import { describe, it, expect } from "vitest";
import {
  validateImportData,
  convertToFamilyNodes,
  type ExcelMember,
} from "../lib/utils/excelParser";

describe("validateImportData", () => {
  it("passes on a minimal valid family", () => {
    const members: ExcelMember[] = [
      { id: "m1", nama: "Ayah", jenis_kelamin: "M" },
      {
        id: "m2",
        nama: "Anak",
        parent_id: "m1",
      },
    ];
    const result = validateImportData(members, "id");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("flags missing name as error", () => {
    const members: ExcelMember[] = [{ nama: "" } as ExcelMember];
    const result = validateImportData(members, "id");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Nama");
  });

  it("flags duplicate ids as error", () => {
    const members: ExcelMember[] = [
      { id: "x", nama: "A" },
      { id: "x", nama: "B" },
    ];
    const result = validateImportData(members, "id");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /duplikat/i.test(e))).toBe(true);
  });

  it("flags death year before birth year", () => {
    const members: ExcelMember[] = [
      { nama: "A", tahun_lahir: 1990, tahun_wafat: 1980 },
    ];
    const result = validateImportData(members, "id");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /wafat/i.test(e))).toBe(true);
  });

  it("emits warning for unknown parent_id", () => {
    const members: ExcelMember[] = [
      { id: "m1", nama: "Anak", parent_id: "ghost" },
    ];
    const result = validateImportData(members, "id");
    expect(result.warnings.some((w) => /ghost/.test(w))).toBe(true);
  });
});

describe("convertToFamilyNodes", () => {
  it("builds parent↔child bidirectional links", () => {
    const members: ExcelMember[] = [
      { id: "p", nama: "Ayah", jenis_kelamin: "M" },
      { id: "m", nama: "Ibu", jenis_kelamin: "F" },
      {
        id: "c",
        nama: "Anak",
        ayah_id: "p",
        ibu_id: "m",
        parent_ids: "p, m",
      },
    ];
    const nodes = convertToFamilyNodes(members);
    const child = nodes.find((n) => n.id === "c")!;
    expect(child.parentIds).toEqual(expect.arrayContaining(["p", "m"]));

    const dad = nodes.find((n) => n.id === "p")!;
    const mom = nodes.find((n) => n.id === "m")!;
    expect(dad.childrenIds).toContain("c");
    expect(mom.childrenIds).toContain("c");
  });

  it("links spouses bidirectionally", () => {
    const members: ExcelMember[] = [
      { id: "a", nama: "A", pasangan_ids: "b" },
      { id: "b", nama: "B" },
    ];
    const nodes = convertToFamilyNodes(members);
    const a = nodes.find((n) => n.id === "a")!;
    const partnerB = nodes.find((n) => n.id === "b")!;
    expect(a.partners).toContain("b");
    expect(partnerB.partners).toContain("a");
  });

  it("infers co-parent from partnership when only one parent listed", () => {
    const members: ExcelMember[] = [
      { id: "a", nama: "A", pasangan_ids: "b" },
      { id: "b", nama: "B" },
      { id: "c", nama: "Anak", parent_id: "a" },
    ];
    const nodes = convertToFamilyNodes(members);
    const a = nodes.find((n) => n.id === "a")!;
    // Partners should be linked, and both should eventually show child
    expect(a.partners).toContain("b");
    expect(a.childrenIds).toContain("c");
  });

  it("does not make siblings partners, even if they share parents", () => {
    const members: ExcelMember[] = [
      { id: "p", nama: "Ayah" },
      { id: "m", nama: "Ibu" },
      { id: "s1", nama: "Kakak", parent_ids: "p, m" },
      { id: "s2", nama: "Adik", parent_ids: "p, m" },
    ];
    const nodes = convertToFamilyNodes(members);
    const s1 = nodes.find((n) => n.id === "s1")!;
    const s2 = nodes.find((n) => n.id === "s2")!;
    expect(s1.partners).not.toContain("s2");
    expect(s2.partners).not.toContain("s1");
  });

  it("resolves parent-by-name when id is missing", () => {
    const members: ExcelMember[] = [
      { id: "dad", nama: "Pak Budi" },
      { nama: "Anak", parent_nama: "Pak Budi" },
    ];
    const nodes = convertToFamilyNodes(members);
    const child = nodes.find((n) => n.label === "Anak")!;
    expect(child.parentIds).toContain("dad");
  });
});
