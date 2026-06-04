import { describe, expect, it } from "vitest";
import {
  assertTreeGraphValid,
  InvalidTreeGraphError,
} from "../lib/tree/repository";
import type { FamilyNode } from "../lib/types/tree";

function person(id: string): FamilyNode {
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
  };
}

describe("server-side tree graph validation", () => {
  it("accepts a non-empty internally consistent archive", () => {
    expect(() => assertTreeGraphValid([person("root")])).not.toThrow();
  });

  it("rejects an empty archive before destructive graph replacement", () => {
    expect(() => assertTreeGraphValid([])).toThrow(InvalidTreeGraphError);
  });

  it("rejects orphan and one-way relationship references", () => {
    const orphan = { ...person("child"), parentIds: ["missing"] };
    expect(() => assertTreeGraphValid([orphan])).toThrow(InvalidTreeGraphError);

    const first = { ...person("first"), partners: ["second"] };
    expect(() => assertTreeGraphValid([first, person("second")])).toThrow(
      InvalidTreeGraphError
    );

    const parentOnly = {
      ...person("parent"),
      childrenIds: ["child"],
    };
    expect(() => assertTreeGraphValid([parentOnly, person("child")])).toThrow(
      InvalidTreeGraphError
    );

    const childOnly = {
      ...person("child"),
      parentId: "parent",
      parentIds: ["parent"],
    };
    expect(() => assertTreeGraphValid([person("parent"), childOnly])).toThrow(
      InvalidTreeGraphError
    );
  });

  it("rejects circular ancestry", () => {
    const first = {
      ...person("first"),
      parentId: "second",
      parentIds: ["second"],
      childrenIds: ["second"],
    };
    const second = {
      ...person("second"),
      parentId: "first",
      parentIds: ["first"],
      childrenIds: ["first"],
    };
    expect(() => assertTreeGraphValid([first, second])).toThrow(
      InvalidTreeGraphError
    );
  });

  it("rejects self links and biological sibling partners", () => {
    const selfPartner = { ...person("self"), partners: ["self"] };
    expect(() => assertTreeGraphValid([selfPartner])).toThrow(
      InvalidTreeGraphError
    );

    const parent = { ...person("parent"), childrenIds: ["a", "b"] };
    const first = {
      ...person("a"),
      parentId: "parent",
      parentIds: ["parent"],
      partners: ["b"],
    };
    const second = {
      ...person("b"),
      parentId: "parent",
      parentIds: ["parent"],
      partners: ["a"],
    };

    expect(() => assertTreeGraphValid([parent, first, second])).toThrow(
      InvalidTreeGraphError
    );
  });
});
