import { describe, expect, it, vi } from "vitest";
import { SyncEngine } from "../../lib/sync/SyncEngine";
import { NetworkDetector } from "../../lib/sync/NetworkDetector";
import { LocalStorageWriteAheadLog } from "../../lib/sync/WriteAheadLog";
import type { FamilyNode, Mutation } from "../../lib/sync/types";
import type { SyncConflict } from "../../lib/sync/SyncEngine";

class TestStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

class AlwaysOnlineNetworkDetector extends NetworkDetector {
  override isOnline(): boolean {
    return true;
  }
}

class RecoverableNetworkDetector extends NetworkDetector {
  private online = false;

  override isOnline(): boolean {
    return this.online;
  }

  override async check(): Promise<boolean> {
    this.online = true;
    return true;
  }
}

class StuckOfflineNetworkDetector extends NetworkDetector {
  override isOnline(): boolean {
    return false;
  }

  override async check(): Promise<boolean> {
    return false;
  }
}

function person(id: string): FamilyNode {
  return {
    id,
    label: id,
    year: null,
    deathYear: null,
    parentId: null,
    parentIds: [],
    adoptiveParentIds: [],
    partners: [],
    childrenIds: [],
    generation: 0,
    line: "default",
    imageUrl: null,
    content: { description: "", media: [] },
    works: [],
  };
}

