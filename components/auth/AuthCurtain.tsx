"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../providers/LanguageProvider";
import { Button } from "../ui/Button";
import { AuthField } from "./AuthField";
import { getRegistrationErrorMessage } from "../../lib/registration-errors";
import { getSafeNextPath } from "../../lib/utils/navigation";
import { registerConsentCopy } from "../../lib/legal/consent";

type Mode = "login" | "register";
type Status = "idle" | "loading" | "success";

const EASE = [0.22, 1, 0.36, 1] as const;

export function AuthCurtain({
  initialMode,
  next = "/app",
}: {
  initialMode: Mode;
  next?: string;
}) {
  const router = useRouter();
  const { status: sessionStatus, update } = useSession();
  const { locale } = useLanguage();
  const reduce = useReducedMotion();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [loginStatus, setLoginStatus] = useState<Status>("idle");
  const [registerStatus, setRegisterStatus] = useState<Status>("idle");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const safeNext = getSafeNextPath(next);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace(safeNext);
      router.refresh();
      const fallback = window.setTimeout(() => {
        if (window.location.pathname !== safeNext) window.location.assign(safeNext);
      }, 350);
      return () => window.clearTimeout(fallback);
    }
  }, [router, sessionStatus, safeNext]);

  const t = copyFor(locale);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginStatus("loading");
    setLoginError(null);

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "");
    const password = String(data.get("password") || "");

    const res = await signIn("credentials", { redirect: false, email, password });

    if (res?.error) {
      if (res.error.includes("RATE_LIMITED")) setLoginError(t.login.rateLimited);
      else if (res.error.includes("ACCOUNT_INACTIVE")) setLoginError(t.login.inactive);
      else if (res.error.includes("ACCOUNT_SUSPENDED")) setLoginError(t.login.suspended);
      else setLoginError(t.login.invalid);
      setLoginStatus("idle");
      return;
    }
    setLoginStatus("success");
    await update().catch(() => null);
    router.replace(safeNext);
    router.refresh();
    window.setTimeout(() => {
      if (window.location.pathname !== safeNext) window.location.assign(safeNext);
    }, 350);
  }

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>,
    consentAccepted: boolean
  ) {
    event.preventDefault();
    setRegisterStatus("loading");
    setRegisterError(null);

    const data = new FormData(event.currentTarget);
    const body = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      password: String(data.get("password") || ""),
      consentAccepted,
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setRegisterError(getRegistrationErrorMessage(response.status, payload, locale));
        setRegisterStatus("idle");
        return;
      }
      setRegisterStatus("success");
    } catch {
      setRegisterError(t.register.networkError);
      setRegisterStatus("idle");
    }
  }

  if (sessionStatus === "loading")
    return <StatusScreen>{t.shared.loading}</StatusScreen>;
  if (sessionStatus === "authenticated")
    return <StatusScreen>{t.shared.authed}</StatusScreen>;
  if (registerStatus === "success")
    return <SuccessState locale={locale} reduce={Boolean(reduce)} />;

  const loginForm = (
    <LoginForm
      t={t}
      onSubmit={handleLogin}
      status={loginStatus}
      error={loginError}
    />
  );
  const registerForm = (
    <RegisterForm
      t={t}
      onSubmit={handleRegister}
      status={registerStatus}
      error={registerError}
    />
  );

  return (
    <main className="bg-cream-100">
      {/* ===== Desktop: sliding curtain ===== */}
      <DesktopCurtain
        mode={mode}
        reduce={Boolean(reduce)}
        t={t}
        onToggle={setMode}
        loginForm={loginForm}
        registerForm={registerForm}
      />

      {/* ===== Mobile: crossfade single column ===== */}
      <div className="flex min-h-[calc(100vh-78px)] items-center justify-center px-6 py-12 lg:hidden">
        <div className="w-full max-w-[400px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -18 }}
              transition={{ duration: reduce ? 0.01 : 0.32, ease: EASE }}
            >
              {mode === "login" ? loginForm : registerForm}
              <p className="mt-8 border-t border-cream-300 pt-6 text-center text-[0.875rem] text-ink-500">
                {mode === "login" ? t.curtain.toLoginPrompt : t.curtain.toRegisterPrompt}{" "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "register" : "login")}
                  className="font-medium text-brand-700 underline-offset-2 transition-colors hover:text-brand-800 hover:underline"
                >
                  {mode === "login" ? t.curtain.toRegisterCta : t.curtain.toLoginCta}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// Desktop two-column curtain
