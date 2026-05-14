// Shared fixture builders for family-tree tests.
// Designed to reflect real "every family is different" scenarios:
// different generation depth, remarriage, adoption, single parents,
// multi-root (unrelated families in one tree), skip-generation unions, etc.

import type { FamilyNode } from "../../lib/types/tree";

export function person(
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
    parentId: extra.parentId ?? null,
    parentIds: extra.parentIds ?? [],
    partners: extra.partners ?? [],
    childrenIds: extra.childrenIds ?? [],
    generation: extra.generation ?? 0,
    line: extra.line ?? "default",
    imageUrl: extra.imageUrl ?? null,
    content: extra.content ?? { description: "", media: [] },
    works: extra.works,
  };
}

const uniq = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean)));

export function get(nodes: FamilyNode[], id: string): FamilyNode {
  const n = nodes.find((x) => x.id === id);
  if (!n) throw new Error(`Fixture missing node "${id}"`);
  return n;
}

export function partner(nodes: FamilyNode[], a: string, b: string) {
  const left = get(nodes, a);
  const right = get(nodes, b);
  left.partners = uniq([...(left.partners || []), b]);
  right.partners = uniq([...(right.partners || []), a]);
}

export function child(
  nodes: FamilyNode[],
  parentIds: string[],
  childId: string
) {
  const c = get(nodes, childId);
  c.parentIds = uniq([...(c.parentIds || []), ...parentIds]);
  c.parentId = c.parentIds[0] ?? null;
  for (const pid of parentIds) {
    const parentNode = get(nodes, pid);
    parentNode.childrenIds = uniq([
      ...(parentNode.childrenIds || []),
      childId,
    ]);
  }
}

// ---------- Fixture: small nuclear family (Ayah + Ibu + 2 anak) ----------
export function nuclearFamily(): FamilyNode[] {
  const nodes = [
    person("dad", "Ayah", { sex: "M", year: 1970 }),
    person("mom", "Ibu", { sex: "F", year: 1972 }),
    person("kid1", "Anak 1", { sex: "M", year: 1995 }),
    person("kid2", "Anak 2", { sex: "F", year: 1998 }),
  ];
  partner(nodes, "dad", "mom");
  child(nodes, ["dad", "mom"], "kid1");
  child(nodes, ["dad", "mom"], "kid2");
  return nodes;
}

// ---------- Fixture: five-generation paternal line ----------
export function fiveGenerations(): FamilyNode[] {
  const nodes = [
    person("g5-m", "Buyut-buyut Laki", { sex: "M", year: 1890 }),
    person("g5-f", "Buyut-buyut Perempuan", { sex: "F", year: 1892 }),
    person("g4-m", "Buyut Laki", { sex: "M", year: 1915 }),
    person("g4-f", "Buyut Perempuan", { sex: "F", year: 1918 }),
    person("g3-m", "Kakek", { sex: "M", year: 1940 }),
    person("g3-f", "Nenek", { sex: "F", year: 1943 }),
    person("g2-m", "Ayah", { sex: "M", year: 1965 }),
    person("g2-f", "Ibu", { sex: "F", year: 1968 }),
    person("g1", "Diri", { sex: "M", year: 1990, line: "self" }),
    person("g0", "Anak", { sex: "F", year: 2018 }),
  ];
  partner(nodes, "g5-m", "g5-f");
  partner(nodes, "g4-m", "g4-f");
  partner(nodes, "g3-m", "g3-f");
  partner(nodes, "g2-m", "g2-f");
  child(nodes, ["g5-m", "g5-f"], "g4-m");
  child(nodes, ["g4-m", "g4-f"], "g3-m");
  child(nodes, ["g3-m", "g3-f"], "g2-m");
  child(nodes, ["g2-m", "g2-f"], "g1");
  child(nodes, ["g1"], "g0");
  return nodes;
}

