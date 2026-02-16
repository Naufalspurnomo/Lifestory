/**
 * Excel Parser Utility for Family Tree Import
 * Parses .xlsx/.xls files and converts to FamilyNode[]
 */

import * as XLSX from "xlsx";
import type { FamilyNode, NodeContent, MediaItem, TreeData } from "../types/tree";

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
      {
        Kolom: "jenis_kelamin",
        Keterangan: "M / F / X (opsional tapi direkomendasikan)",
      },
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
        Kolom: "parent_ids",
        Keterangan: "Semua parent ID, pisahkan koma jika lebih dari satu",
      },
      {
        Kolom: "ayah_id",
        Keterangan: "ID ayah (opsional, diprioritaskan saat tersedia)",
      },
      {
        Kolom: "ibu_id",
        Keterangan: "ID ibu (opsional, diprioritaskan saat tersedia)",
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
        jenis_kelamin: "M",
        tahun_lahir: 1950,
        tahun_wafat: "",
        parent_id: "",
        parent_ids: "",
        ayah_id: "",
        ibu_id: "",
        pasangan_ids: "member_002",
        garis: "self",
        deskripsi: "Kepala keluarga",
        foto_url: "",
      },
      {
        id: "member_002",
        nama: "Siti Rahayu",
        jenis_kelamin: "F",
        tahun_lahir: 1955,
        tahun_wafat: "",
        parent_id: "",
        parent_ids: "",
        ayah_id: "",
        ibu_id: "",
        pasangan_ids: "member_001",
        garis: "self",
        deskripsi: "Istri",
        foto_url: "",
      },
      {
        id: "member_003",
        nama: "Andi Santoso",
        jenis_kelamin: "M",
        tahun_lahir: 1980,
        tahun_wafat: "",
        parent_id: "member_001",
        parent_ids: "member_001, member_002",
        ayah_id: "member_001",
        ibu_id: "member_002",
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
      {
        Column: "jenis_kelamin",
        Description: "M / F / X (optional but recommended)",
      },
      { Column: "tahun_lahir", Description: "Birth year (example: 1980)" },
      {
        Column: "tahun_wafat",
        Description: "Death year (leave empty if still alive)",
      },
      { Column: "parent_id", Description: "Parent ID (reference to id column)" },
      {
        Column: "parent_ids",
        Description: "All parent IDs, comma-separated if more than one",
      },
      { Column: "ayah_id", Description: "Father ID (optional)" },
      { Column: "ibu_id", Description: "Mother ID (optional)" },
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
        jenis_kelamin: "M",
        tahun_lahir: 1950,
        tahun_wafat: "",
        parent_id: "",
        parent_ids: "",
        ayah_id: "",
        ibu_id: "",
        pasangan_ids: "member_002",
        garis: "self",
        deskripsi: "Head of family",
        foto_url: "",
      },
      {
        id: "member_002",
        nama: "Sarah Hart",
        jenis_kelamin: "F",
        tahun_lahir: 1955,
        tahun_wafat: "",
        parent_id: "",
        parent_ids: "",
        ayah_id: "",
        ibu_id: "",
        pasangan_ids: "member_001",
        garis: "self",
        deskripsi: "Spouse",
        foto_url: "",
      },
      {
        id: "member_003",
        nama: "Daniel Hart",
        jenis_kelamin: "M",
        tahun_lahir: 1980,
        tahun_wafat: "",
        parent_id: "member_001",
        parent_ids: "member_001, member_002",
        ayah_id: "member_001",
        ibu_id: "member_002",
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
  jenis_kelamin?: FamilyNode["sex"];
  tahun_lahir?: number;
  tahun_wafat?: number;
  parent_id?: string;
  parent_ids?: string;
  parent_nama?: string;
  ayah_id?: string;
  ayah_nama?: string;
  ibu_id?: string;
  ibu_nama?: string;
  pasangan_ids?: string;
  pasangan_nama?: string;
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

function getCellString(row: Record<string, any>, keys: string[]): string | undefined {
  for (const key of keys) {
    if (!(key in row)) continue;
    const value = String(row[key] ?? "").trim();
    if (value) return value;
  }
  return undefined;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function splitCsv(value?: string): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function sharesAnyParent(
  aId: string,
  bId: string,
  parentIdsByNode: Map<string, string[]>
): boolean {
  const aParents = new Set(parentIdsByNode.get(aId) || []);
  if (!aParents.size) return false;
  return (parentIdsByNode.get(bId) || []).some((pid) => aParents.has(pid));
}

function parseGender(value?: string): FamilyNode["sex"] | undefined {
  if (!value) return undefined;
  const normalized = normalizeText(value);
  if (["m", "male", "l", "laki", "laki-laki", "pria"].includes(normalized)) {
    return "M";
  }
  if (["f", "female", "p", "perempuan", "wanita"].includes(normalized)) {
    return "F";
  }
  if (["x", "other", "lainnya", "unknown", "tidak diketahui"].includes(normalized)) {
    return "X";
  }
  return undefined;
}

function mergeCsvField(a?: string, b?: string): string | undefined {
  const merged = splitCsv(a).concat(splitCsv(b));
  if (!merged.length) return undefined;
  return Array.from(new Set(merged)).join(", ");
}

function mergeMember(base: ExcelMember, extra: ExcelMember): ExcelMember {
  return {
    id: base.id || extra.id,
    nama: base.nama || extra.nama,
    jenis_kelamin: base.jenis_kelamin || extra.jenis_kelamin,
    tahun_lahir: base.tahun_lahir ?? extra.tahun_lahir,
    tahun_wafat: base.tahun_wafat ?? extra.tahun_wafat,
    parent_id: base.parent_id || extra.parent_id,
    parent_ids: mergeCsvField(base.parent_ids, extra.parent_ids),
    parent_nama: mergeCsvField(base.parent_nama, extra.parent_nama),
    ayah_id: base.ayah_id || extra.ayah_id,
    ayah_nama: base.ayah_nama || extra.ayah_nama,
    ibu_id: base.ibu_id || extra.ibu_id,
    ibu_nama: base.ibu_nama || extra.ibu_nama,
    pasangan_ids: mergeCsvField(base.pasangan_ids, extra.pasangan_ids),
    pasangan_nama: mergeCsvField(base.pasangan_nama, extra.pasangan_nama),
    garis: base.garis || extra.garis,
    deskripsi: base.deskripsi || extra.deskripsi,
    foto_url: base.foto_url || extra.foto_url,
  };
}

function mergeDuplicateMembers(members: ExcelMember[]): ExcelMember[] {
  const result: ExcelMember[] = [];
  const indexById = new Map<string, number>();

  for (const member of members) {
    if (!member.id) {
      result.push(member);
      continue;
    }

    const existingIndex = indexById.get(member.id);
    if (existingIndex === undefined) {
      indexById.set(member.id, result.length);
      result.push(member);
      continue;
    }

    result[existingIndex] = mergeMember(result[existingIndex], member);
  }

  return result;
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
          id: getCellString(row, ["id", "ID"]),
          nama: getCellString(row, ["nama", "Nama", "name", "Name"]) || "",
          jenis_kelamin: parseGender(
            getCellString(row, ["jenis_kelamin", "gender", "sex", "Jenis_Kelamin"])
          ),
          tahun_lahir: parseYear(row.tahun_lahir ?? row.birth_year),
          tahun_wafat: parseYear(row.tahun_wafat ?? row.death_year),
          parent_id: getCellString(row, ["parent_id", "Parent_ID"]),
          parent_ids: getCellString(row, ["parent_ids", "Parent_IDs", "parents_ids"]),
          parent_nama: getCellString(row, ["parent_nama", "parent_names"]),
          ayah_id: getCellString(row, ["ayah_id", "father_id"]),
          ayah_nama: getCellString(row, ["ayah_nama", "father_name"]),
          ibu_id: getCellString(row, ["ibu_id", "mother_id"]),
          ibu_nama: getCellString(row, ["ibu_nama", "mother_name"]),
          pasangan_ids: getCellString(row, ["pasangan_ids", "partner_ids", "pasangan_id"]),
          pasangan_nama: getCellString(row, ["pasangan_nama", "partner_names"]),
          garis: getCellString(row, ["garis", "line"]),
          deskripsi: getCellString(row, ["deskripsi", "description"]),
          foto_url: getCellString(row, ["foto_url", "image_url"]),
        }));

        resolve(mergeDuplicateMembers(members));
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
  const existingIds = new Set(
    members.map((member) => member.id).filter((id): id is string => Boolean(id))
  );
  const existingNames = new Set(
    members
      .map((member) => normalizeText(member.nama || ""))
      .filter((name) => Boolean(name))
  );

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

    const parentRefs = uniqueIds([
      member.parent_id,
      member.ayah_id,
      member.ibu_id,
      ...splitCsv(member.parent_ids),
      ...splitCsv(member.parent_nama),
      member.ayah_nama,
      member.ibu_nama,
    ]);

    for (const parentRef of parentRefs) {
      const normalizedRef = normalizeText(parentRef);
      const parentExists =
        existingIds.has(parentRef) || existingNames.has(normalizedRef);
      if (!parentExists) {
        warnings.push(
          `${t.row} ${rowNum}: ${t.parentNotFound(parentRef)}`
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
  const uniqueNameToId = new Map<string, string | undefined>();
  const tempIdPrefix = "import_";
  const importSeed = Date.now();

  members.forEach((member, index) => {
    const originalId = member.id || `temp_${index}`;
    const newId = member.id || `${tempIdPrefix}${importSeed}_${index}`;
    idMap.set(originalId, newId);
  });

  members.forEach((member, index) => {
    const nameKey = normalizeText(member.nama || "");
    if (!nameKey) return;

    const originalId = member.id || `temp_${index}`;
    const mappedId = idMap.get(originalId);
    if (!mappedId) return;

    if (!uniqueNameToId.has(nameKey)) {
      uniqueNameToId.set(nameKey, mappedId);
      return;
    }

    const existingId = uniqueNameToId.get(nameKey);
    if (existingId && existingId !== mappedId) {
      uniqueNameToId.set(nameKey, undefined);
    }
  });

  const resolveReference = (rawValue?: string): string | undefined => {
    if (!rawValue) return undefined;
    const value = rawValue.trim();
    if (!value) return undefined;

    const mappedById = idMap.get(value);
    if (mappedById) return mappedById;

    const mappedByName = uniqueNameToId.get(normalizeText(value));
    return mappedByName || undefined;
  };

  const parentIdsByNode = new Map<string, string[]>();
  const partnerIdsByNode = new Map<string, string[]>();

  const nodes: FamilyNode[] = members.map((member, index) => {
    const originalId = member.id || `temp_${index}`;
    const nodeId = idMap.get(originalId)!;
    const parentIds = uniqueIds([
      resolveReference(member.parent_id),
      resolveReference(member.ayah_id),
      resolveReference(member.ibu_id),
      ...splitCsv(member.parent_ids).map((value) => resolveReference(value)),
      ...splitCsv(member.parent_nama).map((value) => resolveReference(value)),
      ...splitCsv(member.ayah_nama).map((value) => resolveReference(value)),
      ...splitCsv(member.ibu_nama).map((value) => resolveReference(value)),
    ]).filter((id) => id !== nodeId);
    const partnerIds = uniqueIds([
      ...splitCsv(member.pasangan_ids).map((value) => resolveReference(value)),
      ...splitCsv(member.pasangan_nama).map((value) => resolveReference(value)),
    ]).filter((id) => id !== nodeId);

    parentIdsByNode.set(nodeId, parentIds);
    partnerIdsByNode.set(nodeId, partnerIds);

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

    return {
      id: nodeId,
      label: member.nama || `Member ${index + 1}`,
      sex: member.jenis_kelamin,
      year: member.tahun_lahir ?? null,
      deathYear: member.tahun_wafat ?? null,
      parentId: parentIds[0] || null,
      partners: partnerIds,
      childrenIds: [],
      parentIds,
      generation: 0,
      line,
      imageUrl: member.foto_url || null,
      content,
    };
  });

  const childrenMap = new Map<string, Set<string>>();
  const partnerMap = new Map<string, Set<string>>();

  nodes.forEach((node) => {
    childrenMap.set(node.id, new Set<string>());
    partnerMap.set(node.id, new Set<string>());
  });

  nodes.forEach((node) => {
    const parentIds = parentIdsByNode.get(node.id) || [];
    parentIds.forEach((parentId) => {
      childrenMap.get(parentId)?.add(node.id);
    });

    const partnerIds = partnerIdsByNode.get(node.id) || [];
    partnerIds.forEach((partnerId) => {
      if (!partnerMap.has(partnerId)) return;
      partnerMap.get(node.id)?.add(partnerId);
      partnerMap.get(partnerId)?.add(node.id);
    });
  });

  nodes.forEach((node) => {
    const parentIds = parentIdsByNode.get(node.id) || [];
    if (parentIds.length < 2) return;

    for (let i = 0; i < parentIds.length - 1; i++) {
      for (let j = i + 1; j < parentIds.length; j++) {
        const leftParent = parentIds[i];
        const rightParent = parentIds[j];
        if (sharesAnyParent(leftParent, rightParent, parentIdsByNode)) {
          continue;
        }
        if (!partnerMap.has(leftParent) || !partnerMap.has(rightParent)) continue;
        partnerMap.get(leftParent)?.add(rightParent);
        partnerMap.get(rightParent)?.add(leftParent);
      }
    }
  });

  return nodes.map((node) => {
    const parentIds = parentIdsByNode.get(node.id) || [];
    const childrenIds = Array.from(childrenMap.get(node.id) || []);
    const partnerIds = Array.from(partnerMap.get(node.id) || []);

    return {
      ...node,
      parentIds,
      parentId: parentIds[0] || null,
      childrenIds,
      partners: partnerIds,
    };
  });
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
    { width: 12 },
    { width: 15 },
    { width: 18 },
    { width: 15 },
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

type ExportSheetNames = {
  importSheet: string;
  relationSheet: string;
  summarySheet: string;
  summaryRows: Array<Record<string, string | number>>;
};

const EXPORT_COPY: Record<Locale, ExportSheetNames> = {
  id: {
    importSheet: "Data Keluarga",
    relationSheet: "Relasi Lengkap",
    summarySheet: "Ringkasan",
    summaryRows: [
      { Kunci: "Format", Nilai: "Lifestory Family Export v1" },
      { Kunci: "Catatan", Nilai: "Sheet Data Keluarga bisa dipakai untuk import ulang." },
      { Kunci: "Catatan", Nilai: "Kolom kakak/adik ditentukan dari tahun lahir jika tersedia." },
      { Kunci: "Catatan", Nilai: "Jika tahun lahir tidak lengkap, relasi saudara masuk kolom tidak terklasifikasi." },
    ],
  },
  en: {
    importSheet: "Family Data",
    relationSheet: "Full Relations",
    summarySheet: "Summary",
    summaryRows: [
      { Key: "Format", Value: "Lifestory Family Export v1" },
      { Key: "Notes", Value: "The Family Data sheet can be re-imported." },
      { Key: "Notes", Value: "Older/younger siblings are inferred from birth year when available." },
      { Key: "Notes", Value: "If birth years are incomplete, siblings move to unclassified columns." },
    ],
  },
};

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter((value): value is string => Boolean(value))));
}

