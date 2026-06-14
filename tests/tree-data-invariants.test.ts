import { describe, expect, it } from "vitest";
import type { FamilyNode } from "../lib/types/tree";
import { treeNodesPayloadSchema } from "../lib/validations";
import { applyNodeMutations } from "../lib/sync/applyMutations";
import { createExportData } from "../lib/sync/ExportManager";
import { roundTripTree, serializeTreeToRows } from "../lib/tree/persistence";
import { sanitizeGraph } from "../lib/hooks/useTreeState";
import {
  buildFamilyGraph,
  deriveFamilyNodesFromGraph,
  validateFamilyGraph,
} from "../lib/tree/familyGraph";
import {
  derivePublicBaseUrlFromEndpoint,
  resolveDisplayMediaUrl,
} from "../lib/media/public-url";

function familyNode(id: string, overrides: Partial<FamilyNode> = {}): FamilyNode {
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

describe("family tree validation", () => {
  it("rejects unsafe media URLs before persistence", () => {
    const result = treeNodesPayloadSchema.safeParse({
      expectedVersion: 1,
      nodes: [
        familyNode("root", {
          imageUrl: "javascript:alert(1)",
        }),
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing relationship references", () => {
    const result = treeNodesPayloadSchema.safeParse({
      expectedVersion: 1,
      nodes: [
        familyNode("child", {
          parentIds: ["missing-parent"],
        }),
      ],
    });

    expect(result.success).toBe(false);
  });
});

describe("sync mutation application", () => {
  it("removes references when a node is deleted", () => {
    const nodes = [
      familyNode("parent", { childrenIds: ["child"] }),
      familyNode("child", {
        parentId: "parent",
        parentIds: ["parent"],
        partners: ["partner"],
      }),
      familyNode("partner", { partners: ["child"] }),
    ];

    const result = applyNodeMutations(nodes, [
      { type: "delete", nodeId: "child", payload: null },
    ]);
    const byId = new Map(result.map((node) => [node.id, node]));

    expect(byId.has("child")).toBe(false);
    expect(byId.get("parent")?.childrenIds).toEqual([]);
    expect(byId.get("partner")?.partners).toEqual([]);
  });

  it("merges set-like updates without dropping concurrent additions", () => {
    const previous = familyNode("root", { partners: ["existing"] });
    const current = familyNode("root", {
      partners: ["existing", "collaborator-added"],
    });
    const next = familyNode("root", {
      partners: ["existing", "client-added"],
    });

    const [result] = applyNodeMutations([current], [
      {
        type: "update",
        nodeId: "root",
        previousPayload: previous,
        payload: next,
      },
    ]);

    expect(result.partners).toEqual([
      "existing",
      "collaborator-added",
      "client-added",
    ]);
  });
});

describe("tree persistence projection", () => {
  it("round-trips biological, adoptive, and partner relationships", () => {
    const parent = familyNode("parent", { childrenIds: ["child"] });
    const adoptive = familyNode("adoptive");
    const child = familyNode("child", {
      parentId: "parent",
      parentIds: ["parent"],
      adoptiveParentIds: ["adoptive"],
      partners: ["spouse"],
    });
    const spouse = familyNode("spouse", { partners: ["child"] });

    const result = roundTripTree([parent, adoptive, child, spouse]);
    const byId = new Map(result.map((node) => [node.id, node]));

    expect(byId.get("parent")?.childrenIds).toEqual(["child"]);
    expect(byId.get("child")?.parentIds).toEqual(["parent"]);
    expect(byId.get("child")?.adoptiveParentIds).toEqual(["adoptive"]);
    expect(byId.get("child")?.partners).toEqual(["spouse"]);
    expect(byId.get("spouse")?.partners).toEqual(["child"]);
  });

  it("round-trips manual sibling order", () => {
    const result = roundTripTree([
      familyNode("child-a", { siblingOrder: 1 }),
      familyNode("child-b", { siblingOrder: 0 }),
    ]);
    const byId = new Map(result.map((node) => [node.id, node]));

    expect(byId.get("child-a")?.siblingOrder).toBe(1);
    expect(byId.get("child-b")?.siblingOrder).toBe(0);
  });
});

describe("canonical family graph", () => {
  it("builds parent units and parent-child links as the canonical relation layer", () => {
    const father = familyNode("father", {
      label: "Ayah",
      partners: ["mother"],
      childrenIds: ["child"],
    });
    const mother = familyNode("mother", {
      label: "Ibu",
      partners: ["father"],
      childrenIds: ["child"],
    });
    const child = familyNode("child", {
      label: "Anak",
      parentId: "mother",
      parentIds: ["mother", "father"],
    });

    const graph = buildFamilyGraph([father, mother, child]);
    const validation = validateFamilyGraph(graph);
    const parentLink = graph.parentChildLinks.find(
      (link) => link.childId === "child"
    );
    const parentUnit = graph.unions.find(
      (union) => union.id === parentLink?.parentUnitId
    );

    expect(validation.valid).toBe(true);
    expect(parentUnit?.partnerIds).toEqual(
      expect.arrayContaining(["father", "mother"])
    );
    expect(parentUnit?.partnerIds).toHaveLength(2);
    expect(parentLink?.relationType).toBe("biological");
    expect(parentLink?.confidence).toBe("confirmed");
  });

  it("rebuilds derived parent, child, and partner caches from canonical graph", () => {
    const father = familyNode("father", { partners: ["mother"] });
    const mother = familyNode("mother", { partners: ["father"] });
    const child = familyNode("child", {
      parentId: "mother",
      parentIds: ["mother", "father"],
    });

    const derived = deriveFamilyNodesFromGraph(
      buildFamilyGraph([father, mother, child]),
      [father, mother, child]
    );
    const byId = new Map(derived.map((node) => [node.id, node]));

    expect(byId.get("father")?.childrenIds).toEqual(["child"]);
    expect(byId.get("mother")?.childrenIds).toEqual(["child"]);
    expect(byId.get("child")?.parentIds).toEqual(
      expect.arrayContaining(["father", "mother"])
    );
    expect(byId.get("child")?.parentIds).toHaveLength(2);
    expect(byId.get("father")?.partners).toEqual(["mother"]);
  });

  it("does not guess a co-parent when a parent has multiple reciprocal partners", () => {
    const mother = familyNode("mother", {
      partners: ["father-a", "father-b"],
      childrenIds: ["child"],
    });
    const fatherA = familyNode("father-a", { partners: ["mother"] });
    const fatherB = familyNode("father-b", { partners: ["mother"] });
    const child = familyNode("child", {
      parentId: "mother",
      parentIds: ["mother"],
    });

    const derived = deriveFamilyNodesFromGraph(
      buildFamilyGraph([mother, fatherA, fatherB, child]),
      [mother, fatherA, fatherB, child]
    );

    expect(derived.find((node) => node.id === "child")?.parentIds).toEqual([
      "mother",
    ]);
  });

  it("allows unknown parent units for future sibling commands without storing sibling links", () => {
    const graph = {
      schemaVersion: 1 as const,
      persons: [familyNode("child-a"), familyNode("child-b")],
      unions: [
        {
          id: "unit-unknown-parent",
          partnerIds: [],
          status: "unknown" as const,
          evidenceIds: [],
        },
      ],
      parentChildLinks: [
        {
          id: "pcl-unit-unknown-parent-child-a-biological",
          parentUnitId: "unit-unknown-parent",
          childId: "child-a",
          relationType: "unknown" as const,
          confidence: "unknown" as const,
          evidenceIds: [],
        },
        {
          id: "pcl-unit-unknown-parent-child-b-biological",
          parentUnitId: "unit-unknown-parent",
          childId: "child-b",
          relationType: "unknown" as const,
          confidence: "unknown" as const,
          evidenceIds: [],
        },
      ],
      evidence: [],
    };

    expect(validateFamilyGraph(graph).valid).toBe(true);
  });

  it("persists canonical relation metadata on edge rows", () => {
    const father = familyNode("father", { partners: ["mother"] });
    const mother = familyNode("mother", { partners: ["father"] });
    const child = familyNode("child", {
      parentId: "mother",
      parentIds: ["mother", "father"],
    });

    const snapshot = serializeTreeToRows([father, mother, child]);
    const parentEdge = snapshot.edges.find(
      (edge) => edge.kind === "biological-parent" && edge.toId === "child"
    );

    expect(parentEdge?.metadata?.familyGraph).toMatchObject({
      entity: "parentChildLink",
      relationType: "biological",
      confidence: "confirmed",
    });
  });

  it("includes canonical graph in JSON exports alongside derived node caches", () => {
    const tree = {
      id: "tree",
      name: "Keluarga",
      ownerId: "owner",
      nodes: [
        familyNode("father", { partners: ["mother"] }),
        familyNode("mother", { partners: ["father"] }),
        familyNode("child", {
          parentId: "mother",
          parentIds: ["mother", "father"],
        }),
      ],
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-13T00:00:00.000Z",
    };

    const exportData = createExportData(tree);

    expect(exportData.tree.nodes).toHaveLength(3);
    expect(exportData.tree.graph?.unions.length).toBeGreaterThan(0);
    expect(exportData.tree.graph?.parentChildLinks).toHaveLength(1);
  });
});

describe("legacy relationship repair", () => {
  it("promotes single-parent children to the unambiguous couple parent unit", () => {
    const father = familyNode("riduan", {
      label: "Riduan Santoso",
      partners: ["suwahi"],
    });
    const mother = familyNode("suwahi", {
      label: "Suwahi",
      partners: ["riduan"],
      childrenIds: ["sugiarto"],
    });
    const child = familyNode("sugiarto", {
      label: "Sugiarto Santoso",
      parentId: "suwahi",
      parentIds: ["suwahi"],
    });

    const result = sanitizeGraph([father, mother, child]);
    const byId = new Map(result.map((node) => [node.id, node]));

    expect(byId.get("sugiarto")?.parentIds).toEqual(["suwahi", "riduan"]);
    expect(byId.get("riduan")?.childrenIds).toEqual(["sugiarto"]);
  });
});

describe("Supabase media URL normalization", () => {
  it("derives public object URLs from Supabase S3 endpoints", () => {
    expect(
      derivePublicBaseUrlFromEndpoint(
        "https://project-ref.storage.supabase.co/storage/v1/s3",
        "family media"
      )
    ).toBe(
      "https://project-ref.supabase.co/storage/v1/object/public/family%20media"
    );
  });

  it("normalizes hosted Supabase S3 object URLs for browser display", () => {
    expect(
      resolveDisplayMediaUrl(
        "https://project-ref.storage.supabase.co/storage/v1/s3/family-media/trees/root/photo.webp"
      )
    ).toBe(
      "https://project-ref.supabase.co/storage/v1/object/public/family-media/trees/root/photo.webp"
    );
  });
});
