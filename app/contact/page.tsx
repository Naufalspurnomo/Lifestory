"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  User2,
} from "lucide-react";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { Button } from "../../components/ui/Button";
import {
  FloatingInput,
  FloatingTextarea,
} from "../../components/ui/FloatingField";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  STUDIO_ADDRESS,
} from "../../lib/contact-info";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

export default function ContactPage() {
  const { locale } = useLanguage();
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const { reduced } = useMotionGuard();
  const isId = locale === "id";

  const copy = isId
    ? {
        badge: "Kontak Lifestory",
        title: "Mari ceritakan kisah keluarga Anda.",
        subtitle:
          "Kami siap mendampingi proses pengabadian kisah hidup, dari konsultasi awal hingga produk akhir yang siap diwariskan.",
        formLabel: "Kirim Pesan",
        formIntro:
          "Tinggalkan nama, email, dan ringkasan kebutuhan Anda. Tim kami akan membalas dalam waktu dekat.",
        name: "Nama",
        namePlaceholder: "Nama lengkap",
        email: "Email",
        emailPlaceholder: "nama@email.com",
        message: "Pesan",
        messagePlaceholder:
          "Ceritakan singkat mengenai keluarga, paket yang diminati, atau kisah yang ingin diabadikan.",
        send: "Kirim Pesan",
        sending: "Mengirim...",
        sent: "Pesan terkirim",
        sendFailed:
          "Pesan belum terkirim. Coba lagi atau hubungi kami lewat email/WhatsApp.",
        validationFailed:
          "Lengkapi nama, email yang valid, dan pesan minimal 10 karakter.",
        thanks:
          "Terima kasih. Tim Lifestory akan menghubungi Anda dalam 1x24 jam.",
        infoTitle: "Cara lain menjangkau kami",
        infoNote:
          "Pilih saluran yang paling nyaman. Kami merespons dengan ritme yang tenang, sesuai semangat Lifestory.",
        items: [
          {
            icon: Mail,
            label: "Email",
            value: CONTACT_EMAIL,
            href: `mailto:${CONTACT_EMAIL}`,
            note: "Pertanyaan umum dan kerja sama",
          },
          {
            icon: Phone,
            label: "Telepon",
            value: CONTACT_PHONE_DISPLAY,
            href: `tel:${CONTACT_PHONE_TEL}`,
            note: "Senin - Jumat, 09.00 - 17.00 WIB",
          },
          {
            icon: MapPin,
            label: "Studio",
            value: STUDIO_ADDRESS,
            href: "#",
            note: "Pertemuan langsung dengan janji",
          },
        ],
        responseTitle: "Waktu respons",
        responseBody:
          "Kami menjawab pesan secara personal pada hari kerja. Untuk konsultasi paket, mohon sertakan ringkasan keluarga.",
      }
    : {
        badge: "Contact Lifestory",
        title: "Let us tell your family story.",
        subtitle:
          "We are here to guide your life-story preservation journey, from the first conversation to the final heirloom.",
        formLabel: "Send a message",
        formIntro:
          "Leave your name, email, and a short note. Our team will get back to you shortly.",
        name: "Name",
        namePlaceholder: "Full name",
        email: "Email",
        emailPlaceholder: "name@email.com",
        message: "Message",
        messagePlaceholder:
          "Briefly share about the family, package of interest, or stories you want to preserve.",
        send: "Send message",
        sending: "Sending...",
        sent: "Message sent",
        sendFailed:
          "Your message was not sent. Please try again or contact us by email/WhatsApp.",
        validationFailed:
          "Please enter a valid name, email, and message of at least 10 characters.",
        thanks: "Thanks. The Lifestory team will reply within one working day.",
        infoTitle: "Other ways to reach us",
        infoNote:
          "Pick the channel that feels right. We reply with a calm rhythm, matching the Lifestory pace.",
        items: [
          {
            icon: Mail,
            label: "Email",
            value: CONTACT_EMAIL,
            href: `mailto:${CONTACT_EMAIL}`,
            note: "General inquiries and partnerships",
          },
          {
            icon: Phone,
            label: "Phone",
            value: CONTACT_PHONE_DISPLAY,
            href: `tel:${CONTACT_PHONE_TEL}`,
            note: "Mon - Fri, 09.00 - 17.00 WIB",
          },
          {
            icon: MapPin,
            label: "Studio",
            value: STUDIO_ADDRESS,
            href: "#",
            note: "Studio visits by appointment",
          },
        ],
        responseTitle: "Response time",
        responseBody:
          "We answer messages personally on weekdays. For package consultations, please share a brief family summary.",
      };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!response.ok) {
        setError(response.status === 400 ? copy.validationFailed : copy.sendFailed);
        setStatus("idle");
        return;
      }

      form.reset();
      setStatus("sent");
    } catch {
      setError(copy.sendFailed);
      setStatus("idle");
    }
  }

  return (
    <div className="bg-cream-100 text-ink-700">
      {/* Hero â€” editorial split, NO shared hero image */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream-50 to-cream-100">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-12 h-[400px] w-[400px] rounded-full bg-brand-200/30 blur-3xl" />
          <div className="absolute -right-32 bottom-0 h-[360px] w-[360px] rounded-full bg-accent-100/35 blur-3xl" />
          <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-40" />
        </div>

        <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-6 pb-12 pt-20 lg:grid-cols-[1fr_0.85fr] lg:gap-16 lg:pt-28">
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            <span className="inline-flex items-center gap-2 rounded-pill border border-cream-300 bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              {copy.badge}
            </span>
            <h1 className="mt-6 font-serif font-medium text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.96] tracking-[-0.025em] text-ink-800">
              {copy.title}
            </h1>
            <p className="mt-6 text-base leading-relaxed text-ink-500 md:text-lg">
              {copy.subtitle}
            </p>

            {/* Quick contact rail */}
            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {copy.items.slice(0, 2).map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-card border border-cream-300 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft"
                  >
                    <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-card border border-cream-300 bg-cream-100 text-brand-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">
                        {item.label}
                      </p>
                      <p className="truncate text-sm font-semibold text-ink-800">
                        {item.value}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </motion.div>

          {/* Right â€” letter mock */}
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.7, delay: reduced ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden lg:block"
          >
            <div className="absolute -left-6 top-6 h-full w-full rotate-[-3deg] rounded-card-lg border border-cream-300 bg-white/70 shadow-soft" />
            <div className="relative rotate-[2deg] overflow-hidden rounded-card-lg border border-cream-300 bg-white p-8 shadow-deep">
              <div className="flex items-center justify-between border-b border-cream-300 pb-4">
                <span className="font-serif text-xl text-ink-800">
                  Lifestory.co
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                  Studio Note
                </span>
              </div>
              <p className="mt-5 font-serif text-2xl leading-snug text-ink-800">
                {isId
                  ? "Halo, mari kita mulai dengan secangkir kopi."
                  : "Hello, letâ€™s begin with a cup of coffee."}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">
                {isId
                  ? "Setiap proyek Lifestory dimulai dari sesi konsultasi yang tenang. Tidak ada pitch deck, hanya percakapan untuk memahami keluarga Anda."
                  : "Every Lifestory project begins with a calm consultation. No pitch deck, just a conversation to understand your family."}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-pill bg-brand-gradient text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                  {isId ? "Konsultasi gratis 30 menit" : "Free 30-minute discovery"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Mobile/tablet fallback â€” flat letter card */}
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.6, delay: reduced ? 0 : 0.18 }}
            className="relative overflow-hidden rounded-card-lg border border-cream-300 bg-white p-6 shadow-soft lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-cream-300 pb-3">
              <span className="font-serif text-lg text-ink-800">Lifestory.co</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                Studio Note
              </span>
            </div>
            <p className="mt-4 font-serif text-xl leading-snug text-ink-800">
              {isId
                ? "Mari kita mulai dengan secangkir kopi."
                : "Letâ€™s begin with a cup of coffee."}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              {isId
                ? "Konsultasi 30 menit, tanpa pitch deck â€” hanya percakapan."
                : "A 30-minute consult, no pitch deck, just a conversation."}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: reduced ? 0.01 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-card-lg border border-cream-300 bg-white/85 p-7 shadow-elev backdrop-blur-sm md:p-9"
          >
            <div className="mb-7 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
                {copy.formLabel}
              </p>
              <h2 className="font-serif text-[clamp(1.6rem,3vw,2.3rem)] text-ink-800">
                {copy.formIntro}
              </h2>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <FloatingInput
                  required
                  name="name"
                  label={copy.name}
                  hint={copy.namePlaceholder}
                  iconLeft={<User2 />}
                  autoComplete="name"
                  minLength={2}
                  maxLength={120}
                />
                <FloatingInput
                  required
                  type="email"
                  name="email"
                  label={copy.email}
                  hint={copy.emailPlaceholder}
                  iconLeft={<Mail />}
                  autoComplete="email"
                  maxLength={254}
                />
              </div>

              <FloatingTextarea
                required
                name="message"
                label={copy.message}
                hint={copy.messagePlaceholder}
                rows={6}
                minLength={10}
                maxLength={4000}
              />

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Button
                  type="submit"
                  loading={status === "sending"}
                  iconRight={
                    status === "sent" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )
                  }
                  animateRightIcon
                  size="lg"
                >
                  {status === "sending"
                    ? copy.sending
                    : status === "sent"
                    ? copy.sent
                    : copy.send}
                </Button>
                {status === "sent" && (
                  <p
                    className="inline-flex items-center gap-2 text-sm text-success"
                    role="status"
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-success" />
                    {copy.thanks}
                  </p>
                )}
                {error && (
                  <p
                    className="inline-flex items-center gap-2 text-sm text-danger"
                    role="alert"
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-danger" />
                    {error}
                  </p>
                )}
              </div>
            </form>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: reduced ? 0.01 : 0.55, delay: reduced ? 0 : 0.1, ease: "easeOut" }}
            className="space-y-5"
          >
            <div className="rounded-[28px] border border-[#dfd2be] bg-[linear-gradient(150deg,#fff8ea_0%,#fffdf6_60%,#fff_100%)] p-7 shadow-[0_18px_36px_rgba(59,43,24,0.1)]">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#82693c]">
                    {copy.infoTitle}
                  </p>
                  <p className="mt-1 max-w-xs text-sm leading-relaxed text-[#6e6258]">
                    {copy.infoNote}
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#dccfb3] bg-white/80 text-[#82693c]">
                  <MessageCircle className="h-5 w-5" />
                </span>
              </div>

              <div className="space-y-3">
                {copy.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-2xl border border-[#eee1cb] bg-white/85 p-4 transition hover:border-[#c8b187] hover:bg-white"
                    >
                      <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-[#dccfb3] bg-[#fdfbf6] text-[#82693c]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#82693c]">
                          {item.label}
                        </p>
                        <p className="mt-0.5 break-words text-sm font-semibold leading-relaxed text-[#3f342d]">
                          {item.value}
                        </p>
                        <p className="text-xs leading-relaxed text-[#7b6f63]">
                          {item.note}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#dfd2be] bg-white/82 p-6 shadow-[0_14px_28px_rgba(59,43,24,0.08)]">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-[#dccfb3] bg-[#fdfbf6] text-[#82693c]">
                  <Clock3 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#82693c]">
                    {copy.responseTitle}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[#6e6258]">
                    {copy.responseBody}
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>
    </div>
  );
}