function sortPeople(a: FamilyNode, b: FamilyNode): number {
  if (a.generation !== b.generation) return a.generation - b.generation;

  const ay = a.year ?? Number.POSITIVE_INFINITY;
  const by = b.year ?? Number.POSITIVE_INFINITY;
  if (ay !== by) return ay - by;

  return a.label.localeCompare(b.label, "id", { sensitivity: "base" });
}

function buildRelationGraph(nodes: FamilyNode[]) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const parentMap = new Map<string, Set<string>>();
  const childMap = new Map<string, Set<string>>();
  const partnerMap = new Map<string, Set<string>>();

  for (const node of nodes) {
    parentMap.set(node.id, new Set<string>());
    childMap.set(node.id, new Set<string>());
    partnerMap.set(node.id, new Set<string>());
  }

  for (const node of nodes) {
    const parentIds = uniqueIds([...(node.parentIds || []), node.parentId]);
    for (const parentId of parentIds) {
      if (!nodeMap.has(parentId)) continue;
      parentMap.get(node.id)?.add(parentId);
      childMap.get(parentId)?.add(node.id);
    }

    for (const childId of node.childrenIds || []) {
      if (!nodeMap.has(childId)) continue;
      childMap.get(node.id)?.add(childId);
      parentMap.get(childId)?.add(node.id);
    }

    for (const partnerId of node.partners || []) {
      if (!nodeMap.has(partnerId)) continue;
      partnerMap.get(node.id)?.add(partnerId);
      partnerMap.get(partnerId)?.add(node.id);
    }
  }

  return { nodeMap, parentMap, childMap, partnerMap };
}

