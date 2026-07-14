import { describe, expect, it } from "vitest";
import { NetworkDetector } from "../lib/sync/NetworkDetector";
import { SyncEngine } from "../lib/sync/SyncEngine";
import { LocalStorageWriteAheadLog } from "../lib/sync/WriteAheadLog";

describe("browser fetch context", () => {
  it("keeps the global context for the health check", async () => {
    let receiver: unknown;
    const contextSensitiveFetch = function (this: unknown) {
      receiver = this;
      return Promise.resolve(new Response(null, { status: 200 }));
    } as typeof fetch;
    const detector = new NetworkDetector("/api/health", 30_000, contextSensitiveFetch);

    await expect(detector.check()).resolves.toBe(true);
    expect(receiver).toBe(globalThis);
  });

  it("keeps the global context when autosave posts a queued edit", async () => {
    let receiver: unknown;
    const contextSensitiveFetch = function (this: unknown) {
      receiver = this;
      return Promise.resolve(
        new Response(
          JSON.stringify({ success: true, newVersion: 2, acknowledgedSeqNos: [1] }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );
    } as typeof fetch;
    const wal = new LocalStorageWriteAheadLog({ memory: true });
    const engine = new SyncEngine({
      wal,
      fetchImpl: contextSensitiveFetch,
      config: { debounceMs: 60_000 },
      getTreeNodes: () => [],
    });

    await engine.enqueue("tree-1", {
      type: "add",
      nodeId: "node-1",
      payload: null,
    });
    await engine.flush();
    engine.destroy();

    expect(receiver).toBe(globalThis);
    await expect(wal.getCount()).resolves.toBe(0);
  });
});
