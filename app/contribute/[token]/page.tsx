"use client";

import { type FormEvent, useEffect, useState } from "react";
import { TurnstileField } from "../../../components/security/TurnstileField";
import { Button } from "../../../components/ui/Button";

type RequestInfo = {
  prompt: string;
  treeName: string;
  targetPerson?: { label: string } | null;
};

export default function ContributionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [info, setInfo] = useState<RequestInfo | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "sent" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    params
      .then(({ token }) =>
        fetch(`/api/contribute/${encodeURIComponent(token)}`).then(async (response) => {
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || "Tautan tidak berlaku.");
          setInfo(payload.request);
          setStatus("ready");
        })
      )
      .catch((error: unknown) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Tautan tidak berlaku.");
      });
  }, [params]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) return;
    setStatus("loading");
    const { token } = await params;
    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/contribute/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "story",
        payload: { text: text.trim() },
        turnstileToken: String(formData.get("turnstileToken") || "") || undefined,
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus("error");
      setMessage(payload?.error || "Kontribusi belum terkirim.");
      return;
    }
    setStatus("sent");
    setMessage(payload?.message || "Terima kasih.");
  }

  return (
    <main className="min-h-screen bg-cream-100 px-5 py-12 text-ink-900 sm:px-8">
      <section className="mx-auto max-w-[36rem] rounded-3xl border border-cream-300 bg-cream-50 p-7 shadow-soft sm:p-10">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-brand-700">
          Arsip keluarga
        </p>
        {status === "loading" && !info ? (
          <p className="mt-8 text-ink-600">Memuat permintaan...</p>
        ) : null}
        {status === "error" ? (
          <p role="alert" className="mt-8 text-danger">
            {message}
          </p>
        ) : null}
        {status === "sent" ? (
          <>
            <h1 className="mt-5 font-serif text-4xl font-light">Sudah diterima.</h1>
            <p className="mt-4 leading-relaxed text-ink-600">{message}</p>
          </>
        ) : null}
        {info && status !== "sent" && status !== "error" ? (
          <>
            <h1 className="mt-5 font-serif text-4xl font-light">Bantu satu cerita kecil.</h1>
            <p className="mt-4 text-sm leading-relaxed text-ink-600">
              Untuk arsip <strong>{info.treeName}</strong>
              {info.targetPerson ? ` - tentang ${info.targetPerson.label}` : ""}
            </p>
            <div className="mt-7 rounded-2xl border border-brand-200 bg-brand-50/60 p-5 text-[1.05rem] leading-relaxed text-ink-800">
              {info.prompt}
            </div>
            <form onSubmit={submit} className="mt-5 space-y-5">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={7}
                maxLength={20000}
                placeholder="Tulis yang Anda ingat..."
                className="w-full resize-y rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-[0.95rem] leading-relaxed outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
              <TurnstileField />
              <Button
                type="submit"
                disabled={!text.trim() || status === "loading"}
                size="lg"
                className="w-full rounded-pill"
              >
                {status === "loading" ? "Mengirim..." : "Kirim kontribusi"}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-ink-500">
              Tidak perlu membuat akun. Kontribusi akan ditinjau keluarga sebelum tampil.
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}
