// Mirror of the regression fixture from tests/helpers/asymmetric-in-laws.ts,
// shaped for the visual report generator. Represents the exact bug Naufal
// reproduced: adding one grandparent on the spouse's side used to shift the
// user's own parents up a generation.

import type { FamilyNode } from "../../../lib/types/tree";
import { buildTree, node, link } from "../helpers/builders";

export function asymmetricInLawsTree(): FamilyNode[] {
  const b = buildTree();

  b.add(node("ayah-aku", "Ayah aku", { sex: "M" }));
  b.add(node("ibu-ku", "Ibu ku", { sex: "F" }));
  b.add(node("adek-ku", "Adek ku", { sex: "M" }));
  b.add(node("kakak-ku", "Kakak ku", { sex: "F" }));
  b.add(node("admin", "Admin", { sex: "M", line: "self" }));

  b.add(node("kakek-istri", "Kakek istri", { sex: "M" }));
  b.add(node("ayah-istri", "Ayah istri", { sex: "M" }));
  b.add(node("ibu-istri", "Ibu istri", { sex: "F" }));
  b.add(node("istri-ku", "Istri ku", { sex: "F" }));

  b.add(node("anak-pertama", "Anak pertama", { sex: "M" }));
  b.add(node("anak-kedua", "Anak kedua", { sex: "M" }));

  link.partner(b, "ayah-aku", "ibu-ku");
  link.partner(b, "ayah-istri", "ibu-istri");
  link.partner(b, "admin", "istri-ku");

  link.child(b, ["ayah-aku", "ibu-ku"], "admin");
  link.child(b, ["ayah-aku", "ibu-ku"], "adek-ku");
  link.child(b, ["ayah-aku", "ibu-ku"], "kakak-ku");

  link.child(b, ["kakek-istri"], "ayah-istri");
  link.child(b, ["ayah-istri", "ibu-istri"], "istri-ku");

  link.child(b, ["admin", "istri-ku"], "anak-pertama");
  link.child(b, ["admin", "istri-ku"], "anak-kedua");

  return b.nodes();
}
