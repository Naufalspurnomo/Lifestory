"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  Feather,
  HeartHandshake,
} from "lucide-react";
import { MagneticButton } from "../../components/ui/MagneticButton";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { Button } from "../../components/ui/Button";
import { Container } from "../../components/ui/Container";
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
        aboutLabel: "Studio biografi keluarga",
        heritage: "Sejarah",
        heroKicker: "Cerita yang bisa dibuka lagi, bukan sekadar dikenang.",
        heroTitle: "Kami menulis keluarga seperti ia benar-benar hidup.",
        heroBody:
          "Dari percakapan di meja makan, album yang mulai pudar, sampai nama yang jarang disebut, kami susun menjadi buku, film pendek, dan arsip keluarga yang layak diwariskan.",
        heroHighlights: [
          "Wawancara mendalam",
          "Penulisan dan kurasi foto",
          "Buku, film, dan silsilah digital",
        ],
        heroPrimary: "Bicarakan keluarga Anda",
        heroSecondary: "Lihat proses kerja",

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
        whyNowEyebrow: "Kenapa sekarang",
        whyNowTitle: "Yang hilang duluan bukan fotonya, tapi konteksnya.",
        whyNowItems: [
          {
            number: "01",
            title: "Suara hilang lebih cepat dari gambar.",
            body: "Foto bisa bertahan puluhan tahun. Cara seseorang tertawa, menasihati, atau memanggil anaknya sering hilang lebih dulu.",
          },
          {
            number: "02",
            title: "Album keluarga jarang menjelaskan siapa mereka.",
            body: "Nama, tempat, dan tahun memang penting. Tetapi generasi berikutnya juga perlu tahu pilihan hidup, kebiasaan, dan nilai yang membentuk keluarga.",
          },
          {
            number: "03",
            title: "Cerita besar biasanya terlambat ditanyakan.",
            body: "Banyak keluarga baru ingin merekam setelah narasumber utama lelah, sakit, atau sudah tidak bisa bercerita panjang.",
          },
        ],

        // Promises (replacement for Purpose+Benefit list-walls)
        promisesEyebrow: "Standar kerja",
        promisesTitle: "Yang kami jaga saat keluarga menyerahkan cerita.",
        promisesLead:
          "Bukan janji manis. Ini pagar kerja agar hasilnya tidak terasa seperti template, dan keluarga tetap merasa aman sepanjang proses.",
        promiseItems: [
          {
            title: "Kami mulai dari orangnya, bukan paketnya.",
            body: "Setiap keluarga punya ritme, bahasa, dan batas cerita sendiri. Paket hanya alat, bukan arah utama.",
          },
          {
            title: "Fakta diperiksa sebelum ditulis indah.",
            body: "Tanggal, nama, foto, dan urutan peristiwa dikonfirmasi agar narasi tetap hangat tanpa mengorbankan akurasi.",
          },
          {
            title: "Keluarga boleh mengoreksi sampai terasa benar.",
            body: "Draft tidak dianggap selesai hanya karena sudah rapi. Kami cari nada yang terasa tepat bagi keluarga.",
          },
          {
            title: "Foto lama diperlakukan sebagai arsip.",
            body: "Kami tidak menaruh foto sebagai hiasan. Setiap gambar dipilih karena membantu pembaca mengenal orangnya.",
          },
          {
            title: "Hasil akhir harus layak dibuka ulang.",
            body: "Buku, video, dan arsip digital harus tetap enak dilihat hari ini, lalu tetap pantas ditunjukkan bertahun-tahun lagi.",
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
        marqueeEyebrow: "Untuk siapa",
        marqueeTitle: "Untuk keluarga yang ingin berhenti menunda cerita penting.",
        marqueePoints: [
          "Anak yang ingin merekam kisah orang tua sebelum terlambat",
          "Orang tua yang ingin meninggalkan buku untuk anak cucu",
          "Keluarga besar yang ingin menyatukan foto, nama, dan silsilah",
          "Saudara yang ingin memberi hadiah bermakna, bukan barang sekali pakai",
          "Perusahaan keluarga yang ingin menjaga kisah pendiri",
          "Pasangan yang ingin mengarsipkan perjalanan rumah tangga",
        ],
        // Final CTA
        priorityLabel: "Mulai dari satu percakapan",
        priorityTitle: "Bawa satu nama. Kami bantu susun sisanya.",
        priorityBody:
          "Anda tidak perlu datang dengan arsip lengkap. Cukup ceritakan siapa yang ingin diabadikan, lalu kami bantu menentukan format yang paling masuk akal.",
        consultCta: "Bicarakan keluarga Anda",
        exploreCta: "Lihat proses kerja",
      }
    : {
        aboutLabel: "Family biography studio",
        heritage: "Heritage",
        heroKicker: "Stories to open again, not just remember.",
        heroTitle: "We write families as they truly lived.",
        heroBody:
          "From dining-table conversations, fading albums, and names rarely mentioned, we shape books, short films, and family archives made to be passed on.",
        heroHighlights: [
          "In-depth interviews",
          "Writing and photo curation",
          "Books, films, and digital lineage",
        ],
        heroPrimary: "Discuss your family",
        heroSecondary: "See our process",

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
        whyNowTitle: "What disappears first is not the photo, but the context.",
        whyNowItems: [
          {
            number: "01",
            title: "Voices fade faster than images.",
            body: "A photo can survive for decades. The way someone laughed, advised, or called their children often disappears first.",
          },
          {
            number: "02",
            title: "Family albums rarely explain who people were.",
            body: "Names, places, and years matter. The next generation also needs the choices, habits, and values that shaped the family.",
          },
          {
            number: "03",
            title: "The important questions are often asked too late.",
            body: "Many families only begin recording when the main storyteller is tired, ill, or no longer able to speak at length.",
          },
        ],

        promisesEyebrow: "Working standard",
        promisesTitle: "What we protect when a family trusts us with its story.",
        promisesLead:
          "Not soft promises. These are working rules that keep the result from feeling templated and keep the family safe throughout the process.",
        promiseItems: [
          {
            title: "We start with the person, not the package.",
            body: "Every family has its own rhythm, language, and boundaries. The package is only a tool, not the direction.",
          },
          {
            title: "Facts are checked before they are written beautifully.",
            body: "Dates, names, photos, and sequences are confirmed so the narrative stays warm without sacrificing accuracy.",
          },
          {
            title: "The family can revise until the tone feels right.",
            body: "A draft is not done just because it looks tidy. We look for the voice that feels true to the family.",
          },
          {
            title: "Old photographs are treated as archives.",
            body: "Images are not decoration. Each one is chosen because it helps the reader know the person better.",
          },
          {
            title: "The final work must deserve to be reopened.",
            body: "Books, films, and digital archives should look right today and still feel worthy years from now.",
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
        marqueeTitle: "For families ready to stop postponing the important story.",
        marqueePoints: [
          "Children who want to record their parents before it is too late",
          "Parents who want to leave a book for their children and grandchildren",
          "Large families uniting photos, names, and lineage",
          "Siblings looking for a meaningful gift, not a disposable object",
          "Family businesses preserving the founder's story",
          "Couples archiving the journey of their household",
        ],
        priorityLabel: "Start with one conversation",
        priorityTitle: "Bring one name. We will help shape the rest.",
        priorityBody:
          "You do not need a complete archive before talking to us. Tell us who you want preserved, and we will help choose the format that makes sense.",
        consultCta: "Discuss your family",
        exploreCta: "See our process",
      };

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <div className="bg-cream-100 text-ink-700">
      {/* ============= HERO ============= */}
      <section className="relative overflow-hidden border-b border-cream-300 bg-cream-50">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-grain bg-[length:24px_24px] opacity-25" />

        <Container size="xl">
          <div className="grid grid-cols-1 gap-10 pb-20 pt-16 md:pt-20 lg:grid-cols-[1fr_0.8fr] lg:gap-16 lg:pb-24 lg:pt-20">
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                <span aria-hidden className="h-px w-8 bg-brand-500" />
                {copy.aboutLabel}
              </p>
              <p className="mt-6 max-w-md text-sm font-light uppercase tracking-[0.18em] text-ink-500">
                {copy.heroKicker}
              </p>
              <h1 className="mt-5 max-w-4xl font-serif font-light text-[clamp(2.65rem,7vw,5.45rem)] leading-[0.98] tracking-normal text-ink-900">
                {copy.heroTitle}
              </h1>
              <p className="mt-7 max-w-xl text-base font-light leading-[1.75] text-ink-600 md:text-lg">
                {copy.heroBody}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-cream-300 pt-5">
                {copy.heroHighlights.map((item, index) => (
                  <span key={item} className="flex items-center gap-4">
                    {index > 0 && <span aria-hidden className="h-4 w-px bg-ink-300/50" />}
                    <span className="text-[9px] font-bold italic uppercase tracking-[0.2em] text-ink-500">
                      {item}
                    </span>
                  </span>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/contact" className="w-full sm:w-auto">
                  <MagneticButton strength={0.2} distance={100} className="w-full sm:w-auto">
                    <Button
                      variant="dark"
                      size="lg"
                      block
                      iconRight={<ArrowRight className="h-4 w-4" />}
                      animateRightIcon
                      className="group relative overflow-hidden sm:w-auto !bg-brand-700 text-cream-50 hover:!bg-brand-800 transition-all duration-500 border-none px-10 py-6 rounded-none shadow-none"
                    >
                      <span className="relative z-10 font-medium tracking-[0.15em] text-[11px] uppercase whitespace-nowrap">{copy.heroPrimary}</span>
                    </Button>
                  </MagneticButton>
                </Link>
                <Link href="#process" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    block
                    iconLeft={<BookOpenText className="h-4 w-4 text-brand-700 group-hover:text-cream-50 transition-colors" />}
                    className="group sm:w-auto !border-brand-700 bg-transparent hover:!bg-brand-700 !text-brand-700 hover:!text-cream-50 shadow-none px-10 py-6 font-medium tracking-[0.15em] text-[11px] uppercase whitespace-nowrap rounded-none transition-colors duration-500"
                  >
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
      <section id="process" className="relative bg-cream-100 section-y-md">
        <Container>
          <div className="mb-16 max-w-3xl md:mb-20">
            <p className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
              <span className="h-px w-8 bg-brand-500" />
              {copy.chaptersEyebrow}
            </p>
            <h2 className="mt-6 font-serif text-[clamp(2.25rem,4.8vw,3.75rem)] font-light leading-[1.02] tracking-normal text-ink-900">
              {copy.chaptersTitle}
            </h2>
            <p className="mt-5 max-w-2xl text-base font-light leading-[1.75] text-ink-600 md:text-lg">
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
      <section className="relative bg-cream-100 py-[clamp(5rem,8vw,7.5rem)]">
        <Container size="md">
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduced ? 0.01 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative border border-cream-300 bg-cream-50 px-8 py-14 text-center md:px-16 md:py-20"
          >
            <span
              aria-hidden
              className="absolute left-1/2 top-0 h-[3px] w-24 -translate-x-1/2 bg-brand-700"
            />

            <div className="relative">
              <p className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                <span className="h-px w-8 bg-brand-500" />
                {copy.priorityLabel}
                <span className="h-px w-8 bg-brand-500" />
              </p>
              <h2 className="mt-6 font-serif text-[clamp(2rem,4.6vw,3.5rem)] font-light leading-[1.04] tracking-normal text-ink-900">
                {copy.priorityTitle}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base font-light leading-[1.75] text-ink-600 md:text-lg">
                {copy.priorityBody}
              </p>

              <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/contact" className="w-full sm:w-auto">
                  <MagneticButton strength={0.2} distance={100} className="w-full sm:w-auto">
                    <Button
                      variant="dark"
                      size="lg"
                      block
                      iconRight={<ArrowRight className="h-4 w-4" />}
                      animateRightIcon
                      className="group relative overflow-hidden sm:w-auto !bg-brand-700 text-cream-50 hover:!bg-brand-800 transition-all duration-500 border-none px-10 py-6 rounded-none shadow-none"
                    >
                      <span className="relative z-10 font-medium tracking-[0.15em] text-[11px] uppercase whitespace-nowrap">{copy.consultCta}</span>
                    </Button>
                  </MagneticButton>
                </Link>
                <Link href="#process" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    block
                    className="group sm:w-auto !border-brand-700 bg-transparent hover:!bg-brand-700 !text-brand-700 hover:!text-cream-50 shadow-none px-10 py-6 font-medium tracking-[0.15em] text-[11px] uppercase whitespace-nowrap rounded-none transition-colors duration-500"
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
