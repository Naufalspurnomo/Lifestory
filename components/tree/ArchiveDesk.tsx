"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookHeart, Check, ClipboardCheck, Copy, MessageCircle, PenLine, Send, X } from "lucide-react";
import type { FamilyNode } from "../../lib/types/tree";
import { starterContributionPrompts } from "../../lib/contributions";
import { getArchiveMissions } from "../../lib/archive/missions";
import { toast } from "sonner";

type Request = { id: string; prompt: string; status: string; expiresAt: string; targetPerson?: { id: string; label: string } | null; proposal?: { id: string; status: string } | null };
type Proposal = { id: string; status: string; payload: { text?: string; contributorName?: string; relationshipToFamily?: string }; request?: Request | null };

type Props = {
  isOpen: boolean;
  treeId: string;
  nodes: FamilyNode[];
  targetNode?: FamilyNode | null;
  onClose: () => void;
  onFocus: (id: string) => void;
  onEdit: (node: FamilyNode) => void;
  onPublished: () => void;
};

async function readJson(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || "Arsip belum dapat diperbarui.");
  return body;
}

export default function ArchiveDesk({ isOpen, treeId, nodes, targetNode, onClose, onFocus, onEdit, onPublished }: Props) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [prompt, setPrompt] = useState("");
  const [selectedNode, setSelectedNode] = useState<FamilyNode | null>(targetNode || null);
  const [share, setShare] = useState<{ text: string; url: string } | null>(null);
  const [reviewing, setReviewing] = useState<Proposal | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [requestResult, proposalResult] = await Promise.all([
        fetch(`/api/trees/${encodeURIComponent(treeId)}/contribution-requests`).then(readJson),
        fetch(`/api/trees/${encodeURIComponent(treeId)}/proposals`).then(readJson),
      ]);
      setRequests(requestResult.requests || []);
      setProposals(proposalResult.proposals || []);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Arsip belum dapat dimuat."); }
  }, [treeId]);

  useEffect(() => { if (isOpen) void refresh(); }, [isOpen, refresh]);
  useEffect(() => { if (targetNode) setSelectedNode(targetNode); }, [targetNode]);

  const pending = proposals.filter((item) => item.status === "pending");
  const missions = useMemo(() => getArchiveMissions(nodes, pending.length), [nodes, pending.length]);

  async function createRequest() {
    if (!prompt.trim()) return;
    setBusy(true); setError("");
    try {
      const result = await fetch(`/api/trees/${encodeURIComponent(treeId)}/contribution-requests`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), targetPersonId: selectedNode?.id || null }),
      }).then(readJson);
      setShare({ text: result.whatsappText, url: result.contributionUrl });
      setPrompt("");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Tautan belum dibuat."); }
    finally { setBusy(false); }
  }

  async function reject(proposal: Proposal) {
    setBusy(true); setError("");
    try {
      await fetch(`/api/trees/${encodeURIComponent(treeId)}/proposals/${encodeURIComponent(proposal.id)}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision: "rejected" }) }).then(readJson);
      await refresh();
      toast.success("Kontribusi ditolak.", { id: "archive-rejected" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Kontribusi belum ditolak."); }
    finally { setBusy(false); }
  }

  function openReview(proposal: Proposal) {
    setReviewing(proposal);
    setBody(proposal.payload?.text || "");
    setTitle(proposal.request?.targetPerson?.label ? `Kenangan tentang ${proposal.request.targetPerson.label}` : "Satu kenangan keluarga");
  }

  async function publish() {
    if (!reviewing || !title.trim() || !body.trim()) return;
    setBusy(true); setError("");
    try {
      await fetch(`/api/trees/${encodeURIComponent(treeId)}/proposals/${encodeURIComponent(reviewing.id)}/publish`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), visibility: "tree", personIds: reviewing.request?.targetPerson?.id ? [reviewing.request.targetPerson.id] : [] }),
      }).then(readJson);
      setReviewing(null); await refresh(); onPublished();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Cerita belum diterbitkan."); }
    finally { setBusy(false); }
  }

  if (!isOpen) return null;
  const selectMission = (mission: ReturnType<typeof getArchiveMissions>[number]) => {
    if (mission.kind === "proposal") return document.getElementById("archive-inbox")?.scrollIntoView({ behavior: "smooth" });
    const node = nodes.find((item) => item.id === mission.nodeId);
    if (!node) return;
    setSelectedNode(node);
    if (mission.kind === "story") { setPrompt(`Apa kenangan yang paling Anda ingat tentang ${node.label}?`); }
    else { onFocus(node.id); onEdit(node); }
  };

  async function copyWhatsAppMessage() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.text);
      toast.success("Pesan WhatsApp disalin.", { id: "archive-whatsapp-copy" });
    } catch {
      toast.error("Pesan WhatsApp belum dapat disalin.", {
        id: "archive-whatsapp-copy",
        duration: 7000,
      });
    }
  }

  return <div className="fixed inset-0 z-[90] flex justify-end">
    <button aria-label="Tutup meja arsip" onClick={onClose} className="absolute inset-0 bg-ink-900/35 backdrop-blur-[2px]" />
    <aside role="dialog" aria-modal="true" aria-label="Misi Arsip" className="relative flex h-full w-full max-w-[480px] flex-col bg-cream-50 shadow-deep ring-1 ring-ink-900/10">
      <header className="flex items-start justify-between border-b border-cream-300 bg-cream-100 px-5 py-5">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">Kurator keluarga</p><h2 className="mt-1 font-serif text-2xl text-ink-900">Misi Arsip</h2><p className="mt-1 text-sm text-ink-500">Satu langkah kecil agar cerita keluarga tidak hilang.</p></div>
        <button onClick={onClose} className="rounded-full p-2 text-ink-500 hover:bg-cream-200"><X className="h-5 w-5" /></button>
      </header>
      <div className="flex-1 space-y-7 overflow-y-auto p-5">
        {error && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}
        <section><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-ink-500"><ClipboardCheck className="h-4 w-4 text-brand-700" /> Prioritas hari ini</div>
          <div className="space-y-2">{missions.length ? missions.map((mission) => <button key={mission.id} onClick={() => selectMission(mission)} className="w-full rounded-xl border border-cream-300 bg-cream-50 p-4 text-left transition hover:border-brand-400 hover:bg-cream-100"><p className="text-sm font-bold text-ink-800">{mission.title}</p><p className="mt-1 text-xs leading-5 text-ink-500">{mission.body}</p></button>) : <p className="rounded-xl border border-cream-300 bg-cream-100 p-4 text-sm text-ink-600">Arsip inti sudah rapi. Anda bisa tetap meminta kenangan baru kapan saja.</p>}</div>
        </section>
        <section className="border-t border-cream-300 pt-6"><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-brand-700"/><h3 className="text-sm font-bold text-ink-800">Minta satu kenangan</h3></div>
          <p className="mt-1 text-xs leading-5 text-ink-500">Kirim satu pertanyaan yang mudah dijawab lewat WhatsApp.</p>
          <select value={selectedNode?.id || ""} onChange={(event) => setSelectedNode(nodes.find((node) => node.id === event.target.value) || null)} className="mt-3 w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm text-ink-800"><option value="">Tentang keluarga secara umum</option>{nodes.filter((node) => !(node as FamilyNode & { isPlaceholder?: boolean }).isPlaceholder).map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}</select>
          <select onChange={(event) => event.target.value && setPrompt(event.target.value)} defaultValue="" className="mt-2 w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm text-ink-700"><option value="">Pilih pertanyaan arsip…</option>{starterContributionPrompts.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Tulis pertanyaan yang ingin Anda titipkan…" rows={4} maxLength={500} className="mt-2 w-full rounded-xl border border-cream-300 bg-white px-3 py-3 text-sm leading-6 text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
          <button disabled={busy || !prompt.trim()} onClick={() => void createRequest()} className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-4 text-sm font-bold text-white shadow-cta transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /> Buat tautan WhatsApp</button>
          {share && <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3"><p className="text-xs leading-5 text-ink-700">Tautan siap dibagikan. Kontribusi akan menunggu persetujuan Anda.</p><button onClick={() => void copyWhatsAppMessage()} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand-800"><Copy className="h-3.5 w-3.5" /> Salin pesan WhatsApp</button></div>}
        </section>
        <section id="archive-inbox" className="border-t border-cream-300 pt-6"><div className="flex items-center gap-2"><BookHeart className="h-4 w-4 text-brand-700"/><h3 className="text-sm font-bold text-ink-800">Kotak masuk kenangan</h3>{pending.length ? <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-bold text-white">{pending.length}</span> : null}</div>
          <div className="mt-3 space-y-3">{pending.length ? pending.map((proposal) => <article key={proposal.id} className="rounded-xl border border-cream-300 bg-white p-4"><p className="text-xs leading-5 text-ink-500">{proposal.request?.prompt}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-800">{proposal.payload?.text}</p>{proposal.payload?.contributorName && <p className="mt-3 text-xs font-bold text-brand-800">{proposal.payload.contributorName}{proposal.payload.relationshipToFamily ? ` · ${proposal.payload.relationshipToFamily}` : ""}</p>}<div className="mt-4 flex gap-2"><button disabled={busy} onClick={() => openReview(proposal)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-700 px-3 text-xs font-bold text-white"><PenLine className="h-3.5 w-3.5" /> Tinjau & terbitkan</button><button disabled={busy} onClick={() => void reject(proposal)} className="h-9 rounded-full border border-cream-400 px-3 text-xs font-bold text-ink-600 hover:bg-cream-100">Tolak</button></div></article>) : <p className="rounded-xl border border-dashed border-cream-400 p-4 text-sm text-ink-500">Belum ada kenangan yang menunggu ditinjau.</p>}</div>
          {requests.filter((request) => request.status === "open").length > 0 && <p className="mt-3 text-xs text-ink-500">{requests.filter((request) => request.status === "open").length} permintaan masih menunggu jawaban keluarga.</p>}
        </section>
      </div>
    </aside>
    {reviewing && <div className="absolute inset-0 z-10 flex items-end justify-center bg-ink-900/35 p-3 sm:items-center"><section role="dialog" aria-modal="true" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-cream-50 p-5 shadow-deep"><div className="flex justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">Tinjau arsip</p><h3 className="font-serif text-2xl text-ink-900">Terbitkan kenangan</h3></div><button onClick={() => setReviewing(null)} className="p-2 text-ink-500"><X className="h-5 w-5" /></button></div><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} className="mt-5 w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm font-bold text-ink-800" placeholder="Judul cerita" /><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={10} maxLength={20000} className="mt-3 w-full rounded-xl border border-cream-300 bg-white px-3 py-3 text-sm leading-6 text-ink-800" placeholder="Isi cerita" /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setReviewing(null)} className="h-10 rounded-full px-4 text-sm font-bold text-ink-600">Batal</button><button disabled={busy || !title.trim() || !body.trim()} onClick={() => void publish()} className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-700 px-5 text-sm font-bold text-white disabled:opacity-50"><Check className="h-4 w-4" /> Terbitkan ke arsip</button></div></section></div>}
  </div>;
}
