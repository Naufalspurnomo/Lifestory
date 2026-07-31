"use client";

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
import { ProcessActs } from "../../components/about/ProcessActs";
import { PullQuote } from "../../components/about/PullQuote";
import { WhyNowDark } from "../../components/about/WhyNowDark";
import { PromiseGrid } from "../../components/about/PromiseGrid";
import { VisionMissionSplit } from "../../components/about/VisionMissionSplit";
import { ValuesMarquee } from "../../components/about/ValuesMarquee";
import { AboutHeroLead } from "../../components/about/AboutHeroLead";
import { CountUp } from "../../components/ui/CountUp";
import { AmbientGlow } from "../../components/ui/AmbientGlow";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

export default function AboutPage() {
  const { locale } = useLanguage();
  const isId = locale === "id";
  const { reduced, shouldReduceScrollMotion, isCoarsePointer } = useMotionGuard();

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
        chaptersPrevious: "Sebelumnya",
        chaptersNext: "Berikutnya",
        chaptersHint: "Geser / pilih",
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

        // Hero features
        heroFeatures: [
          "Ditulis dengan pendekatan mendalam",
          "Dibangun dari cerita keluarga Anda",
          "Menjadi warisan untuk generasi berikutnya",
        ],
        // Hero handwritten note
        heroNote: "Setiap keluarga punya cerita. Kami bantu merawatnya.",
        // Stats
        stats: [
          { number: "100+", label: "Buku keluarga telah diterbitkan" },
          { number: "80+", label: "Film keluarga diproduksi" },
          { number: "50+", label: "Keluarga dari berbagai daerah di Indonesia" },
          { number: "100%", label: "Dikerjakan dengan empati & kerahasiaan" },
        ],
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

        // Hero features
        heroFeatures: [
          "Written with deep approach",
          "Built from your family stories",
          "Becomes a legacy for future generations",
        ],
        // Hero handwritten note
        heroNote: "Every family has a story. We help preserve it.",
        // Stats
        stats: [
          { number: "100+", label: "Family books published" },
          { number: "80+", label: "Family films produced" },
          { number: "50+", label: "Families from across Indonesia" },
          { number: "100%", label: "Done with empathy & confidentiality" },
        ],

        manifestoEyebrow: "Studio Manifesto",
        manifestoQuote:
          "Life happens once. Stories that remain unwritten will disappear with the person who carries them.",
        manifestoBy: "Lifestory Studio · Since 2018",

        chaptersEyebrow: "How We Work",
        chaptersTitle: "Three acts. One legacy.",
        chaptersLead:
          "Every project is run like an editorial production: structured, never rushed, with the family's emotion at the center.",
        chaptersPrevious: "Previous",
        chaptersNext: "Next",
        chaptersHint: "Swipe / select",
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

  const featureIcons = [
    <svg key="f1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
    <svg key="f2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    <svg key="f3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  ];

  const photoTags = ["1985", "1992", isId ? "Sekarang" : "Today"];

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <div className="bg-cream-100 text-ink-700">
      {/* ============= HERO ============= */}
      <section className="relative overflow-hidden bg-[#f8f5ee]">
        <AboutHeroLead
          isId={isId}
          reduced={reduced}
          lightMotion={shouldReduceScrollMotion}
          copy={{
            aboutLabel: copy.aboutLabel,
            heroBody: copy.heroBody,
            heroFeatures: copy.heroFeatures,
            heroPrimary: copy.heroPrimary,
            heroSecondary: copy.heroSecondary,
            heroNote: copy.heroNote,
          }}
        />

        <div className="hidden" aria-hidden>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-20" />
          <div className="absolute -right-[10%] -top-[15%] h-[70%] w-[50%] rounded-full bg-[radial-gradient(ellipse,rgba(236,226,204,0.6),transparent_70%)]" />
          <div className="absolute -left-[5%] bottom-[10%] h-[40%] w-[30%] rounded-full bg-[radial-gradient(ellipse,rgba(236,226,204,0.35),transparent_70%)]" />
        </div>

        <Container size="xl">
          <div className="relative grid grid-cols-1 gap-8 pb-0 pt-14 md:pt-18 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-20 xl:gap-16">
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 pb-10 lg:pb-16"
            >
              <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500">
                  <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 1 8-1 3.5-3.1 5-5 6.5" />
                  <path d="M11 20A7 7 0 0 0 12.2 6.9C6.5 4.9 5 3.5 3 2 2 4 1 6.5 2 10c1 3.5 3.1 5 5 6.5" />
                  <path d="M11 20V10" />
                </svg>
                {copy.aboutLabel}
              </p>

              <h1 className="mt-7 max-w-[14ch] font-serif font-bold text-[clamp(2.65rem,6.5vw,4.8rem)] leading-[1.02] tracking-[-0.01em] text-ink-900">
                {isId ? (
                  <>Kami menulis keluarga seperti ia <em className="font-serif italic font-light">benar-benar</em> hidup.</>
                ) : (
                  <>We write families as they <em className="font-serif italic font-light">truly</em> lived.</>
                )}
              </h1>

              <p className="mt-6 max-w-lg text-[0.95rem] font-light leading-[1.8] text-ink-600 md:text-base">
                {copy.heroBody}
              </p>

              <div className="mt-8 flex flex-wrap items-start gap-x-8 gap-y-4 border-t border-cream-300 pt-6">
                {copy.heroFeatures.map((feature, index) => (
                  <div key={feature} className="flex items-start gap-2.5 max-w-[160px]">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cream-400 text-brand-700">
                      {featureIcons[index]}
                    </span>
                    <span className="text-[11px] font-medium leading-[1.5] text-ink-700">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <MagneticButton strength={0.2} distance={100} className="w-full sm:w-auto">
                    <Button
                      href="/contact"
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
                <Button
                  href="#process"
                    variant="outline"
                    size="lg"
                    block
                    iconLeft={<BookOpenText className="h-4 w-4 text-brand-700 group-hover:text-cream-50 transition-colors" />}
                    className="group sm:w-auto !border-brand-700 bg-transparent hover:!bg-brand-700 !text-brand-700 hover:!text-cream-50 shadow-none px-10 py-6 font-medium tracking-[0.15em] text-[11px] uppercase whitespace-nowrap rounded-none transition-colors duration-500"
                  >
                    {copy.heroSecondary}
                </Button>
              </div>
            </motion.div>

            {/* ===== RIGHT — PHOTO COLLAGE ===== */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0.01 : 1, delay: reduced ? 0 : 0.2 }}
              className="relative hidden min-h-[520px] lg:block"
            >
              {/* Decorative botanical element — top-right */}
              <div aria-hidden className="pointer-events-none absolute -right-6 -top-8 z-0 h-[200px] w-[160px] opacity-[0.18]">
                <svg viewBox="0 0 160 200" fill="none" className="h-full w-full text-brand-500">
                  <path d="M80 200 C80 140 30 100 10 60 C30 80 60 70 80 30 C100 70 130 80 150 60 C130 100 80 140 80 200Z" fill="currentColor" opacity="0.3" />
                  <path d="M80 200 C80 150 50 120 30 80 C50 95 70 85 80 50 C90 85 110 95 130 80 C110 120 80 150 80 200Z" fill="currentColor" opacity="0.2" />
                </svg>
              </div>

              {/* Photo 1 — left, tilted left */}
              <motion.figure
                initial={{ opacity: 0, y: reduced ? 0 : 40, rotate: -8 }}
                animate={{ opacity: 1, y: 0, rotate: -8 }}
                transition={{ duration: reduced ? 0.01 : 0.9, delay: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-0 top-[12%] z-10 w-[42%] max-w-[220px]"
              >
                <div className="overflow-hidden rounded-[3px] border border-cream-300 bg-cream-100 p-[6px] shadow-deep">
                  {/* Year label — top */}
                  <div className="mb-1 flex justify-center">
                    <span className="text-[10px] font-bold tracking-[0.15em] text-ink-500">{photoTags[0]}</span>
                  </div>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[2px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/image/about-hero-1.webp" alt="" className="h-full w-full object-cover" />
                  </div>
                </div>
              </motion.figure>

              {/* Photo 2 — center, slight right tilt */}
              <motion.figure
                initial={{ opacity: 0, y: reduced ? 0 : 40, rotate: 3 }}
                animate={{ opacity: 1, y: 0, rotate: 3 }}
                transition={{ duration: reduced ? 0.01 : 0.9, delay: reduced ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-[25%] top-[2%] z-20 w-[48%] max-w-[250px]"
              >
                <div className="overflow-hidden rounded-[3px] border border-cream-300 bg-cream-100 p-[6px] shadow-deep">
                  <div className="mb-1 flex justify-center">
                    <span className="text-[10px] font-bold tracking-[0.15em] text-ink-500">{photoTags[1]}</span>
                  </div>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/image/about-hero-2.webp" alt="" className="h-full w-full object-cover" />
                  </div>
                </div>
                {/* Paper clip decorative element */}
                <div aria-hidden className="absolute -right-3 -top-4 z-30 text-brand-400/50">
                  <svg width="24" height="48" viewBox="0 0 24 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2 C6 2 2 6 2 12 L2 36 C2 42 6 46 12 46 C18 46 22 42 22 36 L22 14 C22 8 18 4 12 4" />
                  </svg>
                </div>
              </motion.figure>

              {/* Photo 3 — right, tilted right */}
              <motion.figure
                initial={{ opacity: 0, y: reduced ? 0 : 40, rotate: 6 }}
                animate={{ opacity: 1, y: 0, rotate: 6 }}
                transition={{ duration: reduced ? 0.01 : 0.9, delay: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-[18%] z-30 w-[44%] max-w-[230px]"
              >
                <div className="overflow-hidden rounded-[3px] border border-cream-300 bg-cream-100 p-[6px] shadow-deep">
                  <div className="mb-1 flex justify-center">
                    <span className="rounded-sm bg-brand-700/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-brand-700">{photoTags[2]}</span>
                  </div>
                  <div className="relative aspect-[3/4] overflow-hidden rounded-[2px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/image/about-hero-3.webp" alt="" className="h-full w-full object-cover" />
                  </div>
                </div>
              </motion.figure>

              {/* Handwritten note card */}
              <motion.div
                initial={{ opacity: 0, rotate: 4, y: reduced ? 0 : 20 }}
                animate={{ opacity: 1, rotate: 4, y: 0 }}
                transition={{ duration: reduced ? 0.01 : 0.8, delay: reduced ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden
                className="absolute bottom-[8%] right-[2%] z-40 max-w-[180px] rounded-[2px] bg-cream-200 px-5 py-4 shadow-soft"
              >
                <p className="font-serif text-[0.85rem] italic leading-[1.5] text-ink-700">
                  {copy.heroNote}
                </p>
              </motion.div>

              {/* Decorative botanical — bottom-right */}
              <div aria-hidden className="pointer-events-none absolute -bottom-4 -right-4 z-0 h-[120px] w-[80px] opacity-[0.12]">
                <svg viewBox="0 0 80 120" fill="none" className="h-full w-full text-brand-500">
                  <ellipse cx="40" cy="30" rx="15" ry="28" fill="currentColor" opacity="0.25" transform="rotate(-15 40 30)" />
                  <ellipse cx="55" cy="50" rx="12" ry="24" fill="currentColor" opacity="0.2" transform="rotate(10 55 50)" />
                  <ellipse cx="30" cy="55" rx="10" ry="22" fill="currentColor" opacity="0.2" transform="rotate(-25 30 55)" />
                  <line x1="40" y1="60" x2="40" y2="120" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                </svg>
              </div>
            </motion.div>

            {/* Mobile photo strip */}
            <div aria-hidden className="relative flex items-end justify-center gap-3 pb-8 lg:hidden">
              {[
                "/image/about-hero-1.webp",
                "/image/about-hero-2.webp",
                "/image/about-hero-3.webp",
              ].map((src, i) => {
                const sizes = ["h-40 w-28 sm:h-44 sm:w-32", "h-48 w-32 sm:h-56 sm:w-36", "h-40 w-28 sm:h-48 sm:w-32"];
                const rotations = ["-rotate-3", "rotate-1", "rotate-3"];
                return (
                  <figure
                    key={src}
                    className={`relative flex-shrink-0 overflow-hidden rounded-[3px] border border-cream-300 bg-cream-100 p-1.5 shadow-elev ${sizes[i]} ${rotations[i]}`}
                  >
                    <div className="mb-0.5 text-center">
                      <span className="text-[8px] font-bold tracking-[0.12em] text-ink-500">{photoTags[i]}</span>
                    </div>
                    <div className="relative h-[calc(100%-16px)] w-full overflow-hidden rounded-[2px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                  </figure>
                );
              })}
            </div>
          </div>
        </Container>
        </div>

        {/* ===== COMPACT EDITORIAL STATS ===== */}
        <div className="relative z-20 px-6 pb-10 pt-2 md:pb-12 lg:pb-14">
          <div className="mx-auto max-w-5xl border-y border-cream-300/80">
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: reduced ? 0.01 : 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-2 md:grid-cols-4"
            >
              {copy.stats.map((stat, index) => (
                <motion.div
                  key={stat.number}
                  initial={{ opacity: 0, y: reduced ? 0 : isCoarsePointer ? 8 : 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{
                    duration: reduced ? 0.01 : isCoarsePointer ? 0.4 : 0.55,
                    delay: reduced ? 0 : index * (isCoarsePointer ? 0.035 : 0.07),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`flex min-h-[108px] items-center gap-3 px-4 py-5 text-left sm:px-6 ${
                    index % 2 === 1 ? "border-l border-cream-300/70" : ""
                  } ${
                    index >= 2 ? "border-t border-cream-300/70 md:border-t-0" : ""
                  } ${
                    index > 0 ? "md:border-l md:border-cream-300/70" : ""
                  }`}
                >
                  <p className="shrink-0 font-serif text-[1.75rem] font-light leading-none text-ink-900 lg:text-[2rem]">
                    <CountUp value={stat.number} />
                  </p>
                  <p className="max-w-[13ch] text-[10px] font-medium leading-[1.55] text-ink-500 sm:text-[11px]">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============= MANIFESTO PULL QUOTE ============= */}
      <PullQuote
        eyebrow={copy.manifestoEyebrow}
        quote={copy.manifestoQuote}
        attribution={copy.manifestoBy}
      />

      <ProcessActs
        copy={{
          eyebrow: copy.chaptersEyebrow,
          title: copy.chaptersTitle,
          lead: copy.chaptersLead,
          chapters: copy.chapters,
          previousLabel: copy.chaptersPrevious,
          nextLabel: copy.chaptersNext,
          interactionHint: copy.chaptersHint,
        }}
      />

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
            className="relative overflow-hidden border border-cream-300 bg-cream-50 px-8 py-14 text-center md:px-16 md:py-20"
          >
            <AmbientGlow className="-left-20 -top-24" size={400} duration={16} />
            <AmbientGlow
              className="-bottom-24 -right-16"
              color="rgba(176,141,87,0.1)"
              size={360}
              duration={19}
              delay={1.5}
            />
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
                <MagneticButton strength={0.2} distance={100} className="w-full sm:w-auto">
                    <Button
                      href="/contact"
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
                <Button
                  href="#process"
                    variant="outline"
                    size="lg"
                    block
                    className="group sm:w-auto !border-brand-700 bg-transparent hover:!bg-brand-700 !text-brand-700 hover:!text-cream-50 shadow-none px-10 py-6 font-medium tracking-[0.15em] text-[11px] uppercase whitespace-nowrap rounded-none transition-colors duration-500"
                  >
                    {copy.exploreCta}
                </Button>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
