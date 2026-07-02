import { describe, expect, it } from "vitest";
import {
  buildTreePdfModel,
  formatLifespan,
  groupNodesForPdf,
} from "../lib/export/treePdf";
import type { FamilyNode, TreeData } from "../lib/types/tree";

function node(id: string, label: string, overrides: Partial<FamilyNode> = {}): FamilyNode {
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

function tree(nodes: FamilyNode[]): TreeData {
  return {
    id: "tree-1",
    name: "Keluarga Santoso",
    ownerId: "user-1",
    nodes,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  };
}

describe("tree PDF export invariants", () => {
  it("builds export metadata and layout from the current tree", () => {
    const model = buildTreePdfModel(
      tree([
        node("parent", "Riduan", {
          generation: 0,
          childrenIds: ["child"],
        }),
        node("child", "Sugiarto", {
          generation: 1,
          parentId: "parent",
          parentIds: ["parent"],
          year: 1988,
          content: { description: "Cerita singkat", media: [] },
        }),
      ]),
      "id",
      new Date("2026-07-02T00:00:00.000Z")
    );

    expect(model.treeName).toBe("Keluarga Santoso");
    expect(model.memberCount).toBe(2);
    expect(model.generationCount).toBe(2);
    expect(model.layout.nodes).toHaveLength(2);
    expect(model.groups.map((group) => group.title)).toEqual([
      "Generasi 0",
      "Generasi 1",
    ]);
  });

  it("sorts directory members by generation, year, then name", () => {
    const groups = groupNodesForPdf([
      node("b", "Budi", { generation: 1, year: 1990 }),
      node("a", "Ari", { generation: 1, year: 1990 }),
      node("root", "Root", { generation: 0, year: 1960 }),
    ]);

    expect(groups.map((group) => group.members.map((member) => member.label))).toEqual([
      ["Root"],
      ["Ari", "Budi"],
    ]);
  });

  it("formats lifespan fallbacks without throwing on sparse data", () => {
    expect(formatLifespan(node("alive", "Alive", { year: 1980 }), "id")).toBe("1980");
    expect(
      formatLifespan(node("deceased", "Deceased", { year: 1930, deathYear: 2001 }), "id")
    ).toBe("1930 - 2001");
    expect(formatLifespan(node("unknown", "Unknown"), "en")).toBe("Year not recorded");
  });

  it("rejects empty trees before creating a blank PDF", () => {
    expect(() => buildTreePdfModel(tree([]), "id")).toThrow(
      "Belum ada data keluarga untuk diekspor."
    );
  });
});
