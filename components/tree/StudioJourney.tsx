"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BookOpenCheck,
  Check,
  Download,
  FileText,
  HeartHandshake,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLanguage } from "../providers/LanguageProvider";

type Journey = {
  lead: { packageInterest: string; status: string } | null;
  myRole: "owner" | "editor" | "viewer";
  stageIndex: number;
  progress: { publishedStories: number; archivedMedia: number };
  deliverables: {
    id: string;
    kind: string;
    title: string;
    createdAt: string;
    readUrl: string;
  }[];
};

type Props = { isOpen: boolean; treeId: string; onClose: () => void };

export default function StudioJourney({ isOpen, treeId, onClose }: Props) {
  const { locale } = useLanguage();
  const dialogRef = useRef<HTMLElement>(null);
  const [data, setData] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const copy = locale === "id"
    ? {
        close: "Tutup perjalanan studio",
        eyebrow: "Lifestory Studio",
        title: "Perjalanan keluarga",
        lead: "Dari bahan mentah sampai warisan yang siap dibuka kembali.",
        loadError: "Perjalanan studio belum dapat dimuat.",
        stagesLabel: "Tahap proyek",
        stages: ["Konsultasi", "Kumpulkan bahan", "Produksi studio", "Review keluarga", "Penyerahan"],
        current: "Tahap saat ini",
        consultTitle: "Mulai dari konsultasi singkat",
        consultBody: "Kami bantu menentukan tokoh utama, bahan yang perlu dicari, dan bentuk warisan yang paling tepat.",
        consultCta: "Lihat paket studio",
        collection: "Koleksi saat ini",
        stories: "cerita diterbitkan",
        media: "media diarsipkan",
        outputs: "Hasil studio",
        emptyOutputs: "Buku, film, dan ilustrasi final akan muncul di sini saat siap diserahkan.",
        openOutput: "Buka hasil",
        promise: "Janji arsip Lifestory",
        access: "Akses keluarga dikelola per peran, bukan dibuka untuk publik.",
        approval: "Kontribusi keluarga menunggu persetujuan sebelum diterbitkan.",
        continuity: "Pohon dan arsip dapat terus diperbarui setelah penyerahan.",
      }
    : {
        close: "Close studio journey",
        eyebrow: "Lifestory Studio",
        title: "Your family journey",
        lead: "From raw material to a legacy worth reopening.",
        loadError: "The studio journey could not be loaded.",
        stagesLabel: "Project stage",
        stages: ["Consultation", "Collect materials", "Studio production", "Family review", "Delivery"],
        current: "Current stage",
        consultTitle: "Begin with a short consultation",
        consultBody: "We help choose the central person, materials to gather, and the right legacy format.",
        consultCta: "View studio packages",
        collection: "Current collection",
        stories: "published stories",
        media: "archived media",
        outputs: "Studio deliverables",
        emptyOutputs: "Final books, films, and illustrations will appear here when they are ready.",
        openOutput: "Open deliverable",
        promise: "The Lifestory archive promise",
        access: "Family access is role-based and never public by default.",
        approval: "Family contributions wait for approval before publication.",
        continuity: "The tree and archive remain maintainable after delivery.",
      };

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    setData(null);
    setLoading(true);
    setError("");
    dialogRef.current?.focus();

    fetch(`/api/trees/${encodeURIComponent(treeId)}/studio`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error || copy.loadError);
        setData(body);
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : copy.loadError);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      controller.abort();
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [copy.loadError, isOpen, onClose, treeId]);

  if (!isOpen) return null;
  const activeStage = Math.max(0, Math.min(copy.stages.length - 1, data?.stageIndex ?? 0));

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <button aria-label={copy.close} onClick={onClose} className="absolute inset-0 bg-ink-900/35 backdrop-blur-[2px]" />
      <aside
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-journey-title"
        className="relative flex h-full w-full max-w-[480px] flex-col bg-cream-50 shadow-deep ring-1 ring-ink-900/10 outline-none"
      >
        <header className="flex items-start justify-between border-b border-cream-300 bg-cream-100 px-5 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">{copy.eyebrow}</p>
            <h2 id="studio-journey-title" className="mt-1 font-serif text-2xl text-ink-900">{copy.title}</h2>
            <p className="mt-1 text-sm text-ink-500">{copy.lead}</p>
          </div>
          <button aria-label={copy.close} onClick={onClose} className="rounded-full p-2 text-ink-500 transition hover:bg-cream-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-7 overflow-y-auto p-5">
          {loading ? <div role="status" className="flex items-center gap-2 rounded-xl border border-cream-300 bg-white p-4 text-sm text-ink-600"><Loader2 className="h-4 w-4 animate-spin text-brand-700" />{locale === "id" ? "Memuat perjalanan studio..." : "Loading studio journey..."}</div> : null}
          {error ? <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p> : null}

          {!loading && !error ? <>
            <section aria-labelledby="studio-stages-label">
              <p id="studio-stages-label" className="text-xs font-bold uppercase tracking-[0.14em] text-ink-500">{copy.stagesLabel}</p>
              <ol className="mt-4 space-y-3">
                {copy.stages.map((stage, index) => (
                  <li key={stage} className="flex items-center gap-3">
                    <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${index <= activeStage ? "border-brand-700 bg-brand-700 text-white" : "border-cream-400 bg-cream-50 text-ink-500"}`}>
                      {index < activeStage ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <div><p className="text-sm font-bold text-ink-800">{stage}</p>{index === activeStage ? <p className="text-xs text-brand-700">{copy.current}</p> : null}</div>
                  </li>
                ))}
              </ol>
            </section>

            {!data?.lead ? (
              <section className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
                <div className="flex gap-3"><HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" /><div><h3 className="font-bold text-ink-800">{copy.consultTitle}</h3><p className="mt-1 text-sm leading-6 text-ink-600">{copy.consultBody}</p><Link href="/subscribe" className="mt-3 inline-flex rounded-full bg-brand-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">{copy.consultCta}</Link></div></div>
              </section>
            ) : (
              <section className="rounded-2xl border border-cream-300 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-500">{copy.collection}</p>
                <div className="mt-3 grid grid-cols-2 gap-3"><div><p className="font-serif text-3xl text-ink-900">{data.progress.publishedStories}</p><p className="text-xs text-ink-500">{copy.stories}</p></div><div><p className="font-serif text-3xl text-ink-900">{data.progress.archivedMedia}</p><p className="text-xs text-ink-500">{copy.media}</p></div></div>
              </section>
            )}

            <section>
              <div className="flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-brand-700" /><h3 className="text-sm font-bold text-ink-800">{copy.outputs}</h3></div>
              {data?.deliverables.length ? <div className="mt-3 space-y-2">{data.deliverables.map((item) => <a key={item.id} href={item.readUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-cream-300 bg-white p-3 transition hover:border-brand-300 hover:bg-cream-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"><FileText className="h-4 w-4 shrink-0 text-brand-700" /><p className="min-w-0 flex-1 truncate text-sm font-bold text-ink-800">{item.title}</p><span className="sr-only">{copy.openOutput}</span><Download className="h-4 w-4 shrink-0 text-ink-500" /></a>)}</div> : <p className="mt-3 rounded-xl border border-dashed border-cream-400 p-4 text-sm text-ink-500">{copy.emptyOutputs}</p>}
            </section>

            <section className="border-t border-cream-300 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-500">{copy.promise}</p>
              <div className="mt-3 space-y-3 text-sm text-ink-700"><p className="flex gap-2"><LockKeyhole className="h-4 w-4 shrink-0 text-brand-700" />{copy.access}</p><p className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-brand-700" />{copy.approval}</p><p className="flex gap-2"><BookOpenCheck className="h-4 w-4 shrink-0 text-brand-700" />{copy.continuity}</p></div>
            </section>
          </> : null}
        </div>
      </aside>
    </div>
  );
}