// ============================================================
function DesktopCurtain({
  mode,
  reduce,
  t,
  onToggle,
  loginForm,
  registerForm,
}: {
  mode: Mode;
  reduce: boolean;
  t: Copy;
  onToggle: (m: Mode) => void;
  loginForm: React.ReactNode;
  registerForm: React.ReactNode;
}) {
  const leftPane = useRef<HTMLDivElement>(null);
  const rightPane = useRef<HTMLDivElement>(null);

  // The covered pane must be unreachable by keyboard / screen readers.
  useEffect(() => {
    leftPane.current?.toggleAttribute("inert", mode === "register");
    rightPane.current?.toggleAttribute("inert", mode === "login");
  }, [mode]);

  return (
    <div className="relative hidden min-h-[calc(100vh-78px)] grid-cols-2 lg:grid">
      {/* Left pane = login */}
      <div
        ref={leftPane}
        className="flex items-center justify-center px-10 py-14 xl:px-16"
      >
        <div className="w-full max-w-[360px]">{loginForm}</div>
      </div>

      {/* Right pane = register */}
      <div
        ref={rightPane}
        className="flex items-center justify-center px-10 py-14 xl:px-16"
      >
        <div className="w-full max-w-[360px]">{registerForm}</div>
      </div>

      {/* The curtain: covers the inactive half, slides between them.
          It holds the interactive toggle CTA, so it must NOT be aria-hidden;
          only its image + gradient are decorative. */}
      <motion.aside
        initial={false}
        animate={{ x: mode === "register" ? "0%" : "100%" }}
        transition={{ duration: reduce ? 0.01 : 0.7, ease: EASE }}
        className="absolute inset-y-0 left-0 z-20 w-1/2 overflow-hidden bg-ink-900"
      >
        <Image
          src="/image/cinematic-memory.png"
          alt=""
          aria-hidden
          fill
          sizes="50vw"
          className="pointer-events-none object-cover opacity-25"
          priority
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-900/85 via-ink-900/80 to-ink-900/90"
        />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-center xl:px-20">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: reduce ? 0.01 : 0.4, ease: EASE }}
              className="flex max-w-[26rem] flex-col items-center"
            >
              <span aria-hidden className="mb-7 h-px w-10 bg-brand-400" />
              <h2 className="font-serif text-[2.4rem] font-light leading-[1.1] tracking-[-0.02em] text-cream-50 xl:text-[2.9rem]">
                {mode === "login" ? t.curtain.toRegisterTitle : t.curtain.toLoginTitle}
              </h2>
              <p className="mt-5 max-w-[32ch] text-[0.95rem] leading-relaxed text-cream-300">
                {mode === "login" ? t.curtain.toRegisterBody : t.curtain.toLoginBody}
              </p>
              <button
                type="button"
                onClick={() => onToggle(mode === "login" ? "register" : "login")}
                className="mt-9 inline-flex h-12 items-center justify-center rounded-pill border border-cream-300/40 px-9 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-cream-50 outline-none transition-all duration-300 ease-smooth hover:border-cream-50 hover:bg-cream-50/10 focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
              >
                {mode === "login" ? t.curtain.toRegisterCta : t.curtain.toLoginCta}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.aside>
    </div>
  );
}

// ============================================================
// Forms
// ============================================================
function FormHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-serif text-[2.2rem] font-light leading-[1.08] tracking-[-0.02em] text-ink-900">
        {title}
      </h1>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-600">{subtitle}</p>
    </div>
  );
}

function LoginForm({
  t,
  onSubmit,
  status,
  error,
}: {
  t: Copy;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: Status;
  error: string | null;
}) {
  return (
    <div>
      <FormHeader title={t.login.title} subtitle={t.login.subtitle} />
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <AuthField
          required
          name="email"
          type="email"
          label={t.login.email}
          autoComplete="email"
          maxLength={254}
        />
        <div>
          <AuthField
            required
            name="password"
            type="password"
            label={t.login.password}
            autoComplete="current-password"
            maxLength={128}
          />
          <div className="mt-2 flex justify-end">
            <Link
              href="/auth/forgot"
              className="text-[0.8rem] text-ink-500 transition-colors hover:text-ink-700"
            >
              {t.login.forgot}
            </Link>
          </div>
        </div>

        {error && (
          <p role="alert" aria-live="polite" className="text-[0.85rem] leading-relaxed text-danger">
            {error}
          </p>
        )}

        <Button
          type="submit"
          block
          size="lg"
          loading={status === "loading"}
          disabled={status === "loading" || status === "success"}
          className="mt-1 h-12 rounded-pill"
        >
          {status === "loading" ? t.shared.processing : t.login.cta}
        </Button>

        <p className="text-center text-[0.8rem] text-ink-500">{t.login.trust}</p>
      </form>
    </div>
  );
}

