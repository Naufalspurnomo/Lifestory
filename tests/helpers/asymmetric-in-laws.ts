// Regression fixture for the "asymmetric in-laws" scenario.
//
// The user hits this: they build the tree up to their own parents on the
// left side, then marry someone from a family where they've filled in a
// grandparent on the right side. Without anchor-based layering, the extra
// grandparent on the right pushes the user's parents up to match it, and
// the user's siblings end up sitting next to their in-laws, which is
// visually wrong.
//
// With anchor-based layering, Admin ("self") is always the centre. Parents
// sit at layer -1, grandparents at -2, in-laws align by relationship, not
// by raw ancestor depth.

import type { FamilyNode } from "../../lib/types/tree";

const uniq = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean)));

function mk(
  id: string,
  label: string,
  extra: Partial<FamilyNode> = {}
): FamilyNode {
  return {
    id,
    label,
    sex: extra.sex ?? "X",
    year: extra.year ?? null,
    deathYear: extra.deathYear ?? null,
    parentId: null,
    parentIds: [],
    adoptiveParentIds: [],
    partners: [],
    childrenIds: [],
    generation: 0,
    line: extra.line ?? "default",
    imageUrl: null,
    content: { description: "", media: [] },
  };
}

function linkPartners(all: FamilyNode[], a: string, b: string) {
  const left = all.find((n) => n.id === a)!;
  const right = all.find((n) => n.id === b)!;
  left.partners = uniq([...left.partners, b]);
  right.partners = uniq([...right.partners, a]);
}

function linkChild(all: FamilyNode[], parentIds: string[], childId: string) {
  const child = all.find((n) => n.id === childId)!;
  child.parentIds = uniq([...(child.parentIds || []), ...parentIds]);
  child.parentId = child.parentIds[0] ?? null;
  for (const pid of parentIds) {
    const parent = all.find((n) => n.id === pid)!;
    parent.childrenIds = uniq([...parent.childrenIds, childId]);
  }
}

export function asymmetricInLaws(): FamilyNode[] {
  const nodes: FamilyNode[] = [
    // User side: parents only
    mk("ayah-aku", "Ayah aku", { sex: "M" }),
    mk("ibu-ku", "Ibu ku", { sex: "F" }),
    mk("adek-ku", "Adek ku", { sex: "M" }),
    mk("kakak-ku", "Kakak ku", { sex: "F" }),
    mk("admin", "Admin", { sex: "M", line: "self" }),

    // Wife side: one grandparent filled in
    mk("kakek-istri", "Kakek istri", { sex: "M" }),
    mk("ayah-istri", "Ayah istri", { sex: "M" }),
    mk("ibu-istri", "Ibu istri", { sex: "F" }),
    mk("istri-ku", "Istri ku", { sex: "F" }),

    // Shared children
    mk("anak-pertama", "Anak pertama", { sex: "M" }),
    mk("anak-kedua", "Anak kedua", { sex: "M" }),
  ];

  linkPartners(nodes, "ayah-aku", "ibu-ku");
  linkPartners(nodes, "ayah-istri", "ibu-istri");
  linkPartners(nodes, "admin", "istri-ku");

  linkChild(nodes, ["ayah-aku", "ibu-ku"], "admin");
  linkChild(nodes, ["ayah-aku", "ibu-ku"], "adek-ku");
  linkChild(nodes, ["ayah-aku", "ibu-ku"], "kakak-ku");

  linkChild(nodes, ["kakek-istri"], "ayah-istri");
  linkChild(nodes, ["ayah-istri", "ibu-istri"], "istri-ku");

  linkChild(nodes, ["admin", "istri-ku"], "anak-pertama");
  linkChild(nodes, ["admin", "istri-ku"], "anak-kedua");

  return nodes;
}
