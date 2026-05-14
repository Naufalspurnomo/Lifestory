import { describe, it, expect } from "vitest";
import { calculateSugiyamaLayout } from "../lib/tree/sugiyamaLayout";
import { validateFamilyLayout } from "../lib/tree/layoutValidation";
import {
  nuclearFamily,
  fiveGenerations,
  twoFamiliesJoinedByMarriage,
} from "./helpers/fixtures";
import type { LayoutGraph } from "../lib/types/tree";

describe("validateFamilyLayout", () => {
  it("flags a valid layout as valid", () => {
    const layout = calculateSugiyamaLayout(nuclearFamily());
    const result = validateFamilyLayout(layout);
    expect(result.valid).toBe(true);
  });

  it("reports invalid node coordinates", () => {
    const layout = calculateSugiyamaLayout(fiveGenerations());
    // Corrupt one node deliberately
    const corrupted: LayoutGraph = {
      ...layout,
      nodes: layout.nodes.map((n, i) =>
        i === 0 ? { ...n, x: NaN, y: NaN } : n
      ),
    };
    const result = validateFamilyLayout(corrupted);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((i) => i.code === "invalid-node-position")
    ).toBe(true);
  });

  it("reports duplicate node ids", () => {
    const layout = calculateSugiyamaLayout(nuclearFamily());
    const dup: LayoutGraph = {
      ...layout,
      nodes: [...layout.nodes, { ...layout.nodes[0] }],
    };
    const result = validateFamilyLayout(dup);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.code === "duplicate-node")).toBe(true);
  });

  it("reports a child that is not below its parent-union", () => {
    const layout = calculateSugiyamaLayout(nuclearFamily());
    // Force a union-child edge to terminate above its start
    const broken: LayoutGraph = {
      ...layout,
      nodes: layout.nodes.map((n) =>
        n.id === "kid1" ? { ...n, y: -1000 } : n
      ),
    };
    const result = validateFamilyLayout(broken);
    expect(
      result.issues.some((i) => i.code === "child-not-below-parent")
    ).toBe(true);
  });

  it("reports short edge path", () => {
    const layout = calculateSugiyamaLayout(nuclearFamily());
    const broken: LayoutGraph = {
      ...layout,
      edges: layout.edges.map((e, i) =>
        i === 0 ? { ...e, path: [e.path[0]] } : e
      ),
    };
    const result = validateFamilyLayout(broken);
    expect(result.issues.some((i) => i.code === "short-edge-path")).toBe(true);
  });

  it("keeps bigger graphs valid (two families joined by marriage)", () => {
    const layout = calculateSugiyamaLayout(twoFamiliesJoinedByMarriage());
    const result = validateFamilyLayout(layout);
    const errors = result.issues.filter((i) => i.severity === "error");
    expect(errors).toHaveLength(0);
  });
});
