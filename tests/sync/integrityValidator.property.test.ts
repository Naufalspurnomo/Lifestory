import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { IntegrityValidator } from "../../lib/sync/IntegrityValidator";
import { child, person } from "../helpers/fixtures";

describe("data reliability integrity validator", () => {
  const validator = new IntegrityValidator();

  it("accepts well-formed family trees", () => {
    // Feature: data-reliability-sync, Property 15: Integrity Validator Detects All Corruption Types
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (count) => {
        const nodes = [person("root", "Root")];
        for (let index = 0; index < count; index++) {
          const id = `child-${index}`;
          nodes.push(person(id, `Child ${index}`));
          child(nodes, ["root"], id);
        }
        expect(validator.validate(nodes).valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("detects orphan parents, one-way partners, cycles, and duplicate ids", () => {
    const orphan = [person("a", "A", { parentIds: ["ghost"], parentId: "ghost" })];
    expect(validator.validate(orphan).errors.some((e) => e.type === "orphan-parent-ref")).toBe(true);

    const oneWay = [person("a", "A", { partners: ["b"] }), person("b", "B")];
    expect(validator.validate(oneWay).errors.some((e) => e.type === "unidirectional-partner")).toBe(true);

    const cycle = [person("a", "A"), person("b", "B")];
    child(cycle, ["a"], "b");
    child(cycle, ["b"], "a");
    expect(validator.validate(cycle).errors.some((e) => e.type === "circular-ancestor")).toBe(true);

    const duplicate = [person("a", "A"), person("a", "A copy")];
    expect(validator.validate(duplicate).errors.some((e) => e.type === "duplicate-id")).toBe(true);
  });

  it("detects broken child links, self links, adoptive orphans, and sibling partners", () => {
    const oneWayParentChild = [
      person("parent", "Parent", { childrenIds: ["child"] }),
      person("child", "Child"),
    ];
    expect(
      validator
        .validate(oneWayParentChild)
        .errors.some((e) => e.type === "unidirectional-parent-child")
    ).toBe(true);

    const oneWayChildParent = [
      person("parent", "Parent"),
      person("child", "Child", { parentId: "parent", parentIds: ["parent"] }),
    ];
    expect(
      validator
        .validate(oneWayChildParent)
        .errors.some((e) => e.type === "unidirectional-parent-child")
    ).toBe(true);

    const missingChild = [person("parent", "Parent", { childrenIds: ["ghost"] })];
    expect(
      validator
        .validate(missingChild)
        .errors.some((e) => e.type === "orphan-child-ref")
    ).toBe(true);

    const missingAdoptive = [
      person("child", "Child", { adoptiveParentIds: ["ghost"] }),
    ];
    expect(
      validator
        .validate(missingAdoptive)
        .errors.some((e) => e.type === "orphan-adoptive-parent-ref")
    ).toBe(true);

    const selfPartner = [person("self", "Self", { partners: ["self"] })];
    expect(
      validator.validate(selfPartner).errors.some((e) => e.type === "self-reference")
    ).toBe(true);

    const siblingPartner = [
      person("dad", "Dad", { childrenIds: ["a", "b"] }),
      person("a", "A", {
        parentId: "dad",
        parentIds: ["dad"],
        partners: ["b"],
      }),
      person("b", "B", {
        parentId: "dad",
        parentIds: ["dad"],
        partners: ["a"],
      }),
    ];
    expect(
      validator
        .validate(siblingPartner)
        .errors.some((e) => e.type === "sibling-partner")
    ).toBe(true);
  });
});
