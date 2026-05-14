// Ottoman dynasty (first 7 sultans). Sumber: wikipedia.org/wiki/Ottoman_family_tree,
// britannica.com/place/Ottoman-Empire/Sultans-of-the-Ottoman-Empire,
// wikipedia.org/wiki/List_of_sultans_of_the_Ottoman_Empire. Konten diparafrase.
//
// Scope: Osman I → Orhan → Murad I → Bayezid I → Mehmed I → Murad II → Mehmed II.
// Plus consort/mother (hatun) di tiap generasi (data berbasis tradisi, sebagian disputed).

import type { FamilyNode } from "../../../lib/types/tree";
import { buildTree, node, link } from "../helpers/builders";

export function ottomanDynasty(): FamilyNode[] {
  const b = buildTree();

  b.add(node("ertugrul", "Ertuğrul Gazi", { sex: "M", year: 1191, deathYear: 1281, line: "self" }));
  b.add(node("halime", "Halime Hatun (disputed)", { sex: "F" }));
  link.partner(b, "ertugrul", "halime");

  b.add(node("osman1", "Osman I", { sex: "M", year: 1258, deathYear: 1324 }));
  link.child(b, ["ertugrul", "halime"], "osman1");

  b.add(node("malhun", "Malhun Hatun", { sex: "F" }));
  link.partner(b, "osman1", "malhun");

  b.add(node("orhan", "Orhan", { sex: "M", year: 1281, deathYear: 1362 }));
  link.child(b, ["osman1", "malhun"], "orhan");

  b.add(node("nilufer", "Nilüfer Hatun", { sex: "F", year: 1280, deathYear: 1383 }));
  link.partner(b, "orhan", "nilufer");

  b.add(node("murad1", "Murad I", { sex: "M", year: 1326, deathYear: 1389 }));
  link.child(b, ["orhan", "nilufer"], "murad1");

  b.add(node("gulcicek", "Gülçiçek Hatun", { sex: "F" }));
  link.partner(b, "murad1", "gulcicek");

  b.add(node("bayezid1", "Bayezid I", { sex: "M", year: 1360, deathYear: 1403 }));
  link.child(b, ["murad1", "gulcicek"], "bayezid1");

  b.add(node("devletshah", "Devletşah Hatun", { sex: "F" }));
  link.partner(b, "bayezid1", "devletshah");

  // Bayezid punya banyak anak yang saling berseteru — simpan 2: Mehmed I dan Suleyman
  b.add(node("mehmed1", "Mehmed I", { sex: "M", year: 1389, deathYear: 1421 }));
  b.add(node("suleyman-celebi", "Süleyman Çelebi", { sex: "M", year: 1377, deathYear: 1411 }));
  link.child(b, ["bayezid1", "devletshah"], "mehmed1");
  link.child(b, ["bayezid1", "devletshah"], "suleyman-celebi");

  b.add(node("emine", "Emine Hatun", { sex: "F" }));
  link.partner(b, "mehmed1", "emine");

  b.add(node("murad2", "Murad II", { sex: "M", year: 1404, deathYear: 1451 }));
  link.child(b, ["mehmed1", "emine"], "murad2");

  // Murad II punya dua consort utama — Hüma dan Mara Branković (half-siblings scenario)
  b.add(node("huma", "Hüma Hatun", { sex: "F", deathYear: 1449 }));
  b.add(node("mara-brankovic", "Mara Branković", { sex: "F", year: 1418, deathYear: 1487 }));
  link.partner(b, "murad2", "huma");
  link.partner(b, "murad2", "mara-brankovic");

  b.add(node("mehmed2", "Mehmed II the Conqueror", { sex: "M", year: 1432, deathYear: 1481 }));
  link.child(b, ["murad2", "huma"], "mehmed2");

  // Alaaddin Ali (anak Murad II dari consort lain yang disputed)
  b.add(node("aladdin-ali", "Şehzade Alaeddin Ali", { sex: "M", year: 1430, deathYear: 1443 }));
  link.child(b, ["murad2", "mara-brankovic"], "aladdin-ali");

  return b.nodes();
}
