"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/Button";

export default function LoginPage() {
  const { status: sessionStatus } = useSession();
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";

  // Redirect if already logged in
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

  // Show loading while checking session
  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-slate-500">Memuat...</div>
      </div>
    );
  }

  // Already logged in - show redirect message
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

  return (
    <div className="bg-gradient-to-b from-white to-slate-50 min-h-screen">
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-16">
        <div className="text-center">
          <div className="mb-4 text-4xl">🌳</div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Masuk ke Lifestory
          </h1>
          <p className="mt-2 text-slate-600">
            Akses pohon keluarga, arsip, dan kelola langganan Anda.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
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
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              required
              name="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
            />
          </label>

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/auth/forgot"
              className="text-forest-600 hover:text-forest-700 hover:underline"
            >
              Lupa password?
            </Link>
          </div>

          <Button type="submit" block disabled={status === "loading"}>
            {status === "loading" ? "Memproses..." : "Masuk"}
          </Button>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>

        <div className="text-center">
          <p className="text-slate-600">
            Belum punya akun?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-forest-600 hover:text-forest-700 hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>

        {/* Info box */}
        <div className="rounded-xl bg-slate-100 p-4 text-center text-sm text-slate-600">
          <p>
            Setelah login, Anda akan diarahkan ke{" "}
            <span className="font-medium text-slate-800">
              {next === "/app"
                ? "Pohon Keluarga"
                : next === "/dashboard"
                ? "Dashboard Admin"
                : next}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