// ---------- Fixture: remarriage with half-siblings ----------
// Ayah menikah Ibu-A, cerai, menikah Ibu-B. Ibu-A menikah ulang ke ayah sambung.
export function remarriageHalfSiblings(): FamilyNode[] {
  const nodes = [
    person("dad", "Ayah", { sex: "M", year: 1960 }),
    person("mom-a", "Ibu Pertama", { sex: "F", year: 1962 }),
    person("mom-b", "Ibu Kedua", { sex: "F", year: 1970 }),
    person("step-dad", "Ayah Sambung", { sex: "M", year: 1961 }),
    person("kid-a1", "Anak dari A", { sex: "M", year: 1985 }),
    person("kid-a2", "Anak dari A kedua", { sex: "F", year: 1988 }),
    person("kid-b1", "Anak dari B", { sex: "F", year: 2000 }),
    person("kid-step", "Anak Ibu-A & Ayah Sambung", { sex: "M", year: 1992 }),
  ];
  partner(nodes, "dad", "mom-a");
  partner(nodes, "dad", "mom-b");
  partner(nodes, "mom-a", "step-dad");
  child(nodes, ["dad", "mom-a"], "kid-a1");
  child(nodes, ["dad", "mom-a"], "kid-a2");
  child(nodes, ["dad", "mom-b"], "kid-b1");
  child(nodes, ["mom-a", "step-dad"], "kid-step");
  return nodes;
}

// ---------- Fixture: single parent + adopted child ----------
export function singleParentAdoption(): FamilyNode[] {
  const nodes = [
    person("mom", "Ibu Tunggal", { sex: "F", year: 1970 }),
    person("bio-kid", "Anak Kandung", { sex: "F", year: 2000 }),
    person("adopted-kid", "Anak Adopsi", { sex: "M", year: 2005 }),
  ];
  child(nodes, ["mom"], "bio-kid");
  child(nodes, ["mom"], "adopted-kid");
  return nodes;
}

// ---------- Fixture: two unrelated families in one tree ----------
// Keluarga Naufal (kiri) dan keluarga Asep (kanan) — tidak ada tautan apapun.
export function multiRootUnrelatedFamilies(): FamilyNode[] {
  const nodes = [
    // Naufal side
    person("n-dad", "Ayah Naufal", { sex: "M", year: 1965 }),
    person("n-mom", "Ibu Naufal", { sex: "F", year: 1968 }),
    person("naufal", "Naufal", { sex: "M", year: 1995, line: "self" }),
    // Asep side
    person("a-dad", "Ayah Asep", { sex: "M", year: 1955 }),
    person("a-mom", "Ibu Asep", { sex: "F", year: 1958 }),
    person("asep", "Asep", { sex: "M", year: 1985 }),
    person("asep-wife", "Istri Asep", { sex: "F", year: 1988 }),
    person("asep-kid", "Anak Asep", { sex: "F", year: 2015 }),
  ];
  partner(nodes, "n-dad", "n-mom");
  partner(nodes, "a-dad", "a-mom");
  partner(nodes, "asep", "asep-wife");
  child(nodes, ["n-dad", "n-mom"], "naufal");
  child(nodes, ["a-dad", "a-mom"], "asep");
  child(nodes, ["asep", "asep-wife"], "asep-kid");
  return nodes;
}

// ---------- Fixture: two families joined by marriage in last generation ----------
// Naufal menikah dengan anak Asep → dua pohon yang tadinya terpisah jadi terhubung
// lewat union di generasi termuda. Ini kasus paling sering di real-world.
export function twoFamiliesJoinedByMarriage(): FamilyNode[] {
  const nodes = multiRootUnrelatedFamilies();
  // Replace "naufal" to marry asep-kid (so Naufal Gen 3 left == Asep-kid Gen 3 right)
  partner(nodes, "naufal", "asep-kid");
  nodes.push(
    person("nextgen", "Anak Naufal & Anak Asep", { sex: "F", year: 2050 })
  );
  child(nodes, ["naufal", "asep-kid"], "nextgen");
  return nodes;
}

// ---------- Fixture: large family — 20 children, 3 of them each with 4 kids ----------
// Stress test untuk horizontal spacing di keluarga besar.
export function largeSiblingGroup(): FamilyNode[] {
  const nodes = [
    person("dad", "Ayah", { sex: "M", year: 1940 }),
    person("mom", "Ibu", { sex: "F", year: 1945 }),
  ];
  partner(nodes, "dad", "mom");
  for (let i = 1; i <= 20; i++) {
    const id = `kid-${i}`;
    nodes.push(person(id, `Anak ${i}`, { year: 1965 + i }));
    child(nodes, ["dad", "mom"], id);
  }
  // 3 of them also have children
  for (const parentId of ["kid-1", "kid-10", "kid-20"]) {
    const spouseId = `${parentId}-spouse`;
    nodes.push(person(spouseId, `Pasangan ${parentId}`, { sex: "F" }));
    partner(nodes, parentId, spouseId);
    for (let j = 1; j <= 4; j++) {
      const gc = `${parentId}-c${j}`;
      nodes.push(person(gc, `Cucu ${parentId}-${j}`));
      child(nodes, [parentId, spouseId], gc);
    }
  }
  return nodes;
}

