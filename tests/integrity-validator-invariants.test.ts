import { describe, expect, it } from "vitest";
import { IntegrityValidator } from "../lib/sync/IntegrityValidator";
import type { FamilyNode } from "../lib/types/tree";

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

const validator = new IntegrityValidator();
const types = (nodes: FamilyNode[]) =>
  validator.validate(nodes).errors.map((e) => e.type);

describe("IntegrityValidator.validate", () => {
  it("accepts a fully consistent two-generation family", () => {
    const nodes = [
      node("dad", { childrenIds: ["kid"], partners: ["mom"] }),
      node("mom", { childrenIds: ["kid"], partners: ["dad"] }),
      node("kid", { parentIds: ["dad", "mom"] }),
    ];
    const result = validator.validate(nodes);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("flags a dangling parent reference", () => {
    expect(types([node("kid", { parentIds: ["ghost"] })])).toContain(
      "orphan-parent-ref"
    );
  });

  it("flags a dangling child reference", () => {
    expect(types([node("dad", { childrenIds: ["ghost"] })])).toContain(
      "orphan-child-ref"
    );
  });

  it("flags a dangling adoptive parent reference", () => {
    expect(types([node("kid", { adoptiveParentIds: ["ghost"] })])).toContain(
      "orphan-adoptive-parent-ref"
    );
  });

  it("flags self-references", () => {
    expect(types([node("a", { parentIds: ["a"] })])).toContain("self-reference");
  });

  it("flags a partner link that is not mutual", () => {
    const nodes = [
      node("a", { partners: ["b"] }),
      node("b"), // does not point back to a
    ];
    expect(types(nodes)).toContain("unidirectional-partner");
  });

  it("flags a parent->child link the child does not reciprocate", () => {
    const nodes = [
      node("dad", { childrenIds: ["kid"] }),
      node("kid"), // missing parentIds: ["dad"]
    ];
    expect(types(nodes)).toContain("unidirectional-parent-child");
  });

  it("flags a circular ancestor chain", () => {
    const nodes = [
      node("a", { parentIds: ["b"], childrenIds: ["b"] }),
      node("b", { parentIds: ["a"], childrenIds: ["a"] }),
    ];
    expect(types(nodes)).toContain("circular-ancestor");
  });

  it("flags duplicate ids", () => {
    expect(types([node("a"), node("a")])).toContain("duplicate-id");
  });

  it("flags partners who are biological siblings", () => {
    const nodes = [
      node("parent", { childrenIds: ["s1", "s2"] }),
      node("s1", { parentIds: ["parent"], partners: ["s2"] }),
      node("s2", { parentIds: ["parent"], partners: ["s1"] }),
    ];
    expect(types(nodes)).toContain("sibling-partner");
  });

  it("does not flag unrelated partners as sibling-partners", () => {
    const nodes = [
      node("p1", { childrenIds: ["a"] }),
      node("p2", { childrenIds: ["b"] }),
      node("a", { parentIds: ["p1"], partners: ["b"] }),
      node("b", { parentIds: ["p2"], partners: ["a"] }),
    ];
    expect(types(nodes)).not.toContain("sibling-partner");
  });

  it("flags partners who are in an ancestor chain", () => {
    const nodes = [
      node("parent", { childrenIds: ["child"], partners: ["child"] }),
      node("child", { parentIds: ["parent"], partners: ["parent"] }),
    ];

    expect(types(nodes)).toContain("ancestor-partner");
  });
});
