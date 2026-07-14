"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useLanguage } from "../providers/LanguageProvider";
import { toast } from "sonner";

type Candidate = {
  familyIdentityId: string;
  treeId: string;
  displayName: string;
  maskedOwnerName: string;
  memberCount: number;
  confidence: number;
  confidenceLabel: "medium" | "high";
  matchReasons: string[];
  requestStatus: "none" | "pending" | "approved" | "rejected";
};

type Props = {
  userName: string;
  onStart: (initialMember: { label: string; year: number | null }) => Promise<boolean>;
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

export default function FamilyDiscoveryGate({ userName, onStart }: Props) {
  const { locale } = useLanguage();
  const [personName, setPersonName] = useState(userName);
  const [birthYear, setBirthYear] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [hometown, setHometown] = useState("");
  const [siblings, setSiblings] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [starting, setStarting] = useState(false);
  const [stage, setStage] = useState<"discovery" | "first-member">("discovery");
  const [firstMemberName, setFirstMemberName] = useState(userName);
  const [firstMemberYear, setFirstMemberYear] = useState("");
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const copy = useMemo(
    () =>
      locale === "id"
        ? {
            badge: "Verifikasi keluarga",
            title: "Cek dulu apakah keluarga Anda sudah ada",
            subtitle:
              "Isi beberapa penanda keluarga. Lifestory hanya menampilkan kandidat aman dan akses tetap menunggu persetujuan owner.",
            personName: "Nama Anda",
            birthYear: "Tahun lahir",
            fatherName: "Nama ayah",
            motherName: "Nama ibu",
            hometown: "Asal keluarga",
            siblings: "Nama saudara kandung",
            siblingsHint: "Pisahkan dengan koma atau baris baru",
            consent:
              "Saya setuju data ini dipakai untuk pencocokan keluarga di Lifestory.",
            search: "Cari keluarga saya",
            searching: "Mencari...",
            continueNew: "Buat pohon baru",
            startAnyway: "Lewati dan buat pohon baru",
            savedMatches: "Kandidat dari pencarian terakhir",
            noMatch:
              "Belum ada kandidat kuat. Anda tetap bisa membuat pohon baru.",
            request: "Minta akses",
            pending: "Menunggu owner",
            approved: "Sudah disetujui",
            rejected: "Ditolak",
            medium: "Cocok sedang",
            high: "Cocok kuat",
            members: (count: number) => `${count} anggota`,
            owner: (name: string) => `Owner ${name}`,
            failedLoad:
              "Pencarian keluarga belum bisa dimuat. Anda tetap bisa membuat pohon baru.",
            failedSearch:
              "Pencarian keluarga belum bisa diproses. Coba lagi atau buat pohon baru.",
            failedRequest: "Request akses belum terkirim.",
            requestSent: "Permintaan akses dikirim kepada pemilik keluarga.",
            firstMemberLabel: "Anggota pertama",
            firstMemberTitle: "Mulai dari satu catatan keluarga",
            firstMemberSubtitle:
              "Simpan data inti Anda terlebih dahulu. Setelah itu, pohon keluarga akan dibuat dari catatan ini.",
            firstMemberName: "Nama lengkap",
            firstMemberNamePlaceholder: "Nama anggota pertama",
            firstMemberYear: "Tahun lahir",
            firstMemberYearHint: "Opsional",
            createFirstMember: "Simpan dan buat pohon",
            creatingFirstMember: "Menyimpan pohon...",
            backToDiscovery: "Kembali ke verifikasi",
            failedStart:
              "Pohon belum bisa dibuat. Periksa koneksi lalu coba lagi.",
          }
        : {
            badge: "Family verification",
            title: "Check whether your family already exists",
            subtitle:
              "Enter a few family markers. Lifestory only shows safe candidates and access still requires owner approval.",
            personName: "Your name",
            birthYear: "Birth year",
            fatherName: "Father name",
            motherName: "Mother name",
            hometown: "Family origin",
            siblings: "Sibling names",
            siblingsHint: "Separate by comma or line break",
            consent:
              "I agree to use this data for family matching in Lifestory.",
            search: "Find my family",
            searching: "Searching...",
            continueNew: "Create new tree",
            startAnyway: "Skip and create new tree",
            savedMatches: "Candidates from your last search",
            noMatch: "No strong candidate yet. You can still create a new tree.",
            request: "Request access",
            pending: "Waiting for owner",
            approved: "Approved",
            rejected: "Rejected",
            medium: "Medium match",
            high: "Strong match",
            members: (count: number) => `${count} members`,
            owner: (name: string) => `Owner ${name}`,
            failedLoad:
              "Family discovery is unavailable. You can still create a new tree.",
            failedSearch:
              "Family discovery could not run. Try again or create a new tree.",
            failedRequest: "Access request was not sent.",
            requestSent: "Your access request was sent to the family owner.",
            firstMemberLabel: "First family record",
            firstMemberTitle: "Begin with one family record",
            firstMemberSubtitle:
              "Save your core details first. Your family tree will be created from this record.",
            firstMemberName: "Full name",
            firstMemberNamePlaceholder: "First family member's name",
            firstMemberYear: "Birth year",
            firstMemberYearHint: "Optional",
            createFirstMember: "Save and create tree",
            creatingFirstMember: "Saving tree...",
            backToDiscovery: "Back to verification",
            failedStart:
              "The tree could not be created. Check your connection and try again.",
          },
    [locale]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadSavedCandidates() {
      setLoadingSaved(true);
      try {
        const response = await fetch("/api/family-discovery/candidates", {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (!cancelled) setError(readError(payload, copy.failedLoad));
          return;
        }
        if (!cancelled) {
          setCandidates(Array.isArray(payload.candidates) ? payload.candidates : []);
          setHasSearched(Array.isArray(payload.candidates) && payload.candidates.length > 0);
        }
      } catch {
        if (!cancelled) setError(copy.failedLoad);
      } finally {
        if (!cancelled) setLoadingSaved(false);
      }
    }
    loadSavedCandidates();
    return () => {
      cancelled = true;
    };
  }, [copy.failedLoad]);

  function buildPayload() {
    return {
      personName,
      birthYear: birthYear.trim() ? Number(birthYear) : null,
      fatherName,
      motherName,
      hometown,
      siblingNames: siblings
        .split(/[,\n]/)
        .map((name) => name.trim())
        .filter(Boolean),
      consentAccepted,
    };
  }

  async function submitDiscovery(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const response = await fetch("/api/family-discovery/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(readError(payload, copy.failedSearch));
        return;
      }
      setCandidates(Array.isArray(payload.candidates) ? payload.candidates : []);
    } catch {
      setError(copy.failedSearch);
    } finally {
      setLoading(false);
    }
  }

  async function requestAccess(candidate: Candidate) {
    setRequestingId(candidate.familyIdentityId);
    setError(null);
    try {
      const response = await fetch("/api/family-access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyIdentityId: candidate.familyIdentityId,
          treeId: candidate.treeId,
          requestedRole: "editor",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(readError(payload, copy.failedRequest));
        return;
      }
      setCandidates((current) =>
        current.map((item) =>
          item.familyIdentityId === candidate.familyIdentityId
            ? { ...item, requestStatus: "pending" }
            : item
        )
      );
      toast.success(copy.requestSent, { id: "family-access-request" });
    } catch {
      setError(copy.failedRequest);
    } finally {
      setRequestingId(null);
    }
  }

  function startNewTree() {
    setError(null);
    setFirstMemberName(personName.trim() || userName);
    setFirstMemberYear(birthYear);
    setStage("first-member");
  }

  async function submitFirstMember(event: React.FormEvent) {
    event.preventDefault();
    setStarting(true);
    setError(null);
    try {
      const parsedYear = firstMemberYear.trim()
        ? Number(firstMemberYear)
        : null;
      const created = await onStart({
        label: firstMemberName.trim(),
        year: parsedYear,
      });
      if (!created) setError(copy.failedStart);
    } catch {
      setError(copy.failedStart);
    } finally {
      setStarting(false);
    }
  }

  if (stage === "first-member") {
    return (
      <div className="min-h-screen bg-[#faf6ed] px-4 py-8 text-[#3f342d] sm:px-6 lg:px-8">
        <main className="mx-auto max-w-xl">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStage("discovery");
            }}
            className="mb-6 inline-flex items-center gap-2 rounded-lg px-1 py-2 text-sm font-bold text-[#5a4d42] transition hover:text-[#3f342d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82693c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf6ed]"
          >
            <ArrowLeft className="h-4 w-4" />
            {copy.backToDiscovery}
          </button>

          <section className="border border-[#dccfb3] bg-[#fdfbf6] p-5 shadow-[0_18px_36px_rgba(59,43,24,0.08)] sm:p-7">
            <div className="mb-7 flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dccfb3] bg-[#f5efe1] text-[#82693c]">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#82693c]">
                  {copy.firstMemberLabel}
                </p>
                <h1 className="mt-1 font-serif text-3xl leading-tight text-[#3f342d] sm:text-4xl">
                  {copy.firstMemberTitle}
                </h1>
                <p className="mt-2 max-w-lg text-sm leading-6 text-[#73685f]">
                  {copy.firstMemberSubtitle}
                </p>
              </div>
            </div>

            <form onSubmit={submitFirstMember} className="space-y-5">
              <label className="block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wide text-[#6c5c4d]">
                  {copy.firstMemberName}
                </span>
                <input
                  required
                  value={firstMemberName}
                  onChange={(event) => setFirstMemberName(event.target.value)}
                  placeholder={copy.firstMemberNamePlaceholder}
                  className="h-12 w-full rounded-xl border border-[#d9c9ad] bg-white px-3 text-sm font-medium text-[#3f342d] outline-none transition placeholder:text-[#9c8e7e] focus:border-[#82693c] focus:ring-2 focus:ring-[#82693c]/15"
                />
              </label>

              <label className="block space-y-2">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#6c5c4d]">
                  <CalendarDays className="h-3.5 w-3.5 text-[#82693c]" />
                  {copy.firstMemberYear}
                  <span className="font-semibold normal-case tracking-normal text-[#9c8e7e]">
                    {copy.firstMemberYearHint}
                  </span>
                </span>
                <input
                  inputMode="numeric"
                  value={firstMemberYear}
                  onChange={(event) =>
                    setFirstMemberYear(
                      event.target.value.replace(/\D/g, "").slice(0, 4)
                    )
                  }
                  placeholder="1990"
                  className="h-12 w-full rounded-xl border border-[#d9c9ad] bg-white px-3 text-sm font-medium text-[#3f342d] outline-none transition placeholder:text-[#9c8e7e] focus:border-[#82693c] focus:ring-2 focus:ring-[#82693c]/15"
                />
              </label>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                block
                loading={starting}
                disabled={!firstMemberName.trim() || starting}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                {starting ? copy.creatingFirstMember : copy.createFirstMember}
              </Button>
            </form>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf6ed] px-4 py-8 text-[#3f342d] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.7fr)]">
        <section className="rounded-2xl border border-[#dccfb3] bg-white/88 p-5 shadow-[0_18px_44px_rgba(59,43,24,0.08)] backdrop-blur sm:p-7">
          <div className="mb-6 flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dccfb3] bg-[#f6eddf] text-[#82693c]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#82693c]">
                {copy.badge}
              </p>
              <h1 className="mt-1 font-serif text-3xl leading-tight text-[#3f342d] sm:text-4xl">
                {copy.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#73685f]">
                {copy.subtitle}
              </p>
            </div>
          </div>

          <form onSubmit={submitDiscovery} className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[#6c5c4d]">
                {copy.personName}
              </span>
              <input
                value={personName}
                onChange={(event) => setPersonName(event.target.value)}
                required
                className="h-11 w-full rounded-xl border border-[#d9c9ad] bg-[#fdfbf6] px-3 text-sm outline-none transition focus:border-[#82693c] focus:ring-2 focus:ring-[#82693c]/15"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[#6c5c4d]">
                {copy.birthYear}
              </span>
              <input
                value={birthYear}
                onChange={(event) => setBirthYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                className="h-11 w-full rounded-xl border border-[#d9c9ad] bg-[#fdfbf6] px-3 text-sm outline-none transition focus:border-[#82693c] focus:ring-2 focus:ring-[#82693c]/15"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[#6c5c4d]">
                {copy.fatherName}
              </span>
              <input
                value={fatherName}
                onChange={(event) => setFatherName(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#d9c9ad] bg-[#fdfbf6] px-3 text-sm outline-none transition focus:border-[#82693c] focus:ring-2 focus:ring-[#82693c]/15"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[#6c5c4d]">
                {copy.motherName}
              </span>
              <input
                value={motherName}
                onChange={(event) => setMotherName(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#d9c9ad] bg-[#fdfbf6] px-3 text-sm outline-none transition focus:border-[#82693c] focus:ring-2 focus:ring-[#82693c]/15"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[#6c5c4d]">
                {copy.hometown}
              </span>
              <input
                value={hometown}
                onChange={(event) => setHometown(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#d9c9ad] bg-[#fdfbf6] px-3 text-sm outline-none transition focus:border-[#82693c] focus:ring-2 focus:ring-[#82693c]/15"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[#6c5c4d]">
                {copy.siblings}
              </span>
              <input
                value={siblings}
                onChange={(event) => setSiblings(event.target.value)}
                placeholder={copy.siblingsHint}
                className="h-11 w-full rounded-xl border border-[#d9c9ad] bg-[#fdfbf6] px-3 text-sm outline-none transition focus:border-[#82693c] focus:ring-2 focus:ring-[#82693c]/15"
              />
            </label>

            <label className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-[#dccfb3] bg-[#f8f1e4] p-3 text-sm text-[#5b4a3c]">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(event) => setConsentAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#bca980] text-[#82693c]"
              />
              <span>{copy.consent}</span>
            </label>

            {error && (
              <div className="sm:col-span-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                loading={loading}
                disabled={!consentAccepted || loading}
                iconLeft={<Search className="h-4 w-4" />}
              >
                {loading ? copy.searching : copy.search}
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={starting}
                onClick={startNewTree}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                {hasSearched ? copy.continueNew : copy.startAnyway}
              </Button>
            </div>
          </form>
        </section>

        <aside className="rounded-2xl border border-[#dccfb3] bg-[#fdfbf6] p-5 shadow-[0_18px_44px_rgba(59,43,24,0.07)] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#82693c]">
                {copy.savedMatches}
              </p>
            </div>
            {loadingSaved && <Loader2 className="h-4 w-4 animate-spin text-[#82693c]" />}
          </div>

          <div className="space-y-3">
            {!loadingSaved && candidates.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#d6c3a2] bg-white/70 p-5 text-sm leading-6 text-[#73685f]">
                {copy.noMatch}
              </div>
            )}

            {candidates.map((candidate) => (
              <div
                key={candidate.familyIdentityId}
                className="rounded-xl border border-[#dccfb3] bg-white p-4 shadow-[0_8px_18px_rgba(59,43,24,0.05)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl text-[#3f342d]">
                      {candidate.displayName}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#73685f]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f5efe1] px-2.5 py-1">
                        <Users className="h-3.5 w-3.5 text-[#82693c]" />
                        {copy.members(candidate.memberCount)}
                      </span>
                      <span className="rounded-full bg-[#f5efe1] px-2.5 py-1">
                        {copy.owner(candidate.maskedOwnerName)}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#cdb78f] bg-[#f8f1e4] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#82693c]">
                    {candidate.confidenceLabel === "high" ? copy.high : copy.medium}
                  </span>
                </div>

                {candidate.matchReasons.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {candidate.matchReasons.map((reason) => (
                      <p key={reason} className="flex items-center gap-2 text-xs text-[#6f6258]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#82693c]" />
                        {reason}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  {candidate.requestStatus === "none" ||
                  candidate.requestStatus === "rejected" ? (
                    <Button
                      size="sm"
                      block
                      loading={requestingId === candidate.familyIdentityId}
                      onClick={() => requestAccess(candidate)}
                      iconLeft={<UserPlus className="h-4 w-4" />}
                    >
                      {candidate.requestStatus === "rejected"
                        ? copy.request
                        : copy.request}
                    </Button>
                  ) : (
                    <div className="rounded-xl border border-[#dccfb3] bg-[#f8f1e4] px-3 py-2 text-center text-sm font-semibold text-[#6d5833]">
                      {candidate.requestStatus === "approved"
                        ? copy.approved
                        : copy.pending}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