function RegisterForm({
  t,
  onSubmit,
  status,
  error,
}: {
  t: Copy;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, consentAccepted: boolean) => void;
  status: Status;
  error: string | null;
}) {
  const [consentAccepted, setConsentAccepted] = useState(false);

  return (
    <div>
      <FormHeader title={t.register.title} subtitle={t.register.subtitle} />
      <form
        onSubmit={(event) => onSubmit(event, consentAccepted)}
        className="flex flex-col gap-5"
      >
        <AuthField required name="name" label={t.register.name} autoComplete="name" maxLength={120} />
        <AuthField
          required
          name="email"
          type="email"
          label={t.register.email}
          autoComplete="email"
          maxLength={254}
        />
        <AuthField
          required
          name="phone"
          type="tel"
          label={t.register.phone}
          autoComplete="tel"
          inputMode="tel"
        />
        <AuthField
          required
          name="password"
          type="password"
          label={t.register.password}
          hint={t.register.passwordHint}
          minLength={8}
          maxLength={128}
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
          title={t.register.passwordTitle}
          autoComplete="new-password"
        />

        <label className="flex items-start gap-3 rounded-2xl border border-cream-300 bg-cream-50 px-4 py-4">
          <input
            required
            type="checkbox"
            name="consentAccepted"
            checked={consentAccepted}
            onChange={(event) => setConsentAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-cream-400 text-brand-700 focus:ring-brand-400"
          />
          <span className="text-[0.85rem] leading-relaxed text-ink-600">
            {t.register.consentIntro}
            <Link href="/terms" className="font-medium text-brand-700 underline-offset-2 hover:underline">
              {t.register.consentTerms}
            </Link>
            {t.register.consentMid}
            <Link
              href="/privacy-policy"
              className="font-medium text-brand-700 underline-offset-2 hover:underline"
            >
              {t.register.consentPrivacy}
            </Link>
            {t.register.consentOutro}
          </span>
        </label>

        {error && (
          <p role="alert" aria-live="polite" className="text-[0.85rem] leading-relaxed text-danger">
            {error}
          </p>
        )}

        <Button
          type="submit"
          block
          size="lg"
          loading={status === "loading"}
          disabled={status === "loading" || !consentAccepted}
          className="mt-1 h-12 rounded-pill"
        >
          {status === "loading" ? t.shared.processing : t.register.cta}
        </Button>

        <p className="text-center text-[0.8rem] leading-relaxed text-ink-500">
          {t.register.consentNote}
        </p>

        <p className="text-center text-[0.8rem] leading-relaxed text-ink-500">
          {t.register.verifyNote}
        </p>
      </form>
    </div>
  );
}

// ============================================================
// Full-screen states
// ============================================================
function StatusScreen({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-cream-100 px-6">
      <p className="text-[0.95rem] leading-relaxed text-ink-500">{children}</p>
    </main>
  );
}

function SuccessState({ locale, reduce }: { locale: string; reduce: boolean }) {
  const c =
    locale === "id"
      ? {
          title: "Tempat Anda telah dicatat.",
          desc:
            "Data Anda sudah masuk. Tim kami akan menghubungi lewat WhatsApp untuk verifikasi dan mengaktifkan akun keluarga Anda.",
          viewPlans: "Lihat paket langganan",
          backHome: "Kembali ke beranda",
        }
      : {
          title: "Your place is recorded.",
          desc:
            "Your details are in. Our team will reach you on WhatsApp to verify and activate your family's account.",
          viewPlans: "View subscription plans",
          backHome: "Back to home",
        };
  return (
    <main className="flex min-h-[calc(100vh-78px)] items-center justify-center bg-cream-100 px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.01 : 0.6, ease: EASE }}
        className="flex w-full max-w-[30rem] flex-col items-center text-center"
      >
        <span aria-hidden className="h-px w-10 bg-brand-700" />
        <h1 className="mt-6 font-serif text-[2.2rem] font-light leading-[1.08] tracking-[-0.02em] text-ink-900 sm:text-[2.6rem]">
          {c.title}
        </h1>
        <p className="mt-4 max-w-[40ch] text-[0.95rem] leading-relaxed text-ink-600">{c.desc}</p>
        <div className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Link href="/subscribe" className="w-full sm:w-auto">
            <Button block size="lg" className="h-12 rounded-pill">
              {c.viewPlans}
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="ghost" size="lg" className="h-12 rounded-pill">
              {c.backHome}
            </Button>
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

// ============================================================
// Copy
// ============================================================
type Copy = ReturnType<typeof copyFor>;

function copyFor(locale: string) {
  if (locale === "id") {
    const consent = registerConsentCopy.id;
    return {
      shared: {
        processing: "Memproses...",
        loading: "Memuat...",
        authed: "Anda sudah masuk. Mengalihkan...",
      },
      login: {
        title: "Selamat datang kembali.",
        subtitle: "Masuk untuk melanjutkan merawat cerita keluarga Anda.",
        email: "Email",
        password: "Password",
        forgot: "Lupa password?",
        cta: "Masuk",
        trust: "Privat secara bawaan. Hanya keluarga Anda yang melihatnya.",
        invalid: "Email atau password salah.",
        rateLimited: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
        inactive:
          "Akun Anda belum aktif. Silakan tunggu verifikasi admin atau hubungi tim Lifestory.",
        suspended: "Akun ini sedang ditangguhkan. Hubungi tim Lifestory untuk bantuan.",
      },
      register: {
        title: "Mulai arsip keluarga.",
        subtitle: "Buat ruang pribadi untuk menyimpan sejarah keluarga lintas generasi.",
        name: "Nama Lengkap",
        email: "Email",
        phone: "Nomor WhatsApp",
        password: "Password",
        passwordHint: "Min 8 karakter, dengan huruf besar, kecil, dan angka.",
        passwordTitle: "Minimal 8 karakter dengan huruf besar, huruf kecil, dan angka",
        consentIntro: consent.intro,
        consentTerms: consent.terms,
        consentMid: consent.mid,
        consentPrivacy: consent.privacy,
        consentOutro: consent.outro,
        consentNote: consent.note,
        cta: "Daftar Sekarang",
        verifyNote:
          "Akun dibuat nonaktif dulu. Tim kami menghubungi via WhatsApp untuk verifikasi sebelum akun aktif.",
        networkError: "Terjadi kesalahan jaringan. Coba lagi.",
      },
      curtain: {
        toRegisterTitle: "Baru di Lifestory?",
        toRegisterBody:
          "Buat ruang arsip pribadi untuk keluarga Anda, dirawat lintas generasi.",
        toRegisterCta: "Daftar",
        toLoginTitle: "Sudah punya akun?",
        toLoginBody: "Masuk dan lanjutkan dari tempat terakhir Anda tinggalkan.",
        toLoginCta: "Masuk",
        toLoginPrompt: "Belum punya akun?",
        toRegisterPrompt: "Sudah punya akun?",
      },
    } as const;
  }
  const consent = registerConsentCopy.en;
  return {
    shared: {
      processing: "Processing...",
      loading: "Loading...",
      authed: "You're already signed in. Redirecting...",
    },
    login: {
      title: "Welcome back.",
      subtitle: "Sign in to keep caring for your family's stories.",
      email: "Email",
      password: "Password",
      forgot: "Forgot password?",
      cta: "Sign in",
      trust: "Private by default. Only your family sees this.",
      invalid: "Incorrect email or password.",
      rateLimited: "Too many login attempts. Please try again in 15 minutes.",
      inactive:
        "Your account is not active yet. Please wait for admin verification or contact Lifestory.",
      suspended: "This account is suspended. Please contact Lifestory for help.",
    },
    register: {
      title: "Begin your archive.",
      subtitle: "Create a private space to preserve your family history across generations.",
      name: "Full Name",
      email: "Email",
      phone: "WhatsApp Number",
      password: "Password",
      passwordHint: "Min 8 characters, with uppercase, lowercase, and a number.",
      passwordTitle: "At least 8 characters with uppercase, lowercase, and number",
      consentIntro: consent.intro,
      consentTerms: consent.terms,
      consentMid: consent.mid,
      consentPrivacy: consent.privacy,
      consentOutro: consent.outro,
      consentNote: consent.note,
      cta: "Create your archive",
      verifyNote:
        "Your account starts inactive. Our team contacts you via WhatsApp to verify before it activates.",
      networkError: "Network error. Please try again.",
    },
    curtain: {
      toRegisterTitle: "New to Lifestory?",
      toRegisterBody:
        "Create a private archive for your family, cared for across generations.",
      toRegisterCta: "Register",
      toLoginTitle: "Already with us?",
      toLoginBody: "Sign in and pick up right where you left off.",
      toLoginCta: "Sign in",
      toLoginPrompt: "No account yet?",
      toRegisterPrompt: "Already have an account?",
    },
  } as const;
}
