import { describe, expect, it } from "vitest";
import {
  validateImportData,
  convertToFamilyNodes,
  type ExcelMember,
} from "../lib/utils/excelParser";

function member(overrides: Partial<ExcelMember> = {}): ExcelMember {
  return { nama: "Anon", ...overrides };
}

describe("validateImportData", () => {
  it("accepts a clean two-parent family", () => {
    const result = validateImportData([
      member({ id: "dad", nama: "Budi" }),
      member({ id: "mom", nama: "Siti" }),
      member({ id: "kid", nama: "Andi", parent_ids: "dad, mom" }),
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("reports a missing name as a blocking error", () => {
    const result = validateImportData([member({ id: "x", nama: "" })]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Nama wajib"))).toBe(true);
  });

  it("reports duplicate ids and localises in English", () => {
    const result = validateImportData(
      [member({ id: "dup", nama: "A" }), member({ id: "dup", nama: "B" })],
      "en"
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate ID "dup"'))).toBe(true);
  });

  it("warns (not errors) when a parent reference cannot be resolved", () => {
    const result = validateImportData([
      member({ id: "kid", nama: "Andi", parent_id: "ghost" }),
    ]);
    expect(result.valid).toBe(true); // unresolved parent is a warning, not blocking
    expect(result.warnings.some((w) => w.includes("ghost"))).toBe(true);
  });

  it("resolves a parent reference given by name without warning", () => {
    const result = validateImportData([
      member({ id: "dad", nama: "Budi" }),
      member({ id: "kid", nama: "Andi", parent_nama: "Budi" }),
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("errors when the death year precedes the birth year", () => {
    const result = validateImportData([
      member({ id: "x", nama: "A", tahun_lahir: 1980, tahun_wafat: 1970 }),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("wafat"))).toBe(true);
  });

  it("warns on an unrecognised lineage value", () => {
    const result = validateImportData([
      member({ id: "x", nama: "A", garis: "diagonal" }),
    ]);
    expect(result.warnings.some((w) => w.includes("diagonal"))).toBe(true);
  });
});

describe("convertToFamilyNodes", () => {
  it("wires reciprocal parent/child links", () => {
    const nodes = convertToFamilyNodes([
      member({ id: "dad", nama: "Budi" }),
      member({ id: "mom", nama: "Siti" }),
      member({ id: "kid", nama: "Andi", parent_ids: "dad, mom" }),
    ]);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get("kid")?.parentIds).toEqual(["dad", "mom"]);
    expect(byId.get("dad")?.childrenIds).toContain("kid");
    expect(byId.get("mom")?.childrenIds).toContain("kid");
  });

  it("infers co-parents of the same child as partners", () => {
    const nodes = convertToFamilyNodes([
      member({ id: "dad", nama: "Budi" }),
      member({ id: "mom", nama: "Siti" }),
      member({ id: "kid", nama: "Andi", parent_ids: "dad, mom" }),
    ]);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get("dad")?.partners).toContain("mom");
    expect(byId.get("mom")?.partners).toContain("dad");
  });

  it("does not marry two co-parents who are themselves siblings", () => {
    // dad and aunt share grandparent -> they are siblings, must not become partners
    const nodes = convertToFamilyNodes([
      member({ id: "grand", nama: "Kakek" }),
      member({ id: "dad", nama: "Budi", parent_ids: "grand" }),
      member({ id: "aunt", nama: "Wati", parent_ids: "grand" }),
      member({ id: "kid", nama: "Andi", parent_ids: "dad, aunt" }),
    ]);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get("dad")?.partners ?? []).not.toContain("aunt");
  });

  it("resolves explicit partner links by name and keeps them mutual", () => {
    const nodes = convertToFamilyNodes([
      member({ id: "a", nama: "Budi", pasangan_nama: "Siti" }),
      member({ id: "b", nama: "Siti" }),
    ]);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get("a")?.partners).toContain("b");
    expect(byId.get("b")?.partners).toContain("a");
  });

  it("drops self-referential parent links", () => {
    const nodes = convertToFamilyNodes([
      member({ id: "loop", nama: "Solo", parent_id: "loop" }),
    ]);
    expect(nodes[0].parentIds).toEqual([]);
    expect(nodes[0].parentId).toBeNull();
  });
});