// ---------- Fixture: skip-generation (cucu diadopsi oleh kakek) ----------
// Kakek & nenek membesarkan cucu seperti anak (paling umum di Indonesia).
export function skipGenerationAdoption(): FamilyNode[] {
  const nodes = [
    person("grandpa", "Kakek", { sex: "M", year: 1940 }),
    person("grandma", "Nenek", { sex: "F", year: 1942 }),
    person("dad", "Ayah Biologis", { sex: "M", year: 1965 }),
    person("mom", "Ibu Biologis", { sex: "F", year: 1967 }),
    person("kid", "Cucu yang Diadopsi Kakek", { sex: "M", year: 1995 }),
  ];
  partner(nodes, "grandpa", "grandma");
  partner(nodes, "dad", "mom");
  child(nodes, ["grandpa", "grandma"], "dad");
  // Parent biologis tetap lewat `parentIds`; kakek & nenek masuk ke
  // `adoptiveParentIds` (edge terpisah, tidak mempengaruhi layer).
  child(nodes, ["dad", "mom"], "kid");
  const kid = get(nodes, "kid");
  kid.adoptiveParentIds = uniq([
    ...(kid.adoptiveParentIds || []),
    "grandpa",
    "grandma",
  ]);
  return nodes;
}

// ---------- Fixture: asymmetric depth ----------
// Satu cabang punya 5 generasi, cabang lain dari pasangan yang sama cuma 2 generasi.
export function asymmetricDepth(): FamilyNode[] {
  const nodes = [
    person("root-dad", "Ayah", { sex: "M", year: 1940 }),
    person("root-mom", "Ibu", { sex: "F", year: 1942 }),
    // Long branch
    person("a1", "Anak Sulung", { year: 1965 }),
    person("a1-s", "Pasangan Sulung", { sex: "F" }),
    person("a2", "Cucu", { year: 1990 }),
    person("a2-s", "Pasangan Cucu", { sex: "F" }),
    person("a3", "Cicit", { year: 2015 }),
    // Short branch: bungsu tanpa pasangan/keturunan
    person("b1", "Anak Bungsu", { year: 1980 }),
  ];
  partner(nodes, "root-dad", "root-mom");
  partner(nodes, "a1", "a1-s");
  partner(nodes, "a2", "a2-s");
  child(nodes, ["root-dad", "root-mom"], "a1");
  child(nodes, ["root-dad", "root-mom"], "b1");
  child(nodes, ["a1", "a1-s"], "a2");
  child(nodes, ["a2", "a2-s"], "a3");
  return nodes;
}

// ---------- Fixture: incest / invalid — siblings attempted as partners ----------
// Digunakan untuk uji bahwa sanitizer menolak kakak-adik jadi pasangan.
export function siblingsAsPartners(): FamilyNode[] {
  const nodes = [
    person("dad", "Ayah", { sex: "M" }),
    person("mom", "Ibu", { sex: "F" }),
    person("sib-a", "Kakak", { sex: "M" }),
    person("sib-b", "Adik", { sex: "F" }),
  ];
  partner(nodes, "dad", "mom");
  child(nodes, ["dad", "mom"], "sib-a");
  child(nodes, ["dad", "mom"], "sib-b");
  // Intentionally mark siblings as partners (invalid)
  partner(nodes, "sib-a", "sib-b");
  return nodes;
}

// ---------- Fixture: cycle — child listed as own ancestor ----------
export function cyclicGraph(): FamilyNode[] {
  const nodes = [
    person("a", "A"),
    person("b", "B"),
    person("c", "C"),
  ];
  child(nodes, ["a"], "b");
  child(nodes, ["b"], "c");
  // Introduce cycle: A becomes child of C
  child(nodes, ["c"], "a");
  return nodes;
}
