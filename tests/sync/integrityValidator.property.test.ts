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
});
