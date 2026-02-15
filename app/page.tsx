"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "../components/ui/Button";
import {
  motion,
  type Variants,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Fingerprint,
  Globe,
  Image as ImageIcon,
  Lock,
  Share2,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { useMemo, useRef } from "react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

type PremiumFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const highlights: PremiumFeature[] = [
  {
    icon: Lock,
    title: "Privasi kelas premium",
    description: "Data keluarga tersimpan aman dan hanya bisa diakses oleh orang yang kamu undang.",
  },
  {
    icon: Users,
    title: "Kolaborasi antar generasi",
    description: "Anak, orang tua, dan kerabat bisa menambahkan cerita dan foto dalam satu ruang.",
  },
  {
    icon: Share2,
    title: "Arsip yang mudah dibagikan",
    description: "Bagikan momen penting ke anggota keluarga dengan kontrol akses yang jelas.",
  },
  {
    icon: Sparkles,
    title: "Catatan lebih rapi",
    description: "Setiap cerita, tanggal, dan relasi keluarga tertata supaya mudah dibaca ulang.",
  },
  {
    icon: Globe,
    title: "Akses dari mana saja",
    description: "Buka arsip keluarga dari perangkat apa pun tanpa setup yang rumit.",
  },
  {
    icon: Zap,
    title: "Cepat dan nyaman",
    description: "Antarmuka ringan dan fokus ke hal penting: kenangan dan hubungan keluarga.",
  },
  {
    icon: ImageIcon,
    title: "Visual arsip sinematik",
    description: "Foto, dokumen, dan memorabilia tampil elegan seperti galeri warisan pribadi.",
  },
  {
    icon: Fingerprint,
    title: "Identity control modern",
    description: "Hak akses terstruktur untuk anggota keluarga, editor, dan admin inti.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Buat ruang keluarga",
    description: "Mulai dengan profil utama, lalu susun cabang keluarga secara bertahap.",
  },
  {
    step: "02",
    title: "Isi foto dan cerita",
    description: "Unggah dokumentasi lama, tulis kisah penting, dan simpan momen spesial.",
  },
  {
    step: "03",
    title: "Jaga untuk masa depan",
    description: "Arsip tetap tersusun sehingga generasi berikutnya bisa memahami akar keluarga.",
  },
];

const familyPreview = [
  { name: "Ari Rahman", role: "Kakek - 1942" },
  { name: "Mira Rahman", role: "Ibu - 1974" },
  { name: "Nadia Rahman", role: "Cucu - 2003" },
];

const heroStats = [
  { value: "25+", label: "Keluarga aktif mengarsipkan kisah" },
  { value: "1200+", label: "Foto dan dokumen tersusun rapi" },
  { value: "99.9%", label: "Keandalan akses arsip keluarga" },
];

const tickerMoments = [
  "Catatan silsilah antar generasi",
  "Kisah keluarga tersusun berdasarkan timeline",
  "Ruang kolaborasi privat untuk kerabat",
  "Foto lawas dipadukan cerita yang kontekstual",
  "Akses lintas perangkat dengan performa cepat",
  "Arsip personal dengan sistem izin fleksibel",
];

function FeatureCard({ item }: { item: PremiumFeature }) {
  const Icon = item.icon;

  return (
    <motion.article
      variants={fadeUp}
      className="group relative overflow-hidden rounded-2xl border border-warmBorder bg-white/85 p-6 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-accent-200 hover:shadow-[0_16px_34px_rgba(60,102,94,0.15)]"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent-100/45 blur-xl transition group-hover:bg-accent-100/75" />
      <div className="relative mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-50 text-accent-700 shadow-sm ring-1 ring-accent-100">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="relative mb-2 text-lg font-semibold text-warmText">{item.title}</h3>
      <p className="relative text-sm leading-relaxed text-warmMuted">{item.description}</p>
    </motion.article>
  );
}

export default function HomePage() {
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const orbLeftY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 140]), {
    stiffness: 80,
    damping: 24,
    mass: 0.6,
  });
  const orbRightY = useSpring(useTransform(scrollYProgress, [0, 1], [0, -110]), {
    stiffness: 80,
    damping: 24,
    mass: 0.6,
  });
  const cockpitY = useSpring(useTransform(scrollYProgress, [0, 1], [0, 70]), {
    stiffness: 70,
    damping: 22,
    mass: 0.6,
  });
  const cockpitScale = useSpring(useTransform(scrollYProgress, [0, 1], [1, 0.96]), {
    stiffness: 80,
    damping: 24,
    mass: 0.7,
  });
  const tickerLoop = useMemo(() => [...tickerMoments, ...tickerMoments], []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-warm-50 via-[#fdfbf7] to-white text-warmText selection:bg-gold-100 selection:text-warmText">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          style={{ y: orbLeftY }}
          className="absolute -left-28 -top-32 h-80 w-80 rounded-full bg-gold-200/45 blur-3xl"
        />
        <motion.div
          style={{ y: orbRightY }}
          className="absolute -right-24 top-36 h-80 w-80 rounded-full bg-accent-100/80 blur-3xl"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(164,146,117,0.08)_1px,transparent_0)] [background-size:22px_22px]" />
      </div>

      <section
        ref={heroRef}
        className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-20 md:grid-cols-[1.08fr_0.92fr] md:items-center md:pt-28"
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-7 md:pr-3"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-warmBorder bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-700">
            <Sparkles className="h-3.5 w-3.5" />
            Model 2025 Family Archive Experience
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-serif text-4xl leading-tight text-warmText sm:text-5xl md:text-6xl">
            Website keluarga dengan motion premium, terasa hidup sejak first scroll.
          </motion.h1>

          <motion.p variants={fadeUp} className="max-w-xl text-lg leading-relaxed text-warmMuted">
            Lifestory menyatukan arsip keluarga, cerita, dan visual timeline dalam antarmuka yang modern, halus, dan classy untuk desktop maupun mobile.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={isLoggedIn ? "/app" : "/auth/register"}>
              <Button className="h-12 rounded-full px-7 text-sm shadow-[0_14px_28px_rgba(130,105,60,0.24)]">
                {isLoggedIn ? "Buka Pohon Keluarga" : "Mulai Gratis"}
              </Button>
            </Link>
            <Link href="/gallery">
              <Button
                variant="secondary"
                className="h-12 rounded-full border-warmBorder bg-white px-7 text-sm text-warmText shadow-sm hover:bg-warm-100"
              >
                Lihat Galeri Publik
              </Button>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent-700 hover:text-accent-800"
            >
              Pelajari konsepnya
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-7 grid gap-3 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-warmBorder bg-white/80 p-4 shadow-[0_8px_20px_rgba(117,98,70,0.08)] backdrop-blur-sm"
              >
                <p className="text-2xl font-bold text-accent-700">{stat.value}</p>
                <p className="mt-1 text-xs leading-relaxed text-warmMuted">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          style={{ y: cockpitY, scale: cockpitScale }}
          className="relative md:pl-2"
        >
          <div className="absolute -bottom-12 left-1/2 h-28 w-4/5 -translate-x-1/2 rounded-full bg-accent-200/40 blur-2xl" />
          <div className="relative overflow-hidden rounded-[32px] border border-warmBorder bg-white/88 p-6 shadow-[0_28px_84px_rgba(85,73,53,0.24)] backdrop-blur-md">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(31,111,98,0.11),transparent_42%),radial-gradient(circle_at_15%_90%,rgba(176,142,81,0.12),transparent_40%)]" />
            <div className="relative mb-5 flex items-center justify-between">
              <p className="text-sm font-semibold text-warmText">Family Command Center</p>
              <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">
                Realtime Synced
              </span>
            </div>

            <div className="relative h-[350px] overflow-hidden rounded-2xl border border-warmBorder bg-gradient-to-b from-white to-warm-50/70 p-4">
              <motion.svg
                viewBox="0 0 360 260"
                className="absolute inset-0 h-full w-full"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: [0.42, 0.62, 0.42] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.path
                  d="M56 64 C120 20, 208 20, 292 70"
                  stroke="rgba(31,111,98,0.38)"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0.3 }}
                  animate={{ pathLength: [0.25, 1, 0.25] }}
                  transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.path
                  d="M74 182 C132 130, 220 130, 282 185"
                  stroke="rgba(130,105,60,0.38)"
                  strokeWidth="2"
                  fill="none"
                  initial={{ pathLength: 0.3 }}
                  animate={{ pathLength: [0.25, 1, 0.25] }}
                  transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
              </motion.svg>

              <motion.div
                animate={{ y: [0, -10, 0], x: [0, 3, 0] }}
                transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-3 top-4 w-[48%] rounded-2xl border border-warmBorder bg-white/90 p-3 shadow-[0_10px_22px_rgba(117,98,70,0.12)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-accent-600">
                  Root Story
                </p>
                <p className="mt-1 text-sm font-semibold text-warmText">Ari Rahman</p>
                <p className="text-xs text-warmMuted">Catatan keluarga inti 1942 - sekarang</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0], x: [0, -4, 0] }}
                transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="absolute right-3 top-12 w-[45%] rounded-2xl border border-warmBorder bg-white/85 p-3 shadow-[0_10px_22px_rgba(117,98,70,0.11)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-gold-700">
                  Timeline
                </p>
                <p className="mt-1 text-sm font-semibold text-warmText">Momen 3 Generasi</p>
                <p className="text-xs text-warmMuted">Foto, dokumen, dan memo suara keluarga.</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className="absolute bottom-5 left-1/2 w-[85%] -translate-x-1/2 rounded-2xl border border-accent-200 bg-accent-50/75 p-4"
              >
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-accent-700">
                  <Workflow className="h-3.5 w-3.5" />
                  Family Flow
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {familyPreview.map((member) => (
                    <div key={member.name} className="rounded-xl border border-accent-100 bg-white/80 p-2.5">
                      <p className="text-sm font-semibold text-warmText">{member.name}</p>
                      <p className="text-[11px] leading-relaxed text-warmMuted">{member.role}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-20">
        <div className="overflow-hidden rounded-full border border-warmBorder bg-white/82 p-2 shadow-[0_8px_20px_rgba(117,98,70,0.08)] backdrop-blur-sm">
          <div className="story-marquee-track">
            {tickerLoop.map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="mx-2 inline-flex shrink-0 items-center gap-2 rounded-full border border-warmBorder bg-white px-4 py-2 text-sm text-warmMuted"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent-600" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-y border-warmBorder/80 py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(31,111,98,0.12),transparent_38%),radial-gradient(circle_at_85%_80%,rgba(176,142,81,0.16),transparent_42%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(29,26,20,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(29,26,20,0.03)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:radial-gradient(circle_at_center,#000_63%,transparent_100%)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="mb-10 max-w-3xl"
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-accent-700">
              Kenapa terasa premium
            </p>
            <h2 className="font-serif text-3xl text-warmText sm:text-4xl">
              Motion system yang sengaja dirancang untuk UX halus, bukan efek tempelan.
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            {highlights.map((item) => (
              <FeatureCard key={item.title} item={item} />
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-accent-700">
              Experience Flow
            </p>
            <h2 className="font-serif text-3xl text-warmText sm:text-4xl">
              Dari kenangan lama ke arsip digital dalam alur yang jelas.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-warmMuted sm:text-base">
              Setiap langkah didesain agar keluarga non-teknis pun nyaman: tambah data, rapikan struktur, lalu bagikan ke anggota dengan kontrol yang aman.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { icon: BookOpen, text: "Story-first information architecture" },
                { icon: Users, text: "Kolaborasi multi-user dengan peran jelas" },
                { icon: Clock3, text: "Timeline akses cepat untuk sejarah keluarga" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-center gap-3 rounded-xl border border-warmBorder bg-white/70 px-4 py-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <p className="text-sm text-warmText">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <div className="relative pl-10">
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute left-3 top-6 h-[calc(100%-3rem)] w-px origin-top bg-gradient-to-b from-accent-400 via-gold-500 to-transparent"
            />

            <div className="space-y-5">
              {processSteps.map((step, index) => (
                <motion.article
                  key={step.step}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                  className="relative overflow-hidden rounded-2xl border border-warmBorder bg-white/84 p-6 backdrop-blur-sm shadow-[0_10px_26px_rgba(117,98,70,0.1)]"
                >
                  <div className="absolute -left-10 top-6 flex h-7 w-7 items-center justify-center rounded-full border border-accent-200 bg-white text-[11px] font-semibold text-accent-700">
                    {step.step}
                  </div>
                  <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gold-200/45 blur-xl" />
                  <h3 className="relative text-xl font-semibold text-warmText">{step.title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-warmMuted">{step.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.6 }}
          className="lux-cta-gradient relative overflow-hidden rounded-[34px] border border-white/20 px-7 py-10 text-white shadow-[0_28px_86px_rgba(14,45,41,0.36)] sm:px-10 sm:py-12"
        >
          <motion.div
            animate={{ x: [0, 26, 0], y: [0, -12, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-16 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 8, 0] }}
            transition={{ duration: 8.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="absolute -bottom-14 left-6 h-36 w-36 rounded-full bg-gold-300/30 blur-3xl"
          />

          <div className="relative max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-100">
              Premium CTA
            </p>
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
              Naikkan kualitas website keluarga ke level produk digital 2025.
            </h2>
            <p className="mt-3 text-sm text-white/80 sm:text-base">
              Struktur data, motion direction, dan visual depth disusun untuk bikin pengunjung langsung paham value-nya, lalu klik CTA.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href={isLoggedIn ? "/app" : "/auth/register"}>
                <Button className="h-12 rounded-full bg-white px-7 text-sm font-semibold text-accent-900 hover:bg-warm-100">
                  {isLoggedIn ? "Lanjutkan ke Aplikasi" : "Buat Akun Sekarang"}
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="secondary"
                  className="h-12 rounded-full border-white/40 bg-white/10 px-7 text-sm text-white hover:bg-white/20"
                >
                  Tanya Tim Kami
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
