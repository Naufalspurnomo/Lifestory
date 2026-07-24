import { describe, expect, it, vi } from "vitest";
import { SyncEngine } from "../lib/sync/SyncEngine";
import { LocalStorageWriteAheadLog } from "../lib/sync/WriteAheadLog";

function response(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("tree save status", () => {
  it("does not downgrade repeated server failures to a misleading queued status", async () => {
    const engine = new SyncEngine({
      wal: new LocalStorageWriteAheadLog({ memory: true }),
      fetchImpl: vi.fn(async () => response({ error: "Server unavailable" }, 503)) as unknown as typeof fetch,
      config: { debounceMs: 60_000, visibleErrorRetryThreshold: 3 },
    });

    await engine.enqueue("tree-1", {
      type: "add",
      nodeId: "node-1",
      payload: null,
    });
    await engine.forceSync();
    await engine.forceSync();
    await engine.forceSync();

    expect(engine.getStatus()).toMatchObject({
      status: "error",
      pendingCount: 1,
      errorMessage: "Server unavailable",
    });
    engine.destroy();
  });

  it("shows an actionable error when an expired session pauses a save", async () => {
    const engine = new SyncEngine({
      wal: new LocalStorageWriteAheadLog({ memory: true }),
      fetchImpl: vi.fn(async () => response({ error: "Unauthorized" }, 401)) as unknown as typeof fetch,
      config: { debounceMs: 60_000 },
    });

    await engine.enqueue("tree-1", {
      type: "add",
      nodeId: "node-1",
      payload: null,
    });
    await engine.forceSync();

    expect(engine.getStatus()).toMatchObject({
      status: "error",
      pendingCount: 1,
    });
    expect(engine.getStatus().errorMessage).toContain("Sign in again");

    await engine.enqueue("tree-1", {
      type: "update",
      nodeId: "node-1",
      payload: null,
    });
    expect(engine.getStatus().status).toBe("error");
    engine.destroy();
  });
});
