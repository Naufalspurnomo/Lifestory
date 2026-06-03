"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Clock } from "lucide-react";
import type {
  ConflictInfo,
  ConflictResolution,
} from "../../lib/sync/types";

type Props = {
  conflicts: ConflictInfo[];
  onResolve: (resolutions: ConflictResolution[]) => void;
  onDismiss?: () => void;
  timeoutMinutes?: number;
};

const FIELD_LABELS: Record<string, string> = {
  label: "Name",
  sex: "Gender",
  year: "Birth Year",
  deathYear: "Death Year",
  parentId: "Primary Parent",
  parentIds: "Parents",
  adoptiveParentIds: "Adoptive Parents",
  partners: "Partners",
  childrenIds: "Children",
  generation: "Generation",
  line: "Family Line",
  imageUrl: "Photo",
  content: "Biography",
  works: "Works",
  __node__: "Person record",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.join(", ");
  }
  if (typeof value === "object") {
    const desc = (value as Record<string, unknown>).description;
    if (typeof desc === "string") return desc.slice(0, 80) + (desc.length > 80 ? "…" : "");
    return JSON.stringify(value).slice(0, 80) + "…";
  }
  return String(value);
}

export default function ConflictResolutionModal({
  conflicts,
  onResolve,
  onDismiss,
  timeoutMinutes = 5,
}: Props) {
  const [choices, setChoices] = useState<Map<string, "local" | "server">>(
    new Map()
  );
  const [secondsLeft, setSecondsLeft] = useState(timeoutMinutes * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const conflictKey = (c: ConflictInfo) => `${c.nodeId}:${c.field}`;

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-dismiss on timeout
  useEffect(() => {
    if (secondsLeft === 0 && onDismiss) {
      onDismiss();
    }
  }, [secondsLeft, onDismiss]);

  const allResolved = conflicts.every((c) => choices.has(conflictKey(c)));

  const handleChoice = useCallback(
    (conflict: ConflictInfo, source: "local" | "server") => {
      setChoices((prev) => {
        const next = new Map(prev);
        next.set(conflictKey(conflict), source);
        return next;
      });
    },
    []
  );

  const handleSubmit = useCallback(() => {
    const resolutions: ConflictResolution[] = conflicts.map((conflict) => {
      const source = choices.get(conflictKey(conflict)) ?? "server";
      return {
        nodeId: conflict.nodeId,
        field: conflict.field,
        chosenValue:
          source === "local" ? conflict.localValue : conflict.serverValue,
        source,
      };
    });
    onResolve(resolutions);
  }, [conflicts, choices, onResolve]);

  const handleKeepAll = useCallback(
    (source: "local" | "server") => {
      const next = new Map<string, "local" | "server">();
      conflicts.forEach((c) => next.set(conflictKey(c), source));
      setChoices(next);
    },
    [conflicts]
  );

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const isUrgent = secondsLeft < 60;

  // Group conflicts by nodeId
  const grouped = conflicts.reduce<Record<string, ConflictInfo[]>>(
    (acc, conflict) => {
      if (!acc[conflict.nodeId]) acc[conflict.nodeId] = [];
      acc[conflict.nodeId].push(conflict);
      return acc;
    },
    {}
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-[#d4af37]/60 bg-[#0f0f14] shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d4af37]/30 bg-black/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-playfair text-lg font-bold text-white">
                Resolve Conflicts
              </h2>
              <p className="text-xs text-[#94a3b8]">
                {conflicts.length} field{conflicts.length !== 1 ? "s" : ""}{" "}
                changed on another device
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isUrgent
                ? "bg-red-500/20 text-red-300 animate-pulse"
                : "bg-white/10 text-[#94a3b8]"
            }`}
          >
            <Clock className="h-3 w-3" />
            {timeDisplay}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 border-b border-white/5 px-6 py-3">
          <span className="text-xs text-[#7b6f63]">Quick:</span>
          <button
            onClick={() => handleKeepAll("local")}
            className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-300 hover:bg-blue-500/20 transition-colors"
          >
            Keep all mine
          </button>
          <button
            onClick={() => handleKeepAll("server")}
            className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
          >
            Keep all theirs
          </button>
        </div>

        {/* Conflict list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {Object.entries(grouped).map(([nodeId, nodeConflicts]) => (
            <div key={nodeId} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                Node: {nodeId.slice(0, 8)}…
              </h3>
              {nodeConflicts.map((conflict) => {
                const key = conflictKey(conflict);
                const choice = choices.get(key);
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="mb-3 text-sm font-semibold text-white">
                      {FIELD_LABELS[conflict.field] ?? conflict.field}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Local version */}
                      <button
                        onClick={() => handleChoice(conflict, "local")}
                        className={`relative rounded-lg border p-3 text-left transition-all ${
                          choice === "local"
                            ? "border-blue-400 bg-blue-500/10 ring-1 ring-blue-400/50"
                            : "border-white/10 hover:border-white/30 hover:bg-white/5"
                        }`}
                      >
                        {choice === "local" && (
                          <Check className="absolute right-2 top-2 h-4 w-4 text-blue-400" />
                        )}
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-blue-300">
                          Your version
                        </span>
                        <span className="block text-xs text-white/80 break-words">
                          {formatValue(conflict.localValue)}
                        </span>
                      </button>
                      {/* Server version */}
                      <button
                        onClick={() => handleChoice(conflict, "server")}
                        className={`relative rounded-lg border p-3 text-left transition-all ${
                          choice === "server"
                            ? "border-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-400/50"
                            : "border-white/10 hover:border-white/30 hover:bg-white/5"
                        }`}
                      >
                        {choice === "server" && (
                          <Check className="absolute right-2 top-2 h-4 w-4 text-emerald-400" />
                        )}
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          Server version
                        </span>
                        <span className="block text-xs text-white/80 break-words">
                          {formatValue(conflict.serverValue)}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-black/40 px-6 py-4">
          <p className="text-xs text-[#7b6f63]">
            {choices.size}/{conflicts.length} resolved
          </p>
          <div className="flex items-center gap-3">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white/70 hover:bg-white/10 transition-colors"
              >
                Decide Later
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!allResolved}
              className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-wide transition-all ${
                allResolved
                  ? "bg-gradient-to-r from-[#d4af37] to-[#aa8323] text-black shadow-[0_0_12px_rgba(212,175,55,0.4)] hover:scale-105"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              Apply Resolution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
