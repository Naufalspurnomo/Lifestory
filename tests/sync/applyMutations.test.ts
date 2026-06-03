import { describe, expect, it } from "vitest";
import { applyNodeMutations } from "../../lib/sync/applyMutations";
import { person } from "../helpers/fixtures";

describe("shared-tree delta mutation application", () => {
  it("keeps a remote child when a local device adds another child", () => {
    const previous = person("parent", "Parent");
    const current = person("parent", "Parent", {
      childrenIds: ["remote-child"],
    });
    const next = person("parent", "Parent", {
      childrenIds: ["local-child"],
    });

    const [merged] = applyNodeMutations([current], [
      {
        type: "update",
        nodeId: "parent",
        payload: next,
        previousPayload: previous,
      },
    ]);

    expect(merged.childrenIds.sort()).toEqual(["local-child", "remote-child"]);
  });

  it("removes the requested relation without removing a remote relation", () => {
    const previous = person("parent", "Parent", {
      childrenIds: ["old-child"],
    });
    const current = person("parent", "Parent", {
      childrenIds: ["old-child", "remote-child"],
    });
    const next = person("parent", "Parent");

    const [merged] = applyNodeMutations([current], [
      {
        type: "update",
        nodeId: "parent",
        payload: next,
        previousPayload: previous,
      },
    ]);

    expect(merged.childrenIds).toEqual(["remote-child"]);
  });

  it("updates one scalar field without overwriting a different remote edit", () => {
    const previous = person("person", "Before", {
      content: { description: "Before", media: [] },
    });
    const current = person("person", "Before", {
      content: { description: "Remote description", media: [] },
    });
    const next = person("person", "Laptop", {
      content: { description: "Before", media: [] },
    });

    const [merged] = applyNodeMutations([current], [
      {
        type: "update",
        nodeId: "person",
        payload: next,
        previousPayload: previous,
      },
    ]);

    expect(merged.label).toBe("Laptop");
    expect(merged.content.description).toBe("Remote description");
  });

  it("removes optional metadata even when JSON serialization omitted its key", () => {
    const previous = person("person", "Person", {
      sex: "F",
    });
    const current = person("person", "Person", {
      sex: "F",
      content: { description: "Remote description", media: [] },
    });
    const next = person("person", "Person");
    delete next.sex;

    const [merged] = applyNodeMutations([current], [
      {
        type: "update",
        nodeId: "person",
        payload: next,
        previousPayload: previous,
      },
    ]);

    expect(merged.sex).toBeUndefined();
    expect(merged.content.description).toBe("Remote description");
  });

  it("cleans graph references when a node is deleted", () => {
    const parent = person("parent", "Parent", { childrenIds: ["child"] });
    const child = person("child", "Child", {
      parentId: "parent",
      parentIds: ["parent"],
      partners: ["partner"],
    });
    const partner = person("partner", "Partner", { partners: ["child"] });

    const nodes = applyNodeMutations([parent, child, partner], [
      {
        type: "delete",
        nodeId: "child",
        payload: null,
        previousPayload: child,
      },
    ]);

    expect(nodes.map((node) => node.id).sort()).toEqual(["parent", "partner"]);
    expect(nodes.find((node) => node.id === "parent")?.childrenIds).toEqual([]);
    expect(nodes.find((node) => node.id === "partner")?.partners).toEqual([]);
  });
});
