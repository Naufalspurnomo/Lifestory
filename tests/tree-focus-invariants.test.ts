import { describe, expect, it } from "vitest";
import type { FamilyNode } from "../lib/types/tree";
import { buildFamilyGraph } from "../lib/tree/familyGraph";
import { resolveTreeFocusContext } from "../lib/tree/focusView";
import { calculateHierarchicalLayout } from "../lib/tree/layoutEngine";

function person(id: string, overrides: Partial<FamilyNode> = {}): FamilyNode {
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

describe("tree focus context", () => {
  it("highlights ancestors, descendants, co-parents, and their family units", () => {
    const nodes = [
      person("grandparent", { childrenIds: ["parent"] }),
      person("parent", {
        parentIds: ["grandparent"],
        partners: ["partner"],
        childrenIds: ["focus", "sibling"],
      }),
      person("partner", {
        partners: ["parent"],
        childrenIds: ["focus", "sibling"],
      }),
      person("focus", {
        parentIds: ["parent", "partner"],
        partners: ["spouse"],
        childrenIds: ["child"],
      }),
      person("spouse", { partners: ["focus"], childrenIds: ["child"] }),
      person("child", { parentIds: ["focus", "spouse"] }),
      person("sibling", { parentIds: ["parent", "partner"] }),
      person("unrelated"),
    ];
    const graph = buildFamilyGraph(nodes);
    const focus = resolveTreeFocusContext(nodes, "focus", graph);

    expect(Array.from(focus.nodeIds)).toEqual(
      expect.arrayContaining([
        "grandparent",
        "parent",
        "partner",
        "focus",
        "spouse",
        "child",
      ])
    );
    expect(focus.nodeIds.has("sibling")).toBe(false);
    expect(focus.nodeIds.has("unrelated")).toBe(false);
    expect(focus.unionIds.size).toBeGreaterThan(0);

    const layout = calculateHierarchicalLayout(nodes);
    expect(layout.unions?.every((union) => focus.entityIds.has(union.id))).toBe(
      true
    );
  });
});
