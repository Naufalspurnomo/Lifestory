"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  MessageCircleMore,
  ShieldCheck,
  Users,
  Mail,
  Lock,
  User2,
  Phone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../../../components/providers/LanguageProvider";
import { Button } from "../../../components/ui/Button";
import { FloatingInput } from "../../../components/ui/FloatingField";
import { getRegistrationErrorMessage } from "../../../lib/registration-errors";

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
  const reduce = useReducedMotion();
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
    <main className="bg-cream-50">
      <div className="relative mx-auto max-w-3xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.45 }}
          className="rounded-card border border-green-200 bg-white p-8 text-center shadow-soft"
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
    </main>
  );
}

export default function RegisterPage() {
  const { status: sessionStatus } = useSession();
  const { locale } = useLanguage();
  const reduce = useReducedMotion();
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
          helper:
            "Pendaftaran membuat akun nonaktif terlebih dahulu. Admin akan verifikasi pembayaran dan mengaktifkan akses Anda.",
          mobileProof: "Aktivasi terverifikasi",
          mobileMetric: "Kontak via WhatsApp",
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
          helper:
            "Registration creates an inactive account first. Admin verifies payment and activates access.",
          mobileProof: "Verified activation",
          mobileMetric: "WhatsApp contact",
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
    const phone = String(formData.get("phone") || "").trim();
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
          phone,
          password,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(getRegistrationErrorMessage(response.status, payload, locale));
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
    <main className="relative overflow-hidden bg-cream-50">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(130,105,60,0.13),transparent_34%),radial-gradient(circle_at_15%_18%,rgba(170,141,92,0.18),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(29,22,16,0.08),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-60" />

      <div className="relative mx-auto grid min-h-[calc(100vh-78px)] w-full max-w-[1440px] lg:grid-cols-[minmax(0,0.92fr)_minmax(460px,0.78fr)]">
        <section className="relative z-10 flex w-full flex-col justify-center px-5 py-7 sm:px-8 lg:px-16 xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.4 }}
            className="mx-auto w-full max-w-[480px]"
          >
            <div className="mb-6 overflow-hidden rounded-card border border-brand-200 bg-ink-900 p-5 text-cream-50 shadow-deep lg:hidden">
              <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-300">
                    {copy.mobileProof}
                  </p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                  <ShieldCheck className="h-5 w-5 text-brand-300" />
                </div>
              </div>
              <p className="mt-3 max-w-[15rem] font-serif text-2xl leading-[1.05]">
                {copy.sideTitle}
              </p>
              <div className="mt-5 grid gap-2 text-xs font-medium text-cream-100/85">
                {[
                  { icon: MessageCircleMore, text: copy.afterSubmitDesc },
                  { icon: ShieldCheck, text: copy.mobileMetric },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.text}
                      className="grid min-h-11 grid-cols-[1rem_1fr] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] px-3.5 py-2.5"
                    >
                      <Icon className="h-4 w-4 text-brand-300" />
                      <span className="leading-snug">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-7">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                {copy.badge}
              </p>
              <h1 className="font-serif text-3xl leading-tight text-ink-900 sm:text-4xl">
                {copy.title}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-ink-500 sm:text-base">
                {copy.subtitle}
              </p>
            </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-card border border-cream-300 bg-white/95 p-4 shadow-lift backdrop-blur-sm sm:p-6"
          >
            <div className="space-y-4">
              <FloatingInput
                required
                name="name"
                label={copy.name}
                hint={copy.namePlaceholder}
                iconLeft={<User2 />}
                autoComplete="name"
                maxLength={120}
              />
              <FloatingInput
                required
                name="email"
                type="email"
                label={copy.email}
                hint={copy.emailPlaceholder}
                iconLeft={<Mail />}
                autoComplete="email"
                maxLength={254}
              />
              <FloatingInput
                required
                name="phone"
                type="tel"
                label={copy.phone}
                hint={copy.phonePlaceholder}
                iconLeft={<Phone />}
                autoComplete="tel"
              />
              <FloatingInput
                required
                name="password"
                type="password"
                label={copy.password}
                hint={copy.passwordPlaceholder}
                iconLeft={<Lock />}
                minLength={8}
                maxLength={128}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
                title={copy.passwordTitle}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-700"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              block
              loading={status === "loading"}
              size="lg"
              className="mt-5 h-12 text-sm font-semibold shadow-sm transition-all duration-300 hover:shadow-md"
            >
              {copy.register}
            </Button>
          </form>

          <div className="mt-6 rounded-card border border-cream-300 bg-white/70 p-4 text-sm leading-relaxed text-ink-500">
            <p>{copy.helper}</p>
            <p className="mt-3">
              {copy.haveAccount}{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-brand-700 transition hover:text-brand-800 hover:underline"
              >
                {copy.signIn}
              </Link>
            </p>
          </div>
        </motion.div>
      </section>

      <aside className="hidden lg:relative lg:flex lg:flex-col lg:justify-between lg:overflow-hidden lg:bg-ink-900 lg:px-14 lg:py-16 xl:px-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] [background-size:24px_24px]" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-900/30 to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: reduce ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.5, delay: 0.1 }}
          className="relative z-10"
        >
          <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">
            <ShieldCheck className="h-4 w-4" />
            {copy.mobileProof}
          </div>
          <h2 className="max-w-xl font-serif text-4xl leading-tight text-white xl:text-5xl">
            {copy.sideTitle}
          </h2>
          <div className="mt-12 space-y-6 text-cream-100/80">
            {[
              { icon: ShieldCheck, text: copy.sidePoints[0] },
              { icon: Users, text: copy.sidePoints[1] },
              { icon: MessageCircleMore, text: copy.sidePoints[2] },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-4">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-brand-400" />
                  <p className="max-w-md text-base leading-relaxed text-cream-50/90">{item.text}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-10 mt-auto pt-16"
        >
          <div className="inline-flex max-w-full items-center gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.15em] text-gold-200/70">
              {copy.afterSubmit}
            </span>
            <span className="h-4 w-px bg-white/20" />
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-white">
              {copy.afterSubmitDesc}
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </motion.div>
      </aside>
      </div>
    </main>
  );
}
