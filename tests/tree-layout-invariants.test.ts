import { describe, expect, it } from "vitest";
import { calculateHierarchicalLayout } from "../lib/tree/layoutEngine";
import { getSiblingOrderUpdates } from "../lib/tree/siblingOrder";
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

  it("routes an explicit single-parent child from that parent", () => {
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
    const mother = getPosition(layout.nodes, "mother");
    const childEdge = layout.edges.find(
      (edge) => edge.type === "union-child" && edge.target === "child"
    );

    expect(childEdge).toBeDefined();
    expect(childEdge?.path[0].x).toBeCloseTo(mother.x, 5);
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

  it("orders sibling branches by birth year and keeps partners with the moved branch", () => {
    const nodes = [
      familyNode("father", "Father", {
        partners: ["mother"],
        childrenIds: ["oldest", "middle", "youngest"],
      }),
      familyNode("mother", "Mother", {
        partners: ["father"],
        childrenIds: ["oldest", "middle", "youngest"],
      }),
      familyNode("oldest", "Oldest", {
        year: 1988,
        parentId: "father",
        parentIds: ["father", "mother"],
      }),
      familyNode("middle", "Middle", {
        year: 1989,
        parentId: "father",
        parentIds: ["father", "mother"],
      }),
      familyNode("youngest", "Youngest", {
        year: 1992,
        parentId: "father",
        parentIds: ["father", "mother"],
        partners: ["youngest-partner"],
      }),
      familyNode("youngest-partner", "Youngest Partner", {
        partners: ["youngest"],
      }),
    ];

    const automatic = calculateHierarchicalLayout(nodes);
    expect(getPosition(automatic.nodes, "oldest").x).toBeLessThan(
      getPosition(automatic.nodes, "middle").x
    );
    expect(getPosition(automatic.nodes, "middle").x).toBeLessThan(
      getPosition(automatic.nodes, "youngest").x
    );

    const orderedBranchIds = [
      "youngest::youngest-partner",
      "oldest",
      "middle",
    ];
    const updates = getSiblingOrderUpdates(nodes, "youngest", orderedBranchIds);
    const reorderedNodes = nodes.map((node) => ({
      ...node,
      ...(updates.find((update) => update.nodeId === node.id)?.data || {}),
    }));
    const reordered = calculateHierarchicalLayout(reorderedNodes);
    const youngest = getPosition(reordered.nodes, "youngest");
    const partner = getPosition(reordered.nodes, "youngest-partner");

    expect(youngest.x).toBeLessThan(getPosition(reordered.nodes, "oldest").x);
    expect(Math.abs(youngest.x - partner.x)).toBeLessThanOrEqual(240);
    expect(updates.some((update) => update.nodeId === "youngest-partner")).toBe(
      false
    );
  });

  it("keeps spouse lines in the middle and drops below only when blocked", () => {
    const nodes = [
      familyNode("hub", "Zulu", { partners: ["alpha", "beta"] }),
      familyNode("alpha", "Alpha", { partners: ["hub"] }),
      familyNode("beta", "Beta", { partners: ["hub"] }),
    ];

    const layout = calculateHierarchicalLayout(nodes);
    const spouseEdges = layout.edges.filter((edge) => edge.type === "spouse");

    expect(spouseEdges).toHaveLength(2);
    expect(spouseEdges.every((edge) => edge.path.length > 0)).toBe(true);
    expect(spouseEdges.every((edge) => edge.path.length === 2 || edge.path.length === 4)).toBe(true);
    const middleLine = spouseEdges.find((edge) => edge.path.length === 2);
    expect(middleLine).toBeDefined();
    expect(middleLine!.path[0].y).toBe(middleLine!.path[1].y);
    const fallbackLine = spouseEdges.find((edge) => edge.path.length === 4);
    expect(fallbackLine).toBeDefined();
    expect(fallbackLine!.path[1].y).toBeGreaterThan(fallbackLine!.path[0].y);
  });

  it("does not draw a spouse edge for a multi-parent unit", () => {
    const nodes = [
      familyNode("parent-a", "Parent A", { childrenIds: ["child"] }),
      familyNode("parent-b", "Parent B", { childrenIds: ["child"] }),
      familyNode("parent-c", "Parent C", { childrenIds: ["child"] }),
      familyNode("child", "Child", {
        parentIds: ["parent-a", "parent-b", "parent-c"],
        parentId: "parent-a",
      }),
    ];

    const layout = calculateHierarchicalLayout(nodes);

    expect(layout.edges.filter((edge) => edge.type === "spouse")).toHaveLength(0);
    expect(layout.edges.filter((edge) => edge.type === "parent-union")).toHaveLength(3);
  });

  it("places an adoptive-only child below the adoptive parent", () => {
    const nodes = [
      familyNode("adoptive-parent", "Adoptive Parent", {
        childrenIds: [],
      }),
      familyNode("child", "Adopted Child", {
        adoptiveParentIds: ["adoptive-parent"],
      }),
    ];

    const layout = calculateHierarchicalLayout(nodes);
    const parent = getPosition(layout.nodes, "adoptive-parent");
    const child = getPosition(layout.nodes, "child");

    expect(child.y).toBeGreaterThan(parent.y);
    expect(layout.edges.some((edge) => edge.type === "adoption")).toBe(true);
  });

  it("keeps each parent on the same side as their own parents", () => {
    const nodes = [
      familyNode("paternal-grandfather", "Ayah (Tidak Diketahui)", {
        partners: ["paternal-grandmother"],
        sex: "M",
        childrenIds: ["father"],
      }),
      familyNode("paternal-grandmother", "Ibu (Tidak Diketahui)", {
        partners: ["paternal-grandfather"],
        sex: "F",
        childrenIds: ["father"],
      }),
      familyNode("maternal-grandfather", "Ayah (Tidak Diketahui)", {
        partners: ["maternal-grandmother"],
        sex: "M",
        childrenIds: ["mother"],
      }),
      familyNode("maternal-grandmother", "Ibu (Tidak Diketahui)", {
        partners: ["maternal-grandfather"],
        sex: "F",
        childrenIds: ["mother"],
      }),
      familyNode("father", "Ayah (Tidak Diketahui)", {
        partners: ["mother"],
        parentId: "paternal-grandfather",
        parentIds: ["paternal-grandfather", "paternal-grandmother"],
        sex: "M",
        childrenIds: ["child"],
      }),
      familyNode("mother", "Ibu (Tidak Diketahui)", {
        partners: ["father"],
        parentId: "maternal-grandfather",
        parentIds: ["maternal-grandfather", "maternal-grandmother"],
        sex: "F",
        childrenIds: ["child"],
      }),
      familyNode("child", "Lingga", {
        parentId: "father",
        parentIds: ["father", "mother"],
      }),
    ];

    const layout = calculateHierarchicalLayout(nodes);
    const father = getPosition(layout.nodes, "father");
    const mother = getPosition(layout.nodes, "mother");
    const paternalCenter =
      (getPosition(layout.nodes, "paternal-grandfather").x +
        getPosition(layout.nodes, "paternal-grandmother").x) /
      2;
    const maternalCenter =
      (getPosition(layout.nodes, "maternal-grandfather").x +
        getPosition(layout.nodes, "maternal-grandmother").x) /
      2;

    expect(Math.abs(father.x - paternalCenter)).toBeLessThan(
      Math.abs(father.x - maternalCenter)
    );
    expect(Math.abs(mother.x - maternalCenter)).toBeLessThan(
      Math.abs(mother.x - paternalCenter)
    );
    expect(Math.sign(father.x - mother.x)).toBe(
      Math.sign(paternalCenter - maternalCenter)
    );
  });
});
