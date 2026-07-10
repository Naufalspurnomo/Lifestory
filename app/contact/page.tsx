"use client";

import Image from "next/image";
import { FormEvent, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { TurnstileField } from "../../components/security/TurnstileField";
import {
  CONTACT_EMAIL,
  CONTACT_WHATSAPP_NUMBER,
  STUDIO_ADDRESS,
} from "../../lib/contact-info";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";
import { cn } from "../../lib/utils";
import { contactConsentCopy } from "../../lib/legal/consent";

type FieldName = "name" | "email" | "message";

export default function ContactPage() {
  const { locale } = useLanguage();
  const { reduced } = useMotionGuard();
  const isId = locale === "id";
  const consentCopy = contactConsentCopy[isId ? "id" : "en"];
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<FieldName>("name");
  const [selectedPrompt, setSelectedPrompt] = useState<number | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const copy = isId
    ? {
        eyebrow: "Konsultasi Lifestory",
        title: "Mulai dari satu nama yang ingin selalu diingat.",
        intro:
          "Tidak perlu datang dengan arsip lengkap. Ceritakan siapa yang ingin Anda abadikan, lalu kami bantu menemukan bentuk yang paling tepat.",
        studioGreeting: "Halo, mari kita mulai dengan secangkir kopi.",
        studioBody:
          "Setiap proyek Lifestory dimulai dari sesi konsultasi yang tenang. Tidak ada pitch deck, hanya percakapan untuk memahami keluarga Anda.",
        consultation: "Konsultasi gratis 30 menit",
        formEyebrow: "Mulai percakapan",
        formTitle: "Apa yang membawa Anda ke Lifestory?",
        promptLabel: "Pilih titik awal, jika membantu",
        prompts: [
          "Saya ingin mengabadikan kisah orang tua.",
          "Saya ingin menyatukan arsip keluarga.",
          "Saya ingin memahami paket yang tepat.",
        ],
        name: "Nama Anda",
        namePlaceholder: "Tulis nama lengkap",
        email: "Email",
        emailPlaceholder: "nama@email.com",
        message: "Ceritakan sedikit tentang keluarga Anda",
        messagePlaceholder:
          "Siapa yang ingin diabadikan? Cerita seperti apa yang penting bagi keluarga?",
        consentLabel: consentCopy.label,
        consentNote: consentCopy.note,
        send: "Mulai konsultasi",
        sending: "Mengirim...",
        sent: "Pesan terkirim",
        sendFailed:
          "Pesan belum terkirim. Coba lagi atau hubungi kami lewat WhatsApp.",
        validationFailed: consentCopy.validationFailed,
        thanks: "Terima kasih. Tim Lifestory akan menghubungi Anda dalam 1x24 jam.",
        contactRail: "Atau hubungi studio secara langsung",
        emailLabel: "Email studio",
        whatsappLabel: "WhatsApp",
        studioLabel: "Kunjungi studio",
        fieldProgress: "Langkah",
      }
    : {
        eyebrow: "Lifestory Consultation",
        title: "Begin with one name you never want forgotten.",
        intro:
          "You do not need a complete archive. Tell us who you want to preserve, and we will help shape the right form for their story.",
        studioGreeting: "Hello, let us begin with a cup of coffee.",
        studioBody:
          "Every Lifestory project begins with a calm consultation. No pitch deck, just a conversation to understand your family.",
        consultation: "Free 30-minute consultation",
        formEyebrow: "Start a conversation",
        formTitle: "What brings you to Lifestory?",
        promptLabel: "Choose a starting point, if helpful",
        prompts: [
          "I want to preserve a parent's story.",
          "I want to bring our family archive together.",
          "I want help choosing the right package.",
        ],
        name: "Your name",
        namePlaceholder: "Enter your full name",
        email: "Email",
        emailPlaceholder: "name@email.com",
        message: "Tell us a little about your family",
        messagePlaceholder:
          "Who would you like to preserve? Which stories matter most to your family?",
        consentLabel: consentCopy.label,
        consentNote: consentCopy.note,
        send: "Start consultation",
        sending: "Sending...",
        sent: "Message sent",
        sendFailed:
          "Your message was not sent. Please try again or contact us through WhatsApp.",
        validationFailed: consentCopy.validationFailed,
        thanks: "Thank you. The Lifestory team will reply within one working day.",
        contactRail: "Or reach the studio directly",
        emailLabel: "Studio email",
        whatsappLabel: "WhatsApp",
        studioLabel: "Visit the studio",
        fieldProgress: "Step",
      };

  const fieldIndex = activeField === "name" ? 0 : activeField === "email" ? 1 : 2;

  function choosePrompt(prompt: string, index: number) {
    setSelectedPrompt(index);
    setActiveField("message");
    if (messageRef.current) {
      messageRef.current.value = prompt;
      messageRef.current.focus();
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const turnstileToken = String(formData.get("turnstileToken") || "") || undefined;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, consentAccepted, turnstileToken }),
      });

      if (!response.ok) {
        setError(response.status === 400 ? copy.validationFailed : copy.sendFailed);
        setStatus("idle");
        return;
      }

      form.reset();
      setSelectedPrompt(null);
      setConsentAccepted(false);
      setStatus("sent");
    } catch {
      setError(copy.sendFailed);
      setStatus("idle");
    }
  }

  return (
    <main className="bg-cream-50 text-ink-900">
      <div className="grid min-h-[calc(100svh-78px)] lg:grid-cols-[minmax(0,0.92fr)_minmax(540px,1.08fr)]">
        {/* ============= LEFT — STICKY IMAGE (unchanged) ============= */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0.01 : 0.8 }}
          className="relative min-h-[72svh] overflow-hidden bg-ink-900 lg:sticky lg:top-[64px] lg:h-[calc(100svh-64px)] lg:min-h-0"
        >
          <Image
            src="/image/contact.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 46vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,22,16,0.28)_0%,rgba(29,22,16,0.12)_38%,rgba(29,22,16,0.92)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(29,22,16,0.18),transparent_55%)]" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

          <div className="relative flex h-full min-h-[72svh] flex-col justify-between p-6 text-cream-50 sm:p-9 lg:min-h-0 lg:p-12">
            <div className="flex items-center justify-between border-b border-white/20 pb-5">
              <span className="font-serif text-xl">Lifestory.co</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-brand-200">
                Studio Note
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.8, delay: reduced ? 0 : 0.15 }}
              className="max-w-xl pb-3"
            >
              <p className="max-w-[13ch] font-serif text-[clamp(2.7rem,5vw,5.6rem)] font-light leading-[0.94] tracking-[-0.025em]">
                {copy.studioGreeting}
              </p>
              <p className="mt-6 max-w-lg text-sm font-light leading-[1.8] text-cream-100/78 sm:text-base">
                {copy.studioBody}
              </p>
              <div className="mt-8 flex items-center gap-3 border-t border-white/20 pt-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-300/60 text-brand-200">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-200">
                  {copy.consultation}
                </span>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ============= RIGHT — FORM CONTENT (redesigned) ============= */}
        <section className="relative flex flex-col bg-cream-50">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-grain bg-[length:24px_24px] opacity-15" />

          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.75, delay: reduced ? 0 : 0.08 }}
            className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-14 sm:px-10 sm:py-16 lg:px-14 lg:py-20 xl:px-16"
          >
            {/* Eyebrow + step counter */}
            <div className="flex items-center justify-between gap-5">
              <p className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                <span className="h-px w-8 bg-brand-500" />
                {copy.eyebrow}
              </p>
              <p className="font-serif text-sm text-ink-300">
                {String(fieldIndex + 1).padStart(2, "0")}
                <span className="text-ink-200"> / </span>
                03
              </p>
            </div>

            {/* Headline */}
            <h1 className="mt-8 max-w-md font-serif text-[clamp(2.25rem,4.6vw,3.75rem)] font-light leading-[1.02] tracking-normal text-ink-900">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-lg text-[1rem] font-light leading-[1.75] text-ink-600 md:text-[1.05rem]">
              {copy.intro}
            </p>

            {/* Prompt chips */}
            <div className="mt-10 border-t border-cream-300 pt-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">
                {copy.promptLabel}
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {copy.prompts.map((prompt, index) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => choosePrompt(prompt, index)}
                    className={cn(
                      "border px-4 py-2.5 text-left text-[13px] font-light leading-[1.5] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
                      selectedPrompt === index
                        ? "border-ink-900 bg-ink-900 text-cream-50"
                        : "border-cream-300 bg-transparent text-ink-700 hover:border-ink-900 hover:text-ink-900"
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="mt-10">
              <div className="grid gap-x-8 md:grid-cols-2">
                <ContactField
                  index="01"
                  label={copy.name}
                  active={activeField === "name"}
                >
                  <input
                    required
                    name="name"
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                    placeholder={copy.namePlaceholder}
                    onFocus={() => setActiveField("name")}
                    className="w-full bg-transparent pb-5 pt-3 font-serif text-lg text-ink-900 outline-none placeholder:font-sans placeholder:text-sm placeholder:font-light placeholder:text-ink-300"
                  />
                </ContactField>

                <ContactField
                  index="02"
                  label={copy.email}
                  active={activeField === "email"}
                >
                  <input
                    required
                    type="email"
                    name="email"
                    maxLength={254}
                    autoComplete="email"
                    placeholder={copy.emailPlaceholder}
                    onFocus={() => setActiveField("email")}
                    className="w-full bg-transparent pb-5 pt-3 font-serif text-lg text-ink-900 outline-none placeholder:font-sans placeholder:text-sm placeholder:font-light placeholder:text-ink-300"
                  />
                </ContactField>
              </div>

              <ContactField
                index="03"
                label={copy.message}
                active={activeField === "message"}
                className="mt-4"
              >
                <textarea
                  ref={messageRef}
                  required
                  name="message"
                  rows={4}
                  minLength={10}
                  maxLength={4000}
                  placeholder={copy.messagePlaceholder}
                  onFocus={() => setActiveField("message")}
                  className="w-full resize-none bg-transparent pb-5 pt-3 font-serif text-lg leading-[1.6] text-ink-900 outline-none placeholder:font-sans placeholder:text-sm placeholder:font-light placeholder:text-ink-300"
                />
              </ContactField>

              <label className="mt-6 flex items-start gap-3 rounded-2xl border border-cream-300 bg-cream-50 px-4 py-4">
                <input
                  required
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(event) => setConsentAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-cream-400 text-brand-700 focus:ring-brand-400"
                  aria-describedby="contact-consent-note"
                />
                <span className="text-sm leading-relaxed text-ink-600">
                  {copy.consentLabel}
                </span>
              </label>

              <p
                id="contact-consent-note"
                className="mt-3 text-xs leading-relaxed text-ink-500"
              >
                {copy.consentNote}
              </p>

              <div className="mt-6">
                <TurnstileField />
              </div>

              {/* Submit + feedback */}
              <div className="mt-10 flex flex-wrap items-center gap-5">
                <button
                  type="submit"
                  disabled={status === "sending" || !consentAccepted}
                  className="group inline-flex min-h-[56px] items-center gap-8 bg-brand-700 px-8 text-[10px] font-bold uppercase tracking-[0.18em] text-cream-50 transition-colors duration-500 hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "sending"
                    ? copy.sending
                    : status === "sent"
                    ? copy.sent
                    : copy.send}
                  {status === "sent" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  )}
                </button>

                {status === "sent" && (
                  <p className="max-w-sm text-sm font-light leading-relaxed text-success" role="status">
                    {copy.thanks}
                  </p>
                )}
                {error && (
                  <p className="max-w-sm text-sm font-light leading-relaxed text-danger" role="alert">
                    {error}
                  </p>
                )}
              </div>
            </form>
          </motion.div>

          {/* Contact rail — bottom */}
          <div className="relative border-t border-cream-300">
            <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10 lg:px-14 xl:px-16">
              <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-400">
                {copy.contactRail}
              </p>
              <div className="flex flex-col divide-y divide-cream-300 border-y border-cream-300">
                <ContactLink
                  href={`mailto:${CONTACT_EMAIL}`}
                  label={copy.emailLabel}
                  value={CONTACT_EMAIL}
                  icon={<Mail className="h-4 w-4" />}
                />
                <ContactLink
                  href={`https://wa.me/${CONTACT_WHATSAPP_NUMBER}`}
                  label={copy.whatsappLabel}
                  value="+62 888 9977 771"
                  icon={<MessageCircle className="h-4 w-4" />}
                  external
                />
                <ContactLink
                  href={`https://maps.google.com/?q=${encodeURIComponent(STUDIO_ADDRESS)}`}
                  label={copy.studioLabel}
                  value="Sidoarjo"
                  icon={<MapPin className="h-4 w-4" />}
                  external
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =====================================================================
   ContactField — editorial form field with numbered label
   ===================================================================== */
function ContactField({
  index,
  label,
  active,
  className,
  children,
}: {
  index: string;
  label: string;
  active: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "group block border-b pt-6 transition-colors duration-500",
        active ? "border-ink-900" : "border-cream-300",
        className
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "font-serif text-sm transition-colors duration-300",
            active ? "text-brand-700" : "text-ink-300"
          )}
        >
          {index}
        </span>
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-300",
            active ? "text-ink-900" : "text-ink-400"
          )}
        >
          {label}
        </span>
      </span>
      {children}
    </label>
  );
}

/* =====================================================================
   ContactLink — clean editorial contact card
   ===================================================================== */
function ContactLink({
  href,
  label,
  value,
  icon,
  external,
}: {
  href: string;
  label: string;
  value: string;
  icon: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex flex-col sm:flex-row sm:items-center sm:justify-between py-5 transition-colors duration-300 focus-visible:outline-none"
    >
      <div className="flex items-center gap-3">
        <span className="text-brand-700 transition-colors duration-300 group-hover:text-brand-600">
          {icon}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400 transition-colors duration-300 group-hover:text-ink-700">
          {label}
        </span>
      </div>
      <span className="mt-1.5 sm:mt-0 font-serif text-base sm:text-[1.05rem] font-light text-ink-800 transition-colors duration-300 group-hover:text-brand-700">
        {value}
      </span>
    </a>
  );
}
