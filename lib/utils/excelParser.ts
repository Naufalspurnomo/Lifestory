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
