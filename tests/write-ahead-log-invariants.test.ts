import { describe, expect, it } from "vitest";
import { LocalStorageWriteAheadLog } from "../lib/sync/WriteAheadLog";
import type { Mutation } from "../lib/sync/types";

// memory:true gives each instance its own isolated MemoryStorage, so tests
// never touch a shared localStorage and stay independent.
function newLog(maxEntries = 50) {
  return new LocalStorageWriteAheadLog({
    memory: true,
    maxLocalStorageEntries: maxEntries,
  });
}

function mutation(nodeId: string, type: Mutation["type"] = "add"): Mutation {
  return { type, nodeId, payload: null, timestamp: 1000 };
}

describe("LocalStorageWriteAheadLog", () => {
  it("assigns strictly increasing seqNos across appends", async () => {
    const log = newLog();
    const a = await log.appendMutation("t1", mutation("a"));
    const b = await log.appendMutation("t1", mutation("b"));
    expect(a.seqNo).toBe(1);
    expect(b.seqNo).toBe(2);
    expect(b.status).toBe("pending");
  });

  it("returns pending entries for a tree in seq order, scoped per tree", async () => {
    const log = newLog();
    await log.appendMutation("t1", mutation("a"));
    await log.appendMutation("t2", mutation("b"));
    await log.appendMutation("t1", mutation("c"));

    const pending = await log.getPending("t1");
    expect(pending.map((e) => e.nodeId)).toEqual(["a", "c"]);
  });

  it("acknowledge removes an entry permanently", async () => {
    const log = newLog();
    const entry = await log.appendMutation("t1", mutation("a"));
    await log.acknowledge(entry.seqNo);
    expect(await log.getPending("t1")).toEqual([]);
    expect(await log.getCount()).toBe(0);
  });

  it("markFailed increments retryCount and records the error", async () => {
    const log = newLog();
    const entry = await log.appendMutation("t1", mutation("a"));
    await log.markFailed(entry.seqNo, "boom");
    const [failed] = await log.getPending("t1");
    expect(failed.status).toBe("failed");
    expect(failed.retryCount).toBe(1);
    expect(failed.errorMessage).toBe("boom");
  });

  it("permanently-failed entries leave the active set but stay unresolved", async () => {
    const log = newLog();
    const entry = await log.appendMutation("t1", mutation("a"));
    await log.markPermanentlyFailed(entry.seqNo, "dead");

    expect(await log.getPending("t1")).toEqual([]); // not active
    expect(await log.getPermanentlyFailedCount()).toBe(1);
    expect(await log.hasUnresolved("t1")).toBe(true); // still counts as unresolved
    expect(await log.getCount()).toBe(1);
  });

  it("resetFailed requeues failed and permanently-failed entries as pending", async () => {
    const log = newLog();
    const a = await log.appendMutation("t1", mutation("a"));
    const b = await log.appendMutation("t1", mutation("b"));
    await log.markFailed(a.seqNo, "x");
    await log.markPermanentlyFailed(b.seqNo, "y");

    await log.resetFailed();
    const pending = await log.getPending("t1");
    expect(pending.map((e) => e.status)).toEqual(["pending", "pending"]);
  });

  it("enforces the offline capacity ceiling", async () => {
    const log = newLog(2);
    await log.appendMutation("t1", mutation("a"));
    await log.appendMutation("t1", mutation("b"));
    await expect(log.appendMutation("t1", mutation("c"))).rejects.toThrow(
      /capacity/i
    );
    expect(await log.isFull()).toBe(true);
  });

  it("clear drops only the targeted tree", async () => {
    const log = newLog();
    await log.appendMutation("t1", mutation("a"));
    await log.appendMutation("t2", mutation("b"));
    await log.clear("t1");
    expect(await log.getPending("t1")).toEqual([]);
    expect((await log.getPending("t2")).map((e) => e.nodeId)).toEqual(["b"]);
  });

  it("round-trips the last synced version, defaulting to 1", async () => {
    const log = newLog();
    expect(await log.getLastSyncedVersion("t1")).toBe(1);
    await log.setLastSyncedVersion("t1", 42);
    expect(await log.getLastSyncedVersion("t1")).toBe(42);
  });

  it("reports capacity with the active backend", async () => {
    const log = newLog(10);
    await log.appendMutation("t1", mutation("a"));
    const cap = await log.getCapacity();
    expect(cap).toMatchObject({ used: 1, max: 10, backend: "memory" });
  });
});
