"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";

export default function VerifyEmailPage() {
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Memverifikasi tautan Anda…");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState("error");
      setMessage("Tautan verifikasi tidak ditemukan.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) throw new Error(payload?.error || "Tautan tidak berlaku.");
        setState("success");
        setMessage("Email berhasil diverifikasi. Sekarang Anda dapat masuk dan mulai membangun arsip keluarga.");
      })
      .catch((error: unknown) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Verifikasi gagal.");
      });
  }, []);

  return (
    <main className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-cream-100 px-6 py-16">
      <section className="w-full max-w-[30rem] rounded-3xl border border-cream-300 bg-cream-50 p-8 text-center shadow-soft">
        <span aria-hidden className={`mx-auto block h-px w-10 ${state === "error" ? "bg-danger" : "bg-brand-700"}`} />
        <h1 className="mt-6 font-serif text-[2.2rem] font-light text-ink-900">
          {state === "loading" ? "Sebentar…" : state === "success" ? "Email terverifikasi" : "Verifikasi belum berhasil"}
        </h1>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-600">{message}</p>
        {state !== "loading" && (
          <Link href={state === "success" ? "/auth/login" : "/auth/register"} className="mt-8 inline-block">
            <Button size="lg" className="rounded-pill">{state === "success" ? "Masuk ke Lifestory" : "Daftar ulang"}</Button>
          </Link>
        )}
      </section>
    </main>
  );
}