function mutations(count: number): Mutation[] {
  return Array.from({ length: count }, (_, index) => {
    const node = person(`node-${index}`);
    return { type: "add", nodeId: node.id, payload: node };
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("SyncEngine reliability boundaries", () => {
  it("splits queues larger than the API batch limit and drains all entries", async () => {
    let version = 1;
    const batches: Array<{ batchId: string; mutations: unknown[] }> = [];
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      batches.push(body);
      version += 1;
      return jsonResponse({
        success: true,
        newVersion: version,
        acknowledgedSeqNos: body.mutations.map(
          (mutation: { seqNo: number }) => mutation.seqNo
        ),
      });
    });
    const wal = new LocalStorageWriteAheadLog({
      storage: new TestStorage(),
      maxLocalStorageEntries: 500,
    });
    const engine = new SyncEngine({
      wal,
      fetchImpl: fetchMock as unknown as typeof fetch,
      networkDetector: new AlwaysOnlineNetworkDetector(),
      config: { debounceMs: 60_000 },
    });

    await engine.enqueueMany("tree-1", mutations(251));
    await engine.forceSync();

    expect(batches.map((batch) => batch.mutations.length)).toEqual([250, 1]);
    expect(batches.every((batch) => batch.batchId.startsWith("wal:"))).toBe(true);
    expect(await wal.getCount()).toBe(0);
    expect(engine.getStatus().status).toBe("saved");
    engine.destroy();
  });

  it("keeps rejected edits visible as unresolved instead of reporting Saved", async () => {
    const wal = new LocalStorageWriteAheadLog({
      storage: new TestStorage(),
    });
    const engine = new SyncEngine({
      wal,
      fetchImpl: vi.fn(async () =>
        jsonResponse({ error: "Validation failed" }, 400)
      ) as unknown as typeof fetch,
      networkDetector: new AlwaysOnlineNetworkDetector(),
      config: { debounceMs: 60_000 },
    });

    await engine.enqueueMany("tree-1", mutations(1));
    await engine.forceSync();

    expect(await wal.getCount()).toBe(1);
    expect(await wal.getPermanentlyFailedCount()).toBe(1);
    expect(engine.getStatus().status).toBe("error");
    expect(engine.getStatus().pendingCount).toBe(1);
    engine.destroy();
  });

  it("rechecks connectivity when a manual sync is requested while offline", async () => {
    const wal = new LocalStorageWriteAheadLog({
      storage: new TestStorage(),
    });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return jsonResponse({
        success: true,
        newVersion: 2,
        acknowledgedSeqNos: body.mutations.map(
          (mutation: { seqNo: number }) => mutation.seqNo
        ),
      });
    });
    const engine = new SyncEngine({
      wal,
      fetchImpl: fetchMock as unknown as typeof fetch,
      networkDetector: new RecoverableNetworkDetector(),
      config: { debounceMs: 60_000 },
    });

    await engine.enqueueMany("tree-1", mutations(1));
    await engine.forceSync();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(await wal.getCount()).toBe(0);
    expect(engine.getStatus().status).toBe("saved");
    engine.destroy();
  });

  it("forces a sync attempt when health probing is a false-negative", async () => {
    const wal = new LocalStorageWriteAheadLog({
      storage: new TestStorage(),
    });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      return jsonResponse({
        success: true,
        newVersion: 2,
        acknowledgedSeqNos: body.mutations.map(
          (mutation: { seqNo: number }) => mutation.seqNo
        ),
      });
    });
    const engine = new SyncEngine({
      wal,
      fetchImpl: fetchMock as unknown as typeof fetch,
      networkDetector: new StuckOfflineNetworkDetector(),
      config: { debounceMs: 60_000 },
    });

    await engine.enqueueMany("tree-1", mutations(1));
    await engine.forceSync();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(await wal.getCount()).toBe(0);
    expect(engine.getStatus().status).toBe("saved");
    engine.destroy();
  });

  it("stops retrying when the original tree was intentionally deleted", async () => {
    const wal = new LocalStorageWriteAheadLog({
      storage: new TestStorage(),
    });
    const engine = new SyncEngine({
      wal,
      fetchImpl: vi.fn(async () =>
        jsonResponse({ error: "Tree not found" }, 404)
      ) as unknown as typeof fetch,
      networkDetector: new AlwaysOnlineNetworkDetector(),
      config: { debounceMs: 60_000 },
    });

    await engine.enqueueMany("deleted-tree", mutations(1));
    await engine.forceSync();

    expect(await wal.getPermanentlyFailedCount()).toBe(1);
    expect(engine.getStatus().status).toBe("error");
    expect(engine.getStatus().errorMessage).toContain("no longer exists");
    engine.destroy();
  });

  it("persists a manual conflict resolution as a new versioned snapshot", async () => {
    const wal = new LocalStorageWriteAheadLog({
      storage: new TestStorage(),
    });
    const local = { ...person("node-1"), label: "My edit" };
    const server = { ...person("node-1"), label: "Server edit" };
    let conflict: SyncConflict | null = null;
    let rebased: FamilyNode[] = [];
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") {
        const body = JSON.parse(String(init.body));
        expect(body.expectedVersion).toBe(2);
        expect(body.nodes[0].label).toBe("My edit");
        return jsonResponse({ ok: true, newVersion: 3 });
      }
      return jsonResponse(
        {
          error: "version-conflict",
          currentVersion: 2,
          serverState: [server],
          conflictingNodeIds: ["node-1"],
        },
        409
      );
    });
    const engine = new SyncEngine({
      wal,
      fetchImpl: fetchMock as unknown as typeof fetch,
      getTreeNodes: () => [local],
      networkDetector: new AlwaysOnlineNetworkDetector(),
      config: { debounceMs: 60_000 },
      events: {
        conflict: (value) => {
          conflict = value;
        },
        rebased: (_treeId, nodes) => {
          rebased = nodes;
        },
      },
    });

    await engine.enqueueMany("tree-1", [
      { type: "update", nodeId: local.id, payload: local },
    ]);
    await engine.forceSync();

    expect(conflict?.conflicts.map((item) => item.field)).toContain("label");
    expect(await wal.hasUnresolved("tree-1")).toBe(true);
    const lateEdit = {
      ...local,
      content: {
        ...local.content,
        description: "Edit made while conflict dialog was open",
      },
    };
    await engine.enqueue("tree-1", {
      type: "update",
      nodeId: lateEdit.id,
      payload: lateEdit,
    });

    await engine.resolveConflict([
      {
        nodeId: "node-1",
        field: "label",
        chosenValue: "My edit",
        source: "local",
      },
    ]);

    expect(rebased[0].label).toBe("My edit");
    expect(rebased[0].content.description).toBe(
      "Edit made while conflict dialog was open"
    );
    expect(await wal.hasUnresolved("tree-1")).toBe(false);
    expect(await wal.getLastSyncedVersion("tree-1")).toBe(3);
    engine.destroy();
  });
});
