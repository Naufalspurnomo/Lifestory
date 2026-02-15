/**
 * Excel Parser Utility for Family Tree Import
 * Parses .xlsx/.xls files and converts to FamilyNode[]
 */

import * as XLSX from "xlsx";
import type { FamilyNode, NodeContent, MediaItem } from "../types/tree";

type Locale = "id" | "en";

const COPY = {
  id: {
    readExcelFailedPrefix: "Gagal membaca file Excel: ",
    readFileFailed: "Gagal membaca file",
    row: "Baris",
    requiredName: "Nama wajib diisi",
    duplicateId: (id: string) => `ID "${id}" duplikat`,
    parentNotFound: (id: string) =>
      `Parent ID "${id}" tidak ditemukan dalam data`,
    deathBeforeBirth: "Tahun wafat tidak boleh lebih kecil dari tahun lahir",
    invalidLine: (line: string) =>
      `Garis "${line}" tidak valid, akan digunakan default`,
    templateSheet: "Data Keluarga",
    instructionSheet: "Petunjuk",
    instructionRows: [
      {
        Kolom: "id",
        Keterangan:
          "ID unik untuk setiap anggota (boleh kosong, akan di-generate)",
      },
      { Kolom: "nama", Keterangan: "Nama lengkap (WAJIB)" },
      { Kolom: "tahun_lahir", Keterangan: "Tahun lahir (contoh: 1980)" },
      {
        Kolom: "tahun_wafat",
        Keterangan: "Tahun wafat (kosongkan jika masih hidup)",
      },
      {
        Kolom: "parent_id",
        Keterangan: "ID orang tua (referensi ke kolom id)",
      },
      {
        Kolom: "pasangan_ids",
        Keterangan: "ID pasangan, pisahkan dengan koma jika lebih dari satu",
      },
      {
        Kolom: "garis",
        Keterangan:
          "Garis keturunan: paternal, maternal, self, descendant, union",
      },
      { Kolom: "deskripsi", Keterangan: "Keterangan atau bio singkat" },
      { Kolom: "foto_url", Keterangan: "URL foto (opsional)" },
    ],
    sampleRows: [
      {
        id: "member_001",
        nama: "Budi Santoso",
        tahun_lahir: 1950,
        tahun_wafat: "",
        parent_id: "",
        pasangan_ids: "member_002",
        garis: "self",
        deskripsi: "Kepala keluarga",
        foto_url: "",
      },
      {
        id: "member_002",
        nama: "Siti Rahayu",
        tahun_lahir: 1955,
        tahun_wafat: "",
        parent_id: "",
        pasangan_ids: "member_001",
        garis: "self",
        deskripsi: "Istri",
        foto_url: "",
      },
      {
        id: "member_003",
        nama: "Andi Santoso",
        tahun_lahir: 1980,
        tahun_wafat: "",
        parent_id: "member_001",
        pasangan_ids: "",
        garis: "descendant",
        deskripsi: "Anak pertama",
        foto_url: "",
      },
    ],
  },
  en: {
    readExcelFailedPrefix: "Failed to read Excel file: ",
    readFileFailed: "Failed to read file",
    row: "Row",
    requiredName: "Name is required",
    duplicateId: (id: string) => `Duplicate ID "${id}"`,
    parentNotFound: (id: string) => `Parent ID "${id}" was not found in data`,
    deathBeforeBirth: "Death year cannot be earlier than birth year",
    invalidLine: (line: string) =>
      `Line "${line}" is invalid, default will be used`,
    templateSheet: "Family Data",
    instructionSheet: "Instructions",
    instructionRows: [
      {
        Column: "id",
        Description: "Unique ID per member (optional, auto-generated if empty)",
      },
      { Column: "nama", Description: "Full name (REQUIRED)" },
      { Column: "tahun_lahir", Description: "Birth year (example: 1980)" },
      {
        Column: "tahun_wafat",
        Description: "Death year (leave empty if still alive)",
      },
      { Column: "parent_id", Description: "Parent ID (reference to id column)" },
      {
        Column: "pasangan_ids",
        Description: "Partner IDs, separated by comma for multiple values",
      },
      {
        Column: "garis",
        Description:
          "Lineage type: paternal, maternal, self, descendant, union",
      },
      { Column: "deskripsi", Description: "Short note or bio" },
      { Column: "foto_url", Description: "Photo URL (optional)" },
    ],
    sampleRows: [
      {
        id: "member_001",
        nama: "Michael Hart",
        tahun_lahir: 1950,
        tahun_wafat: "",
        parent_id: "",
        pasangan_ids: "member_002",
        garis: "self",
        deskripsi: "Head of family",
        foto_url: "",
      },
      {
        id: "member_002",
        nama: "Sarah Hart",
        tahun_lahir: 1955,
        tahun_wafat: "",
        parent_id: "",
        pasangan_ids: "member_001",
        garis: "self",
        deskripsi: "Spouse",
        foto_url: "",
      },
      {
        id: "member_003",
        nama: "Daniel Hart",
        tahun_lahir: 1980,
        tahun_wafat: "",
        parent_id: "member_001",
        pasangan_ids: "",
        garis: "descendant",
        deskripsi: "First child",
        foto_url: "",
      },
    ],
  },
} as const;

function getCopy(locale: Locale) {
  return COPY[locale];
}

