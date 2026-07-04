"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Clock3,
  Loader2,
  ShieldCheck,
  UserRoundCheck,
  X,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useLanguage } from "../providers/LanguageProvider";

type IncomingRequest = {
  id: string;
  treeName: string;
  requesterName: string;
  requesterEmail: string;
  requestedRole: "editor" | "viewer";
  confidence: number;
  matchReasons: string[];
  requesterSummary: {
    personName?: string;
    birthYear?: number | null;
    fatherName?: string | null;
    motherName?: string | null;
    hometown?: string | null;
    siblingCount?: number;
  };
  createdAt: string;
};

type OutgoingRequest = {
  id: string;
  treeName: string;
  ownerName: string;
  status: "pending" | "approved" | "rejected";
  confidence: number;
  createdAt: string;
};

type Payload = {
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onReviewed?: (message: string) => void;
};

function readError(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }
  return fallback;
}

export default function FamilyAccessInbox({
  isOpen,
  onClose,
  onReviewed,
}: Props) {
  const { locale } = useLanguage();
  const [payload, setPayload] = useState<Payload>({
    incoming: [],
    outgoing: [],
  });
  const [loading, setLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copy =
    locale === "id"
      ? {
          title: "Request Akses Keluarga",
          subtitle: "Review kandidat keluarga sebelum mereka masuk ke canvas.",
          empty: "Belum ada request akses baru.",
          outgoingTitle: "Request yang Anda kirim",
          approve: "Setujui",
          reject: "Tolak",
          approved: "Request disetujui",
          rejected: "Request ditolak",
          close: "Tutup",
          failedLoad: "Gagal memuat request akses.",
          failedReview: "Gagal memproses request.",
          confidence: (score: number) => `Skor ${score}`,
          requester: "Requester",
          profile: "Klaim keluarga",
          father: "Ayah",
          mother: "Ibu",
          origin: "Asal",
          siblings: "Saudara",
          pending: "Menunggu",
          approvedLabel: "Disetujui",
          rejectedLabel: "Ditolak",
        }
      : {
          title: "Family Access Requests",
          subtitle: "Review family candidates before they join the canvas.",
          empty: "No new access requests.",
          outgoingTitle: "Requests you sent",
          approve: "Approve",
          reject: "Reject",
          approved: "Request approved",
          rejected: "Request rejected",
          close: "Close",
          failedLoad: "Failed to load access requests.",
          failedReview: "Failed to review request.",
          confidence: (score: number) => `Score ${score}`,
          requester: "Requester",
          profile: "Family claim",
          father: "Father",
          mother: "Mother",
          origin: "Origin",
          siblings: "Siblings",
          pending: "Pending",
          approvedLabel: "Approved",
          rejectedLabel: "Rejected",
        };

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/family-access-requests", {
        cache: "no-store",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(readError(body, copy.failedLoad));
        return;
      }
      setPayload({
        incoming: Array.isArray(body.incoming) ? body.incoming : [],
        outgoing: Array.isArray(body.outgoing) ? body.outgoing : [],
      });
    } catch {
      setError(copy.failedLoad);
    } finally {
      setLoading(false);
    }
  }, [copy.failedLoad]);

  useEffect(() => {
    if (!isOpen) return;
    loadRequests();
  }, [isOpen, loadRequests]);

  if (!isOpen) return null;

  async function review(request: IncomingRequest, decision: "approved" | "rejected") {
    setReviewingId(request.id);
    setError(null);
    try {
      const response = await fetch(`/api/family-access-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, role: request.requestedRole }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(readError(body, copy.failedReview));
        return;
      }
      setPayload((current) => ({
        ...current,
        incoming: current.incoming.filter((item) => item.id !== request.id),
      }));
      onReviewed?.(decision === "approved" ? copy.approved : copy.rejected);
    } catch {
      setError(copy.failedReview);
    } finally {
      setReviewingId(null);
    }
  }

  function statusLabel(status: OutgoingRequest["status"]) {
    if (status === "approved") return copy.approvedLabel;
    if (status === "rejected") return copy.rejectedLabel;
    return copy.pending;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#fdfbf6] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#dccfb3] bg-[#faf6ed] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dccfb3] bg-white text-[#82693c]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-serif text-2xl text-[#3f342d]">{copy.title}</h2>
              <p className="mt-1 text-sm text-[#73685f]">{copy.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#73685f] transition hover:bg-[#ece2cc]"
            aria-label={copy.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[#dccfb3] bg-white p-5 text-sm text-[#73685f]">
              <Loader2 className="h-4 w-4 animate-spin text-[#82693c]" />
              {copy.title}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && payload.incoming.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#d6c3a2] bg-white/70 p-6 text-sm text-[#73685f]">
              {copy.empty}
            </div>
          )}

          {payload.incoming.map((request) => (
            <div key={request.id} className="rounded-xl border border-[#dccfb3] bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-xl text-[#3f342d]">
                      {request.requesterName}
                    </h3>
                    <span className="rounded-full bg-[#f5efe1] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#82693c]">
                      {copy.confidence(request.confidence)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#73685f]">
                    {copy.requester}: {request.requesterEmail}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#82693c]">
                    {request.treeName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={reviewingId === request.id}
                    onClick={() => review(request, "rejected")}
                    iconLeft={<X className="h-4 w-4" />}
                  >
                    {copy.reject}
                  </Button>
                  <Button
                    size="sm"
                    loading={reviewingId === request.id}
                    onClick={() => review(request, "approved")}
                    iconLeft={<Check className="h-4 w-4" />}
                  >
                    {copy.approve}
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-[#eadcc2] bg-[#fdfbf6] p-3 text-sm text-[#5b4a3c]">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#82693c]">
                    {copy.profile}
                  </p>
                  <div className="space-y-1 text-xs">
                    {request.requesterSummary.birthYear && (
                      <p>{request.requesterSummary.birthYear}</p>
                    )}
                    {request.requesterSummary.fatherName && (
                      <p>
                        {copy.father}: {request.requesterSummary.fatherName}
                      </p>
                    )}
                    {request.requesterSummary.motherName && (
                      <p>
                        {copy.mother}: {request.requesterSummary.motherName}
                      </p>
                    )}
                    {request.requesterSummary.hometown && (
                      <p>
                        {copy.origin}: {request.requesterSummary.hometown}
                      </p>
                    )}
                    {Boolean(request.requesterSummary.siblingCount) && (
                      <p>
                        {copy.siblings}: {request.requesterSummary.siblingCount}
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-[#eadcc2] bg-[#fdfbf6] p-3 text-sm text-[#5b4a3c]">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#82693c]">
                    Match
                  </p>
                  <div className="space-y-1">
                    {request.matchReasons.map((reason) => (
                      <p key={reason} className="flex items-center gap-2 text-xs">
                        <UserRoundCheck className="h-3.5 w-3.5 text-[#82693c]" />
                        {reason}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {payload.outgoing.length > 0 && (
            <div className="rounded-xl border border-[#dccfb3] bg-white p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-[#82693c]">
                {copy.outgoingTitle}
              </p>
              <div className="space-y-2">
                {payload.outgoing.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[#f8f1e4] px-3 py-2 text-sm text-[#5b4a3c]"
                  >
                    <span className="truncate">
                      {request.treeName} - {request.ownerName}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#82693c]">
                      <Clock3 className="h-3.5 w-3.5" />
                      {statusLabel(request.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[#dccfb3] bg-[#faf6ed] px-5 py-4">
          <Button variant="secondary" block onClick={onClose}>
            {copy.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
