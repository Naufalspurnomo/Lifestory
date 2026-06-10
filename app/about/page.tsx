"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  Feather,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { Button } from "../../components/ui/Button";
import { RibbonBadge } from "../../components/ui/Ornament";
import { Container } from "../../components/ui/Container";
import { Eyebrow } from "../../components/ui/Eyebrow";
import { ChapterRow } from "../../components/about/ChapterRow";
import { PullQuote } from "../../components/about/PullQuote";
import { WhyNowDark } from "../../components/about/WhyNowDark";
import { PromiseGrid } from "../../components/about/PromiseGrid";
import { VisionMissionSplit } from "../../components/about/VisionMissionSplit";
import { ValuesMarquee } from "../../components/about/ValuesMarquee";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

export default function AboutPage() {
  const { locale } = useLanguage();
  const isId = locale === "id";
  const { reduced } = useMotionGuard();

  // ============================================================
  //  COPY
  // ============================================================
  const copy = isId
    ? {
        aboutLabel: "Tentang Lifestory Co.",
        heritage: "Sejarah",
        heroTitle: "Kisah hidup tidak berhenti di satu generasi.",
        heroBody:
          "Lifestory Company merangkai kenangan, percakapan, dan dokumen keluarga menjadi karya warisan agar identitas dan jejak hidup tetap dikenal generasi berikutnya.",
        heroHighlights: [
          "Arsip memori keluarga",
          "Narasi biografi berlapis emosi",
          "Warisan visual lintas generasi",
        ],
        heroPrimary: "Konsultasi paket",
        heroSecondary: "Lihat ruang kerja",

        // Manifesto pull quote
        manifestoEyebrow: "Manifesto Studio",
        manifestoQuote:
          "Hidup hanya satu kali. Cerita yang tidak ditulis akan hilang bersama orang yang membawanya.",
        manifestoBy: "Lifestory Studio · Sejak 2018",

        // 3 Chapters
        chaptersEyebrow: "Cara Kami Bekerja",
        chaptersTitle: "Tiga babak. Satu warisan.",
        chaptersLead:
          "Setiap proyek dijalankan sebagai pertunjukan editorial yang terstruktur, tidak terburu, dan menjaga emosi keluarga sebagai pusatnya.",
        chapters: [
          {
            phase: "Babak Mendengar",
            title: "Sebelum kalimat pertama ditulis.",
            body: "Kami memulai dengan sesi wawancara hangat di rumah keluarga Anda. Tidak ada daftar pertanyaan kaku, hanya percakapan yang membiarkan ingatan lama muncul kembali secara alami.",
            note: "Cerita yang baik selalu dimulai dari telinga, bukan dari pena.",
            icon: Feather,
            image: "/image/about-mendengar.webp",
          },
          {
            phase: "Babak Merangkai",
            title: "Memori menjadi narasi sinematik.",
            body: "Tim penulis dan art director menyusun alur, memilih foto, dan merancang halaman demi halaman. Kami merestorasi foto lama, mengoreksi tanggal, dan mengkonfirmasi setiap fakta dengan keluarga.",
            note: "Detail kecil seperti bau dapur, lagu favorit, dan panggilan keluarga membuat halaman terasa hidup.",
            icon: BookOpenText,
            image: "/image/about-merangkai.webp",
          },
          {
            phase: "Babak Mewariskan",
            title: "Diserahkan dengan upacara kecil.",
            body: "Buku, video, dan poster silsilah dipresentasikan langsung di hadapan keluarga, dalam kemasan kelas heirloom. Momen ini sengaja kami rayakan karena warisan layak diperlakukan seperti permata.",
            note: "Kami merilis hanya saat keluarga benar-benar bangga atas hasilnya.",
            icon: HeartHandshake,
            image: "/image/about-waris.webp",
          },
        ],

        // Why Now dark section
        whyNowEyebrow: "Kenapa Sekarang",
        whyNowTitle: "Tiga alasan kami tidak menunggu.",
        whyNowItems: [
          {
            number: "01",
            title: "Hidup terlalu berharga untuk diingat sekedar lewat foto.",
            body: "Tanpa cerita yang menyertai, foto hanya jadi gambar. Kami menyelamatkan suara, gestur, dan filosofi hidup di baliknya.",
          },
          {
            number: "02",
            title: "Banyak cucu tidak mengenal kakek-nenek mereka secara utuh.",
            body: "Generasi penghubung sering kehilangan kosa kata untuk bercerita. Kami menjadi penerjemahnya.",
          },
          {
            number: "03",
            title: "Pelajaran hidup yang tidak dicatat akan dipelajari ulang oleh keturunan dengan harga mahal.",
            body: "Pengalaman keluarga adalah modal pendidikan paling murah jika sempat ditulis ulang dengan rapi.",
          },
        ],

        // Promises (replacement for Purpose+Benefit list-walls)
        promisesEyebrow: "Yang Kami Janjikan",
        promisesTitle: "Lima janji yang membentuk semua keputusan kami.",
        promisesLead:
          "Setiap detail proses, dari pemilihan kertas hingga jadwal handover, dijaga oleh lima prinsip ini.",
        promiseItems: [
          {
            title: "Cerita lebih utuh, bukan sekedar lengkap.",
            body: "Kami merangkai konteks, emosi, dan latar belakang, bukan cuma daftar peristiwa kronologis.",
          },
          {
            title: "Warisan yang lebih dari harta.",
            body: "Yang kami wariskan adalah cara berpikir, prinsip, dan rasa hangat keluarga, bukan benda mati.",
          },
          {
            title: "Arsip yang rapi, bisa dilanjutkan.",
            body: "Format dirancang agar generasi berikutnya bisa menambahkan bab mereka sendiri.",
          },
          {
            title: "Hubungan keluarga yang lebih dekat.",
            body: "Sesi wawancara sering menjadi reuni emosional. Bonus itu sengaja kami jaga.",
          },
          {
            title: "Inspirasi melampaui keluarga.",
            body: "Banyak buku Lifestory akhirnya dibaca oleh tetangga, kolega, bahkan orang asing yang merasa terhubung.",
          },
        ],

        // Vision Mission
        visionLabel: "Visi",
        visionTitle: "Menjadi rumah penulisan kisah hidup paling dicari di Indonesia.",
        visionPoints: [
          "Memimpin kategori penulisan biografi keluarga premium.",
          "Menjadikan dokumentasi diri sebagai gerakan budaya, bukan privilese.",
          "Mempererat keluarga besar lewat cerita yang terdokumentasi.",
          "Memiliki galeri publik tempat masyarakat bisa membaca koleksi.",
        ],
        missionLabel: "Misi",
        missionTitle: "Setiap proyek diselesaikan seperti ini, tanpa pengecualian.",
        missionPoints: [
          "Konsep dan kemasan yang berbeda untuk setiap keluarga.",
          "Layanan profesional dengan kerahasiaan tingkat studio.",
          "Pendampingan purna jual untuk hubungan jangka panjang.",
          "Momen handover yang berkesan dan dirayakan.",
        ],

        // Marquee
        marqueeEyebrow: "Untuk Siapa",
        marqueeTitle: "Lifestory adalah jembatan antar generasi.",
        marqueePoints: [
          "Dari Ayah untuk anaknya",
          "Dari Anak untuk ayahnya",
          "Dari Saudara untuk saudaranya",
          "Dari Generasi ini untuk Generasi nanti",
          "Dari Cucu untuk Kakeknya",
          "Dari Ibu untuk anaknya",
        ],
        // Final CTA
        priorityLabel: "Yang Kami Utamakan",
        priorityTitle: "Spesial. Berkualitas. Selalu.",
        priorityBody:
          "Kami membentuk citra brand yang kuat dengan pekerjaan yang kuat, bukan sebaliknya. Kalau Anda merasa keluarga Anda layak diabadikan, mari kita bicara.",
        consultCta: "Konsultasi paket",
        exploreCta: "Lihat ruang kerja",
      }
    : {
        aboutLabel: "About Lifestory Co.",
        heritage: "Heritage",
        heroTitle: "A life story should not stop at one generation.",
        heroBody:
          "Lifestory Company weaves family memories, conversations, and documents into heirloom works so identity and life traces remain known to the next generation.",
        heroHighlights: [
          "Family memory archive",
          "Emotion-led biography narrative",
          "Cross-generation visual legacy",
        ],
        heroPrimary: "Consult packages",
        heroSecondary: "View workspace",

        manifestoEyebrow: "Studio Manifesto",
        manifestoQuote:
          "Life happens once. Stories that remain unwritten will disappear with the person who carries them.",
        manifestoBy: "Lifestory Studio · Since 2018",

        chaptersEyebrow: "How We Work",
        chaptersTitle: "Three acts. One legacy.",
        chaptersLead:
          "Every project is run like an editorial production: structured, never rushed, with the family's emotion at the center.",
        chapters: [
          {
            phase: "Act Listening",
            title: "Before the first sentence is written.",
            body: "We begin with warm interview sessions at your family's home. No rigid question list, only conversations that let dormant memories return naturally.",
            note: "Good stories begin in the ear, not the pen.",
            icon: Feather,
            image: "/image/about-mendengar.webp",
          },
          {
            phase: "Act Shaping",
            title: "Memories become cinematic narrative.",
            body: "Our writers and art director sequence the story, choose photographs, and design pages. We restore old photos, correct dates, and confirm every fact with the family.",
            note: "Small details like kitchen aromas, favorite songs, and family nicknames are what bring pages to life.",
            icon: BookOpenText,
            image: "/image/about-merangkai.webp",
          },
          {
            phase: "Act Handover",
            title: "Delivered with a small ceremony.",
            body: "The book, film, and lineage poster are presented to the family in heirloom-grade packaging. We celebrate this moment intentionally because legacy deserves to be treated like a jewel.",
            note: "We only release when the family is genuinely proud of the result.",
            icon: HeartHandshake,
            image: "/image/about-waris.webp",
          },
        ],

        whyNowEyebrow: "Why Now",
        whyNowTitle: "Three reasons we don't wait.",
        whyNowItems: [
          {
            number: "01",
            title: "Life is too valuable to be remembered through photos alone.",
            body: "Without context, photos remain images. We rescue the voice, gesture, and life philosophy behind them.",
          },
          {
            number: "02",
            title: "Many grandchildren do not know their grandparents fully.",
            body: "The connecting generation often loses the vocabulary to tell. We become the translator.",
          },
          {
            number: "03",
            title: "Life lessons left unrecorded will be re-learned the expensive way.",
            body: "Family experience is the cheapest education capital if it is written down properly in time.",
          },
        ],

        promisesEyebrow: "Our Promises",
        promisesTitle: "Five promises that shape every decision.",
        promisesLead:
          "Every process detail, from paper choice to handover schedule, is guarded by these five principles.",
        promiseItems: [
          {
            title: "Stories that feel whole, not merely complete.",
            body: "We weave context, emotion, and background, not just chronological lists of events.",
          },
          {
            title: "A legacy beyond wealth.",
            body: "What we pass on is mindset, principle, and family warmth, not inert objects.",
          },
          {
            title: "Archives that are clean and continuable.",
            body: "Format is designed so the next generation can append their own chapters.",
          },
          {
            title: "Tighter family bonds.",
            body: "Interview sessions often become emotional reunions. We deliberately preserve that bonus.",
          },
          {
            title: "Inspiration beyond the family.",
            body: "Many Lifestory books end up read by neighbors, colleagues, even strangers who feel connected.",
          },
        ],

        visionLabel: "Vision",
        visionTitle: "To become Indonesia's most sought-after life-story studio.",
        visionPoints: [
          "Lead the premium family biography category.",
          "Make personal documentation a cultural movement, not a privilege.",
          "Strengthen large families through documented stories.",
          "Build a public-access gallery for the broader community.",
        ],
        missionLabel: "Mission",
        missionTitle: "Every project is delivered like this, no exceptions.",
        missionPoints: [
          "Distinct concept and packaging for every family.",
          "Professional service with studio-grade confidentiality.",
          "Long-term after-sales accompaniment.",
          "A handover moment that is celebrated and remembered.",
        ],

        marqueeEyebrow: "Who It's For",
        marqueeTitle: "Lifestory is a bridge between generations.",
        marqueePoints: [
          "From a Father to his children",
          "From a Child to their father",
          "From a Sibling to their sibling",
          "From this Generation to the next",
          "From a Grandchild to their grandparent",
          "From a Mother to her children",
        ],
        priorityLabel: "What We Prioritize",
        priorityTitle: "Special. High quality. Always.",
        priorityBody:
          "We build a strong brand image through strong work, not the other way around. If you feel your family deserves to be preserved, let's talk.",
        consultCta: "Consult packages",
        exploreCta: "View workspace",
      };

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <div className="bg-cream-100 text-ink-700">
      {/* ============= HERO ============= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream-50 via-cream-100 to-cream-200">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grain bg-[length:24px_24px] opacity-25" />

        {/* Timeline strip */}
        <div className="relative border-b border-cream-300/60">
          <div className="mx-auto flex max-w-[1320px] items-center gap-4 overflow-x-auto px-6 py-3">
            <RibbonBadge className="hidden flex-none sm:inline-flex">
              {copy.heritage}
            </RibbonBadge>
            <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden text-[10px] font-bold uppercase tracking-[0.32em] text-ink-300">
              <span>1899</span>
              <span aria-hidden className="h-px flex-1 bg-cream-300" />
              <span className="hidden sm:inline">1965</span>
              <span aria-hidden className="hidden h-px flex-1 bg-cream-300 sm:inline-block" />
              <span className="hidden md:inline">1992</span>
              <span aria-hidden className="hidden h-px flex-1 bg-brand-400 md:inline-block" />
              <span className="text-brand-700">{new Date().getFullYear()}</span>
              <span aria-hidden className="h-px w-12 bg-cream-300" />
              <span>{new Date().getFullYear() + 50}</span>
            </div>
          </div>
        </div>

        <Container size="xl">
          <div className="grid grid-cols-1 gap-10 pb-20 pt-14 md:pt-20 lg:grid-cols-[1fr_0.8fr] lg:gap-16 lg:pb-24 lg:pt-20">
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <Eyebrow icon={<Sparkles className="h-3 w-3" />}>{copy.aboutLabel}</Eyebrow>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-600">
                {isId ? "Abadikan Warisanmu" : "Preserve Your Legacy"}
              </p>
              <h1 className="mt-3 font-serif font-medium text-[clamp(2.5rem,7vw,5.4rem)] leading-[0.96] tracking-[-0.025em] text-ink-800">
                {copy.heroTitle}
              </h1>
              <p className="mt-7 max-w-xl text-base leading-relaxed text-ink-500 md:text-lg">
                {copy.heroBody}
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {copy.heroHighlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-pill border border-cream-300 bg-white/75 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    block
                    iconRight={<ArrowRight className="h-4 w-4" />}
                    animateRightIcon
                    className="sm:w-auto"
                  >
                    {copy.heroPrimary}
                  </Button>
                </Link>
                <Link href="/app" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" block className="sm:w-auto">
                    {copy.heroSecondary}
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* RIGHT - Heritage photo cluster */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0.01 : 0.8, delay: reduced ? 0 : 0.2 }}
              className="relative hidden h-[520px] lg:flex lg:items-center lg:justify-center"
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <svg
                  aria-hidden
                  width="280"
                  height="280"
                  viewBox="0 0 80 80"
                  fill="none"
                  className="text-brand-700"
                >
                  <circle cx="40" cy="40" r="38" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="4 2" />
                  <circle cx="40" cy="40" r="32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="relative flex items-center justify-center">
                {[
                  {
                    src: "/image/about-hero-1.webp",
                    className: "-rotate-6 z-10 h-[270px] w-[185px] -mr-8 self-start mt-12",
                    tag: "1965",
                  },
                  {
                    src: "/image/about-hero-2.webp",
                    className: "rotate-2 z-30 h-[320px] w-[220px]",
                    tag: "1992",
                  },
                  {
                    src: "/image/about-hero-3.webp",
                    className: "rotate-6 z-20 h-[250px] w-[175px] -ml-8 self-end mb-12",
                    tag: isId ? "Sekarang" : "Today",
                  },
                ].map((p, i) => (
                  <motion.figure
                    key={p.src}
                    initial={{ opacity: 0, y: reduced ? 0 : 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduced ? 0.01 : 0.9,
                      delay: reduced ? 0 : 0.5 + i * 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`relative flex-none overflow-hidden rounded-[12px] border border-cream-400 bg-cream-50 p-2 shadow-deep ${p.className}`}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-[6px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.src} alt="" className="h-full w-full object-cover" />
                    </div>
                    <figcaption className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-pill bg-cream-50/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700 shadow-soft">
                      {p.tag}
                    </figcaption>
                  </motion.figure>
                ))}
              </div>
            </motion.div>

            {/* Mobile/tablet horizontal photo strip */}
            <div
              aria-hidden
              className="relative flex items-end justify-center gap-3 lg:hidden"
            >
              {[
                "/image/about-hero-1.webp",
                "/image/about-hero-2.webp",
                "/image/about-hero-3.webp",
              ].map((src, i) => {
                const sizes = ["h-40 w-28 sm:h-44 sm:w-32", "h-48 w-32 sm:h-56 sm:w-36", "h-40 w-28 sm:h-48 sm:w-32"];
                const rotations = ["-rotate-3", "rotate-1", "rotate-3"];
                const tags = ["1965", "1992", isId ? "Sekarang" : "Today"];
                return (
                  <figure
                    key={src}
                    className={`relative flex-shrink-0 overflow-hidden rounded-[10px] border border-cream-400 bg-cream-50 p-1.5 shadow-elev ${sizes[i]} ${rotations[i]}`}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-[6px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                    <figcaption className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-pill bg-cream-50/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-brand-700 shadow-soft">
                      {tags[i]}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* ============= MANIFESTO PULL QUOTE ============= */}
      <PullQuote
        eyebrow={copy.manifestoEyebrow}
        quote={copy.manifestoQuote}
        attribution={copy.manifestoBy}
      />

      {/* ============= 3 CHAPTERS alternating editorial rows ============= */}
      <section className="relative bg-cream-100 section-y-md">
        <Container>
          <div className="mb-16 max-w-3xl md:mb-20">
            <Eyebrow>{copy.chaptersEyebrow}</Eyebrow>
            <h2 className="mt-4 font-serif text-[clamp(1.85rem,4.6vw,3.6rem)] leading-[1.05] tracking-[-0.02em] text-ink-800">
              {copy.chaptersTitle}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 md:text-lg">
              {copy.chaptersLead}
            </p>
          </div>

          <div className="space-y-20 md:space-y-28 lg:space-y-32">
            {copy.chapters.map((chapter, idx) => (
              <ChapterRow
                key={chapter.title}
                index={idx}
                phase={chapter.phase}
                title={chapter.title}
                body={chapter.body}
                note={chapter.note}
                image={chapter.image}
                imageAlt={chapter.title}
                icon={chapter.icon}
                reversed={idx % 2 === 1}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* ============= WHY NOW dark interlude ============= */}
      <WhyNowDark
        copy={{
          eyebrow: copy.whyNowEyebrow,
          title: copy.whyNowTitle,
          items: copy.whyNowItems,
        }}
      />

      {/* ============= PROMISES icon grid replaces bullet wall ============= */}
      <PromiseGrid
        copy={{
          eyebrow: copy.promisesEyebrow,
          title: copy.promisesTitle,
          lead: copy.promisesLead,
          items: copy.promiseItems,
        }}
      />

      {/* ============= VISION vs MISSION split ============= */}
      <VisionMissionSplit
        copy={{
          visionLabel: copy.visionLabel,
          visionTitle: copy.visionTitle,
          visionPoints: copy.visionPoints,
          missionLabel: copy.missionLabel,
          missionTitle: copy.missionTitle,
          missionPoints: copy.missionPoints,
        }}
      />

      {/* ============= VALUES MARQUEE + STATS ============= */}
      <ValuesMarquee
        copy={{
          eyebrow: copy.marqueeEyebrow,
          title: copy.marqueeTitle,
          fromForLabel: copy.marqueeEyebrow,
          fromForPoints: copy.marqueePoints,
        }}
      />

      {/* ============= FINAL CTA ============= */}
      <section className="relative bg-cream-50 section-y-md">
        <Container size="md">
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduced ? 0.01 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[36px] border border-ink-800/30 bg-gradient-to-br from-ink-900 via-ink-800 to-brand-800 px-8 py-14 text-center text-white shadow-deep md:px-16 md:py-20"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-25" />
            </div>

            <div className="relative">
              <Eyebrow tone="white">{copy.priorityLabel}</Eyebrow>
              <h2 className="mt-5 font-serif text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.04] tracking-[-0.02em]">
                {copy.priorityTitle}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
                {copy.priorityBody}
              </p>

              <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/contact" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    block
                    iconRight={<ArrowRight className="h-4 w-4" />}
                    animateRightIcon
                    className="sm:w-auto"
                  >
                    {copy.consultCta}
                  </Button>
                </Link>
                <Link href="/app" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="ghost"
                    block
                    className="text-white/85 hover:bg-white/10 hover:text-white sm:w-auto"
                  >
                    {copy.exploreCta}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
