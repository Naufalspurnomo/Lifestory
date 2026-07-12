import { describe, expect, it } from "vitest";
import { getArchiveMissions } from "../lib/archive/missions";
import type { FamilyNode } from "../lib/types/tree";

function person(id: string, overrides: Partial<FamilyNode> = {}): FamilyNode {
  return {
    id, label: id, year: 1950, deathYear: null, parentId: null, parentIds: [], adoptiveParentIds: [], partners: [], childrenIds: [], generation: 0,
    imageUrl: "photo.jpg", content: { description: "A saved family story.", media: [] }, ...overrides,
  };
}

describe("archive missions", () => {
  it("puts pending memories first and limits the desk to three real tasks", () => {
    const missions = getArchiveMissions([
      person("no-story", { content: { description: "", media: [] } }),
      person("no-photo", { imageUrl: null }),
      person("no-year", { year: null }),
      person("extra", { content: { description: "", media: [] } }),
    ], 2);
    expect(missions).toHaveLength(3);
    expect(missions[0].kind).toBe("proposal");
    expect(missions.map((mission) => mission.kind)).toEqual(["proposal", "story", "photo"]);
  });

  it("does not invent work for a complete archive", () => {
    expect(getArchiveMissions([person("complete")], 0)).toEqual([]);
  });
});
