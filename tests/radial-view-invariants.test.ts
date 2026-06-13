import { describe, expect, it } from "vitest";
import type { FamilyNode } from "../lib/types/tree";
import { buildFamilyGraph } from "../lib/tree/familyGraph";
import { resolveRadialPeople } from "../lib/tree/radialView";

function person(id: string, label: string, overrides: Partial<FamilyNode> = {}): FamilyNode {
  return {
    id,
    label,
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

function familyFixture() {
  const nodes = [
    person("evan", "Evan Setyawan", { parentIds: ["veronica", "jubahano"], partners: ["irene"] }),
    person("irene", "Irene", { partners: ["evan"] }),
    person("veronica", "Veronica Santoso", { childrenIds: ["evan"] }),
    person("jubahano", "Jubahano", { parentIds: ["suwahi", "riduan"], childrenIds: ["evan"] }),
    person("suwahi", "Suwahi", { partners: ["riduan"], childrenIds: ["jubahano", "meli", "sugiarto", "liem"] }),
    person("riduan", "Riduan Santoso", { partners: ["suwahi"], childrenIds: ["jubahano", "meli", "sugiarto", "liem"] }),
    person("meli", "Meli Yuliara", { parentIds: ["suwahi", "riduan"] }),
    person("sugiarto", "Sugiarto Santoso", { parentIds: ["suwahi", "riduan"], partners: ["phoa"], childrenIds: ["milhan", "hisson"] }),
    person("phoa", "Phoa Mei Ching", { partners: ["sugiarto"], childrenIds: ["milhan", "hisson"] }),
    person("milhan", "Milhan", { parentIds: ["sugiarto", "phoa"] }),
    person("hisson", "Hisson", { parentIds: ["sugiarto", "phoa"] }),
    person("liem", "Liem Wu Ying", { parentIds: ["suwahi", "riduan"], partners: ["soedibyo"], childrenIds: ["janestoca", "yusefresser", "sovi"] }),
    person("soedibyo", "Soedibyo", { partners: ["liem"], childrenIds: ["janestoca", "yusefresser", "sovi"] }),
    person("janestoca", "Janestoca", { parentIds: ["liem", "soedibyo"], partners: ["ida"] }),
    person("ida", "Ida", { partners: ["janestoca"] }),
    person("yusefresser", "Yusefresser", { parentIds: ["liem", "soedibyo"] }),
    person("sovi", "Sovi Sophia", { parentIds: ["liem", "soedibyo"] }),
  ];
  return { nodes, graph: buildFamilyGraph(nodes) };
}

function labels(entries: ReturnType<typeof resolveRadialPeople>) {
  return entries.map((entry) => entry.node.label);
}

describe("radial view relationship grammar", () => {
  it("uses relative ancestry and preserves unknown parent slots for Evan", () => {
    const { nodes, graph } = familyFixture();
    const result = resolveRadialPeople(nodes, "evan", "ancestors", graph, 2);

    expect(labels(result)).toEqual(expect.arrayContaining([
      "Evan Setyawan", "Veronica Santoso", "Jubahano", "Suwahi",
      "Riduan Santoso", "Orang tua belum diketahui",
    ]));
    expect(labels(result)).not.toEqual(expect.arrayContaining(["Milhan", "Irene"]));
  });

  it("does not treat extended-family descendants as Evan's descendants", () => {
    const { nodes, graph } = familyFixture();
    expect(labels(resolveRadialPeople(nodes, "evan", "descendants", graph))).toEqual([
      "Evan Setyawan",
    ]);
  });

  it("resolves descendants through parent units without partners becoming children", () => {
    const { nodes, graph } = familyFixture();
    const riduan = labels(resolveRadialPeople(nodes, "riduan", "descendants", graph));
    const sugiarto = labels(resolveRadialPeople(nodes, "sugiarto", "descendants", graph));
    const liem = labels(resolveRadialPeople(nodes, "liem", "descendants", graph));
    const soedibyo = labels(resolveRadialPeople(nodes, "soedibyo", "descendants", graph));

    expect(riduan).toEqual(expect.arrayContaining([
      "Meli Yuliara", "Liem Wu Ying", "Sugiarto Santoso", "Jubahano",
      "Milhan", "Hisson", "Janestoca", "Yusefresser", "Sovi Sophia",
    ]));
    expect(sugiarto).toEqual(expect.arrayContaining(["Milhan", "Hisson"]));
    expect(sugiarto).not.toContain("Phoa Mei Ching");
    expect(liem).toEqual(expect.arrayContaining(["Janestoca", "Yusefresser", "Sovi Sophia"]));
    expect(liem).not.toContain("Soedibyo");
    expect(soedibyo).toEqual(expect.arrayContaining(["Janestoca", "Yusefresser", "Sovi Sophia"]));
    expect(soedibyo).not.toContain("Ida");
  });
});
