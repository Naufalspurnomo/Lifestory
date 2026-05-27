import { describe, it, expect } from "vitest";
import { calculateSugiyamaLayout } from "../lib/tree/sugiyamaLayout";
import { validateFamilyLayout } from "../lib/tree/layoutValidation";
import { LAYOUT } from "../lib/types/tree";
import {
  nuclearFamily,
  fiveGenerations,
  remarriageHalfSiblings,
  singleParentAdoption,
  multiRootUnrelatedFamilies,
  twoFamiliesJoinedByMarriage,
  largeSiblingGroup,
  tenGenerationExtendedFamily,
  skipGenerationAdoption,
  asymmetricDepth,
} from "./helpers/fixtures";

function expectValidLayout(nodes: ReturnType<typeof nuclearFamily>) {
  const layout = calculateSugiyamaLayout(nodes);
  const result = validateFamilyLayout(layout);
  const errors = result.issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    // Surface first few issues for easier debugging in CI.
    const preview = errors
      .slice(0, 5)
      .map((e) => `[${e.code}] ${e.message}`)
      .join("\n");
    throw new Error(`Layout invalid:\n${preview}`);
  }
  return layout;
}

describe("layout engine — core correctness", () => {
  it("renders a standard nuclear family with 4 nodes on 2 generations", () => {
    const layout = expectValidLayout(nuclearFamily());
    expect(layout.nodes).toHaveLength(4);
    const gens = new Set(layout.nodes.map((n) => n.generation));
    expect([...gens].sort()).toEqual([0, 1]);
    // At least one union + spouse edge + 2 union-child edges
    expect(layout.unions?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(layout.edges.some((e) => e.type === "spouse")).toBe(true);
    expect(
      layout.edges.filter((e) => e.type === "union-child").length
    ).toBeGreaterThanOrEqual(2);
  });

  it("produces monotonically increasing y for 5 generations", () => {
    const layout = expectValidLayout(fiveGenerations());
    const byId = new Map(layout.nodes.map((n) => [n.id, n]));
    // g5 (oldest) must sit above g0 (youngest)
    expect(byId.get("g5-m")!.y!).toBeLessThan(byId.get("g0")!.y!);
    // And each generation step must be >= next (allowing equal layer when absorbed)
    const ordered = ["g5-m", "g4-m", "g3-m", "g2-m", "g1", "g0"];
    for (let i = 0; i < ordered.length - 1; i++) {
      expect(byId.get(ordered[i])!.y!).toBeLessThanOrEqual(
        byId.get(ordered[i + 1])!.y!
      );
    }
  });

  it("places remarriage + half siblings without overlap", () => {
    const layout = expectValidLayout(remarriageHalfSiblings());
    // Ayah punya 2 union → minimal ada 3 union nodes
    expect(layout.unions?.length ?? 0).toBeGreaterThanOrEqual(3);
    // 4 anak terpisah di generation di bawah
    const kidGens = new Set(
      layout.nodes
        .filter((n) =>
          ["kid-a1", "kid-a2", "kid-b1", "kid-step"].includes(n.id)
        )
        .map((n) => n.generation)
    );
    expect(kidGens.size).toBe(1);
  });

  it("handles single parent without partner", () => {
    const layout = expectValidLayout(singleParentAdoption());
    // Anak harus tetap kelihatan di bawah ibu tunggal
    const mom = layout.nodes.find((n) => n.id === "mom")!;
    const bio = layout.nodes.find((n) => n.id === "bio-kid")!;
    expect(bio.y!).toBeGreaterThan(mom.y!);
  });
});

describe("layout engine — real-world family combinations", () => {
  it("lays out two unrelated families side-by-side without overlap", () => {
    const layout = expectValidLayout(multiRootUnrelatedFamilies());
    const ids = ["n-dad", "n-mom", "a-dad", "a-mom"];
    const xs = layout.nodes
      .filter((n) => ids.includes(n.id))
      .map((n) => n.x!);
    // Semua punya koordinat finite
    xs.forEach((x) => expect(Number.isFinite(x)).toBe(true));
    // Tidak ada 2 node yang duduk di posisi identik
    const uniqueXs = new Set(xs.map((x) => Math.round(x)));
    expect(uniqueXs.size).toBe(xs.length);
  });

  it("connects two families joined by marriage in latest generation", () => {
    const layout = expectValidLayout(twoFamiliesJoinedByMarriage());
    // Harus ada spouse edge antara naufal-asep-kid
    const marriageEdge = layout.edges.find(
      (e) =>
        e.type === "spouse" &&
        ((e.source === "naufal" && e.target === "asep-kid") ||
          (e.source === "asep-kid" && e.target === "naufal"))
    );
    expect(marriageEdge).toBeDefined();
    // Anak mereka harus punya parent-union dengan 2 parent
    const union = layout.unions?.find(
      (u) =>
        u.partnerIds.includes("naufal") && u.partnerIds.includes("asep-kid")
    );
    expect(union).toBeDefined();
    expect(union?.childrenIds).toContain("nextgen");
  });

  it("handles large sibling group (20+ siblings) within bounded width", () => {
    const nodes = largeSiblingGroup();
    const layout = expectValidLayout(nodes);
    // Sanity: semua 20 anak pada layer/generation yang sama
    const siblings = layout.nodes.filter((n) => /^kid-\d+$/.test(n.id));
    expect(siblings).toHaveLength(20);
    const gens = new Set(siblings.map((n) => n.generation));
    expect(gens.size).toBe(1);
    // Lebar layout harus cukup memuat 20 anak tanpa overlap
    const minSpacing = LAYOUT.NODE_SIZE + 16;
    const sortedX = siblings.map((n) => n.x!).sort((a, b) => a - b);
    for (let i = 1; i < sortedX.length; i++) {
      expect(sortedX[i] - sortedX[i - 1]).toBeGreaterThanOrEqual(minSpacing);
    }
  });

  it("handles a 10-generation extended family with 150+ people", () => {
    const nodes = tenGenerationExtendedFamily();
    const layout = expectValidLayout(nodes);

    expect(layout.nodes.length).toBeGreaterThanOrEqual(150);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);

    const generations = new Set(layout.nodes.map((node) => node.generation));
    expect(generations.size).toBe(10);

    const oldest = layout.nodes.find((node) => node.id === "g1-father")!;
    const youngest = layout.nodes.find((node) => node.id === "g10-main")!;
    expect(youngest.y!).toBeGreaterThan(oldest.y!);

    const branchNodes = layout.nodes.filter((node) =>
      /-sibling-\d+-child-\d+$/.test(node.id)
    );
    expect(branchNodes.length).toBeGreaterThanOrEqual(40);
    branchNodes.forEach((node) => {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    });
  });

  it("handles skip-generation adoption (kakek adopts cucu) via adoptiveParentIds", () => {
    const layout = expectValidLayout(skipGenerationAdoption());
    const kid = layout.nodes.find((n) => n.id === "kid")!;
    const dad = layout.nodes.find((n) => n.id === "dad")!;
    const grandpa = layout.nodes.find((n) => n.id === "grandpa")!;

    // Cucu tetap di bawah ayah biologis
    expect(kid.y!).toBeGreaterThan(dad.y!);
    // Kakek tetap di generasi 0 (tidak ikut kolaps ke layer ayah)
    expect(grandpa.generation).toBeLessThan(dad.generation);
    // Harus ada edge tipe "adoption" kakek -> cucu
    const adoptionEdge = layout.edges.find(
      (e) =>
        e.type === "adoption" && e.source === "grandpa" && e.target === "kid"
    );
    expect(adoptionEdge).toBeDefined();
  });

  it("handles asymmetric depth (one branch 5 gen, another 1 gen)", () => {
    const layout = expectValidLayout(asymmetricDepth());
    const byId = new Map(layout.nodes.map((n) => [n.id, n]));
    // Bungsu tidak boleh masuk generation lebih dalam dari root+1
    const root = byId.get("root-dad")!;
    const youngest = byId.get("b1")!;
    expect(youngest.generation - root.generation).toBe(1);
    // Cicit harus paling bawah
    const cicit = byId.get("a3")!;
    const allYs = layout.nodes.map((n) => n.y!);
    expect(cicit.y!).toBe(Math.max(...allYs));
  });
});

