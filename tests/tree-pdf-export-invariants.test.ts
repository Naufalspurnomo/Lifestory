import { describe, expect, it } from "vitest";
import {
  buildTreePdfDocumentModel,
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
  it("builds a PDF document model with editorial page types", () => {
    const model = buildTreePdfDocumentModel(
      tree([
        node("parent", "Riduan", {
          generation: 0,
          line: "self",
          childrenIds: ["child"],
          imageUrl: "/avatar.jpg",
        }),
        node("child", "Sugiarto", {
          generation: 1,
          parentId: "parent",
          parentIds: ["parent"],
          year: 1988,
          content: {
            description: "Cerita singkat",
            media: [{ type: "image", url: "/memory.jpg" }],
          },
        }),
      ]),
      "id",
      new Date("2026-07-02T00:00:00.000Z")
    );

    expect(model.treeName).toBe("Keluarga Santoso");
    expect(model.root.id).toBe("parent");
    expect(model.memberCount).toBe(2);
    expect(model.generationCount).toBe(2);
    expect(model.stats).toMatchObject({ members: 2, generations: 2, photos: 1, stories: 1, media: 1 });
    expect(model.layout.nodes).toHaveLength(2);
    expect(model.logoPath).toBe("/logo/lifestory-logo.png");
    expect(model.generations.map((group) => group.title)).toEqual([
      "Generasi 0",
      "Generasi 1",
    ]);
    expect(model.pages.map((page) => page.kind)).toEqual([
      "cover",
      "overview",
      "generation",
      "directory",
    ]);
  });

  it("keeps the legacy buildTreePdfModel export as the document model", () => {
    const model = buildTreePdfModel(tree([node("root", "Root", { line: "self" })]));

    expect(model.pages[0]).toMatchObject({ kind: "cover" });
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

  it("derives export generations from relationships when stored values are stale", () => {
    const model = buildTreePdfDocumentModel(
      tree([
        node("parent", "Parent", { childrenIds: ["child"], generation: 0 }),
        node("child", "Child", { parentId: "parent", parentIds: ["parent"], generation: 0 }),
      ])
    );

    expect(model.generations.map((group) => group.generation)).toEqual([0, 1]);
    expect(model.memberCards.find((member) => member.id === "child")?.generation).toBe(1);
  });

  it("formats lifespan fallbacks without throwing on sparse data", () => {
    expect(formatLifespan(node("alive", "Alive", { year: 1980 }), "id")).toBe("1980");
    expect(
      formatLifespan(node("deceased", "Deceased", { year: 1930, deathYear: 2001 }), "id")
    ).toBe("1930 - 2001");
    expect(formatLifespan(node("unknown", "Unknown"), "en")).toBe("Year not recorded");
  });

  it("paginates large generations instead of shrinking below readable card rules", () => {
    const nodes = Array.from({ length: 25 }, (_, index) =>
      node(`node-${index}`, `Member ${index}`, {
        generation: 1,
        parentId: "root",
        parentIds: ["root"],
      })
    );
    nodes.unshift(node("root", "Root", { generation: 0, childrenIds: nodes.map((child) => child.id) }));

    const model = buildTreePdfDocumentModel(tree(nodes));
    const generationPages = model.pages.filter((page) => page.kind === "generation");

    expect(generationPages).toHaveLength(4);
    expect(generationPages.every((page) => page.format === "a3" && page.orientation === "landscape")).toBe(true);
    expect(generationPages.every((page) => page.kind !== "generation" || page.minFontSize >= 9)).toBe(true);
    expect(generationPages.map((page) => (page.kind === "generation" ? page.memberIds.length : 0))).toEqual([
      1,
      12,
      12,
      1,
    ]);
  });

  it("suppresses empty metadata on visual pages but keeps directory detail fallbacks", () => {
    const model = buildTreePdfDocumentModel(tree([node("unknown", "Unknown", { generation: 0 })]), "en");
    const overview = model.pages.find((page) => page.kind === "overview");

    expect(overview).toMatchObject({ suppressEmptyMetadata: true });
    expect(model.memberCards[0].treeLifespan).toBe("");
    expect(model.memberCards[0].lifespan).toBe("Year not recorded");
    expect(model.memberCards[0].description).toBe("No story summary yet.");
  });

  it("uses an expandable atlas page for the full relationship map", () => {
    const model = buildTreePdfDocumentModel(tree([node("root", "Root", { generation: 0 })]));

    expect(model.pages.find((page) => page.kind === "overview")).toMatchObject({
      format: "a2",
      orientation: "landscape",
      logoPath: "/logo/lifestory-logo.png",
      minNodeWidth: 68,
      minNodeHeight: 36,
      minFontSize: 8,
      profileImages: true,
    });
    expect(model.pages.find((page) => page.kind === "directory")).toMatchObject({
      format: "a4",
      orientation: "portrait",
    });
  });

  it("grows the full relationship atlas past A0 before shrinking names or portraits", () => {
    const children = Array.from({ length: 50 }, (_, index) =>
      node(`child-${index}`, `Anak Keluarga ${index}`, {
        parentId: "root",
        parentIds: ["root"],
        imageUrl: `/profiles/${index}.jpg`,
      })
    );
    const model = buildTreePdfDocumentModel(
      tree([node("root", "Pendiri Keluarga", { childrenIds: children.map((child) => child.id) }), ...children])
    );
    const overview = model.pages.find((page) => page.kind === "overview");

    expect(overview?.format).toEqual(expect.any(Array));
    expect(Array.isArray(overview?.format) && overview.format[0]).toBeGreaterThan(1189);
  });

  it("keeps the overview tied to the production relationship layout", () => {
    const model = buildTreePdfDocumentModel(
      tree([
        node("father", "Bapak", { partners: ["mother"], childrenIds: ["child"] }),
        node("mother", "Ibu", { partners: ["father"], childrenIds: ["child"] }),
        node("child", "Anak", { parentId: "father", parentIds: ["father", "mother"] }),
      ])
    );

    expect(model.layout.edges.map((edge) => edge.type)).toEqual(
      expect.arrayContaining(["spouse", "union-child"])
    );
  });

  it("includes member photos, stories, and media indicators in directory cards", () => {
    const model = buildTreePdfDocumentModel(
      tree([
        node("member", "Ari", {
          generation: 0,
          year: 1972,
          imageUrl: "/ari.jpg",
          content: {
            description: "Pendiri keluarga dan penjaga cerita.",
            media: [{ type: "image", url: "/ari-memory.jpg" }],
          },
        }),
      ])
    );

    expect(model.memberCards[0]).toMatchObject({
      name: "Ari",
      lifespan: "1972",
      hasPhoto: true,
      hasStory: true,
      hasMedia: true,
      description: "Pendiri keluarga dan penjaga cerita.",
    });
  });

  it("rejects empty trees before creating a blank PDF", () => {
    expect(() => buildTreePdfDocumentModel(tree([]), "id")).toThrow(
      "Belum ada data keluarga untuk diekspor."
    );
  });
});
