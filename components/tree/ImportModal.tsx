"use client";

import { useCallback, useRef, useState } from "react";
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
import { useLanguage } from "../providers/LanguageProvider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (nodes: FamilyNode[]) => void;
};

type ImportStep = "upload" | "preview" | "importing";

export default function ImportModal({ isOpen, onClose, onImport }: Props) {
  const { locale } = useLanguage();
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [members, setMembers] = useState<ExcelMember[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copy =
    locale === "id"
      ? {
          title: "Import dari Excel",
          subtitleUpload: "Upload file Excel dengan data anggota keluarga",
          subtitlePreview: "Preview data yang akan diimport",
          subtitleImporting: "Mengimpor data...",
          downloadTemplate: "Download Template Excel",
          invalidFileType: "File harus berformat Excel (.xlsx atau .xls)",
          emptyExcel: "File Excel kosong atau tidak ada data valid",
          readExcelFailed: "Gagal membaca file Excel",
          convertFailed: "Gagal mengonversi data",
          dropHere: "Lepaskan file di sini",
          dragDrop: "Drag & drop file Excel",
          clickToSelect: "atau klik untuk memilih file",
          format: "Format: .xlsx, .xls",
          guideTitle: "Petunjuk:",
          guideItems: [
            "Download template Excel terlebih dahulu",
            "Isi data anggota keluarga sesuai format",
            'Kolom "nama" wajib diisi',
            'Kolom "pasangan" bisa pakai format "Nama A ==== Nama B"',
            "Data yang diimport akan mengganti semua data yang ada",
          ],
          foundMembers: (count: number) => `${count} anggota keluarga ditemukan`,
          errorTitle: "Error (tidak bisa import):",
          warningTitle: "Peringatan:",
          columns: [
            "#",
            "Nama",
            "Generasi",
            "Lahir",
            "Wafat",
            "Parent ID",
            "Pasangan",
            "Garis",
          ],
          empty: "Kosong",
          warningReplace:
            "Perhatian: Import akan mengganti semua data pohon keluarga yang ada saat ini.",
          importing: "Mengimpor data...",
          cancel: "Batal",
          back: "Kembali",
          importMembers: (count: number) => `Import ${count} Anggota`,
          templateFilename: "template_import_keluarga.xlsx",
        }
      : {
          title: "Import from Excel",
          subtitleUpload: "Upload an Excel file with family member data",
          subtitlePreview: "Preview data to be imported",
          subtitleImporting: "Importing data...",
          downloadTemplate: "Download Excel Template",
          invalidFileType: "File must be an Excel format (.xlsx or .xls)",
          emptyExcel: "Excel file is empty or contains no valid data",
          readExcelFailed: "Failed to read Excel file",
          convertFailed: "Failed to convert data",
          dropHere: "Drop file here",
          dragDrop: "Drag & drop Excel file",
          clickToSelect: "or click to choose a file",
          format: "Format: .xlsx, .xls",
          guideTitle: "Instructions:",
          guideItems: [
            "Download the Excel template first",
            "Fill in family member data based on format",
            '"nama" column is required',
            'Use "pasangan" column with format like "Name A ==== Name B"',
            "Imported data will replace all current tree data",
          ],
          foundMembers: (count: number) => `${count} family members found`,
          errorTitle: "Error (cannot import):",
          warningTitle: "Warnings:",
          columns: [
            "#",
            "Name",
            "Generation",
            "Birth",
            "Death",
            "Parent ID",
            "Partner",
            "Line",
          ],
          empty: "Empty",
          warningReplace:
            "Attention: Import will replace all current family tree data.",
          importing: "Importing data...",
          cancel: "Cancel",
          back: "Back",
          importMembers: (count: number) => `Import ${count} Members`,
          templateFilename: "family_import_template.xlsx",
        };

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

  const handleDownloadTemplate = () => {
    const blob = generateExcelTemplate(locale);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = copy.templateFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (selectedFile: File) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const isValidType =
      validTypes.includes(selectedFile.type) ||
      selectedFile.name.endsWith(".xlsx") ||
      selectedFile.name.endsWith(".xls");

    if (!isValidType) {
      setError(copy.invalidFileType);
      return;
    }

    setFile(selectedFile);
    setError(null);

    try {
      const parsedMembers = await parseExcelFile(selectedFile, locale);

      if (parsedMembers.length === 0) {
        setError(copy.emptyExcel);
        return;
      }

      const validationResult = validateImportData(parsedMembers, locale);
      setMembers(parsedMembers);
      setValidation(validationResult);
      setStep("preview");
    } catch (err) {
      setError((err as Error).message || copy.readExcelFailed);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileChange(droppedFile);
  };

  const handleImport = () => {
    if (!validation?.valid) return;
    setStep("importing");

    try {
      const nodes = convertToFamilyNodes(members);
      onImport(nodes);
      handleClose();
    } catch (err) {
      setError((err as Error).message || copy.convertFailed);
      setStep("preview");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="shrink-0 border-b border-warm-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-warmText">{copy.title}</h2>
          <p className="text-sm text-warmMuted">
            {step === "upload" && copy.subtitleUpload}
            {step === "preview" && copy.subtitlePreview}
            {step === "importing" && copy.subtitleImporting}
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {step === "upload" && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <Button
                  variant="secondary"
                  onClick={handleDownloadTemplate}
                  className="gap-2"
                >
                  📥 {copy.downloadTemplate}
                </Button>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
                  isDragging
                    ? "border-gold-500 bg-gold-50"
                    : "border-warm-300 hover:border-gold-400 hover:bg-warm-50"
                }`}
              >
                <div className="mb-4 text-4xl">📂</div>
                <p className="mb-2 text-lg font-medium text-warmText">
                  {isDragging ? copy.dropHere : copy.dragDrop}
                </p>
                <p className="text-sm text-warmMuted">{copy.clickToSelect}</p>
                <p className="mt-2 text-xs text-warmMuted">{copy.format}</p>
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

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">❌ {error}</p>
                </div>
              )}

              <div className="rounded-xl border border-gold-200 bg-gold-50 p-4">
                <p className="mb-2 text-sm font-medium text-gold-800">
                  📋 {copy.guideTitle}
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm text-gold-700">
                  {copy.guideItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-warm-100 p-3">
                <span className="text-2xl">📄</span>
                <div>
                  <p className="font-medium text-warmText">{file?.name}</p>
                  <p className="text-sm text-warmMuted">
                    {copy.foundMembers(members.length)}
                  </p>
                </div>
              </div>

              {validation && validation.errors.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="mb-2 text-sm font-medium text-red-700">
                    ❌ {copy.errorTitle}
                  </p>
                  <ul className="max-h-24 list-inside list-disc space-y-1 overflow-auto text-sm text-red-600">
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation && validation.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-2 text-sm font-medium text-amber-700">
                    ⚠️ {copy.warningTitle}
                  </p>
                  <ul className="max-h-24 list-inside list-disc space-y-1 overflow-auto text-sm text-amber-600">
                    {validation.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-warm-200">
                <div className="max-h-64 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-warm-100">
                      <tr>
                        {copy.columns.map((column) => (
                          <th
                            key={column}
                            className="px-3 py-2 text-left font-medium text-warmMuted"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100">
                      {members.map((member, idx) => (
                        <tr key={idx} className="hover:bg-warm-50">
                          <td className="px-3 py-2 text-warmMuted">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-warmText">
                            {member.nama || (
                              <span className="italic text-red-500">{copy.empty}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-warmMuted">
                            {member.generasi || "-"}
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
                            {member.pasangan || member.pasangan_ids || member.pasangan_nama || "-"}
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

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">⚠️ {copy.warningReplace}</p>
              </div>
            </div>
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 animate-spin text-4xl">⏳</div>
              <p className="text-lg font-medium text-warmText">{copy.importing}</p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-warm-200 px-6 py-4">
          <div className="flex justify-end gap-3">
            {step === "upload" && (
              <Button variant="secondary" onClick={handleClose}>
                {copy.cancel}
              </Button>
            )}

            {step === "preview" && (
              <>
                <Button variant="secondary" onClick={reset}>
                  ← {copy.back}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={!validation?.valid}
                >
                  {copy.importMembers(members.length)}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
