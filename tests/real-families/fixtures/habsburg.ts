// House of Habsburg — simplified Spanish line from Maximilian I down to Charles II.
// Sumber: wikipedia.org/wiki/House_of_Habsburg, britannica.com/topic/House-of-Habsburg,
// wikipedia.org/wiki/Charles_II_of_Spain, wikipedia.org/wiki/Template:Habsburg_family_tree.
// Konten diparafrase untuk kepatuhan lisensi.
//
// Fokus: konsanguinitas intens. Philip IV menikah keponakannya Mariana of Austria.
// Cabang juga merangkum Ferdinand I (Austrian line) dari generasi Charles V.

import type { FamilyNode } from "../../../lib/types/tree";
import { buildTree, node, link } from "../helpers/builders";

export function habsburgDynasty(): FamilyNode[] {
  const b = buildTree();

  // ----- Gen 0 -----
  b.add(node("max1", "Maximilian I", { sex: "M", year: 1459, deathYear: 1519, line: "self" }));
  b.add(node("mary-burgundy", "Mary of Burgundy", { sex: "F", year: 1457, deathYear: 1482 }));
  link.partner(b, "max1", "mary-burgundy");

  // ----- Gen 1 -----
  b.add(node("philip1", "Philip I of Castile", { sex: "M", year: 1478, deathYear: 1506 }));
  link.child(b, ["max1", "mary-burgundy"], "philip1");

  b.add(node("joanna", "Joanna of Castile", { sex: "F", year: 1479, deathYear: 1555 }));
  link.partner(b, "philip1", "joanna");

  // ----- Gen 2 -----
  b.add(node("charles5", "Charles V", { sex: "M", year: 1500, deathYear: 1558 }));
  b.add(node("ferdinand1", "Ferdinand I", { sex: "M", year: 1503, deathYear: 1564 }));
  link.child(b, ["philip1", "joanna"], "charles5");
  link.child(b, ["philip1", "joanna"], "ferdinand1");

  b.add(node("isabella-portugal", "Isabella of Portugal", { sex: "F", year: 1503, deathYear: 1539 }));
  link.partner(b, "charles5", "isabella-portugal");

  b.add(node("anna-bohemia", "Anna of Bohemia and Hungary", { sex: "F", year: 1503, deathYear: 1547 }));
  link.partner(b, "ferdinand1", "anna-bohemia");

  // ----- Gen 3 -----
  b.add(node("philip2", "Philip II of Spain", { sex: "M", year: 1527, deathYear: 1598 }));
  link.child(b, ["charles5", "isabella-portugal"], "philip2");

  b.add(node("maximilian2", "Maximilian II", { sex: "M", year: 1527, deathYear: 1576 }));
  link.child(b, ["ferdinand1", "anna-bohemia"], "maximilian2");

  b.add(node("anna-austria", "Anna of Austria", { sex: "F", year: 1549, deathYear: 1580 }));
  link.child(b, ["maximilian2"], "anna-austria");

  // Philip II married his niece Anna of Austria — classic Habsburg consanguinity
  link.partner(b, "philip2", "anna-austria");

  // ----- Gen 4 -----
  b.add(node("philip3", "Philip III of Spain", { sex: "M", year: 1578, deathYear: 1621 }));
  link.child(b, ["philip2", "anna-austria"], "philip3");

  b.add(node("margaret-austria", "Margaret of Austria", { sex: "F", year: 1584, deathYear: 1611 }));
  link.partner(b, "philip3", "margaret-austria");

  // ----- Gen 5 -----
  b.add(node("philip4", "Philip IV of Spain", { sex: "M", year: 1605, deathYear: 1665 }));
  b.add(node("maria-anna", "Maria Anna of Spain", { sex: "F", year: 1606, deathYear: 1646 }));
  link.child(b, ["philip3", "margaret-austria"], "philip4");
  link.child(b, ["philip3", "margaret-austria"], "maria-anna");

  b.add(node("ferdinand3", "Ferdinand III, Holy Roman Emperor", { sex: "M", year: 1608, deathYear: 1657 }));
  link.partner(b, "maria-anna", "ferdinand3");

  // ----- Gen 6 -----
  b.add(node("mariana-austria", "Mariana of Austria", { sex: "F", year: 1634, deathYear: 1696 }));
  link.child(b, ["ferdinand3", "maria-anna"], "mariana-austria");

  // Philip IV married his own niece Mariana.
  link.partner(b, "philip4", "mariana-austria");

  // ----- Gen 7 -----
  b.add(node("charles2", "Charles II of Spain", { sex: "M", year: 1661, deathYear: 1700 }));
  link.child(b, ["philip4", "mariana-austria"], "charles2");

  return b.nodes();
}
