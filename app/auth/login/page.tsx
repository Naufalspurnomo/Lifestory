"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock3,
  LockKeyhole,
  Sparkles,
  TreePine,
  Users,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";

function routeLabel(next: string) {
  if (next === "/app") return "Pohon Keluarga";
  if (next === "/dashboard") return "Dashboard Admin";
  return next;
}

function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="rounded-2xl border border-warmBorder bg-white px-6 py-4 text-sm text-warmMuted shadow-sm">
        Memuat halaman login...
      </div>
    </div>
  );
}

function AuthenticatedState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="rounded-2xl border border-accent-200 bg-accent-50/70 px-6 py-5 text-center shadow-sm">
        <p className="text-sm font-semibold text-accent-700">Anda sudah login.</p>
        <p className="mt-1 text-sm text-accent-700">Mengalihkan ke aplikasi...</p>
      </div>
    </div>
  );
}

function LoginPageContent() {
  const { status: sessionStatus } = useSession();
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.push(next);
    }
  }, [sessionStatus, router, next]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Email atau password salah.");
      setStatus("idle");
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (sessionStatus === "loading") return <LoadingState />;
  if (sessionStatus === "authenticated") return <AuthenticatedState />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-warm-50 via-[#fbf8f2] to-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-gold-200/50 blur-3xl" />
        <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-accent-100/70 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(164,146,117,0.08)_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1fr_0.95fr] lg:py-20">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[30px] border border-warmBorder bg-white/86 p-6 shadow-[0_24px_64px_rgba(88,74,51,0.18)] backdrop-blur-sm sm:p-8"
        >
          <div className="mb-8 space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-warmBorder bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent-700">
              <Sparkles className="h-3.5 w-3.5" />
              Secure Access
            </p>
            <h1 className="font-serif text-3xl leading-tight text-warmText sm:text-4xl">
              Masuk ke ruang arsip keluarga Anda.
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-warmMuted sm:text-base">
              Lanjutkan menata pohon keluarga, menambahkan cerita, dan mengelola akses anggota.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-warmText">Email</span>
              <input
                required
                name="email"
                type="email"
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-warmBorder bg-white px-4 py-3 text-sm text-warmText outline-none transition focus:border-accent-300 focus:ring-2 focus:ring-accent-100"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-warmText">Password</span>
              <input
                required
                name="password"
                type="password"
                placeholder="Masukkan password"
                className="w-full rounded-xl border border-warmBorder bg-white px-4 py-3 text-sm text-warmText outline-none transition focus:border-accent-300 focus:ring-2 focus:ring-accent-100"
              />
            </label>

            <div className="flex items-center justify-between pt-1 text-sm">
              <Link href="/auth/forgot" className="text-accent-700 transition hover:text-accent-800 hover:underline">
                Lupa password?
              </Link>
              <p className="text-warmMuted">Login aman dengan kredensial pribadi</p>
            </div>

            <Button
              type="submit"
              block
              disabled={status === "loading"}
              className="h-12 rounded-xl text-sm"
            >
              {status === "loading" ? "Memproses..." : "Masuk Sekarang"}
            </Button>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </form>

          <div className="mt-6 border-t border-warmBorder pt-5 text-sm text-warmMuted">
            Belum punya akun?{" "}
            <Link href="/auth/register" className="font-semibold text-accent-700 transition hover:text-accent-800">
              Daftar sekarang
            </Link>
          </div>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="relative overflow-hidden rounded-[30px] border border-accent-300 bg-gradient-to-br from-accent-900 via-accent-800 to-gold-800 p-6 text-white shadow-[0_22px_68px_rgba(19,45,42,0.4)] sm:p-8"
        >
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 left-6 h-28 w-28 rounded-full bg-gold-200/30 blur-3xl" />

          <div className="relative space-y-6">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <TreePine className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-2xl leading-tight sm:text-3xl">
              Login cepat, lanjutkan cerita keluarga tanpa jeda.
            </h2>

            <div className="space-y-3 text-sm text-white/85">
              {[
                { icon: LockKeyhole, text: "Akses terenkripsi untuk data keluarga sensitif." },
                { icon: Users, text: "Kontrol anggota dan kolaborator dalam satu dashboard." },
                { icon: Clock3, text: "Progres arsip tersimpan otomatis tiap perubahan." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 p-3">
                    <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                    <p>{item.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/20 p-4 text-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-gold-200">
                Redirect tujuan
              </p>
              <p className="inline-flex items-center gap-2 font-medium text-white">
                {routeLabel(next)}
                <ArrowRight className="h-4 w-4" />
              </p>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

function LoginPageFallback() {
  return <LoadingState />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

