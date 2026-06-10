"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Upload, FileWarning, Check, AlertCircle } from "lucide-react";
import {
  downloadTreeJson,
  parseImportText,
} from "../../lib/sync/ExportManager";
import type {
  FamilyNode,
  ImportValidation,
  TreeData,
} from "../../lib/sync/types";

type Props = {
  /** Current tree data for export */
  tree: TreeData | null;
  /** Existing nodes in the tree (for duplicate ID detection) */
  existingNodes?: FamilyNode[];
  /** Called when import is validated and user confirms */
  onImport: (nodes: FamilyNode[], mode: "merge" | "replace") => void;
  /** Called when export completes */
  onExportComplete?: () => void;
  /** Called on export error */
  onExportError?: (error: string) => void;
  /** Whether the app is currently offline */
  isOffline?: boolean;
};

type ImportState =
  | { step: "idle" }
  | { step: "validating" }
  | { step: "error"; validation: ImportValidation }
  | { step: "duplicates"; duplicateIds: string[]; nodes: FamilyNode[] }
  | { step: "success"; count: number };

export default function ExportImportControls({
  tree,
  existingNodes = [],
  onImport,
  onExportComplete,
  onExportError,
  isOffline = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>({ step: "idle" });

  const handleExport = useCallback(() => {
    if (!tree || tree.nodes.length === 0) {
      onExportError?.("No data to export");
      return;
    }
    try {
      downloadTreeJson(tree);
      onExportComplete?.();
    } catch (error) {
      onExportError?.(
        error instanceof Error ? error.message : "Export failed"
      );
    }
  }, [tree, onExportComplete, onExportError]);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Reset input so same file can be re-selected
      event.target.value = "";

      if (file.size > 50 * 1024 * 1024) {
        setImportState({
          step: "error",
          validation: {
            valid: false,
            errors: ["File exceeds the 50 MB import limit"],
          },
        });
        return;
      }

      setImportState({ step: "validating" });

      try {
        const text = await file.text();
        const { data, validation } = parseImportText(text, existingNodes);

        if (!validation.valid || !data) {
          setImportState({ step: "error", validation });
          return;
        }

        if (
          validation.duplicateIds &&
          validation.duplicateIds.length > 0
        ) {
          setImportState({
            step: "duplicates",
            duplicateIds: validation.duplicateIds,
            nodes: data.tree.nodes,
          });
          return;
        }

        // No conflicts â€” import directly
        onImport(data.tree.nodes, "replace");
        setImportState({ step: "success", count: data.tree.nodes.length });
        setTimeout(() => setImportState({ step: "idle" }), 3000);
      } catch {
        setImportState({
          step: "error",
          validation: { valid: false, errors: ["Failed to read file"] },
        });
      }
    },
    [existingNodes, onImport]
  );

  const handleDuplicateChoice = useCallback(
    (mode: "merge" | "replace") => {
      if (importState.step !== "duplicates") return;
      onImport(importState.nodes, mode);
      setImportState({ step: "success", count: importState.nodes.length });
      setTimeout(() => setImportState({ step: "idle" }), 3000);
    },
    [importState, onImport]
  );

  return (
    <div className="relative">
      {/* Trigger buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#e8d5b5] hover:bg-white/10 transition-colors"
          title={isOffline ? "Export from local data" : "Export tree as JSON"}
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#e8d5b5] hover:bg-white/10 transition-colors"
          title="Import tree from JSON"
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Import</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Import feedback overlay */}
      {importState.step !== "idle" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-[#82693c]/40 bg-[#0f0f14] shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
            {/* Validating */}
            {importState.step === "validating" && (
              <div className="flex flex-col items-center gap-4 p-8">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#82693c] border-t-transparent" />
                <p className="text-sm font-bold text-white">
                  Validating import fileâ€¦
                </p>
              </div>
            )}

            {/* Error */}
            {importState.step === "error" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                    <FileWarning className="h-5 w-5 text-red-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Import Failed
                  </h3>
                </div>
                <ul className="space-y-1.5 pl-1">
                  {importState.validation.errors.map((err, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-red-300"
                    >
                      <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                      {err}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setImportState({ step: "idle" })}
                  className="w-full rounded-full border border-white/20 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {/* Duplicate IDs â€” ask merge or replace */}
            {importState.step === "duplicates" && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Duplicate Members Found
                    </h3>
                    <p className="text-xs text-[#94a3b8]">
                      {importState.duplicateIds.length} node
                      {importState.duplicateIds.length !== 1 ? "s" : ""} already
                      exist in your tree
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-[#c7b289]">
                  The imported file contains members that already exist. How
                  would you like to proceed?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDuplicateChoice("merge")}
                    className="flex-1 rounded-full border border-blue-400/30 bg-blue-500/10 py-2.5 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition-colors"
                  >
                    Merge
                  </button>
                  <button
                    onClick={() => handleDuplicateChoice("replace")}
                    className="flex-1 rounded-full border border-amber-400/30 bg-amber-500/10 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors"
                  >
                    Replace All
                  </button>
                </div>
                <button
                  onClick={() => setImportState({ step: "idle" })}
                  className="w-full rounded-full border border-white/10 py-2 text-xs font-bold text-white/50 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Success */}
            {importState.step === "success" && (
              <div className="flex flex-col items-center gap-4 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                  <Check className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm font-bold text-white">
                  {importState.count} member
                  {importState.count !== 1 ? "s" : ""} imported successfully
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
