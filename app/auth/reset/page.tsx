"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "../../../components/providers/LanguageProvider";
import { Button } from "../../../components/ui/Button";
import { FloatingInput } from "../../../components/ui/FloatingField";

function ResetPasswordContent() {
  const { locale } = useLanguage();
  const reduce = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token] = useState(() => searchParams.get("token") || "");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [token]);

  const copy =
    locale === "id"
      ? {
          badge: "Password Baru",
          title: "Buat password baru.",
          subtitle:
            "Gunakan password yang kuat agar arsip keluarga Anda tetap aman.",
          password: "Password baru",
          confirmPassword: "Ulangi password baru",
          passwordPlaceholder: "Min 8 karakter, huruf besar, kecil, angka",
          tokenMissingTitle: "Tautan tidak valid",
          tokenMissingBody:
            "Minta tautan reset baru dari halaman lupa password.",
          processing: "Menyimpan...",
          save: "Simpan Password",
          successTitle: "Password berhasil diganti",
          successBody: "Silakan masuk lagi memakai password baru Anda.",
          login: "Masuk",
          backToForgot: "Minta tautan baru",
          backToLogin: "Kembali ke login",
          mismatch: "Konfirmasi password tidak sama.",
          failed: "Password gagal diganti. Tautan mungkin sudah kedaluwarsa.",
        }
      : {
          badge: "New Password",
          title: "Create a new password.",
          subtitle: "Use a strong password to keep your family archive secure.",
          password: "New password",
          confirmPassword: "Confirm new password",
          passwordPlaceholder: "Min 8 chars, uppercase, lowercase, number",
          tokenMissingTitle: "Invalid link",
          tokenMissingBody: "Request a new reset link from forgot password.",
          processing: "Saving...",
          save: "Save Password",
          successTitle: "Password changed",
          successBody: "Sign in again with your new password.",
          login: "Sign in",
          backToForgot: "Request new link",
          backToLogin: "Back to login",
          mismatch: "Password confirmation does not match.",
          failed: "Password could not be changed. The link may have expired.",
        };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setError(copy.mismatch);
      setStatus("idle");
      return;
    }

    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Reset password failed");
      }

      setStatus("success");
      router.refresh();
    } catch {
      setError(copy.failed);
      setStatus("idle");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#faf2e1] via-[#fbf8f2] to-[#f7f5f1] text-[#40342c]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#f1d99b]/55 blur-3xl" />
        <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-[#e6ddc6]/70 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(164,146,117,0.08)_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.5, ease: "easeOut" }}
          className="w-full"
        >
          <Link
            href="/auth/login"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dccfb7] bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#6c5a49] backdrop-blur-sm transition hover:border-[#c7b289] hover:bg-white hover:text-[#4c3f34]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {copy.backToLogin}
          </Link>

          <div className="rounded-[30px] border border-[#dfd2be] bg-white/86 p-7 shadow-[0_24px_60px_rgba(88,74,51,0.18)] backdrop-blur-sm sm:p-9">
            <div className="mb-7 flex items-start gap-4">
              <span className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-[#ddc7a2] bg-[linear-gradient(150deg,#fff7e3_0%,#f6e5c1_100%)] text-[#b07f2f] shadow-sm">
                <KeyRound className="h-5 w-5" />
              </span>
              <div className="space-y-2">
                <p className="inline-flex items-center gap-2 rounded-full border border-[#dccfb7] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9b845f]">
                  <Sparkles className="h-3 w-3" />
                  {copy.badge}
                </p>
                <h1 className="font-serif text-3xl leading-tight text-[#3f342d] sm:text-4xl">
                  {copy.title}
                </h1>
                <p className="max-w-md text-sm leading-relaxed text-[#73685f] sm:text-base">
                  {copy.subtitle}
                </p>
              </div>
            </div>

            {!token ? (
              <div className="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-serif text-xl text-[#3f342d]">
                  {copy.tokenMissingTitle}
                </p>
                <p className="text-sm leading-relaxed text-red-700">
                  {copy.tokenMissingBody}
                </p>
                <Link
                  href="/auth/forgot"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 transition hover:text-red-800"
                >
                  {copy.backToForgot}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : status === "success" ? (
              <div className="space-y-4 rounded-2xl border border-[#cfe3d2] bg-[linear-gradient(150deg,#f1faef_0%,#fbfff8_100%)] p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-[#bcd6bd] bg-white text-[#5a7d5e]">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <p className="font-serif text-xl text-[#3f342d]">
                    {copy.successTitle}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-[#5d6e5e]">
                  {copy.successBody}
                </p>
                <Button
                  type="button"
                  size="lg"
                  block
                  onClick={() => router.push("/auth/login")}
                  iconRight={<ArrowRight className="h-4 w-4" />}
                  animateRightIcon
                >
                  {copy.login}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <FloatingInput
                  required
                  name="password"
                  type="password"
                  label={copy.password}
                  hint={copy.passwordPlaceholder}
                  iconLeft={<Lock />}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                />
                <FloatingInput
                  required
                  name="confirmPassword"
                  type="password"
                  label={copy.confirmPassword}
                  hint={copy.passwordPlaceholder}
                  iconLeft={<Lock />}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  block
                  size="lg"
                  loading={status === "loading"}
                  iconRight={<ArrowRight className="h-4 w-4" />}
                  animateRightIcon
                >
                  {copy.save}
                </Button>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="rounded-2xl border border-[#dfd2be] bg-white px-6 py-4 text-sm text-[#73685f] shadow-sm">
        Loading reset page...
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
