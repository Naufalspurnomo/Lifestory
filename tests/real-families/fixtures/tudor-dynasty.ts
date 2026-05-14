// House of Tudor — Henry VII → Henry VIII + 6 wives → Mary I / Elizabeth I / Edward VI.
// Sumber: wikipedia.org/wiki/Henry_VIII, wikipedia.org/wiki/Wives_of_Henry_VIII,
// britannica.com, rmg.co.uk, westminster-abbey.org. Konten diparafrase.
//
// Stress-test favorit untuk remarriage: Henry VIII punya 6 pasangan, 3 di
// antaranya melahirkan anak yang bertakhta.

import type { FamilyNode } from "../../../lib/types/tree";
import { buildTree, node, link } from "../helpers/builders";

export function tudorDynasty(): FamilyNode[] {
  const b = buildTree();

  // ----- Gen 1 -----
  b.add(node("henry7", "Henry VII", { sex: "M", year: 1457, deathYear: 1509, line: "self" }));
  b.add(node("elizabeth-york", "Elizabeth of York", { sex: "F", year: 1466, deathYear: 1503 }));
  link.partner(b, "henry7", "elizabeth-york");

  // ----- Gen 2 -----
  b.add(node("arthur-tudor", "Arthur, Prince of Wales", { sex: "M", year: 1486, deathYear: 1502 }));
  b.add(node("margaret-tudor", "Margaret Tudor", { sex: "F", year: 1489, deathYear: 1541 }));
  b.add(node("henry8", "Henry VIII", { sex: "M", year: 1491, deathYear: 1547 }));
  b.add(node("mary-tudor", "Mary Tudor (Queen of France)", { sex: "F", year: 1496, deathYear: 1533 }));
  for (const id of ["arthur-tudor", "margaret-tudor", "henry8", "mary-tudor"]) {
    link.child(b, ["henry7", "elizabeth-york"], id);
  }

  // ----- 6 wives of Henry VIII -----
  b.add(node("catherine-aragon", "Catherine of Aragon", { sex: "F", year: 1485, deathYear: 1536 }));
  b.add(node("anne-boleyn", "Anne Boleyn", { sex: "F", year: 1501, deathYear: 1536 }));
  b.add(node("jane-seymour", "Jane Seymour", { sex: "F", year: 1508, deathYear: 1537 }));
  b.add(node("anne-cleves", "Anne of Cleves", { sex: "F", year: 1515, deathYear: 1557 }));
  b.add(node("catherine-howard", "Catherine Howard", { sex: "F", year: 1523, deathYear: 1542 }));
  b.add(node("catherine-parr", "Catherine Parr", { sex: "F", year: 1512, deathYear: 1548 }));
  for (const wife of [
    "catherine-aragon",
    "anne-boleyn",
    "jane-seymour",
    "anne-cleves",
    "catherine-howard",
    "catherine-parr",
  ]) {
    link.partner(b, "henry8", wife);
  }

  // Arthur Tudor's brief marriage before his death — same Catherine!
  link.partner(b, "arthur-tudor", "catherine-aragon");

  // ----- Gen 3: Henry VIII's children by three different mothers -----
  b.add(node("mary1", "Mary I", { sex: "F", year: 1516, deathYear: 1558 }));
  link.child(b, ["henry8", "catherine-aragon"], "mary1");

  b.add(node("elizabeth1", "Elizabeth I", { sex: "F", year: 1533, deathYear: 1603 }));
  link.child(b, ["henry8", "anne-boleyn"], "elizabeth1");

  b.add(node("edward6", "Edward VI", { sex: "M", year: 1537, deathYear: 1553 }));
  link.child(b, ["henry8", "jane-seymour"], "edward6");

  b.add(node("henry-fitzroy", "Henry Fitzroy (illegitimate)", { sex: "M", year: 1519, deathYear: 1536 }));
  // Keep illegitimate son visible via adoptive-to-Henry8 link; unknown mother.
  b.get("henry-fitzroy").parentIds = ["henry8"];
  b.get("henry-fitzroy").parentId = "henry8";
  b.get("henry8").childrenIds = [
    ...b.get("henry8").childrenIds,
    "henry-fitzroy",
  ];

  // Margaret's child (simplified): James V of Scotland
  b.add(node("james4-scotland", "James IV of Scotland", { sex: "M", year: 1473, deathYear: 1513 }));
  link.partner(b, "margaret-tudor", "james4-scotland");

  b.add(node("james5-scotland", "James V of Scotland", { sex: "M", year: 1512, deathYear: 1542 }));
  link.child(b, ["margaret-tudor", "james4-scotland"], "james5-scotland");

  // Mary Queen of Scots as descendant (Gen 4)
  b.add(node("mary-qos", "Mary, Queen of Scots", { sex: "F", year: 1542, deathYear: 1587 }));
  link.child(b, ["james5-scotland"], "mary-qos");

  return b.nodes();
}
