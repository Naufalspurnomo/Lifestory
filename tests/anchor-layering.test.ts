// Regression tests for anchor-based layering. The scenario the user
// actually hit: asymmetric ancestor depth should not shift siblings onto
// the wrong generation.

import { describe, it, expect } from "vitest";
import { calculateSugiyamaLayout } from "../lib/tree/sugiyamaLayout";
import { asymmetricInLaws } from "./helpers/asymmetric-in-laws";
import { fiveGenerations, nuclearFamily } from "./helpers/fixtures";

function genOf(
  layout: ReturnType<typeof calculateSugiyamaLayout>,
  id: string
): number {
  const node = layout.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Node ${id} missing from layout`);
  return node.generation;
}

describe("anchor-based layering — asymmetric in-laws", () => {
  const layout = calculateSugiyamaLayout(asymmetricInLaws());

  it("places the user's parents on the same layer as the parents-in-law", () => {
    expect(genOf(layout, "ayah-aku")).toBe(genOf(layout, "ayah-istri"));
    expect(genOf(layout, "ibu-ku")).toBe(genOf(layout, "ibu-istri"));
  });

  it("keeps the user and siblings on the same generation as the spouse", () => {
    const admin = genOf(layout, "admin");
    expect(genOf(layout, "adek-ku")).toBe(admin);
    expect(genOf(layout, "kakak-ku")).toBe(admin);
    expect(genOf(layout, "istri-ku")).toBe(admin);
  });

  it("places siblings one generation below their parents", () => {
    expect(genOf(layout, "admin") - genOf(layout, "ayah-aku")).toBe(1);
  });

  it("places the lone grandparent two generations above the user", () => {
    expect(genOf(layout, "admin") - genOf(layout, "kakek-istri")).toBe(2);
  });

  it("places the user's children one generation below the user", () => {
    expect(genOf(layout, "anak-pertama") - genOf(layout, "admin")).toBe(1);
    expect(genOf(layout, "anak-kedua") - genOf(layout, "admin")).toBe(1);
  });

  it("does not generate any layout errors", () => {
    for (const node of layout.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });
});

describe("anchor-based layering — fallback to absolute depth", () => {
  it("works identically to before when no 'self' node is present", () => {
    // nuclearFamily() has no line: 'self', so anchor layering falls back
    // to the original absolute-depth algorithm. The dad and mom land on
    // the same layer, and their children one layer below.
    const nodes = nuclearFamily().map((n) => ({ ...n, line: "default" as const }));
    const layout = calculateSugiyamaLayout(nodes);
    const dadGen = genOf(layout, "dad");
    const momGen = genOf(layout, "mom");
    expect(dadGen).toBe(momGen);
    expect(genOf(layout, "kid1")).toBe(dadGen + 1);
    expect(genOf(layout, "kid2")).toBe(dadGen + 1);
  });

  it("preserves existing anchored tree (five generations)", () => {
    // fiveGenerations already marks 'g1' as self.
    const layout = calculateSugiyamaLayout(fiveGenerations());
    const selfGen = genOf(layout, "g1");
    // g5 ancestors (4 layers up), g0 descendants (1 layer down).
    expect(selfGen - genOf(layout, "g5-m")).toBe(4);
    expect(genOf(layout, "g0") - selfGen).toBe(1);
  });
});
