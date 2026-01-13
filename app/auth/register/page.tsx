"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/Button";

export default function RegisterPage() {
  const { status: sessionStatus } = useSession();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.push("/app");
    }
  }, [sessionStatus, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    // For MVP: Show info that registration is manual
    await new Promise((resolve) => setTimeout(resolve, 500));
    setStatus("success");
  }

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-slate-500">Memuat...</div>
      </div>
    );
  }

  if (sessionStatus === "authenticated") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">✓</div>
          <p className="text-slate-700">Anda sudah login. Mengalihkan...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="bg-gradient-to-b from-white to-slate-50 min-h-screen">
        <div className="mx-auto max-w-lg px-6 py-16">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <div className="mb-4 text-5xl">📧</div>
            <h2 className="text-2xl font-semibold text-green-800">
              Pendaftaran Diterima!
            </h2>
            <p className="mt-3 text-green-700">
              Terima kasih telah mendaftar. Admin akan menghubungi Anda melalui
              WhatsApp untuk menyelesaikan aktivasi akun.
            </p>
            <div className="mt-6 space-y-3">
              <Link href="/subscribe">
                <Button block>Lihat Paket Langganan</Button>
              </Link>
              <Link href="/">
                <Button variant="secondary" block>
                  Kembali ke Beranda
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-white to-slate-50 min-h-screen">
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-16">
        <div className="text-center">
          <div className="mb-4 text-4xl">🌱</div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Daftar ke Lifestory
          </h1>
          <p className="mt-2 text-slate-600">
            Buat akun untuk memulai membangun warisan digital keluarga Anda.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              Nama Lengkap
            </span>
            <input
              required
              name="name"
              placeholder="Nama Anda"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              required
              name="email"
              type="email"
              placeholder="nama@email.com"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">
              Nomor WhatsApp
            </span>
            <input
              required
              name="phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              required
              name="password"
              type="password"
              placeholder="Minimal 8 karakter"
              minLength={8}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
            />
          </label>

          <Button type="submit" block disabled={status === "loading"}>
            {status === "loading" ? "Memproses..." : "Daftar Sekarang"}
          </Button>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>

        <div className="text-center">
          <p className="text-slate-600">
            Sudah punya akun?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-forest-600 hover:text-forest-700 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>

        {/* Info box */}
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
          <p className="font-medium">ℹ️ Proses Pendaftaran</p>
          <p className="mt-1">
            Setelah mendaftar, admin akan memverifikasi data Anda dan
            menghubungi via WhatsApp untuk aktivasi akun dan pembayaran
            langganan.
          </p>
        </div>
      </div>
    </div>
  );
}
