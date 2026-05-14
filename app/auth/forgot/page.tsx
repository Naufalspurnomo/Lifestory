"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, MailCheck, Sparkles } from "lucide-react";
import { useLanguage } from "../../../components/providers/LanguageProvider";

export default function ForgotPasswordPage() {
  const { locale } = useLanguage();
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  const copy =
    locale === "id"
      ? {
          badge: "Reset Password",
          title: "Lupa password?",
          subtitle:
            "Masukkan email yang terdaftar dan kami kirimkan instruksi reset langsung ke kotak masuk Anda.",
          email: "Email",
          emailPlaceholder: "nama@email.com",
          sending: "Mengirim...",
          sent: "Tautan terkirim",
          send: "Kirim Tautan Reset",
          remembered: "Sudah ingat password?",
          backToLogin: "Kembali ke login",
          successTitle: "Cek email Anda",
          successBody:
            "Jika email tersebut terdaftar, Anda akan menerima tautan reset password dalam beberapa menit ke depan.",
          tipTitle: "Catatan keamanan",
          tipBody:
            "Tautan reset hanya berlaku 30 menit demi keamanan akun keluarga Anda.",
        }
      : {
          badge: "Password Reset",
          title: "Forgot your password?",
          subtitle:
            "Enter your registered email and we will send reset instructions directly to your inbox.",
          email: "Email",
          emailPlaceholder: "name@email.com",
          sending: "Sending...",
          sent: "Link sent",
          send: "Send Reset Link",
          remembered: "Remembered your password?",
          backToLogin: "Back to login",
          successTitle: "Check your inbox",
          successBody:
            "If the email is registered, you will receive a reset link in the next few minutes.",
          tipTitle: "Security note",
          tipBody:
            "Reset links expire in 30 minutes to keep your family account secure.",
        };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 700));
    setStatus("sent");
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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
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

            {status === "sent" ? (
              <div className="space-y-4 rounded-2xl border border-[#cfe3d2] bg-[linear-gradient(150deg,#f1faef_0%,#fbfff8_100%)] p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-[#bcd6bd] bg-white text-[#5a7d5e]">
                    <MailCheck className="h-4 w-4" />
                  </span>
                  <p className="font-serif text-xl text-[#3f342d]">
                    {copy.successTitle}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-[#5d6e5e]">
                  {copy.successBody}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7b6f63]">
                    {copy.email}
                  </span>
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder={copy.emailPlaceholder}
                    className="w-full rounded-xl border border-[#e2d4be] bg-white px-4 py-3 text-sm text-[#3f342d] placeholder:text-[#a99e8f] outline-none transition focus:border-[#c48b24] focus:ring-2 focus:ring-[#f6e5c1]"
                  />
                </label>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e6ab2f] to-[#cc8a12] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_14px_30px_rgba(169,116,21,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(169,116,21,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === "loading" ? copy.sending : copy.send}
                </button>

                <p className="rounded-xl border border-[#eee1cb] bg-[#fffcf7] p-3 text-xs leading-relaxed text-[#7b6f63]">
                  <span className="font-semibold text-[#9b845f]">
                    {copy.tipTitle}.
                  </span>{" "}
                  {copy.tipBody}
                </p>
              </form>
            )}

            <div className="mt-6 border-t border-[#ece2cc] pt-5 text-sm text-[#73685f]">
              {copy.remembered}{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-[#a8761a] transition hover:text-[#7e570f]"
              >
                {copy.backToLogin}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
