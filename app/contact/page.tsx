"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "../../components/providers/LanguageProvider";

const heroImage = "/hero-bg.jpg";

export default function ContactPage() {
  const { locale } = useLanguage();
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
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
        thanks:
          "Terima kasih. Tim Lifestory akan menghubungi Anda dalam 1x24 jam.",
        infoTitle: "Cara lain menjangkau kami",
        infoNote:
          "Pilih saluran yang paling nyaman. Kami merespons dengan ritme yang tenang, sesuai semangat Lifestory.",
        items: [
          {
            icon: Mail,
            label: "Email",
            value: "halo@lifestory.co",
            note: "Pertanyaan umum dan kerja sama",
          },
          {
            icon: Phone,
            label: "Telepon",
            value: "+62 812 3456 7890",
            note: "Senin - Jumat, 09.00 - 17.00 WIB",
          },
          {
            icon: MapPin,
            label: "Studio",
            value: "Jakarta, Indonesia",
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
        thanks: "Thanks. The Lifestory team will reply within one working day.",
        infoTitle: "Other ways to reach us",
        infoNote:
          "Pick the channel that feels right. We reply with a calm rhythm, matching the Lifestory pace.",
        items: [
          {
            icon: Mail,
            label: "Email",
            value: "hello@lifestory.co",
            note: "General inquiries and partnerships",
          },
          {
            icon: Phone,
            label: "Phone",
            value: "+62 812 3456 7890",
            note: "Mon - Fri, 09.00 - 17.00 WIB",
          },
          {
            icon: MapPin,
            label: "Studio",
            value: "Jakarta, Indonesia",
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
    await new Promise((resolve) => setTimeout(resolve, 800));
    setStatus("sent");
  }

  return (
    <div className="bg-[#f7f5f1] text-[#40342c]">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 scale-[1.02] bg-cover bg-center"
          style={{ backgroundImage: `url("${heroImage}")` }}
        />
        <div className="absolute inset-0 bg-[rgba(245,236,219,0.7)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.74)_0%,rgba(245,236,219,0.18)_45%,rgba(247,245,241,0.96)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.55),transparent_42%),radial-gradient(circle_at_82%_8%,rgba(228,191,112,0.22),transparent_34%)]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 md:pb-20 md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dccfb7] bg-[rgba(255,255,255,0.72)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7b6f63] backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#c48b24]" />
              {copy.badge}
            </p>
            <h1 className="font-serif text-[clamp(2.4rem,6vw,4.6rem)] leading-[1] tracking-[-0.02em] text-[#3f342d]">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-2xl text-[clamp(1rem,1.6vw,1.2rem)] leading-relaxed text-[#73685f]">
              {copy.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="rounded-[28px] border border-[#dfd2be] bg-white/85 p-7 shadow-[0_22px_44px_rgba(59,43,24,0.1)] backdrop-blur-sm md:p-9"
          >
            <div className="mb-7 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9b845f]">
                {copy.formLabel}
              </p>
              <h2 className="font-serif text-[clamp(1.7rem,3vw,2.3rem)] text-[#3f342d]">
                {copy.formIntro}
              </h2>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7b6f63]">
                    {copy.name}
                  </span>
                  <input
                    required
                    name="name"
                    placeholder={copy.namePlaceholder}
                    className="w-full rounded-xl border border-[#e2d4be] bg-white px-4 py-3 text-sm text-[#3f342d] placeholder:text-[#a99e8f] outline-none transition focus:border-[#c48b24] focus:ring-2 focus:ring-[#f6e5c1]"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7b6f63]">
                    {copy.email}
                  </span>
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder={copy.emailPlaceholder}
                    className="w-full rounded-xl border border-[#e2d4be] bg-white px-4 py-3 text-sm text-[#3f342d] placeholder:text-[#a99e8f] outline-none transition focus:border-[#c48b24] focus:ring-2 focus:ring-[#f6e5c1]"
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#7b6f63]">
                  {copy.message}
                </span>
                <textarea
                  required
                  name="message"
                  rows={5}
                  placeholder={copy.messagePlaceholder}
                  className="w-full resize-none rounded-xl border border-[#e2d4be] bg-white px-4 py-3 text-sm text-[#3f342d] placeholder:text-[#a99e8f] outline-none transition focus:border-[#c48b24] focus:ring-2 focus:ring-[#f6e5c1]"
                />
              </label>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#e6ab2f] to-[#cc8a12] px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_14px_30px_rgba(169,116,21,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(169,116,21,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === "sending"
                    ? copy.sending
                    : status === "sent"
                    ? copy.sent
                    : copy.send}
                  <ArrowRight className="h-4 w-4" />
                </button>
                {status === "sent" && (
                  <p className="inline-flex items-center gap-2 text-sm text-[#5a7d5e]">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#5a7d5e]" />
                    {copy.thanks}
                  </p>
                )}
              </div>
            </form>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
            className="space-y-5"
          >
            <div className="rounded-[28px] border border-[#dfd2be] bg-[linear-gradient(150deg,#fff8ea_0%,#fffdf6_60%,#fff_100%)] p-7 shadow-[0_18px_36px_rgba(59,43,24,0.1)]">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9b845f]">
                    {copy.infoTitle}
                  </p>
                  <p className="mt-1 max-w-xs text-sm leading-relaxed text-[#6e6258]">
                    {copy.infoNote}
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#ddc7a2] bg-white/80 text-[#b07f2f]">
                  <MessageCircle className="h-5 w-5" />
                </span>
              </div>

              <div className="space-y-3">
                {copy.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-2xl border border-[#eee1cb] bg-white/85 p-4 transition hover:border-[#dcc28e] hover:bg-white"
                    >
                      <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-[#ddc7a2] bg-[#fff7e8] text-[#b07f2f]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9b845f]">
                          {item.label}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-[#3f342d]">
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
                <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-[#ddc7a2] bg-[#fff7e8] text-[#b07f2f]">
                  <Clock3 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9b845f]">
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
