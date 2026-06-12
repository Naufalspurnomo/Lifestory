import { calculateSugiyamaLayout } from "../lib/tree/sugiyamaLayout";
import { validateFamilyLayout } from "../lib/tree/layoutValidation";
import type { FamilyNode } from "../lib/types/tree";

type Fixture = {
  name: string;
  nodes: FamilyNode[];
};

function person(
  id: string,
  label: string,
  extra: Partial<FamilyNode> = {}
): FamilyNode {
  return {
    id,
    label,
    sex: extra.sex || "X",
    year: extra.year ?? null,
    deathYear: extra.deathYear ?? null,
    parentId: extra.parentId ?? null,
    parentIds: extra.parentIds || [],
    partners: extra.partners || [],
    childrenIds: extra.childrenIds || [],
    generation: extra.generation ?? 0,
    line: extra.line || "default",
    imageUrl: extra.imageUrl ?? null,
    content: extra.content || { description: "", media: [] },
    works: extra.works,
  };
}

function get(nodes: FamilyNode[], id: string) {
  const node = nodes.find((item) => item.id === id);
  if (!node) throw new Error(`Missing fixture node ${id}`);
  return node;
}

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function partner(nodes: FamilyNode[], aId: string, bId: string) {
  const a = get(nodes, aId);
  const b = get(nodes, bId);
  a.partners = uniq([...(a.partners || []), bId]);
  b.partners = uniq([...(b.partners || []), aId]);
}

function child(nodes: FamilyNode[], parentIds: string[], childId: string) {
  const target = get(nodes, childId);
  target.parentIds = uniq([...(target.parentIds || []), ...parentIds]);
  target.parentId = target.parentIds[0] ?? null;

  for (const parentId of parentIds) {
    const parentNode = get(nodes, parentId);
    parentNode.childrenIds = uniq([...(parentNode.childrenIds || []), childId]);
  }
}

function nuclearWithManyChildren(): Fixture {
  const nodes = [
    person("father", "Ayah", { sex: "M" }),
    person("mother", "Ibu", { sex: "F" }),
  ];

  partner(nodes, "father", "mother");

  for (let index = 1; index <= 12; index++) {
    const id = `child-${index}`;
    nodes.push(person(id, `Anak ${index}`));
    child(nodes, ["father", "mother"], id);
  }

  return { name: "nuclear-12-children", nodes };
}

function fourGenerations(): Fixture {
  const nodes = [
    person("great-grandfather", "Buyut Laki-laki", { sex: "M" }),
    person("great-grandmother", "Buyut Perempuan", { sex: "F" }),
    person("grandfather", "Kakek", { sex: "M" }),
    person("grandmother", "Nenek", { sex: "F" }),
    person("father", "Ayah", { sex: "M" }),
    person("mother", "Ibu", { sex: "F" }),
    person("child", "Anak"),
    person("grandchild", "Cucu"),
  ];

  partner(nodes, "great-grandfather", "great-grandmother");
  partner(nodes, "grandfather", "grandmother");
  partner(nodes, "father", "mother");
  child(nodes, ["great-grandfather", "great-grandmother"], "grandfather");
  child(nodes, ["grandfather", "grandmother"], "father");
  child(nodes, ["father", "mother"], "child");
  child(nodes, ["child"], "grandchild");

  return { name: "four-generations", nodes };
}

function remarriageAndHalfSiblings(): Fixture {
  const nodes = [
    person("father", "Ayah Bersama", { sex: "M" }),
    person("mother-a", "Ibu Pertama", { sex: "F" }),
    person("mother-b", "Ibu Kedua", { sex: "F" }),
    person("stepfather", "Ayah Sambung", { sex: "M" }),
    person("child-a1", "Anak A1"),
    person("child-a2", "Anak A2"),
    person("child-b1", "Anak B1"),
    person("child-step", "Anak Ibu Pertama dan Ayah Sambung"),
  ];

  partner(nodes, "father", "mother-a");
  partner(nodes, "father", "mother-b");
  partner(nodes, "mother-a", "stepfather");
  child(nodes, ["father", "mother-a"], "child-a1");
  child(nodes, ["father", "mother-a"], "child-a2");
  child(nodes, ["father", "mother-b"], "child-b1");
  child(nodes, ["mother-a", "stepfather"], "child-step");

  return { name: "remarriage-half-siblings", nodes };
}

function singleParentBranch(): Fixture {
  const nodes = [
    person("mother", "Single Parent", { sex: "F" }),
    person("child-1", "Anak Tunggal"),
    person("child-2", "Anak Kedua"),
    person("grandchild-1", "Cucu Pertama"),
  ];

  child(nodes, ["mother"], "child-1");
  child(nodes, ["mother"], "child-2");
  child(nodes, ["child-1"], "grandchild-1");

  return { name: "single-parent-branch", nodes };
}

function neighboringDescendantBranches(): Fixture {
  const nodes = [
    person("sugiarto", "Sugiarto Santoso"),
    person("phoa", "Phoa Mei Ching"),
    person("milhan", "Milhan"),
    person("hisson", "Hisson"),
    person("liem", "Liem Wu Ying"),
    person("soedibyo", "Soedibyo"),
    person("janestoca", "Janestoca"),
    person("yusefresser", "Yusefresser"),
    person("sovi", "Sovi Sophia"),
  ];

  child(nodes, ["sugiarto"], "phoa");
  child(nodes, ["phoa"], "milhan");
  child(nodes, ["phoa"], "hisson");
  child(nodes, ["liem"], "soedibyo");
  child(nodes, ["soedibyo"], "janestoca");
  child(nodes, ["soedibyo"], "yusefresser");
  child(nodes, ["soedibyo"], "sovi");

  return { name: "neighboring-descendant-branches", nodes };
}

const fixtures: Fixture[] = [
  nuclearWithManyChildren(),
  fourGenerations(),
  remarriageAndHalfSiblings(),
  singleParentBranch(),
  neighboringDescendantBranches(),
];

let failed = false;

for (const fixture of fixtures) {
  const layout = calculateSugiyamaLayout(fixture.nodes);
  const validation = validateFamilyLayout(layout);
  const errors = validation.issues.filter((issue) => issue.severity === "error");
  const warnings = validation.issues.filter(
    (issue) => issue.severity === "warning"
  );

  if (errors.length > 0) {
    failed = true;
    console.error(`FAIL ${fixture.name}`);
    for (const issue of errors) {
      console.error(`  [${issue.code}] ${issue.message}`);
    }
    continue;
  }

  console.log(
    `PASS ${fixture.name}: ${layout.nodes.length} people, ${layout.unions?.length || 0} unions, ${layout.edges.length} edges` +
      (warnings.length > 0 ? `, ${warnings.length} warnings` : "")
  );
}

if (failed) {
  process.exitCode = 1;
}