describe("layout engine — edge cases", () => {
  it("returns empty layout for empty input", () => {
    const layout = calculateSugiyamaLayout([]);
    expect(layout.nodes).toHaveLength(0);
    expect(layout.edges).toHaveLength(0);
    expect(layout.width).toBe(0);
    expect(layout.height).toBe(0);
  });

  it("handles a single isolated node", () => {
    const layout = calculateSugiyamaLayout(nuclearFamily().slice(0, 1));
    expect(layout.nodes).toHaveLength(1);
    expect(Number.isFinite(layout.nodes[0].x)).toBe(true);
    expect(Number.isFinite(layout.nodes[0].y)).toBe(true);
  });

  it("all x/y coordinates are finite for every fixture", () => {
    const fixtures = [
      nuclearFamily(),
      fiveGenerations(),
      remarriageHalfSiblings(),
      singleParentAdoption(),
      multiRootUnrelatedFamilies(),
      twoFamiliesJoinedByMarriage(),
      largeSiblingGroup(),
      tenGenerationExtendedFamily(),
      skipGenerationAdoption(),
      asymmetricDepth(),
    ];
    for (const nodes of fixtures) {
      const layout = calculateSugiyamaLayout(nodes);
      for (const n of layout.nodes) {
        expect(Number.isFinite(n.x)).toBe(true);
        expect(Number.isFinite(n.y)).toBe(true);
      }
      for (const e of layout.edges) {
        for (const p of e.path) {
          expect(Number.isFinite(p.x)).toBe(true);
          expect(Number.isFinite(p.y)).toBe(true);
        }
      }
    }
  });
});
