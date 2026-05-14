// Genghis Khan lineage (selected). Sumber: wikipedia.org/wiki/Genghis_Khan,
// wikipedia.org/wiki/Tolui, wikipedia.org/wiki/%C3%96gedei_Khan, wikipedia.org/wiki/Jochi,
// wikipedia.org/wiki/Kublai_Khan, britannica.com/biography/Jochi,
// worldhistory.org/Ogedei_Khan. Konten diparafrase.
//
// Scope: Yesügei & Hö'elün → Temüjin (Genghis Khan) → 4 anak utama + Börte →
// cucu kunci (Batu, Möngke, Kublai, Hulagu) founding masing-masing khanate.
// Test khusus: banyak field tahun tidak pasti (gunakan `c.` → kita pakai year
// terbaik; beberapa sengaja null untuk uji tampilan "unknown year").

import type { FamilyNode } from "../../../lib/types/tree";
import { buildTree, node, link } from "../helpers/builders";

export function genghisKhanLineage(): FamilyNode[] {
  const b = buildTree();

  // ----- Gen 0 -----
  b.add(node("yesugei", "Yesügei", { sex: "M", year: null, deathYear: 1171 }));
  b.add(node("hoelun", "Hö'elün", { sex: "F", year: null, deathYear: null }));
  link.partner(b, "yesugei", "hoelun");

  // ----- Gen 1: Temüjin = Genghis Khan -----
  b.add(node("temujin", "Genghis Khan (Temüjin)", { sex: "M", year: 1162, deathYear: 1227, line: "self" }));
  link.child(b, ["yesugei", "hoelun"], "temujin");

  b.add(node("borte", "Börte", { sex: "F", year: 1161, deathYear: 1230 }));
  link.partner(b, "temujin", "borte");

  // ----- Gen 2: 4 anak utama dari Börte -----
  b.add(node("jochi", "Jochi", { sex: "M", year: 1182, deathYear: 1227 }));
  b.add(node("chagatai", "Chagatai", { sex: "M", year: 1183, deathYear: 1242 }));
  b.add(node("ogedei", "Ögedei", { sex: "M", year: 1186, deathYear: 1241 }));
  b.add(node("tolui", "Tolui", { sex: "M", year: 1191, deathYear: 1232 }));
  for (const id of ["jochi", "chagatai", "ogedei", "tolui"]) {
    link.child(b, ["temujin", "borte"], id);
  }

  b.add(node("sorghaghtani", "Sorghaghtani Beki", { sex: "F", year: null, deathYear: 1252 }));
  link.partner(b, "tolui", "sorghaghtani");

  // Unknown Jochi wife → parent null (kid yang ditampilkan tetap ke Jochi saja)
  // Ini uji case "single parent known".
  b.add(node("orda", "Orda Khan (White Horde)", { sex: "M", year: 1204, deathYear: 1251 }));
  b.add(node("batu", "Batu Khan (Golden Horde)", { sex: "M", year: 1205, deathYear: 1255 }));
  link.child(b, ["jochi"], "orda");
  link.child(b, ["jochi"], "batu");

  b.add(node("guyuk", "Güyük Khan", { sex: "M", year: 1206, deathYear: 1248 }));
  link.child(b, ["ogedei"], "guyuk");

  // Tolui + Sorghaghtani - 3 kunci founding dinasti
  b.add(node("monke", "Möngke Khan", { sex: "M", year: 1209, deathYear: 1259 }));
  b.add(node("kublai", "Kublai Khan (Yuan)", { sex: "M", year: 1215, deathYear: 1294 }));
  b.add(node("hulagu", "Hülegü (Ilkhanate)", { sex: "M", year: 1217, deathYear: 1265 }));
  b.add(node("ariqboke", "Ariq Böke", { sex: "M", year: 1219, deathYear: 1266 }));
  for (const id of ["monke", "kublai", "hulagu", "ariqboke"]) {
    link.child(b, ["tolui", "sorghaghtani"], id);
  }

  // ----- Gen 4 (spot): Yesün Temür, Temür Öljeytü Khan, dll - lewati untuk sekarang -----

  return b.nodes();
}