function getNodesByIds(ids: string[], nodeMap: Map<string, FamilyNode>): FamilyNode[] {
  return ids
    .map((id) => nodeMap.get(id))
    .filter((node): node is FamilyNode => Boolean(node))
    .sort(sortPeople);
}

function idsToString(ids: string[]): string {
  return ids.join(", ");
}

function namesToString(nodes: FamilyNode[]): string {
  return nodes.map((node) => node.label).join(", ");
}

function publicImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return "";
  return /^https?:\/\//i.test(imageUrl) ? imageUrl : "";
}

function pickParentRoles(parentNodes: FamilyNode[]): {
  father?: FamilyNode;
  mother?: FamilyNode;
} {
  let father =
    parentNodes.find((parent) => parent.sex === "M") ||
    parentNodes.find((parent) => parent.line === "paternal");
  let mother =
    parentNodes.find((parent) => parent.sex === "F") ||
    parentNodes.find((parent) => parent.line === "maternal");

  if (father && mother && father.id === mother.id) {
    mother = parentNodes.find((parent) => parent.id !== father?.id);
  }

  if (!father && mother && parentNodes.length === 2) {
    father = parentNodes.find((parent) => parent.id !== mother?.id);
  }

  if (!mother && father && parentNodes.length === 2) {
    mother = parentNodes.find((parent) => parent.id !== father?.id);
  }

  return { father, mother };
}

