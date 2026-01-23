"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "../ui/Button";
import {
    parseExcelFile,
    validateImportData,
    convertToFamilyNodes,
    generateExcelTemplate,
    type ExcelMember,
    type ValidationResult,
} from "../../lib/utils/excelParser";
import type { FamilyNode } from "../../lib/types/tree";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onImport: (nodes: FamilyNode[]) => void;
};

type ImportStep = "upload" | "preview" | "importing";

export default function ImportModal({ isOpen, onClose, onImport }: Props) {
    const [step, setStep] = useState<ImportStep>("upload");
    const [file, setFile] = useState<File | null>(null);
    const [members, setMembers] = useState<ExcelMember[]>([]);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = useCallback(() => {
        setStep("upload");
        setFile(null);
        setMembers([]);
        setValidation(null);
        setError(null);
        setIsDragging(false);
    }, []);

    const handleClose = useCallback(() => {
        reset();
        onClose();
    }, [reset, onClose]);

    if (!isOpen) return null;

    // Download template
    const handleDownloadTemplate = () => {
        const blob = generateExcelTemplate();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "template_import_keluarga.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Handle file selection
    const handleFileChange = async (selectedFile: File) => {
        // Validate file type
        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
        ];
        const isValidType =
            validTypes.includes(selectedFile.type) ||
            selectedFile.name.endsWith(".xlsx") ||
            selectedFile.name.endsWith(".xls");

        if (!isValidType) {
            setError("File harus berformat Excel (.xlsx atau .xls)");
            return;
        }

        setFile(selectedFile);
        setError(null);

        try {
            // Parse Excel file
            const parsedMembers = await parseExcelFile(selectedFile);

            if (parsedMembers.length === 0) {
                setError("File Excel kosong atau tidak ada data valid");
                return;
            }

            // Validate data
            const validationResult = validateImportData(parsedMembers);
            setMembers(parsedMembers);
            setValidation(validationResult);
            setStep("preview");
        } catch (err) {
            setError((err as Error).message || "Gagal membaca file Excel");
        }
    };

    // Handle drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileChange(droppedFile);
        }
    };

    // Handle import
    const handleImport = () => {
        if (!validation?.valid) return;

        setStep("importing");

        try {
            const nodes = convertToFamilyNodes(members);
            onImport(nodes);
            handleClose();
        } catch (err) {
            setError((err as Error).message || "Gagal mengkonversi data");
            setStep("preview");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col">
                {/* Header */}
                <div className="border-b border-warm-200 px-6 py-4 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-warmText">
                        Import dari Excel
                    </h2>
                    <p className="text-sm text-warmMuted">
                        {step === "upload" && "Upload file Excel dengan data anggota keluarga"}
                        {step === "preview" && "Preview data yang akan diimport"}
                        {step === "importing" && "Mengimport data..."}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-auto">
                    {/* Step 1: Upload */}
                    {step === "upload" && (
                        <div className="space-y-6">
                            {/* Download Template Button */}
                            <div className="flex justify-center">
                                <Button
                                    variant="secondary"
                                    onClick={handleDownloadTemplate}
                                    className="gap-2"
                                >
                                    📥 Download Template Excel
                                </Button>
                            </div>

                            {/* Dropzone */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                  border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                  transition-all duration-200
                  ${isDragging
                                        ? "border-gold-500 bg-gold-50"
                                        : "border-warm-300 hover:border-gold-400 hover:bg-warm-50"
                                    }
                `}
                            >
                                <div className="text-4xl mb-4">📂</div>
                                <p className="text-lg font-medium text-warmText mb-2">
                                    {isDragging
                                        ? "Lepaskan file di sini"
                                        : "Drag & drop file Excel"}
                                </p>
                                <p className="text-sm text-warmMuted">
                                    atau klik untuk memilih file
                                </p>
                                <p className="text-xs text-warmMuted mt-2">
                                    Format: .xlsx, .xls
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleFileChange(f);
                                    }}
                                    className="hidden"
                                />
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                                    <p className="text-sm text-red-700">❌ {error}</p>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="rounded-xl bg-gold-50 border border-gold-200 p-4">
                                <p className="text-sm text-gold-800 font-medium mb-2">
                                    📋 Petunjuk:
                                </p>
                                <ul className="text-sm text-gold-700 space-y-1 list-disc list-inside">
                                    <li>Download template Excel terlebih dahulu</li>
                                    <li>Isi data anggota keluarga sesuai format</li>
                                    <li>Kolom "nama" wajib diisi</li>
                                    <li>Data yang diimport akan mengganti semua data yang ada</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preview */}
                    {step === "preview" && (
                        <div className="space-y-4">
                            {/* File info */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-warm-100">
                                <span className="text-2xl">📄</span>
                                <div>
                                    <p className="font-medium text-warmText">{file?.name}</p>
                                    <p className="text-sm text-warmMuted">
                                        {members.length} anggota keluarga ditemukan
                                    </p>
                                </div>
                            </div>

                            {/* Validation errors */}
                            {validation && validation.errors.length > 0 && (
                                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                                    <p className="text-sm text-red-700 font-medium mb-2">
                                        ❌ Error (tidak bisa import):
                                    </p>
                                    <ul className="text-sm text-red-600 space-y-1 list-disc list-inside max-h-24 overflow-auto">
                                        {validation.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Validation warnings */}
                            {validation && validation.warnings.length > 0 && (
                                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                                    <p className="text-sm text-amber-700 font-medium mb-2">
                                        ⚠️ Peringatan:
                                    </p>
                                    <ul className="text-sm text-amber-600 space-y-1 list-disc list-inside max-h-24 overflow-auto">
                                        {validation.warnings.map((warn, i) => (
                                            <li key={i}>{warn}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Preview table */}
                            <div className="border border-warm-200 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto max-h-64">
                                    <table className="w-full text-sm">
                                        <thead className="bg-warm-100 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium text-warmMuted">
                                                    #
                                                </th>
                                                <th className="px-3 py-2 text-left font-medium text-warmMuted">
                                                    Nama
                                                </th>
                                                <th className="px-3 py-2 text-left font-medium text-warmMuted">
                                                    Lahir
                                                </th>
                                                <th className="px-3 py-2 text-left font-medium text-warmMuted">
                                                    Wafat
                                                </th>
                                                <th className="px-3 py-2 text-left font-medium text-warmMuted">
                                                    Parent ID
                                                </th>
                                                <th className="px-3 py-2 text-left font-medium text-warmMuted">
                                                    Garis
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-warm-100">
                                            {members.map((member, idx) => (
                                                <tr key={idx} className="hover:bg-warm-50">
                                                    <td className="px-3 py-2 text-warmMuted">{idx + 1}</td>
                                                    <td className="px-3 py-2 text-warmText font-medium">
                                                        {member.nama || (
                                                            <span className="text-red-500 italic">Kosong</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-warmMuted">
                                                        {member.tahun_lahir || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-warmMuted">
                                                        {member.tahun_wafat || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-warmMuted">
                                                        {member.parent_id || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-warmMuted">
                                                        {member.garis || "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Replace warning */}
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                                <p className="text-sm text-amber-800">
                                    ⚠️ <strong>Perhatian:</strong> Import akan mengganti semua data
                                    pohon keluarga yang ada saat ini.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Importing */}
                    {step === "importing" && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin text-4xl mb-4">⏳</div>
                            <p className="text-lg font-medium text-warmText">
                                Mengimport data...
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-warm-200 px-6 py-4 flex-shrink-0">
                    <div className="flex gap-3 justify-end">
                        {step === "upload" && (
                            <Button variant="secondary" onClick={handleClose}>
                                Batal
                            </Button>
                        )}

                        {step === "preview" && (
                            <>
                                <Button variant="secondary" onClick={reset}>
                                    ← Kembali
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleImport}
                                    disabled={!validation?.valid}
                                >
                                    Import {members.length} Anggota
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
