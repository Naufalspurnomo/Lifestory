import { describe, expect, it } from "vitest";
import { calculateHierarchicalLayout } from "../lib/tree/layoutEngine";
import type { FamilyNode } from "../lib/types/tree";

function familyNode(id: string, label: string, overrides: Partial<FamilyNode> = {}): FamilyNode {
  return {
    id,
    label,
    sex: "X",
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

function link(nodes: FamilyNode[], parentId: string, childId: string) {
  const parent = nodes.find((node) => node.id === parentId);
  const child = nodes.find((node) => node.id === childId);
  if (!parent || !child) throw new Error(`Missing fixture link ${parentId} -> ${childId}`);

  parent.childrenIds = Array.from(new Set([...parent.childrenIds, childId]));
  child.parentIds = Array.from(new Set([...(child.parentIds || []), parentId]));
  child.parentId = child.parentIds[0] || null;
}

function getPosition(nodes: FamilyNode[], id: string) {
  const node = nodes.find((item) => item.id === id);
  if (!node || !Number.isFinite(node.x) || !Number.isFinite(node.y)) {
    throw new Error(`Missing layout position for ${id}`);
  }
  return { x: node.x!, y: node.y! };
}

describe("family tree layout spacing", () => {
  it("routes children from the couple midpoint when both parents are linked", () => {
    const nodes = [
      familyNode("father", "Riduan Santoso", {
        partners: ["mother"],
        childrenIds: ["child"],
      }),
      familyNode("mother", "Suwahi", {
        partners: ["father"],
        childrenIds: ["child"],
      }),
      familyNode("child", "Sugiarto Santoso", {
        parentId: "mother",
        parentIds: ["mother", "father"],
      }),
    ];

    const layout = calculateHierarchicalLayout(nodes);
    const father = getPosition(layout.nodes, "father");
    const mother = getPosition(layout.nodes, "mother");
    const coupleMidpoint = (father.x + mother.x) / 2;
    const childEdge = layout.edges.find(
      (edge) => edge.type === "union-child" && edge.target === "child"
    );

    expect(childEdge).toBeDefined();
    expect(childEdge?.path[0].x).toBeCloseTo(coupleMidpoint, 5);
    expect(childEdge?.path[0].x).not.toBeCloseTo(mother.x, 5);
  });

  it("renders legacy single-parent children from the couple midpoint when the parent has one clear partner", () => {
    const nodes = [
      familyNode("father", "Riduan Santoso", {
        partners: ["mother"],
      }),
      familyNode("mother", "Suwahi", {
        partners: ["father"],
        childrenIds: ["child"],
      }),
      familyNode("child", "Sugiarto Santoso", {
        parentId: "mother",
        parentIds: ["mother"],
      }),
    ];

    const layout = calculateHierarchicalLayout(nodes);
    const father = getPosition(layout.nodes, "father");
    const mother = getPosition(layout.nodes, "mother");
    const coupleMidpoint = (father.x + mother.x) / 2;
    const childEdge = layout.edges.find(
      (edge) => edge.type === "union-child" && edge.target === "child"
    );

    expect(childEdge).toBeDefined();
    expect(childEdge?.path[0].x).toBeCloseTo(coupleMidpoint, 5);
    expect(childEdge?.path[0].x).not.toBeCloseTo(mother.x, 5);
  });

  it("reserves horizontal room for neighboring branches with descendants", () => {
    const nodes = [
      familyNode("sugiarto", "Sugiarto Santoso"),
      familyNode("phoa", "Phoa Mei Ching"),
      familyNode("milhan", "Milhan"),
      familyNode("hisson", "Hisson"),
      familyNode("liem", "Liem Wu Ying"),
      familyNode("soedibyo", "Soedibyo"),
      familyNode("janestoca", "Janestoca"),
      familyNode("yusefresser", "Yusefresser"),
      familyNode("sovi", "Sovi Sophia"),
    ];

    link(nodes, "sugiarto", "phoa");
    link(nodes, "phoa", "milhan");
    link(nodes, "phoa", "hisson");
    link(nodes, "liem", "soedibyo");
    link(nodes, "soedibyo", "janestoca");
    link(nodes, "soedibyo", "yusefresser");
    link(nodes, "soedibyo", "sovi");

    const layout = calculateHierarchicalLayout(nodes);
    const phoa = getPosition(layout.nodes, "phoa");
    const soedibyo = getPosition(layout.nodes, "soedibyo");

    expect(Math.abs(phoa.x - soedibyo.x)).toBeGreaterThanOrEqual(260);
  });
});
