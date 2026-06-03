import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { LocalStorageWriteAheadLog } from "../../lib/sync/WriteAheadLog";
import type { Mutation } from "../../lib/sync/types";
import { person } from "../helpers/fixtures";

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

function wal(maxLocalStorageEntries = 1000) {
  return new LocalStorageWriteAheadLog({
    storage: new TestStorage(),
    maxLocalStorageEntries,
  });
}

describe("data reliability write-ahead log", () => {
  it("assigns complete monotonically increasing entries and replays in order", async () => {
    // Feature: data-reliability-sync, Properties 1-2: WAL ordering and structure
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 40 }), async (count) => {
        const log = wal();
        for (let index = 0; index < count; index++) {
          const mutation: Mutation = {
            type: "update",
            nodeId: `node-${index}`,
            payload: person(`node-${index}`, `Node ${index}`),
          };
          const entry = await log.appendMutation("tree-1", mutation);
          expect(entry.id).not.toHaveLength(0);
          expect(entry.seqNo).toBe(index + 1);
          expect(entry.timestamp).toBeGreaterThan(0);
          expect(entry.treeId).toBe("tree-1");
          expect(entry.payload).toEqual(mutation.payload);
        }

        const pending = await log.getAllPending();
        expect(pending.map((entry) => entry.seqNo)).toEqual(
          Array.from({ length: count }, (_, index) => index + 1)
        );
      }),
      { numRuns: 100 }
    );
  });

  it("acknowledges exactly one entry", async () => {
    // Feature: data-reliability-sync, Property 3: WAL Acknowledge Removes Entry
    const log = wal();
    await log.appendMutation("tree-1", {
      type: "add",
      nodeId: "a",
      payload: person("a", "A"),
    });
    const second = await log.appendMutation("tree-1", {
      type: "add",
      nodeId: "b",
      payload: person("b", "B"),
    });
    await log.acknowledge(second.seqNo);

    const pending = await log.getAllPending();
    expect(pending.map((entry) => entry.nodeId)).toEqual(["a"]);
  });

  it("preserves previous node state for three-way conflict merging", async () => {
    const log = wal();
    const previous = person("a", "Before");
    const current = person("a", "After");

    await log.appendMutations("tree-1", [
      {
        type: "update",
        nodeId: "a",
        payload: current,
        previousPayload: previous,
      },
    ]);

    const [entry] = await log.getAllPending();
    expect(entry.previousPayload).toEqual(previous);
  });

  it("enforces capacity without growing the queue", async () => {
    // Feature: data-reliability-sync, Property 5: WAL Capacity Enforcement
    const log = wal(1);
    await log.appendMutation("tree-1", {
      type: "add",
      nodeId: "a",
      payload: person("a", "A"),
    });

    await expect(
      log.appendMutation("tree-1", {
        type: "add",
        nodeId: "b",
        payload: person("b", "B"),
      })
    ).rejects.toThrow(/capacity/);
    expect(await log.getCount()).toBe(1);
  });

  it("rejects an oversized mutation batch without storing a partial action", async () => {
    const log = wal(2);
    await expect(
      log.appendMutations("tree-1", [
        {
          type: "add",
          nodeId: "a",
          payload: person("a", "A"),
        },
        {
          type: "add",
          nodeId: "b",
          payload: person("b", "B"),
        },
        {
          type: "add",
          nodeId: "c",
          payload: person("c", "C"),
        },
      ])
    ).rejects.toThrow(/capacity/);
    expect(await log.getCount()).toBe(0);
  });

  it("does not prune active entries younger than the retention window", async () => {
    // Feature: data-reliability-sync, Property 16: WAL Retention Policy
    const log = wal();
    await log.appendMutation("tree-1", {
      type: "add",
      nodeId: "a",
      payload: person("a", "A"),
    });
    await log.prune(7);
    expect(await log.getCount()).toBe(1);
  });
});
