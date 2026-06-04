import { describe, expect, it } from "vitest";
import { IntegrityValidator } from "../lib/sync/IntegrityValidator";
import { roundTripTree } from "../lib/tree/persistence";
import {
  assertTreeGraphValid,
  InvalidTreeGraphError,
} from "../lib/tree/repository";
import { calculateSugiyamaLayout } from "../lib/tree/sugiyamaLayout";
import { validateFamilyLayout } from "../lib/tree/layoutValidation";
import type { FamilyNode } from "../lib/types/tree";
import {
  asymmetricDepth,
  child,
  cyclicGraph,
  fiveGenerations,
  largeSiblingGroup,
  multiRootUnrelatedFamilies,
  nuclearFamily,
  partner,
  person,
  remarriageHalfSiblings,
  siblingsAsPartners,
  singleParentAdoption,
  skipGenerationAdoption,
  tenGenerationExtendedFamily,
  twoFamiliesJoinedByMarriage,
} from "./helpers/fixtures";

const validator = new IntegrityValidator();

function sorted(values: string[] | undefined): string[] {
  return [...(values || [])].sort();
}

function byId(nodes: FamilyNode[]) {
  return new Map(nodes.map((node) => [node.id, node]));
}

function expectSameRelationshipSurface(before: FamilyNode[], after: FamilyNode[]) {
  const previous = byId(before);
  const next = byId(after);
  expect(next.size).toBe(previous.size);

  for (const [id, original] of previous) {
    const restored = next.get(id);
    expect(restored, `missing node ${id}`).toBeDefined();
    expect(sorted(restored!.parentIds)).toEqual(sorted(original.parentIds));
    expect(sorted(restored!.adoptiveParentIds)).toEqual(
      sorted(original.adoptiveParentIds)
    );
    expect(sorted(restored!.partners)).toEqual(sorted(original.partners));
    expect(sorted(restored!.childrenIds)).toEqual(sorted(original.childrenIds));
  }
}

function stepFamilyWithoutAutomaticCoParent(): FamilyNode[] {
  const nodes = [
    person("parent", "Parent"),
    person("current-partner", "Current Partner"),
    person("child-from-earlier-family", "Child From Earlier Family"),
  ];
  partner(nodes, "parent", "current-partner");
  child(nodes, ["parent"], "child-from-earlier-family");
  return nodes;
}

describe("world family readiness gate", () => {
  const validFamilies: Array<[string, () => FamilyNode[]]> = [
    ["nuclear family", nuclearFamily],
    ["five generations", fiveGenerations],
    ["remarriage and half siblings", remarriageHalfSiblings],
    ["single parent and adoption", singleParentAdoption],
    ["unrelated families in one archive", multiRootUnrelatedFamilies],
    ["two families joined by marriage", twoFamiliesJoinedByMarriage],
    ["large sibling group", largeSiblingGroup],
    ["ten-generation extended family", tenGenerationExtendedFamily],
    ["skip-generation adoption", skipGenerationAdoption],
    ["asymmetric branch depth", asymmetricDepth],
    ["step-family without automatic co-parent", stepFamilyWithoutAutomaticCoParent],
  ];

  it.each(validFamilies)(
    "keeps %s valid across graph validation, DB round-trip, and layout",
    (_name, build) => {
      const nodes = build();
      const integrity = validator.validate(nodes);
      expect(integrity.errors).toEqual([]);
      expect(integrity.valid).toBe(true);
      expect(() => assertTreeGraphValid(nodes)).not.toThrow();

      const restored = roundTripTree(nodes);
      expectSameRelationshipSurface(nodes, restored);

      const layout = calculateSugiyamaLayout(restored);
      const layoutResult = validateFamilyLayout(layout);
      const errors = layoutResult.issues.filter(
        (issue) => issue.severity === "error"
      );
      expect(errors).toEqual([]);
    }
  );

  it("rejects corrupt ancestry cycles and biological sibling partners", () => {
    for (const nodes of [cyclicGraph(), siblingsAsPartners()]) {
      expect(validator.validate(nodes).valid).toBe(false);
      expect(() => assertTreeGraphValid(nodes)).toThrow(InvalidTreeGraphError);
    }
  });
});
