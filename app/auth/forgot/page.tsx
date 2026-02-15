"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "../../../components/providers/LanguageProvider";
import { Button } from "../../../components/ui/Button";

export default function ForgotPasswordPage() {
  const { locale } = useLanguage();
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  const copy =
    locale === "id"
      ? {
          sectionLabel: "Reset Password",
          title: "Lupa password?",
          subtitle: "Masukkan email Anda dan kami kirimkan instruksi reset.",
          email: "Email",
          sending: "Mengirim...",
          sent: "Email terkirim",
          send: "Kirim link reset",
          remembered: "Sudah ingat?",
          backToLogin: "Kembali ke login",
        }
      : {
          sectionLabel: "Password Reset",
          title: "Forgot your password?",
          subtitle: "Enter your email and we will send reset instructions.",
          email: "Email",
          sending: "Sending...",
          sent: "Email sent",
          send: "Send reset link",
          remembered: "Remembered?",
          backToLogin: "Back to login",
        };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 700));
    setStatus("sent");
  }

  return (
    <div className="bg-white">
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">
            {copy.sectionLabel}
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">{copy.title}</h1>
          <p className="text-slate-700">{copy.subtitle}</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6"
        >
          <label className="space-y-1 text-sm text-slate-700">
            {copy.email}
            <input
              required
              name="email"
              type="email"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
            />
          </label>
          <Button type="submit" block disabled={status === "loading"}>
            {status === "sent"
              ? copy.sent
              : status === "loading"
              ? copy.sending
              : copy.send}
          </Button>
          <div className="text-center text-sm text-forest-700">
            {copy.remembered}{" "}
            <Link href="/auth/login" className="font-semibold hover:text-forest-800">
              {copy.backToLogin}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
