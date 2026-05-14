// Descendants of Queen Victoria (selected). Sumber: royal.uk, wikipedia.org/wiki/Queen_Victoria,
// wikipedia.org/wiki/Descendants_of_Queen_Victoria, historyextra.com, allthatsinteresting.com.
// Konten diparafrase untuk kepatuhan lisensi.
//
// Scope: Victoria & Albert, 9 anak mereka, pasangan masing-masing, dan ~1-2 cucu
// penting tiap cabang. Total cukup lebar (30+ node) untuk stress horizontal.

import type { FamilyNode } from "../../../lib/types/tree";
import { buildTree, node, link } from "../helpers/builders";

export function victoriaDescendants(): FamilyNode[] {
  const b = buildTree();

  // ----- Gen 1 -----
  b.add(node("victoria", "Queen Victoria", { sex: "F", year: 1819, deathYear: 1901, line: "self" }));
  b.add(node("albert", "Prince Albert", { sex: "M", year: 1819, deathYear: 1861 }));
  link.partner(b, "victoria", "albert");

  // ----- Gen 2: 9 anak Victoria & Albert -----
  const kids: Array<[string, string, number, number | null]> = [
    ["vicky", "Victoria, Princess Royal", 1840, 1901],
    ["edward7", "Edward VII", 1841, 1910],
    ["alice", "Princess Alice", 1843, 1878],
    ["alfred", "Prince Alfred", 1844, 1900],
    ["helena", "Princess Helena", 1846, 1923],
    ["louise", "Princess Louise", 1848, 1939],
    ["arthur", "Prince Arthur", 1850, 1942],
    ["leopold", "Prince Leopold", 1853, 1884],
    ["beatrice-v", "Princess Beatrice", 1857, 1944],
  ];
  for (const [id, label, year, deathYear] of kids) {
    b.add(
      node(id, label, {
        sex: label.startsWith("Prince ") || label === "Edward VII" ? "M" : "F",
        year,
        deathYear,
      })
    );
    link.child(b, ["victoria", "albert"], id);
  }

  // ----- Gen 2 partners -----
  b.add(node("friedrich3", "Frederick III of Germany", { sex: "M", year: 1831, deathYear: 1888 }));
  link.partner(b, "vicky", "friedrich3");

  b.add(node("alexandra-denmark", "Alexandra of Denmark", { sex: "F", year: 1844, deathYear: 1925 }));
  link.partner(b, "edward7", "alexandra-denmark");

  b.add(node("louis-hesse", "Louis IV, Grand Duke of Hesse", { sex: "M", year: 1837, deathYear: 1892 }));
  link.partner(b, "alice", "louis-hesse");

  b.add(node("marie-russia", "Maria Alexandrovna of Russia", { sex: "F", year: 1853, deathYear: 1920 }));
  link.partner(b, "alfred", "marie-russia");

  b.add(node("christian-hs", "Prince Christian of Schleswig-Holstein", { sex: "M", year: 1831, deathYear: 1917 }));
  link.partner(b, "helena", "christian-hs");

  b.add(node("lorne", "John Campbell, Marquess of Lorne", { sex: "M", year: 1845, deathYear: 1914 }));
  link.partner(b, "louise", "lorne");

  b.add(node("louise-prussia", "Princess Louise Margaret of Prussia", { sex: "F", year: 1860, deathYear: 1917 }));
  link.partner(b, "arthur", "louise-prussia");

  b.add(node("helena-waldeck", "Princess Helena of Waldeck", { sex: "F", year: 1861, deathYear: 1922 }));
  link.partner(b, "leopold", "helena-waldeck");

  b.add(node("henry-battenberg", "Prince Henry of Battenberg", { sex: "M", year: 1858, deathYear: 1896 }));
  link.partner(b, "beatrice-v", "henry-battenberg");

  // ----- Gen 3 (pilihan) -----
  b.add(node("wilhelm2", "Wilhelm II, German Emperor", { sex: "M", year: 1859, deathYear: 1941 }));
  link.child(b, ["vicky", "friedrich3"], "wilhelm2");

  b.add(node("george5", "George V", { sex: "M", year: 1865, deathYear: 1936 }));
  link.child(b, ["edward7", "alexandra-denmark"], "george5");

  b.add(node("alix", "Alix (Empress Alexandra of Russia)", { sex: "F", year: 1872, deathYear: 1918 }));
  link.child(b, ["alice", "louis-hesse"], "alix");

  b.add(node("ernst-hesse", "Ernest Louis, Grand Duke of Hesse", { sex: "M", year: 1868, deathYear: 1937 }));
  link.child(b, ["alice", "louis-hesse"], "ernst-hesse");

  b.add(node("marie-romania", "Marie, Queen of Romania", { sex: "F", year: 1875, deathYear: 1938 }));
  link.child(b, ["alfred", "marie-russia"], "marie-romania");

  b.add(node("victoria-eugenie", "Victoria Eugenie, Queen of Spain", { sex: "F", year: 1887, deathYear: 1969 }));
  link.child(b, ["beatrice-v", "henry-battenberg"], "victoria-eugenie");

  b.add(node("margaret-connaught", "Margaret, Crown Princess of Sweden", { sex: "F", year: 1882, deathYear: 1920 }));
  link.child(b, ["arthur", "louise-prussia"], "margaret-connaught");

  return b.nodes();
}
