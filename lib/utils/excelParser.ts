/**
 * Excel Parser Utility for Family Tree Import
 * Parses .xlsx/.xls files and converts to FamilyNode[]
 */

import * as XLSX from "xlsx";
import type { FamilyNode, NodeContent, MediaItem } from "../types/tree";

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
export async function parseExcelFile(file: File): Promise<ExcelMember[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "array" });

                // Get first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON with header row
                const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(
                    worksheet,
                    { defval: "" }
                );

                // Map to ExcelMember format
                const members: ExcelMember[] = jsonData.map((row) => ({
                    id: String(row.id || row.ID || "").trim() || undefined,
                    nama: String(row.nama || row.Nama || row.name || row.Name || "").trim(),
                    tahun_lahir: parseYear(row.tahun_lahir || row.birth_year),
                    tahun_wafat: parseYear(row.tahun_wafat || row.death_year),
                    parent_id: String(row.parent_id || row.Parent_ID || "").trim() || undefined,
                    pasangan_ids: String(row.pasangan_ids || row.partner_ids || "").trim() || undefined,
                    garis: String(row.garis || row.line || "").trim() || undefined,
                    deskripsi: String(row.deskripsi || row.description || "").trim() || undefined,
                    foto_url: String(row.foto_url || row.image_url || "").trim() || undefined,
                }));

                resolve(members);
            } catch (error) {
                reject(new Error("Gagal membaca file Excel: " + (error as Error).message));
            }
        };

        reader.onerror = () => {
            reject(new Error("Gagal membaca file"));
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
export function validateImportData(members: ExcelMember[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const idSet = new Set<string>();

    members.forEach((member, index) => {
        const rowNum = index + 2; // +2 for header row and 1-based index

        // Check required field
        if (!member.nama) {
            errors.push(`Baris ${rowNum}: Nama wajib diisi`);
        }

        // Check duplicate IDs
        if (member.id) {
            if (idSet.has(member.id)) {
                errors.push(`Baris ${rowNum}: ID "${member.id}" duplikat`);
            }
            idSet.add(member.id);
        }

        // Check parent reference
        if (member.parent_id && !idSet.has(member.parent_id)) {
            // Check if parent exists in the list
            const parentExists = members.some((m) => m.id === member.parent_id);
            if (!parentExists) {
                warnings.push(
                    `Baris ${rowNum}: Parent ID "${member.parent_id}" tidak ditemukan dalam data`
                );
            }
        }

        // Validate year ranges
        if (member.tahun_lahir && member.tahun_wafat) {
            if (member.tahun_wafat < member.tahun_lahir) {
                errors.push(
                    `Baris ${rowNum}: Tahun wafat tidak boleh lebih kecil dari tahun lahir`
                );
            }
        }

        // Validate line value
        const validLines = ["paternal", "maternal", "union", "descendant", "self", "default"];
        if (member.garis && !validLines.includes(member.garis.toLowerCase())) {
            warnings.push(
                `Baris ${rowNum}: Garis "${member.garis}" tidak valid, akan digunakan default`
            );
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
    // Create ID mapping for members without ID
    const idMap = new Map<string, string>();
    const tempIdPrefix = "import_";

    // First pass: assign IDs
    members.forEach((member, index) => {
        const originalId = member.id || `temp_${index}`;
        const newId = member.id || `${tempIdPrefix}${Date.now()}_${index}`;
        idMap.set(originalId, newId);
    });

    // Build parent-children relationships
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

    // Second pass: create FamilyNode objects
    const nodes: FamilyNode[] = members.map((member, index) => {
        const originalId = member.id || `temp_${index}`;
        const nodeId = idMap.get(originalId)!;

        // Parse partner IDs
        const partnerIds: string[] = [];
        if (member.pasangan_ids) {
            member.pasangan_ids.split(",").forEach((pid) => {
                const trimmedPid = pid.trim();
                const mappedId = idMap.get(trimmedPid);
                if (mappedId) {
                    partnerIds.push(mappedId);
                }
            });
        }

        // Determine generation (will be recalculated by layout engine)
        let generation = 0;

        // Determine line type
        let line: FamilyNode["line"] = "default";
        if (member.garis) {
            const garis = member.garis.toLowerCase();
            if (["paternal", "maternal", "union", "descendant", "self"].includes(garis)) {
                line = garis as FamilyNode["line"];
            }
        }

        // Create content
        const content: NodeContent = {
            description: member.deskripsi || "",
            media: [],
        };

        // Add image if URL provided
        if (member.foto_url) {
            content.media.push({
                type: "image",
                url: member.foto_url,
            } as MediaItem);
        }

        // Get parent ID (mapped)
        const parentId = member.parent_id ? idMap.get(member.parent_id) || null : null;

        // Get parent IDs array
        const parentIds: string[] = parentId ? [parentId] : [];

        // Get children IDs
        const childrenIds = childrenMap.get(nodeId) || [];

        return {
            id: nodeId,
            label: member.nama,
            year: member.tahun_lahir || null,
            deathYear: member.tahun_wafat || null,
            parentId: parentId,
            partners: partnerIds,
            childrenIds: childrenIds,
            parentIds: parentIds,
            generation: generation,
            line: line,
            imageUrl: member.foto_url || null,
            content: content,
        };
    });

    return nodes;
}

/**
 * Generate downloadable Excel template
 */
export function generateExcelTemplate(): Blob {
    // Create template data
    const templateData = [
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
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create data sheet
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet["!cols"] = [
        { width: 15 }, // id
        { width: 25 }, // nama
        { width: 12 }, // tahun_lahir
        { width: 12 }, // tahun_wafat
        { width: 15 }, // parent_id
        { width: 20 }, // pasangan_ids
        { width: 12 }, // garis
        { width: 30 }, // deskripsi
        { width: 40 }, // foto_url
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Keluarga");

    // Create instruction sheet
    const instructions = [
        { Kolom: "id", Keterangan: "ID unik untuk setiap anggota (boleh kosong, akan di-generate)" },
        { Kolom: "nama", Keterangan: "Nama lengkap (WAJIB)" },
        { Kolom: "tahun_lahir", Keterangan: "Tahun lahir (contoh: 1980)" },
        { Kolom: "tahun_wafat", Keterangan: "Tahun wafat (kosongkan jika masih hidup)" },
        { Kolom: "parent_id", Keterangan: "ID orang tua (referensi ke kolom id)" },
        { Kolom: "pasangan_ids", Keterangan: "ID pasangan, pisahkan dengan koma jika lebih dari satu" },
        { Kolom: "garis", Keterangan: "Garis keturunan: paternal, maternal, self, descendant, union" },
        { Kolom: "deskripsi", Keterangan: "Keterangan atau bio singkat" },
        { Kolom: "foto_url", Keterangan: "URL foto (opsional)" },
    ];

    const instructionSheet = XLSX.utils.json_to_sheet(instructions);
    instructionSheet["!cols"] = [{ width: 15 }, { width: 60 }];
    XLSX.utils.book_append_sheet(workbook, instructionSheet, "Petunjuk");

    // Generate buffer and create blob
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    return new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
}
