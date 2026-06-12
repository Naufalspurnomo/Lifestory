import { describe, expect, it } from "vitest";
import type { FamilyNode } from "../lib/types/tree";
import { treeNodesPayloadSchema } from "../lib/validations";
import { applyNodeMutations } from "../lib/sync/applyMutations";
import { roundTripTree } from "../lib/tree/persistence";
import { sanitizeGraph } from "../lib/hooks/useTreeState";
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