function safeFileName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

  return cleaned || "family-tree";
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportFamilyTreeToExcel(
  tree: TreeData,
  locale: Locale = "id"
): void {
  if (!tree.nodes.length) {
    throw new Error(locale === "id" ? "Tidak ada anggota untuk diekspor." : "No members to export.");
  }

  const workbook = XLSX.utils.book_new();
  const copy = EXPORT_COPY[locale];
  const sortedNodes = [...tree.nodes].sort(sortPeople);
  const { nodeMap, parentMap, childMap, partnerMap } = buildRelationGraph(sortedNodes);

  const importRows = sortedNodes.map((node) => {
    const parentIds = Array.from(parentMap.get(node.id) || []);
    const parentNodes = getNodesByIds(parentIds, nodeMap);
    const { father, mother } = pickParentRoles(parentNodes);
    const partnerIds = Array.from(partnerMap.get(node.id) || []);
    const partnerNodes = getNodesByIds(partnerIds, nodeMap);
    const primaryParentId = father?.id || mother?.id || parentIds[0] || "";

    return {
      id: node.id,
      nama: node.label,
      jenis_kelamin: node.sex || "X",
      tahun_lahir: node.year ?? "",
      tahun_wafat: node.deathYear ?? "",
      parent_id: primaryParentId,
      parent_ids: idsToString(parentIds),
      parent_nama: namesToString(parentNodes),
      ayah_id: father?.id || "",
      ayah_nama: father?.label || "",
      ibu_id: mother?.id || "",
      ibu_nama: mother?.label || "",
      pasangan_ids: idsToString(partnerIds),
      pasangan_nama: namesToString(partnerNodes),
      garis: node.line || "default",
      deskripsi: node.content?.description || "",
      foto_url: publicImageUrl(node.imageUrl),
    };
  });

  const relationRows = sortedNodes.map((node) => {
    const parentIds = Array.from(parentMap.get(node.id) || []);
    const childIds = Array.from(childMap.get(node.id) || []);
    const partnerIds = Array.from(partnerMap.get(node.id) || []);

    const parentNodes = getNodesByIds(parentIds, nodeMap);
    const childNodes = getNodesByIds(childIds, nodeMap);
    const partnerNodes = getNodesByIds(partnerIds, nodeMap);

    const { father, mother } = pickParentRoles(parentNodes);

    const siblingSet = new Set<string>();
    for (const parentId of parentIds) {
      const siblingsFromParent = Array.from(childMap.get(parentId) || []);
      for (const siblingId of siblingsFromParent) {
        if (siblingId !== node.id) siblingSet.add(siblingId);
      }
    }

    const olderSiblingIds: string[] = [];
    const youngerSiblingIds: string[] = [];
    const unclassifiedSiblingIds: string[] = [];

    for (const siblingId of siblingSet) {
      const sibling = nodeMap.get(siblingId);
      if (!sibling) continue;

      if (
        node.year !== null &&
        sibling.year !== null &&
        node.year !== sibling.year
      ) {
        if (sibling.year < node.year) {
          olderSiblingIds.push(siblingId);
        } else {
          youngerSiblingIds.push(siblingId);
        }
      } else {
        unclassifiedSiblingIds.push(siblingId);
      }
    }

    const olderSiblings = getNodesByIds(uniqueIds(olderSiblingIds), nodeMap);
    const youngerSiblings = getNodesByIds(uniqueIds(youngerSiblingIds), nodeMap);
    const unclassifiedSiblings = getNodesByIds(
      uniqueIds(unclassifiedSiblingIds),
      nodeMap
    );
    const allSiblings = getNodesByIds(
      uniqueIds([...olderSiblingIds, ...youngerSiblingIds, ...unclassifiedSiblingIds]),
      nodeMap
    );

    return {
      id: node.id,
      nama: node.label,
      jenis_kelamin: node.sex || "X",
      generasi: node.generation,
      tahun_lahir: node.year ?? "",
      tahun_wafat: node.deathYear ?? "",
      garis: node.line || "default",
      ayah_id: father?.id || "",
      ayah_nama: father?.label || "",
      ibu_id: mother?.id || "",
      ibu_nama: mother?.label || "",
      parent_ids: idsToString(parentIds),
      parent_nama: namesToString(parentNodes),
      pasangan_ids: idsToString(partnerIds),
      pasangan_nama: namesToString(partnerNodes),
      anak_ids: idsToString(childIds),
      anak_nama: namesToString(childNodes),
      kakak_ids: idsToString(olderSiblings.map((sibling) => sibling.id)),
      kakak_nama: namesToString(olderSiblings),
      adik_ids: idsToString(youngerSiblings.map((sibling) => sibling.id)),
      adik_nama: namesToString(youngerSiblings),
      saudara_ids: idsToString(allSiblings.map((sibling) => sibling.id)),
      saudara_nama: namesToString(allSiblings),
      saudara_tidak_terklasifikasi_ids: idsToString(
        unclassifiedSiblings.map((sibling) => sibling.id)
      ),
      saudara_tidak_terklasifikasi_nama: namesToString(unclassifiedSiblings),
    };
  });

  const summaryRows = [
    ...(copy.summaryRows as Array<Record<string, string | number>>),
    locale === "id"
      ? { Kunci: "Nama Pohon", Nilai: tree.name }
      : { Key: "Tree Name", Value: tree.name },
    locale === "id"
      ? { Kunci: "Jumlah Anggota", Nilai: tree.nodes.length }
      : { Key: "Members Count", Value: tree.nodes.length },
    locale === "id"
      ? { Kunci: "Diekspor Pada", Nilai: new Date().toISOString() }
      : { Key: "Exported At", Value: new Date().toISOString() },
  ];

  const importSheet = XLSX.utils.json_to_sheet(importRows);
  importSheet["!cols"] = [
    { width: 22 },
    { width: 28 },
    { width: 14 },
    { width: 12 },
    { width: 12 },
    { width: 22 },
    { width: 28 },
    { width: 28 },
    { width: 20 },
    { width: 24 },
    { width: 20 },
    { width: 24 },
    { width: 28 },
    { width: 28 },
    { width: 12 },
    { width: 45 },
    { width: 32 },
  ];
  XLSX.utils.book_append_sheet(workbook, importSheet, copy.importSheet);

  const relationSheet = XLSX.utils.json_to_sheet(relationRows);
  relationSheet["!cols"] = [
    { width: 22 },
    { width: 28 },
    { width: 14 },
    { width: 10 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 20 },
    { width: 24 },
    { width: 20 },
    { width: 24 },
    { width: 28 },
    { width: 32 },
    { width: 28 },
    { width: 32 },
    { width: 28 },
    { width: 32 },
    { width: 28 },
    { width: 32 },
    { width: 28 },
    { width: 32 },
    { width: 28 },
    { width: 32 },
    { width: 34 },
    { width: 38 },
  ];
  XLSX.utils.book_append_sheet(workbook, relationSheet, copy.relationSheet);

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ width: 22 }, { width: 70 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, copy.summarySheet);

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  const fileDate = new Date().toISOString().split("T")[0];
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  triggerBlobDownload(blob, `${safeFileName(tree.name)}-export-${fileDate}.xlsx`);
}
