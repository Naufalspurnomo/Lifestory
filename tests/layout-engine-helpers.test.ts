import { describe, it, expect } from "vitest";
import {
  detectCycle,
  calculateGeneration,
} from "../lib/tree/layoutEngine";
import {
  nuclearFamily,
  fiveGenerations,
  cyclicGraph,
} from "./helpers/fixtures";

describe("detectCycle", () => {
  it("returns false for a valid nuclear family", () => {
    expect(detectCycle(nuclearFamily())).toBe(false);
  });

  it("returns false for 5 generations", () => {
    expect(detectCycle(fiveGenerations())).toBe(false);
  });

  it("returns true when a cycle is present", () => {
    expect(detectCycle(cyclicGraph())).toBe(true);
  });

  it("returns true when a new node creates a cycle", () => {
    const nodes = nuclearFamily();
    // Bikin dad jadi anak dari kid1 — sikel
    const kid1 = nodes.find((n) => n.id === "kid1")!;
    const proposed = {
      id: "dad",
      childrenIds: [...kid1.childrenIds, "dad"],
    } as any;
    // Since dad already has kid1 as child, and now kid1 has dad as child → cycle
    // We pass newNode as an updated dad with parentIds=[kid1]
    const modified = nodes.map((n) =>
      n.id === "kid1"
        ? { ...n, childrenIds: [...(n.childrenIds || []), "dad"] }
        : n
    );
    expect(detectCycle(modified, proposed)).toBe(true);
  });
});

describe("calculateGeneration", () => {
  it("returns 0 for a root node with no parents", () => {
    const nodes = nuclearFamily();
    expect(calculateGeneration(nodes, "dad")).toBe(0);
    expect(calculateGeneration(nodes, "mom")).toBe(0);
  });

  it("returns 1 for direct children of root", () => {
    const nodes = nuclearFamily();
    expect(calculateGeneration(nodes, "kid1")).toBe(1);
  });

  it("increments generation for each ancestor level", () => {
    const nodes = fiveGenerations();
    expect(calculateGeneration(nodes, "g5-m")).toBe(0);
    expect(calculateGeneration(nodes, "g4-m")).toBe(1);
    expect(calculateGeneration(nodes, "g3-m")).toBe(2);
    expect(calculateGeneration(nodes, "g2-m")).toBe(3);
    expect(calculateGeneration(nodes, "g1")).toBe(4);
    expect(calculateGeneration(nodes, "g0")).toBe(5);
  });

  it("returns 0 for unknown nodeId", () => {
    const nodes = nuclearFamily();
    expect(calculateGeneration(nodes, "does-not-exist")).toBe(0);
  });
});
