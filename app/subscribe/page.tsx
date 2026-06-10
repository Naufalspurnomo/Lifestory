"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  MessageCircle,
  Sparkles,
  TreePine,
  Wallet,
} from "lucide-react";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { Button } from "../../components/ui/Button";
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_NUMBER,
} from "../../lib/contact-info";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

export default function SubscribePage() {
  const { data: session } = useSession();
  const { locale } = useLanguage();
  const user = session?.user;
  const isSubscribed = user?.subscriptionActive;
  const isId = locale === "id";
  const { reduced } = useMotionGuard();

  const copy = isId
    ? {
        plans: [
          {
            name: "Paket Keluarga",
            tag: "Unggulan",
            price: "Rp 99.000",
            period: "/ bulan",
            tagline: "Ruang arsip privat untuk keluarga modern.",
            features: [
              "Pohon silsilah interaktif tanpa batas",
              "Arsip foto & dokumen keluarga",
              "Undang anggota keluarga untuk kolaborasi",
              "Backup data otomatis",
            ],
          },
        ],
        paymentMethods: [
          {
            name: "BCA",
            number: "1234567890",
            holder: "PT Lifestory Indonesia",
            icon: Building2,
          },
          {
            name: "Mandiri",
            number: "0987654321",
            holder: "PT Lifestory Indonesia",
            icon: Building2,
          },
          {
            name: "GoPay / OVO / Dana",
            number: CONTACT_PHONE_DISPLAY,
            holder: "Lifestory",
            icon: Wallet,
          },
        ],
        orderMessage: (name: string, email: string, planName: string) =>
          `Halo Admin Lifestory!\n\nSaya ingin berlangganan ${planName}.\n\nNama: ${name}\nEmail: ${email}\n\nMohon konfirmasi pembayaran saya. Terima kasih!`,
        activeBadge: "Status Aktif",
        activeTitle: "Langganan Anda aktif.",
        activeBody:
          "Terima kasih telah menjadi bagian dari Lifestory. Nikmati semua fitur untuk merawat kisah keluarga.",
        activeCta: "Buka Pohon Keluarga",
        exploreCta: "Jelajahi Galeri",
        sectionLabel: "Berlangganan",
        heading: "Abadikan sejarah keluarga Anda.",
        subheading:
          "Bangun pohon silsilah interaktif, simpan kenangan berharga, dan wariskan cerita keluarga untuk generasi mendatang.",
        highlights: [
          "Akses penuh tanpa batas anggota",
          "Backup otomatis & enkripsi",
          "Kolaborasi multi-perangkat",
        ],
        paymentTitle: "Tiga langkah pembayaran",
        paymentSubtitle:
          "Proses ringkas dengan pendampingan langsung dari tim Lifestory.",
        paymentStep1: "Transfer ke rekening berikut",
        paymentStep1Desc:
          "Pilih salah satu metode di bawah dan transfer sesuai jumlah paket.",
        accountNamePrefix: "a.n.",
        paymentStep2: "Konfirmasi pembayaran via WhatsApp",
        paymentStep2Desc:
          "Pesan otomatis kami siapkan untuk mempercepat verifikasi.",
        whatsappCta: "Konfirmasi via WhatsApp",
        paymentStep3: "Akun aktif dalam 1x24 jam",
        paymentStep3Body:
          "Admin memverifikasi pembayaran dan mengaktifkan akun. Notifikasi aktivasi dikirim ke email Anda.",
        loginPromptPrefix: "Masuk",
        loginPromptMiddle: "atau",
        loginPromptRegister: "daftar",
        loginPromptSuffix: "terlebih dahulu sebelum berlangganan.",
        stepLabel: (n: number) => `Langkah 0${n}`,
      }
    : {
        plans: [
          {
            name: "Family Plan",
            tag: "Signature",
            price: "Rp 99.000",
            period: "/ month",
            tagline: "A private archive space for modern families.",
            features: [
              "Unlimited interactive family trees",
              "Family photo and document archive",
              "Invite family members to collaborate",
              "Automatic data backup",
            ],
          },
        ],
        paymentMethods: [
          {
            name: "BCA",
            number: "1234567890",
            holder: "PT Lifestory Indonesia",
            icon: Building2,
          },
          {
            name: "Mandiri",
            number: "0987654321",
            holder: "PT Lifestory Indonesia",
            icon: Building2,
          },
          {
            name: "GoPay / OVO / Dana",
            number: CONTACT_PHONE_DISPLAY,
            holder: "Lifestory",
            icon: Wallet,
          },
        ],
        orderMessage: (name: string, email: string, planName: string) =>
          `Hello Lifestory Admin!\n\nI want to subscribe to ${planName}.\n\nName: ${name}\nEmail: ${email}\n\nPlease confirm my payment. Thank you!`,
        activeBadge: "Active Status",
        activeTitle: "Your subscription is active.",
        activeBody:
          "Thank you for being part of Lifestory. Enjoy every feature designed to preserve your family stories.",
        activeCta: "Open Family Tree",
        exploreCta: "Explore Gallery",
        sectionLabel: "Subscription",
        heading: "Preserve your family history.",
        subheading:
          "Build interactive family trees, store precious memories, and pass down your stories to future generations.",
        highlights: [
          "Full access for unlimited members",
          "Auto backup and encryption",
          "Cross-device collaboration",
        ],
        paymentTitle: "Three steps to subscribe",
        paymentSubtitle: "A simple flow guided personally by the Lifestory team.",
        paymentStep1: "Transfer to one of the accounts below",
        paymentStep1Desc:
          "Pick the account that suits you and transfer the package amount.",
        accountNamePrefix: "a/n",
        paymentStep2: "Confirm payment via WhatsApp",
        paymentStep2Desc:
          "We prepare an auto-filled message to speed up verification.",
        whatsappCta: "Confirm via WhatsApp",
        paymentStep3: "Account activates within 24 hours",
        paymentStep3Body:
          "Admin verifies your payment and activates your account. You will receive an email notification right after.",
        loginPromptPrefix: "Login",
        loginPromptMiddle: "or",
        loginPromptRegister: "register",
        loginPromptSuffix: "first before subscribing.",
        stepLabel: (n: number) => `Step 0${n}`,
      };

  const selectedPlan = copy.plans[0];
  const orderText = encodeURIComponent(
    copy.orderMessage(
      user?.name || "-",
      user?.email || "-",
      selectedPlan.name
    )
  );

  if (isSubscribed) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-cream-50 via-cream-100 to-cream-200 text-ink-700">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-20 h-[400px] w-[400px] rounded-full bg-brand-200/35 blur-3xl" />
          <div className="absolute -right-32 bottom-16 h-[360px] w-[360px] rounded-full bg-accent-100/35 blur-3xl" />
          <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-40" />
        </div>
        <section className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-card-lg border border-cream-300 bg-white/86 p-9 shadow-elev backdrop-blur-sm"
          >
            <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-card-lg border border-[#cfe3d2] bg-[linear-gradient(150deg,#f1faef_0%,#fbfff8_100%)] text-success">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
              {copy.activeBadge}
            </p>
            <h1 className="mt-2 font-serif text-[clamp(2rem,4.4vw,3.2rem)] leading-tight text-ink-800">
              {copy.activeTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-500">
              {copy.activeBody}
            </p>
            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Link href="/app" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  block
                  iconRight={<ArrowRight className="h-4 w-4" />}
                  animateRightIcon
                  className="sm:w-auto"
                >
                  {copy.activeCta}
                </Button>
              </Link>
              <Link href="/gallery" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" block className="sm:w-auto">
                  {copy.exploreCta}
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#faf6ed] via-[#fdfbf6] to-[#faf6ed] text-[#40342c]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#dfceb0]/45 blur-3xl" />
        <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-[#ece2cc]/65 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(164,146,117,0.06)_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <section className="relative mx-auto max-w-5xl px-6 pb-12 pt-16 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.55, ease: "easeOut" }}
          className="space-y-4 text-center"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-[#dccfb3] bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#82693c]">
            <Sparkles className="h-3.5 w-3.5 text-[#82693c]" />
            {copy.sectionLabel}
          </p>
          <h1 className="font-serif text-[clamp(2.2rem,5.4vw,4.4rem)] leading-[1] tracking-[-0.02em] text-[#3f342d]">
            {copy.heading}
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-[#73685f] md:text-lg">
            {copy.subheading}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {copy.highlights.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#dccfb3] bg-white/75 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#7b6f63] backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-3xl px-6 pb-12">
        {copy.plans.map((plan) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: reduced ? 0.01 : 0.55, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[28px] border border-[#dfd2be] bg-[linear-gradient(150deg,#fff8ea_0%,#fffdf6_55%,#fff_100%)] p-8 shadow-[0_24px_50px_rgba(88,74,51,0.16)]"
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[rgba(228,191,112,0.18)]" />
            <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[rgba(202,162,79,0.12)]" />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#82693c]">
                    {plan.tag}
                  </p>
                  <h2 className="mt-1 font-serif text-3xl text-[#3f342d]">
                    {plan.name}
                  </h2>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dccfb3] bg-white/85 text-[#82693c]">
                  <TreePine className="h-5 w-5" />
                </span>
              </div>

              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#6e6258]">
                {plan.tagline}
              </p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-[clamp(2.5rem,5vw,3.6rem)] leading-none text-[#3f342d]">
                  {plan.price}
                </span>
                <span className="text-sm text-[#7b6f63]">{plan.period}</span>
              </div>

              <ul className="mt-6 grid gap-2.5 md:grid-cols-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 rounded-xl border border-[#eee1cb] bg-white/85 p-3 text-sm text-[#5a4d42]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#82693c]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="relative mx-auto max-w-4xl px-6 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reduced ? 0.01 : 0.55, ease: "easeOut" }}
          className="mb-8 max-w-2xl"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#82693c]">
            {copy.paymentTitle}
          </p>
          <h2 className="mt-2 font-serif text-[clamp(1.8rem,3.6vw,2.6rem)] leading-tight text-[#3f342d]">
            {copy.paymentSubtitle}
          </h2>
        </motion.div>

        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: reduced ? 0.01 : 0.5, ease: "easeOut" }}
            className="rounded-3xl border border-[#dfd2be] bg-white/85 p-6 shadow-[0_14px_28px_rgba(59,43,24,0.08)] md:p-7"
          >
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex flex-1 items-start gap-4 min-w-[260px]">
                <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-[#dccfb3] bg-[#fdfbf6] text-[#82693c] font-serif text-lg font-semibold">
                  01
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#82693c]">
                    {copy.stepLabel(1)}
                  </p>
                  <h3 className="mt-1 font-serif text-xl text-[#3f342d]">
                    {copy.paymentStep1}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#6e6258]">
                    {copy.paymentStep1Desc}
                  </p>
                </div>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dccfb3] bg-white text-[#82693c]">
                <CreditCard className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {copy.paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.name}
                    className="rounded-2xl border border-[#eee1cb] bg-[#fffcf7] p-4 transition hover:border-[#c8b187] hover:bg-white"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#82693c]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="font-semibold text-[#3f342d]">{method.name}</p>
                    </div>
                    <p className="font-mono text-sm text-[#5a4d42]">
                      {method.number}
                    </p>
                    <p className="text-xs text-[#7b6f63]">
                      {copy.accountNamePrefix} {method.holder}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.05, ease: "easeOut" }}
            className="rounded-3xl border border-[#dfd2be] bg-white/85 p-6 shadow-[0_14px_28px_rgba(59,43,24,0.08)] md:p-7"
          >
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex flex-1 items-start gap-4 min-w-[260px]">
                <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-[#dccfb3] bg-[#fdfbf6] text-[#82693c] font-serif text-lg font-semibold">
                  02
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#82693c]">
                    {copy.stepLabel(2)}
                  </p>
                  <h3 className="mt-1 font-serif text-xl text-[#3f342d]">
                    {copy.paymentStep2}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#6e6258]">
                    {copy.paymentStep2Desc}
                  </p>
                </div>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#dccfb3] bg-white text-[#82693c]">
                <MessageCircle className="h-4 w-4" />
              </span>
            </div>

            <a
              href={`https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${orderText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#22a35a] px-6 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white shadow-[0_12px_26px_rgba(34,163,90,0.3)] transition hover:-translate-y-0.5 hover:bg-[#1a8b4a] hover:shadow-[0_16px_30px_rgba(34,163,90,0.36)]"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {copy.whatsappCta}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.1, ease: "easeOut" }}
            className="rounded-3xl border border-[#dfd2be] bg-white/85 p-6 shadow-[0_14px_28px_rgba(59,43,24,0.08)] md:p-7"
          >
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex flex-1 items-start gap-4 min-w-[260px]">
                <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl border border-[#dccfb3] bg-[#fdfbf6] text-[#82693c] font-serif text-lg font-semibold">
                  03
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#82693c]">
                    {copy.stepLabel(3)}
                  </p>
                  <h3 className="mt-1 font-serif text-xl text-[#3f342d]">
                    {copy.paymentStep3}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6e6258]">
                    {copy.paymentStep3Body}
                  </p>
                </div>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#cfe3d2] bg-[#f1faef] text-[#5a7d5e]">
                <BadgeCheck className="h-4 w-4" />
              </span>
            </div>
          </motion.div>
        </div>

        {!user && (
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.15 }}
            className="mx-auto mt-8 max-w-xl rounded-2xl border border-[#e9d4a3] bg-[linear-gradient(150deg,#fdfbf6_0%,#fffdf6_100%)] p-5 text-center shadow-[0_14px_28px_rgba(149,110,33,0.14)]"
          >
            <p className="text-sm text-[#7e570f]">
              <Link
                href="/auth/login"
                className="font-semibold underline-offset-2 transition hover:underline"
              >
                {copy.loginPromptPrefix}
              </Link>{" "}
              {copy.loginPromptMiddle}{" "}
              <Link
                href="/auth/register"
                className="font-semibold underline-offset-2 transition hover:underline"
              >
                {copy.loginPromptRegister}
              </Link>{" "}
              {copy.loginPromptSuffix}
            </p>
          </motion.div>
        )}
      </section>
    </div>
  );
}