// Interface for Excel row data
export interface ExcelMember {
  id?: string;
  nama: string;
  tahun_lahir?: number;
  tahun_wafat?: number;
  parent_id?: string;
  pasangan_ids?: string;
  garis?: string;
  deskripsi?: string;
  foto_url?: string;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Parse Excel file and extract member data
 */
export async function parseExcelFile(
  file: File,
  locale: Locale = "id"
): Promise<ExcelMember[]> {
  const t = getCopy(locale);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: "",
        });

        const members: ExcelMember[] = jsonData.map((row) => ({
          id: String(row.id || row.ID || "").trim() || undefined,
          nama: String(row.nama || row.Nama || row.name || row.Name || "").trim(),
          tahun_lahir: parseYear(row.tahun_lahir || row.birth_year),
          tahun_wafat: parseYear(row.tahun_wafat || row.death_year),
          parent_id: String(row.parent_id || row.Parent_ID || "").trim() || undefined,
          pasangan_ids:
            String(row.pasangan_ids || row.partner_ids || "").trim() || undefined,
          garis: String(row.garis || row.line || "").trim() || undefined,
          deskripsi:
            String(row.deskripsi || row.description || "").trim() || undefined,
          foto_url: String(row.foto_url || row.image_url || "").trim() || undefined,
        }));

        resolve(members);
      } catch (error) {
        reject(new Error(t.readExcelFailedPrefix + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error(t.readFileFailed));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse year value from Excel cell
 */
function parseYear(value: any): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const num = parseInt(String(value), 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Validate imported data
 */
export function validateImportData(
  members: ExcelMember[],
  locale: Locale = "id"
): ValidationResult {
  const t = getCopy(locale);
  const errors: string[] = [];
  const warnings: string[] = [];
  const idSet = new Set<string>();

  members.forEach((member, index) => {
    const rowNum = index + 2;

    if (!member.nama) {
      errors.push(`${t.row} ${rowNum}: ${t.requiredName}`);
    }

    if (member.id) {
      if (idSet.has(member.id)) {
        errors.push(`${t.row} ${rowNum}: ${t.duplicateId(member.id)}`);
      }
      idSet.add(member.id);
    }

    if (member.parent_id && !idSet.has(member.parent_id)) {
      const parentExists = members.some((m) => m.id === member.parent_id);
      if (!parentExists) {
        warnings.push(
          `${t.row} ${rowNum}: ${t.parentNotFound(member.parent_id)}`
        );
      }
    }

    if (member.tahun_lahir && member.tahun_wafat) {
      if (member.tahun_wafat < member.tahun_lahir) {
        errors.push(`${t.row} ${rowNum}: ${t.deathBeforeBirth}`);
      }
    }

    const validLines = [
      "paternal",
      "maternal",
      "union",
      "descendant",
      "self",
      "default",
    ];
    if (member.garis && !validLines.includes(member.garis.toLowerCase())) {
      warnings.push(`${t.row} ${rowNum}: ${t.invalidLine(member.garis)}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert ExcelMember[] to FamilyNode[]
 */
export function convertToFamilyNodes(members: ExcelMember[]): FamilyNode[] {
  const idMap = new Map<string, string>();
  const tempIdPrefix = "import_";

  members.forEach((member, index) => {
    const originalId = member.id || `temp_${index}`;
    const newId = member.id || `${tempIdPrefix}${Date.now()}_${index}`;
    idMap.set(originalId, newId);
  });

  const childrenMap = new Map<string, string[]>();
  members.forEach((member) => {
    if (member.parent_id) {
      const parentNewId = idMap.get(member.parent_id);
      const memberNewId = idMap.get(member.id || `temp_${members.indexOf(member)}`);
      if (parentNewId && memberNewId) {
        const children = childrenMap.get(parentNewId) || [];
        children.push(memberNewId);
        childrenMap.set(parentNewId, children);
      }
    }
  });

  const nodes: FamilyNode[] = members.map((member, index) => {
    const originalId = member.id || `temp_${index}`;
    const nodeId = idMap.get(originalId)!;

    const partnerIds: string[] = [];
    if (member.pasangan_ids) {
      member.pasangan_ids.split(",").forEach((pid) => {
        const trimmedPid = pid.trim();
        const mappedId = idMap.get(trimmedPid);
        if (mappedId) partnerIds.push(mappedId);
      });
    }

    let line: FamilyNode["line"] = "default";
    if (member.garis) {
      const garis = member.garis.toLowerCase();
      if (["paternal", "maternal", "union", "descendant", "self"].includes(garis)) {
        line = garis as FamilyNode["line"];
      }
    }

    const content: NodeContent = {
      description: member.deskripsi || "",
      media: [],
    };

    if (member.foto_url) {
      content.media.push({
        type: "image",
        url: member.foto_url,
      } as MediaItem);
    }

    const parentId = member.parent_id ? idMap.get(member.parent_id) || null : null;
    const parentIds: string[] = parentId ? [parentId] : [];
    const childrenIds = childrenMap.get(nodeId) || [];

    return {
      id: nodeId,
      label: member.nama,
      year: member.tahun_lahir || null,
      deathYear: member.tahun_wafat || null,
      parentId,
      partners: partnerIds,
      childrenIds,
      parentIds,
      generation: 0,
      line,
      imageUrl: member.foto_url || null,
      content,
    };
  });

  return nodes;
}

/**
 * Generate downloadable Excel template
 */
export function generateExcelTemplate(locale: Locale = "id"): Blob {
  const t = getCopy(locale);
  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.json_to_sheet([...t.sampleRows]);
  worksheet["!cols"] = [
    { width: 15 },
    { width: 25 },
    { width: 12 },
    { width: 12 },
    { width: 15 },
    { width: 20 },
    { width: 12 },
    { width: 30 },
    { width: 40 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, t.templateSheet);

  const instructionSheet = XLSX.utils.json_to_sheet([...t.instructionRows]);
  instructionSheet["!cols"] = [{ width: 18 }, { width: 65 }];
  XLSX.utils.book_append_sheet(workbook, instructionSheet, t.instructionSheet);

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
