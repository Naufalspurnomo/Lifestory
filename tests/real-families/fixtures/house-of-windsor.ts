// House of Windsor — modern British royal family, 4 generations.
// Sumber: wikipedia.org/wiki/Elizabeth_II, wikipedia.org/wiki/William,_Prince_of_Wales,
// wikipedia.org/wiki/Sarah_Ferguson, wikipedia.org/wiki/Prince_Harry,_Duke_of_Sussex,
// westminster-abbey.org, royal.uk, historyextra.com. Konten diparafrase untuk
// kepatuhan lisensi.
//
// Scenario coverage:
// - Multi-generation (4 gen: Queen Elizabeth II → Charles III → William/Harry → cucu)
// - Remarriage: Charles III (Diana → Camilla), Anne (Mark Phillips → Timothy Laurence),
//   Andrew + Sarah Ferguson divorced.
// - Half-siblings via same mother different father: (tidak ada di Windsor, tapi ada
//   lewat Camilla Parker Bowles yang punya anak dari pernikahan sebelumnya).
// - Banyak anak per union, generasi termuda masih hidup.

import type { FamilyNode } from "../../../lib/types/tree";
import { buildTree, node, link } from "../helpers/builders";

export function houseOfWindsor(): FamilyNode[] {
  const b = buildTree();

  // ----- Gen 1: Queen Elizabeth II & Prince Philip -----
  b.add(node("qe2", "Queen Elizabeth II", { sex: "F", year: 1926, deathYear: 2022, line: "self" }));
  b.add(node("philip", "Prince Philip", { sex: "M", year: 1921, deathYear: 2021 }));
  link.partner(b, "qe2", "philip");

  // ----- Gen 2: Anak-anak Elizabeth II -----
  b.add(node("charles", "King Charles III", { sex: "M", year: 1948 }));
  b.add(node("anne", "Princess Anne", { sex: "F", year: 1950 }));
  b.add(node("andrew", "Prince Andrew", { sex: "M", year: 1960 }));
  b.add(node("edward", "Prince Edward", { sex: "M", year: 1964 }));
  for (const id of ["charles", "anne", "andrew", "edward"]) {
    link.child(b, ["qe2", "philip"], id);
  }

  // Pasangan Gen 2 (remarriage for Charles & Anne)
  b.add(node("diana", "Diana Spencer", { sex: "F", year: 1961, deathYear: 1997 }));
  b.add(node("camilla", "Camilla Parker Bowles", { sex: "F", year: 1947 }));
  link.partner(b, "charles", "diana");
  link.partner(b, "charles", "camilla");

  b.add(node("mark-phillips", "Mark Phillips", { sex: "M", year: 1948 }));
  b.add(node("timothy-laurence", "Timothy Laurence", { sex: "M", year: 1955 }));
  link.partner(b, "anne", "mark-phillips");
  link.partner(b, "anne", "timothy-laurence");

  b.add(node("sarah-ferguson", "Sarah Ferguson", { sex: "F", year: 1959 }));
  link.partner(b, "andrew", "sarah-ferguson");

  b.add(node("sophie-wessex", "Sophie Rhys-Jones", { sex: "F", year: 1965 }));
  link.partner(b, "edward", "sophie-wessex");

  // ----- Gen 3: Cucu Elizabeth II -----
  b.add(node("william", "Prince William", { sex: "M", year: 1982 }));
  b.add(node("harry", "Prince Harry", { sex: "M", year: 1984 }));
  link.child(b, ["charles", "diana"], "william");
  link.child(b, ["charles", "diana"], "harry");

  b.add(node("peter", "Peter Phillips", { sex: "M", year: 1977 }));
  b.add(node("zara", "Zara Tindall", { sex: "F", year: 1981 }));
  link.child(b, ["anne", "mark-phillips"], "peter");
  link.child(b, ["anne", "mark-phillips"], "zara");

  b.add(node("beatrice", "Princess Beatrice", { sex: "F", year: 1988 }));
  b.add(node("eugenie", "Princess Eugenie", { sex: "F", year: 1990 }));
  link.child(b, ["andrew", "sarah-ferguson"], "beatrice");
  link.child(b, ["andrew", "sarah-ferguson"], "eugenie");

  b.add(node("lady-louise", "Lady Louise Windsor", { sex: "F", year: 2003 }));
  b.add(node("james-wessex", "James, Earl of Wessex", { sex: "M", year: 2007 }));
  link.child(b, ["edward", "sophie-wessex"], "lady-louise");
  link.child(b, ["edward", "sophie-wessex"], "james-wessex");

  // Pasangan Gen 3
  b.add(node("kate", "Catherine Middleton", { sex: "F", year: 1982 }));
  b.add(node("meghan", "Meghan Markle", { sex: "F", year: 1981 }));
  link.partner(b, "william", "kate");
  link.partner(b, "harry", "meghan");

  b.add(node("mike-tindall", "Mike Tindall", { sex: "M", year: 1978 }));
  link.partner(b, "zara", "mike-tindall");

  b.add(node("edo", "Edoardo Mapelli Mozzi", { sex: "M", year: 1983 }));
  link.partner(b, "beatrice", "edo");

  b.add(node("jack-brooksbank", "Jack Brooksbank", { sex: "M", year: 1986 }));
  link.partner(b, "eugenie", "jack-brooksbank");

  // ----- Gen 4: Cicit Elizabeth II -----
  b.add(node("george", "Prince George", { sex: "M", year: 2013 }));
  b.add(node("charlotte", "Princess Charlotte", { sex: "F", year: 2015 }));
  b.add(node("louis", "Prince Louis", { sex: "M", year: 2018 }));
  for (const id of ["george", "charlotte", "louis"]) {
    link.child(b, ["william", "kate"], id);
  }

  b.add(node("archie", "Prince Archie", { sex: "M", year: 2019 }));
  b.add(node("lilibet", "Princess Lilibet", { sex: "F", year: 2021 }));
  link.child(b, ["harry", "meghan"], "archie");
  link.child(b, ["harry", "meghan"], "lilibet");

  // Zara & Mike 3 children
  b.add(node("mia-tindall", "Mia Tindall", { sex: "F", year: 2014 }));
  b.add(node("lena-tindall", "Lena Tindall", { sex: "F", year: 2018 }));
  b.add(node("lucas-tindall", "Lucas Tindall", { sex: "M", year: 2021 }));
  for (const id of ["mia-tindall", "lena-tindall", "lucas-tindall"]) {
    link.child(b, ["zara", "mike-tindall"], id);
  }

  // Beatrice & Edo: Sienna (Edo also has son Wolfie from prev — skip for now)
  b.add(node("sienna", "Sienna Mapelli Mozzi", { sex: "F", year: 2021 }));
  link.child(b, ["beatrice", "edo"], "sienna");

  // Eugenie & Jack: 2 boys
  b.add(node("august", "August Brooksbank", { sex: "M", year: 2021 }));
  b.add(node("ernest", "Ernest Brooksbank", { sex: "M", year: 2023 }));
  link.child(b, ["eugenie", "jack-brooksbank"], "august");
  link.child(b, ["eugenie", "jack-brooksbank"], "ernest");

  return b.nodes();
}
