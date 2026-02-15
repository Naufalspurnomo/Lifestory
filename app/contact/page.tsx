"use client";

import { FormEvent, useState } from "react";
import { Button } from "../../components/ui/Button";
import { useLanguage } from "../../components/providers/LanguageProvider";

export default function ContactPage() {
  const { locale } = useLanguage();
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const copy =
    locale === "id"
      ? {
          sectionLabel: "Kontak",
          title: "Kirim Pesan",
          subtitle:
            "Pesan Anda akan kami teruskan ke email admin keluarga terkait.",
          name: "Nama",
          email: "Email",
          message: "Pesan",
          send: "Kirim Pesan",
          sent: "Terkirim!",
          thanks: "Terima kasih! Kami akan segera membalas.",
        }
      : {
          sectionLabel: "Contact",
          title: "Send a message",
          subtitle: "We'll route your note to the family admin email.",
          name: "Name",
          email: "Email",
          message: "Message",
          send: "Send message",
          sent: "Sent!",
          thanks: "Thanks! We'll reply soon.",
        };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    // Placeholder: wire to /api/contact when backend is ready.
    await new Promise((resolve) => setTimeout(resolve, 800));
    setStatus("sent");
  }

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">
            {copy.sectionLabel}
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">{copy.title}</h1>
          <p className="text-slate-700">{copy.subtitle}</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-700">
              {copy.name}
              <input
                required
                name="name"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              {copy.email}
              <input
                required
                type="email"
                name="email"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
              />
            </label>
          </div>
          <label className="space-y-1 text-sm text-slate-700">
            {copy.message}
            <textarea
              required
              name="message"
              rows={4}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
            />
          </label>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={status === "sending"}>
              {status === "sent" ? copy.sent : copy.send}
            </Button>
            {status === "sent" && (
              <p className="text-sm text-forest-700">{copy.thanks}</p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
