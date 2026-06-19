import { describe, expect, it } from "vitest";
import { ConflictResolver } from "../lib/sync/ConflictResolver";
import type { FamilyNode } from "../lib/types/tree";
import type { WALEntry } from "../lib/sync/types";

function node(id: string, overrides: Partial<FamilyNode> = {}): FamilyNode {
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
    ...overrides,
  };
}

let seq = 0;
function wal(
  type: WALEntry["type"],
  nodeId: string,
  payload: FamilyNode | null,
  previousPayload: FamilyNode | null = null
): WALEntry {
  seq += 1;
  return {
    id: `wal-${seq}`,
    seqNo: seq,
    treeId: "tree-1",
    timestamp: 1000 + seq,
    type,
    nodeId,
    payload,
    previousPayload,
    status: "pending",
    retryCount: 0,
    lastAttempt: null,
    errorMessage: null,
  };
}

function nodeMap(result: { mergedNodes?: FamilyNode[]; nonConflictingMerge?: FamilyNode[] }) {
  const list = result.mergedNodes ?? result.nonConflictingMerge ?? [];
  return new Map(list.map((n) => [n.id, n]));
}

describe("ConflictResolver.detect", () => {
  const resolver = new ConflictResolver();

  it("auto-applies a local mutation when the server did not touch that node", () => {
    const server = [node("a", { label: "Server A" }), node("b")];
    const entry = wal(
      "update",
      "b",
      node("b", { label: "Local B renamed" }),
      node("b")
    );

    const result = resolver.detect([entry], server, 7, /* changed */ ["a"]);

    expect(result.type).toBe("auto-merged");
    if (result.type !== "auto-merged") return;
    expect(result.newVersion).toBe(7);
    expect(nodeMap(result).get("b")?.label).toBe("Local B renamed");
  });

  it("auto-merges disjoint field edits to the same node without a conflict", () => {
    const base = node("a", { label: "Base", year: 1900 });
    const server = [node("a", { label: "Base", year: 1950 })]; // server changed year
    const local = node("a", { label: "Renamed", year: 1900 }); // local changed label
    const entry = wal("update", "a", local, base);

    const result = resolver.detect([entry], server, 3, ["a"]);

    expect(result.type).toBe("auto-merged");
    if (result.type !== "auto-merged") return;
    const merged = nodeMap(result).get("a");
    expect(merged?.label).toBe("Renamed"); // local edit preserved
    expect(merged?.year).toBe(1950); // server edit preserved
  });

  it("unions concurrent additions to a set field (childrenIds)", () => {
    const base = node("p", { childrenIds: ["c1"] });
    const server = [node("p", { childrenIds: ["c1", "c2"] })]; // server added c2
    const local = node("p", { childrenIds: ["c1", "c3"] }); // local added c3
    const entry = wal("update", "p", local, base);

    const result = resolver.detect([entry], server, 1, ["p"]);

    expect(result.type).toBe("auto-merged");
    if (result.type !== "auto-merged") return;
    const children = nodeMap(result).get("p")?.childrenIds ?? [];
    expect(new Set(children)).toEqual(new Set(["c1", "c2", "c3"]));
  });

  it("flags a real same-field conflict for manual resolution", () => {
    const base = node("a", { label: "Base" });
    const server = [node("a", { label: "Server name" })];
    const local = node("a", { label: "Local name" });
    const entry = wal("update", "a", local, base);

    const result = resolver.detect([entry], server, 1, ["a"]);

    expect(result.type).toBe("manual-required");
    if (result.type !== "manual-required") return;
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]).toMatchObject({
      nodeId: "a",
      field: "label",
      localValue: "Local name",
      serverValue: "Server name",
    });
    // The non-conflicting merge is still returned so the UI can show context.
    expect(nodeMap(result).has("a")).toBe(true);
  });

  it("raises a node-level conflict when local edits a node the server deleted", () => {
    const server: FamilyNode[] = []; // server removed "a"
    const local = node("a", { label: "Local keeps editing" });
    const entry = wal("update", "a", local, node("a"));

    const result = resolver.detect([entry], server, 1, ["a"]);

    expect(result.type).toBe("manual-required");
    if (result.type !== "manual-required") return;
    expect(result.conflicts[0]).toMatchObject({
      nodeId: "a",
      field: "__node__",
      serverValue: null,
    });
  });

  it("raises a node-level conflict when a local delete races a server edit", () => {
    const serverNode = node("a", { label: "Server moved on" });
    const local = wal("delete", "a", null, node("a", { label: "Old" }));

    const result = resolver.detect([local], [serverNode], 1, ["a"]);

    expect(result.type).toBe("manual-required");
    if (result.type !== "manual-required") return;
    expect(result.conflicts[0]).toMatchObject({
      nodeId: "a",
      field: "__node__",
      localValue: null,
    });
  });

  it("honours a clean delete when the server copy is unchanged", () => {
    const original = node("a", { label: "Same" });
    const local = wal("delete", "a", null, node("a", { label: "Same" }));

    const result = resolver.detect([local], [original], 1, ["a"]);

    expect(result.type).toBe("auto-merged");
    if (result.type !== "auto-merged") return;
    expect(nodeMap(result).has("a")).toBe(false);
  });
});

describe("ConflictResolver.resolve", () => {
  const resolver = new ConflictResolver();

  it("applies the chosen value for a field-level conflict", () => {
    const conflicts = [
      {
        nodeId: "a",
        field: "label",
        localValue: "Local",
        serverValue: "Server",
        localTimestamp: 1,
        serverTimestamp: 2,
      },
    ];
    const resolved = resolver.resolve(
      conflicts,
      [{ nodeId: "a", field: "label", chosenValue: "Local", source: "local" }],
      [node("a", { label: "Server" })]
    );
    expect(resolved.find((n) => n.id === "a")?.label).toBe("Local");
  });

  it("deletes the node when a __node__ conflict resolves to null", () => {
    const conflicts = [
      {
        nodeId: "a",
        field: "__node__",
        localValue: null,
        serverValue: node("a"),
        localTimestamp: 1,
        serverTimestamp: 2,
      },
    ];
    const resolved = resolver.resolve(
      conflicts,
      [{ nodeId: "a", field: "__node__", chosenValue: null, source: "local" }],
      [node("a"), node("b")]
    );
    expect(resolved.map((n) => n.id)).toEqual(["b"]);
  });
});

describe("ConflictResolver.canAutoMerge", () => {
  it("is true for non-overlapping edits and false for direct conflicts", () => {
    const resolver = new ConflictResolver();
    const base = node("a", { label: "Base", year: 1900 });

    // Local edits only `year`; server edits only `label` -> no overlap.
    const disjoint = wal(
      "update",
      "a",
      node("a", { label: "Base", year: 2000 }),
      base
    );
    expect(
      resolver.canAutoMerge(
        [disjoint],
        [node("a", { label: "Server renamed", year: 1900 })],
        ["a"]
      )
    ).toBe(true);

    const clashing = wal("update", "a", node("a", { label: "Local" }), base);
    expect(
      resolver.canAutoMerge([clashing], [node("a", { label: "Server" })], ["a"])
    ).toBe(false);
  });
});
