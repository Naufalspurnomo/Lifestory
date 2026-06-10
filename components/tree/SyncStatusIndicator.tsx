"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CloudOff,
  Clock3,
  RefreshCw,
} from "lucide-react";
import type { SyncStatusInfo } from "../../lib/sync/types";

type Props = {
  status: SyncStatusInfo;
  onRetry?: () => void;
};

const LABELS = {
  saved: "Saved",
  syncing: "Saving now",
  pending: "Queued",
  offline: "Saved locally",
  error: "Needs attention",
};

export default function SyncStatusIndicator({ status, onRetry }: Props) {
  const isError = status.status === "error";
  const canRetry = isError;
  const message =
    status.errorMessage ??
    (status.status === "offline"
      ? "Changes are safe in this browser and will sync automatically when the connection returns."
      : status.status === "pending"
      ? "Changes are saved locally and queued for sync."
      : status.status === "syncing"
      ? "Saving changes to the server now."
      : status.warningMessage);

  const iconClass = "h-3.5 w-3.5";
  const icon =
    status.status === "saved" ? (
      <CheckCircle2 className={iconClass} />
    ) : status.status === "syncing" ? (
      <RefreshCw className={`${iconClass} animate-spin`} />
    ) : status.status === "offline" ? (
      <CloudOff className={iconClass} />
    ) : status.status === "error" ? (
      <AlertTriangle className={iconClass} />
    ) : (
      <Clock3 className={iconClass} />
    );

  return (
    <div
      className={`flex max-w-[min(360px,calc(100vw-2rem))] items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-md ${
        isError
          ? "border-red-300/60 bg-red-950/70 text-red-100"
          : status.status === "saved"
          ? "border-emerald-300/50 bg-emerald-950/55 text-emerald-100"
          : "border-[#82693c]/45 bg-black/45 text-[#e8d5b5]"
      }`}
      aria-live="polite"
      title={message}
    >
      {icon}
      <span>{LABELS[status.status]}</span>
      {status.pendingCount > 0 && (
        <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]">
          {status.pendingDisplay}
        </span>
      )}
      {message && (
        <span className="hidden max-w-[180px] truncate text-[10px] font-semibold opacity-80 md:inline">
          {message}
        </span>
      )}
      {canRetry && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-1 rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide hover:bg-white/10"
        >
          Retry now
        </button>
      )}
    </div>
  );
}
