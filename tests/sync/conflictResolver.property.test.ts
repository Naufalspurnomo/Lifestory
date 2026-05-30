import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { diffNodeFields, ConflictResolver } from "../../lib/sync/ConflictResolver";
import type { WALEntry } from "../../lib/sync/types";
import { person } from "../helpers/fixtures";

function wal(nodeId: string): WALEntry {
  return {
    id: `wal-${nodeId}`,
    seqNo: 1,
    treeId: "tree-1",
    timestamp: 1,
    type: "update",
    nodeId,
    payload: person(nodeId, `Local ${nodeId}`),
    status: "pending",
    retryCount: 0,
    lastAttempt: null,
    errorMessage: null,
  };
}

describe("data reliability conflict resolver", () => {
  it("reports exactly changed fields between two nodes", () => {
    // Feature: data-reliability-sync, Property 10: Field-Level Diff Correctness
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 40 }), (label) => {
        const local = person("a", label, { year: 1990 });
        const server = person("a", label, { year: 1991 });
        const fields = diffNodeFields(local, server).map((conflict) => conflict.field);
        expect(fields).toEqual(["year"]);
      }),
      { numRuns: 100 }
    );
  });

  it("auto-merges non-overlapping node changes", () => {
    // Feature: data-reliability-sync, Property 11: Non-Overlapping Conflict Auto-Merge
    const resolver = new ConflictResolver();
    const local = wal("local");
    const server = [person("server", "Server")];
    const result = resolver.detect([local], server, 2, ["server"]);

    expect(result.type).toBe("auto-merged");
    if (result.type === "auto-merged") {
      expect(result.mergedNodes.map((node) => node.id).sort()).toEqual([
        "local",
        "server",
      ]);
    }
  });
});
