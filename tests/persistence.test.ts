// Round-trip tests for the DB serializer. The DB-facing format must preserve
// every important family fact. If this breaks, data loss is the next step.

import { describe, it, expect } from "vitest";
import {
  serializeTreeToRows,
  deserializeRowsToTree,
  roundTripTree,
} from "../lib/tree/persistence";
import {
  fiveGenerations,
  remarriageHalfSiblings,
  singleParentAdoption,
  multiRootUnrelatedFamilies,
  twoFamiliesJoinedByMarriage,
  skipGenerationAdoption,
  nuclearFamily,
} from "./helpers/fixtures";
import type { FamilyNode } from "../lib/types/tree";

function byId(nodes: FamilyNode[]) {
  return new Map(nodes.map((n) => [n.id, n]));
}

function expectSameRelations(before: FamilyNode[], after: FamilyNode[]) {
  const mapBefore = byId(before);
  const mapAfter = byId(after);

  expect(mapAfter.size).toBe(mapBefore.size);

  for (const [id, originalNode] of mapBefore) {
    const roundTrippedNode = mapAfter.get(id);
    expect(roundTrippedNode, `node ${id} missing after round-trip`).toBeDefined();

    const sortedOriginal = [...(originalNode.parentIds || [])].sort();
    const sortedRoundTripped = [...(roundTrippedNode!.parentIds || [])].sort();
    expect(sortedRoundTripped).toEqual(sortedOriginal);

    expect(
      [...(roundTrippedNode!.partners || [])].sort()
    ).toEqual([...(originalNode.partners || [])].sort());

    expect(
      [...(roundTrippedNode!.adoptiveParentIds || [])].sort()
    ).toEqual([...(originalNode.adoptiveParentIds || [])].sort());

    // children are derived from the reverse of parent links; both directions must line up.
    expect(
      [...(roundTrippedNode!.childrenIds || [])].sort()
    ).toEqual([...(originalNode.childrenIds || [])].sort());
  }
}

describe("serializeTreeToRows", () => {
  it("creates biological-parent edge per parentIds entry", () => {
    const snapshot = serializeTreeToRows(fiveGenerations());
    const bio = snapshot.edges.filter(
      (e) => e.kind === "biological-parent"
    );
    // 5 children crossing generations: g4-m, g3-m, g2-m, g1, g0 = 5 children
    // Each has either 2 parents or 1 — we just check the count >= 5.
    expect(bio.length).toBeGreaterThanOrEqual(5);
  });

  it("stores partner edges only once (canonical order)", () => {
    const snapshot = serializeTreeToRows(nuclearFamily());
    const partners = snapshot.edges.filter((e) => e.kind === "partner");
    // dad-mom is a single partner pair; must not be duplicated in both directions.
    expect(partners).toHaveLength(1);
    const [edge] = partners;
    expect(edge.fromId < edge.toId).toBe(true);
  });

  it("stores adoptive-parent edges as a separate kind", () => {
    const snapshot = serializeTreeToRows(skipGenerationAdoption());
    const adoptive = snapshot.edges.filter(
      (e) => e.kind === "adoptive-parent"
    );
    // grandpa and grandma both adopt "kid"
    expect(adoptive).toHaveLength(2);
    const targets = adoptive.map((e) => e.toId);
    expect(targets).toEqual(["kid", "kid"]);
  });
});

describe("deserializeRowsToTree", () => {
  it("rebuilds bidirectional parent/child + partner links", () => {
    const original = twoFamiliesJoinedByMarriage();
    const snapshot = serializeTreeToRows(original);
    const restored = deserializeRowsToTree(snapshot);
    expectSameRelations(original, restored);
  });
});

describe("roundTripTree preserves every fixture", () => {
  const cases: Array<[string, () => FamilyNode[]]> = [
    ["nuclearFamily", nuclearFamily],
    ["fiveGenerations", fiveGenerations],
    ["remarriageHalfSiblings", remarriageHalfSiblings],
    ["singleParentAdoption", singleParentAdoption],
    ["multiRootUnrelatedFamilies", multiRootUnrelatedFamilies],
    ["twoFamiliesJoinedByMarriage", twoFamiliesJoinedByMarriage],
    ["skipGenerationAdoption", skipGenerationAdoption],
  ];

  for (const [name, build] of cases) {
    it(name, () => {
      const original = build();
      const restored = roundTripTree(original);
      expectSameRelations(original, restored);
    });
  }
});
