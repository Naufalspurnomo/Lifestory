"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Clock3,
  LockKeyhole,
  Users,
  Mail,
  Lock,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useLanguage } from "../../../components/providers/LanguageProvider";
import { Button } from "../../../components/ui/Button";
import { FloatingInput } from "../../../components/ui/FloatingField";
import { getSafeNextPath } from "../../../lib/utils/navigation";

type Locale = "id" | "en";

function routeLabel(next: string, locale: Locale) {
  if (next === "/app") return locale === "id" ? "Pohon Keluarga" : "Family Tree";
  if (next === "/dashboard")
    return locale === "id" ? "Dashboard Admin" : "Admin Dashboard";
  return next;
}

function LoadingState() {
  const { locale } = useLanguage();
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="rounded-2xl border border-warmBorder bg-white px-6 py-4 text-sm text-warmMuted shadow-sm">
        {locale === "id" ? "Memuat halaman login..." : "Loading login page..."}
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

function LoginPageContent() {
  const { status: sessionStatus } = useSession();
  const { locale } = useLanguage();
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeNextPath(searchParams.get("next"));

  const copy =
    locale === "id"
      ? {
          badge: "Secure Access",
          title: "Masuk ke ruang arsip keluarga Anda.",
          subtitle:
            "Lanjutkan menata pohon keluarga, menambahkan cerita, dan mengelola akses anggota.",
          email: "Email",
          emailPlaceholder: "nama@email.com",
          password: "Password",
          passwordPlaceholder: "Masukkan password",
          forgotPassword: "Lupa password?",
          secureLogin: "Login aman dengan kredensial pribadi",
          processing: "Memproses...",
          signIn: "Masuk Sekarang",
          invalidCredentials: "Email atau password salah.",
          inactiveAccount:
            "Akun Anda belum aktif. Silakan tunggu verifikasi admin atau hubungi tim Lifestory.",
          suspendedAccount:
            "Akun ini sedang ditangguhkan. Hubungi tim Lifestory untuk bantuan.",
          noAccount: "Belum punya akun?",
          registerNow: "Daftar sekarang",
          sideTitle: "Login cepat, lanjutkan cerita keluarga tanpa jeda.",
          sidePoints: [
            "Akses terenkripsi untuk data keluarga sensitif.",
            "Kontrol anggota dan kolaborator dalam satu dashboard.",
            "Progres arsip tersimpan otomatis tiap perubahan.",
          ],
          redirectTarget: "Redirect tujuan",
          helper: "Gunakan email yang terdaftar saat pembelian atau undangan keluarga.",
          mobileProof: "Arsip keluarga pribadi",
          mobileMetric: "Auto-save aktif",
        }
      : {
          badge: "Secure Access",
          title: "Sign in to your family archive workspace.",
          subtitle:
            "Continue organizing your family tree, adding stories, and managing member access.",
          email: "Email",
          emailPlaceholder: "name@email.com",
          password: "Password",
          passwordPlaceholder: "Enter your password",
          forgotPassword: "Forgot password?",
          secureLogin: "Secure login with private credentials",
          processing: "Processing...",
          signIn: "Sign In Now",
          invalidCredentials: "Incorrect email or password.",
          inactiveAccount:
            "Your account is not active yet. Please wait for admin verification or contact Lifestory.",
          suspendedAccount:
            "This account is suspended. Please contact Lifestory for help.",
          noAccount: "No account yet?",
          registerNow: "Register now",
          sideTitle: "Quick login, continue your family story without pause.",
          sidePoints: [
            "Encrypted access for sensitive family data.",
            "Control members and collaborators from one dashboard.",
            "Archive progress auto-saves on every change.",
          ],
          redirectTarget: "Redirect target",
          helper: "Use the email registered during purchase or family invitation.",
          mobileProof: "Private family archive",
          mobileMetric: "Auto-save active",
        };

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      window.location.href = next;
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
      if (res.error.includes("RATE_LIMITED")) {
        setError(
          locale === "id"
            ? "Terlalu banyak percobaan login. Coba lagi dalam 15 menit."
            : "Too many login attempts. Please try again in 15 minutes."
        );
      } else if (res.error.includes("ACCOUNT_INACTIVE")) {
        setError(copy.inactiveAccount);
      } else if (res.error.includes("ACCOUNT_SUSPENDED")) {
        setError(copy.suspendedAccount);
      } else {
        setError(copy.invalidCredentials);
      }
      setStatus("idle");
      return;
    }

    // Use hard navigation to ensure the session cookie is picked up fresh
    window.location.href = next;
  }

  if (sessionStatus === "loading") return <LoadingState />;
  if (sessionStatus === "authenticated") return <AuthenticatedState />;

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
                  <LockKeyhole className="h-5 w-5 text-brand-300" />
                </div>
              </div>
              <p className="mt-3 max-w-[15rem] font-serif text-2xl leading-[1.05]">
                {copy.sideTitle}
              </p>
              <div className="mt-5 grid gap-2 text-xs font-medium text-cream-100/85">
                {[
                  { icon: LockKeyhole, text: copy.secureLogin },
                  { icon: Clock3, text: copy.mobileMetric },
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
                name="password"
                type="password"
                label={copy.password}
                hint={copy.passwordPlaceholder}
                iconLeft={<Lock />}
                autoComplete="current-password"
                maxLength={128}
              />
            </div>

            <div className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/auth/forgot"
                className="font-semibold text-brand-700 transition hover:text-brand-800 hover:underline"
              >
                {copy.forgotPassword}
              </Link>
              <p className="text-ink-300">{copy.secureLogin}</p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-700"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              block
              loading={status === "loading"}
              size="lg"
              className="h-12 text-sm font-semibold shadow-sm transition-all duration-300 hover:shadow-md"
            >
              {copy.signIn}
            </Button>
          </form>

          <div className="mt-6 rounded-card border border-cream-300 bg-white/70 p-4 text-sm leading-relaxed text-ink-500">
            <p>{copy.helper}</p>
            <p className="mt-3">
              {copy.noAccount}{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-brand-700 transition hover:text-brand-800 hover:underline"
              >
                {copy.registerNow}
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
            <LockKeyhole className="h-4 w-4" />
            {copy.mobileProof}
          </div>
          <h2 className="max-w-xl font-serif text-4xl leading-tight text-white xl:text-5xl">
            {copy.sideTitle}
          </h2>
          <div className="mt-12 space-y-6 text-cream-100/80">
            {[
              { icon: LockKeyhole, text: copy.sidePoints[0] },
              { icon: Users, text: copy.sidePoints[1] },
              { icon: Clock3, text: copy.sidePoints[2] },
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
              {copy.redirectTarget}
            </span>
            <span className="h-4 w-px bg-white/20" />
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-white">
              {routeLabel(next, locale)}
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </motion.div>
      </aside>
      </div>
    </main>
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
