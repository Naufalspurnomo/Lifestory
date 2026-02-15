"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  TreePine,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../../../components/providers/LanguageProvider";
import { Button } from "../../../components/ui/Button";

function LoadingState() {
  const { locale } = useLanguage();
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="rounded-2xl border border-warmBorder bg-white px-6 py-4 text-sm text-warmMuted shadow-sm">
        {locale === "id"
          ? "Memuat halaman pendaftaran..."
          : "Loading registration page..."}
      </div>
    </div>
  );
}

function AuthenticatedState() {
  const { locale } = useLanguage();
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="rounded-2xl border border-accent-200 bg-accent-50/70 px-6 py-5 text-center shadow-sm">
        <p className="text-sm font-semibold text-accent-700">
          {locale === "id" ? "Anda sudah login." : "You are already logged in."}
        </p>
        <p className="mt-1 text-sm text-accent-700">
          {locale === "id" ? "Mengalihkan ke aplikasi..." : "Redirecting to app..."}
        </p>
      </div>
    </div>
  );
}

function SuccessState() {
  const { locale } = useLanguage();
  const copy =
    locale === "id"
      ? {
          title: "Pendaftaran diterima!",
          desc:
            "Data Anda sudah masuk. Tim admin akan menghubungi lewat WhatsApp untuk verifikasi dan aktivasi akun.",
          viewPlans: "Lihat Paket Langganan",
          backHome: "Kembali ke Beranda",
        }
      : {
          title: "Registration received!",
          desc:
            "Your data has been submitted. Our admin team will contact you via WhatsApp for verification and account activation.",
          viewPlans: "View Subscription Plans",
          backHome: "Back to Home",
        };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-warm-50 via-[#fbf8f2] to-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-gold-200/45 blur-3xl" />
        <div className="absolute -right-20 bottom-14 h-72 w-72 rounded-full bg-accent-100/65 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[30px] border border-green-200 bg-white/88 p-8 text-center shadow-[0_22px_60px_rgba(70,109,86,0.2)] backdrop-blur-sm"
        >
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <BadgeCheck className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-3xl text-warmText">{copy.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-warmMuted sm:text-base">
            {copy.desc}
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/subscribe" className="w-full sm:w-auto">
              <Button className="h-11 w-full rounded-xl px-6 sm:w-auto">
                {copy.viewPlans}
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                className="h-11 w-full rounded-xl px-6 sm:w-auto"
              >
                {copy.backHome}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { status: sessionStatus } = useSession();
  const { locale } = useLanguage();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const copy =
    locale === "id"
      ? {
          badge: "Family Onboarding",
          title: "Daftarkan keluarga Anda ke Lifestory.",
          subtitle:
            "Mulai ruang arsip digital untuk menyimpan sejarah keluarga dan mengelola akses lintas generasi.",
          name: "Nama Lengkap",
          namePlaceholder: "Nama Anda",
          email: "Email",
          emailPlaceholder: "nama@email.com",
          phone: "Nomor WhatsApp",
          phonePlaceholder: "08xxxxxxxxxx",
          password: "Password",
          passwordPlaceholder: "Min 8 karakter, huruf besar, kecil, angka",
          passwordTitle: "Minimal 8 karakter dengan huruf besar, huruf kecil, dan angka",
          processing: "Memproses...",
          register: "Daftar Sekarang",
          registerFailed: "Gagal mendaftarkan akun.",
          networkError: "Terjadi kesalahan jaringan. Coba lagi.",
          haveAccount: "Sudah punya akun?",
          signIn: "Masuk di sini",
          sideTitle: "Onboarding yang rapi untuk keluarga modern.",
          sidePoints: [
            "Data pendaftaran diverifikasi sebelum akun aktif.",
            "Akses keluarga dikelola bertahap sesuai kebutuhan.",
            "Koordinasi aktivasi akun via WhatsApp admin.",
          ],
          afterSubmit: "Setelah submit",
          afterSubmitDesc: "Tim admin akan menghubungi Anda",
        }
      : {
          badge: "Family Onboarding",
          title: "Register your family on Lifestory.",
          subtitle:
            "Start a digital archive space to preserve family history and manage access across generations.",
          name: "Full Name",
          namePlaceholder: "Your name",
          email: "Email",
          emailPlaceholder: "name@email.com",
          phone: "WhatsApp Number",
          phonePlaceholder: "08xxxxxxxxxx",
          password: "Password",
          passwordPlaceholder:
            "Min 8 characters with uppercase, lowercase, and number",
          passwordTitle:
            "At least 8 characters with uppercase, lowercase, and number",
          processing: "Processing...",
          register: "Register Now",
          registerFailed: "Failed to register account.",
          networkError: "Network error. Please try again.",
          haveAccount: "Already have an account?",
          signIn: "Sign in here",
          sideTitle: "Structured onboarding for modern families.",
          sidePoints: [
            "Registration data is verified before account activation.",
            "Family access is managed gradually as needed.",
            "Account activation coordination via admin WhatsApp.",
          ],
          afterSubmit: "After submit",
          afterSubmitDesc: "Our admin team will contact you",
        };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.push("/app");
    }
  }, [sessionStatus, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!response.ok) {
        setError(copy.registerFailed);
        setStatus("idle");
        return;
      }

      setStatus("success");
    } catch {
      setError(copy.networkError);
      setStatus("idle");
    }
  }

  if (sessionStatus === "loading") return <LoadingState />;
  if (sessionStatus === "authenticated") return <AuthenticatedState />;
  if (status === "success") return <SuccessState />;

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
              {copy.badge}
            </p>
            <h1 className="font-serif text-3xl leading-tight text-warmText sm:text-4xl">
              {copy.title}
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-warmMuted sm:text-base">
              {copy.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-warmText">{copy.name}</span>
              <input
                required
                name="name"
                placeholder={copy.namePlaceholder}
                className="w-full rounded-xl border border-warmBorder bg-white px-4 py-3 text-sm text-warmText outline-none transition focus:border-accent-300 focus:ring-2 focus:ring-accent-100"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-warmText">
                {copy.email}
              </span>
              <input
                required
                name="email"
                type="email"
                placeholder={copy.emailPlaceholder}
                className="w-full rounded-xl border border-warmBorder bg-white px-4 py-3 text-sm text-warmText outline-none transition focus:border-accent-300 focus:ring-2 focus:ring-accent-100"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-warmText">{copy.phone}</span>
              <input
                required
                name="phone"
                type="tel"
                placeholder={copy.phonePlaceholder}
                className="w-full rounded-xl border border-warmBorder bg-white px-4 py-3 text-sm text-warmText outline-none transition focus:border-accent-300 focus:ring-2 focus:ring-accent-100"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-warmText">
                {copy.password}
              </span>
              <input
                required
                name="password"
                type="password"
                placeholder={copy.passwordPlaceholder}
                minLength={8}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
                title={copy.passwordTitle}
                className="w-full rounded-xl border border-warmBorder bg-white px-4 py-3 text-sm text-warmText outline-none transition focus:border-accent-300 focus:ring-2 focus:ring-accent-100"
              />
            </label>

            <Button
              type="submit"
              block
              disabled={status === "loading"}
              className="h-12 rounded-xl text-sm"
            >
              {status === "loading" ? copy.processing : copy.register}
            </Button>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </form>

          <div className="mt-6 border-t border-warmBorder pt-5 text-sm text-warmMuted">
            {copy.haveAccount}{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-accent-700 transition hover:text-accent-800"
            >
              {copy.signIn}
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
              {copy.sideTitle}
            </h2>

            <div className="space-y-3 text-sm text-white/85">
              {[
                { icon: ShieldCheck, text: copy.sidePoints[0] },
                { icon: Users, text: copy.sidePoints[1] },
                { icon: MessageCircleMore, text: copy.sidePoints[2] },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.text}
                    className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 p-3"
                  >
                    <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                    <p>{item.text}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-white/15 bg-black/20 p-4 text-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-gold-200">
                {copy.afterSubmit}
              </p>
              <p className="inline-flex items-center gap-2 font-medium text-white">
                {copy.afterSubmitDesc}
                <ArrowRight className="h-4 w-4" />
              </p>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
