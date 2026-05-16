"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  Building2,
  Camera,
  Check,
  Gem,
  HeartHandshake,
  Quote,
  Sparkles,
  Target,
  TreePine,
  Video,
} from "lucide-react";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { Button } from "../../components/ui/Button";
import { RibbonBadge } from "../../components/ui/Ornament";

const heroHighlights = [
  "Arsip memori keluarga",
  "Narasi biografi berlapis emosi",
  "Warisan visual lintas generasi",
];

const heroHighlightsEn = [
  "Family memory archive",
  "Emotion-led biography narrative",
  "Cross-generation visual legacy",
];

const storyMoments = [
  {
    phase: "Babak 01",
    title: "Mendengar sebelum menulis.",
    body: "Kami membuka ruang percakapan yang tenang agar cerita lama yang sempat tersembunyi bisa muncul kembali.",
    note: "Setiap detail kecil bisa menjadi benih warisan besar.",
    icon: Quote,
    className:
      "lg:col-span-2 bg-[linear-gradient(140deg,#fff8ea_0%,#fffdf6_56%,#fff_100%)]",
  },
  {
    phase: "Babak 02",
    title: "Merangkai makna.",
    body: "Momen hidup disusun menjadi alur yang utuh, sehingga keluarga tidak hanya membaca fakta, tetapi merasakan perjalanan.",
    note: "Cerita yang rapi membuat nilai hidup lebih mudah diwariskan.",
    icon: Target,
    className:
      "lg:col-span-1 bg-[linear-gradient(145deg,#f3efe6_0%,#fffaf3_100%)]",
  },
  {
    phase: "Babak 03",
    title: "Mewariskan dengan hangat.",
    body: "Hasil akhir disajikan dalam format fisik dan digital agar generasi berikutnya dapat terus terhubung dengan akar keluarga.",
    note: "Warisan terbaik adalah kisah yang bisa disentuh dan dibaca ulang.",
    icon: HeartHandshake,
    className:
      "lg:col-span-2 bg-[linear-gradient(150deg,#f5f8ee_0%,#ffffff_100%)]",
  },
];

const storyMomentsEn = [
  {
    phase: "Act 01",
    title: "Listen before we write.",
    body: "We begin with calm conversations so long-held memories can return and be captured with care.",
    note: "Small details often become the strongest family legacy.",
    icon: Quote,
    className:
      "lg:col-span-2 bg-[linear-gradient(140deg,#fff8ea_0%,#fffdf6_56%,#fff_100%)]",
  },
  {
    phase: "Act 02",
    title: "Shape the meaning.",
    body: "Life moments are arranged into a clear flow, so families do not only read facts but also feel the journey.",
    note: "Structured stories preserve values more effectively.",
    icon: Target,
    className:
      "lg:col-span-1 bg-[linear-gradient(145deg,#f3efe6_0%,#fffaf3_100%)]",
  },
  {
    phase: "Act 03",
    title: "Pass it on with warmth.",
    body: "Final deliverables are prepared in physical and digital formats, keeping future generations connected to their roots.",
    note: "The best legacy is a story that can be revisited anytime.",
    icon: HeartHandshake,
    className:
      "lg:col-span-2 bg-[linear-gradient(150deg,#f5f8ee_0%,#ffffff_100%)]",
  },
];

const whyPoints = [
  "Manusia cuma hidup sekali, dan hidup terlalu berharga jika berlalu tanpa warisan cerita.",
  "Banyak anak dan cucu tidak mengenal moyang, kakek, atau neneknya secara utuh.",
  "Pelajaran hidup tiap orang unik, dan bisa menjadi bekal berharga untuk generasi berikutnya.",
];

const purposePoints = [
  "Mengabadikan kisah hidup seseorang untuk sanak keluarga.",
  "Mewariskan warisan keluarga, bukan hanya harta tetapi juga kisah hidup.",
  "Mengolah pelajaran nyata dari perjalanan hidup agar tidak hilang sia-sia.",
  "Mempererat ikatan persaudaraan lewat memori, pesan, dan catatan garis keturunan.",
  "Mempermudah keluarga melacak silsilah dari waktu ke waktu.",
];

const benefitPoints = [
  "Kisah hidup tidak hilang, tetapi meninggalkan nama baik dan jejak inspiratif.",
  "Anak-cucu dan saudara mendapat pelajaran yang memperkaya pengalaman hidup.",
  "Keeratan keluarga terjaga lewat pesan, nilai, dan memori orang tua.",
  "Mengurangi simpang siur cerita turun-temurun karena arsip lebih jelas dan rapi.",
  "Membangun kesadaran untuk menjaga cerita hidup sebagai sumber inspirasi.",
];

const visionPoints = [
  "Menjadi perusahaan penulisan kisah hidup yang kreatif dan terdepan di Indonesia.",
  "Menciptakan tren aktualisasi diri melalui penulisan kisah hidup profesional.",
  "Mempererat hubungan dalam keluarga besar.",
  "Membuat kisah hidup setiap klien terabadikan.",
  "Menjadi alat dan saluran berkat bagi klien dan orang lain.",
  "Memiliki kantor dengan galeri yang bisa diakses umum.",
];

const missionPoints = [
  "Selalu memberikan konsep dan kemasan yang berbeda.",
  "Memberikan pelayanan yang profesional dan eksklusif.",
  "Memberikan layanan purna jual untuk menjaga hubungan jangka panjang.",
  "Memberikan momen penyerahan produk akhir yang berkesan bagi keluarga.",
];

const marketPoints = [
  "Produk ini relatif baru sehingga ada peluang menjadi pemimpin pasar.",
  "Ada budaya dokumentasi diri pada orang tua maupun generasi muda.",
  "Setiap orang membutuhkan aktualisasi diri dan ruang untuk menyalurkan warisan.",
  "Hampir semua orang ingin meninggalkan sesuatu yang berharga untuk anak-cucu.",
];

const fromForPoints = [
  "Dari Ayah untuk anaknya",
  "Dari Anak untuk ayahnya",
  "Dari Saudara untuk saudaranya",
  "Dari keluarga untuk generasi berikutnya",
];

const productBento = [
  {
    title: "Buku Autobiografi Eksklusif",
    icon: BookOpenText,
    className:
      "lg:col-span-2 bg-[linear-gradient(140deg,#fff5df_0%,#fffaf0_58%,#fff_100%)]",
    points: [
      "Sampul keras premium, kertas berkualitas, kemasan tahan air dan dikustomisasi.",
      "Foto lama, dokumen, dan foto baru dari sesi Lifestory.",
      "Tata letak personal, alur cerita kuat, plus karikatur pop-up.",
    ],
  },
  {
    title: "Video Wawancara & Dokumentasi",
    icon: Video,
    className:
      "lg:col-span-1 bg-[linear-gradient(145deg,#f4efe6_0%,#fffaf4_100%)]",
    points: [
      "Wawancara terarah dan dokumentasi aktivitas bermakna.",
      "Rangkuman momen terbaik dalam kemasan eksklusif + flash disk.",
    ],
  },
  {
    title: "Poster Pohon Keturunan",
    icon: TreePine,
    className:
      "lg:col-span-1 bg-[linear-gradient(145deg,#eef5ec_0%,#fbfffa_100%)]",
    points: [
      "Dicetak dan dibingkai, dengan slot tambahan untuk periode selanjutnya.",
      "Mendukung pelacakan silsilah secara visual dan mudah dipahami.",
    ],
  },
  {
    title: "Sesi Foto & Cetak Besar",
    icon: Camera,
    className:
      "lg:col-span-2 bg-[linear-gradient(145deg,#f7f3eb_0%,#ffffff_100%)]",
    points: [
      "Output foto 20R, 30 file digital, plus bonus 2 foto kecil berbingkai.",
      "Dokumentasi visual artistik untuk melengkapi narasi keluarga.",
    ],
  },
];

const packages = [
  {
    title: "Buku Biografi Kustom",
    tag: "Unggulan",
    desc: "Buku kisah hidup yang dirancang personal untuk warisan keluarga.",
    className:
      "lg:col-span-2 bg-[linear-gradient(145deg,#fff9ef_0%,#fff_100%)]",
    icon: BookOpenText,
    features: [
      "Sampul keras, foto lama + foto baru, penulisan, desain, dan tata letak.",
      "Kemasan tahan air dan unik.",
      "Karikatur pop-up dan kertas berkualitas tinggi.",
    ],
  },
  {
    title: "Sesi Foto",
    tag: "Warisan Visual",
    desc: "Sesi foto profesional untuk melengkapi kisah hidup.",
    className:
      "lg:col-span-2 bg-[linear-gradient(145deg,#f4f0e8_0%,#fffaf4_100%)]",
    icon: Camera,
    features: [
      "Hasil akhir foto 20R.",
      "30 file digital resolusi tinggi.",
      "Bonus 2 foto kecil dengan frame.",
    ],
  },
  {
    title: "Paket Video",
    tag: "Dokumenter",
    desc: "Wawancara, dokumentasi kegiatan, dan rangkuman momen penting.",
    className:
      "lg:col-span-1 bg-[linear-gradient(145deg,#f8f4ec_0%,#fff_100%)]",
    icon: Video,
    features: [
      "Pengemasan video secara eksklusif.",
      "Termasuk flash disk dan kemasan premium.",
      "Narasi yang menjaga pesan asli keluarga.",
    ],
  },
  {
    title: "Pohon Keluarga Cetak & Bingkai",
    tag: "Peta Warisan",
    desc: "Silsilah keluarga dalam bentuk visual elegan yang mudah dilanjutkan.",
    className:
      "lg:col-span-1 bg-[linear-gradient(145deg,#eef5ec_0%,#fff_100%)]",
    icon: TreePine,
    features: [
      "Dicetak dan dibingkai.",
      "Slot lanjutan untuk update generasi berikutnya.",
      "Tercatat di database Lifestory + ucapan terima kasih simbolis.",
    ],
  },
];

const whyPointsEn = [
  "Life is only lived once, and it is too valuable to pass without a meaningful story left behind.",
  "Many children and grandchildren do not truly know their grandparents and ancestors.",
  "Every life journey is unique and can become valuable wisdom for the next generation.",
];

const purposePointsEn = [
  "Preserve a person's life story for their extended family.",
  "Build a family legacy that is not only wealth, but also lived experiences.",
  "Transform real-life lessons into stories that remain useful for years to come.",
  "Strengthen family bonds through shared memories, values, and lineage records.",
  "Make family tree tracking easier and clearer over time.",
];

const benefitPointsEn = [
  "A person's life is not forgotten, but remembered through a meaningful legacy.",
  "Children, grandchildren, and relatives gain lessons that enrich their perspective.",
  "Family closeness is maintained through preserved messages and memories.",
  "Reduces conflicting family narratives by keeping structured archives.",
  "Builds awareness to preserve life stories as inspiration for others.",
];

const visionPointsEn = [
  "Become Indonesia's most creative and leading life-story writing company.",
  "Set a trend for self-actualization through professional biography writing.",
  "Strengthen relationships within large families.",
  "Ensure each client's life story is preserved with dignity.",
  "Become a channel of blessing for clients and wider communities.",
  "Build a public-access gallery office in the future.",
];

const missionPointsEn = [
  "Always deliver distinctive concepts and premium packaging.",
  "Provide professional and exclusive services in every project.",
  "Maintain strong after-sales service to build long-term trust.",
  "Create a memorable final handover experience for each family.",
];

const marketPointsEn = [
  "This is still a relatively new category with market-leader potential.",
  "There is a growing culture of personal documentation across generations.",
  "People seek self-actualization and meaningful channels to express legacy.",
  "Most people want to leave something valuable for their children and grandchildren.",
];

const fromForPointsEn = [
  "From a father to his children",
  "From a child to their father",
  "From siblings to each other",
  "From one generation to the next",
];

const productBentoEn = [
  {
    title: "Exclusive Autobiography Book",
    icon: BookOpenText,
    className:
      "lg:col-span-2 bg-[linear-gradient(140deg,#fff5df_0%,#fffaf0_58%,#fff_100%)]",
    points: [
      "Premium hard cover, high-quality paper, water-resistant custom packaging.",
      "Includes old photos, documents, and new photos from Lifestory sessions.",
      "Personal layout design with strong narrative flow and pop-up caricature.",
    ],
  },
  {
    title: "Interview & Documentary Video",
    icon: Video,
    className:
      "lg:col-span-1 bg-[linear-gradient(145deg,#f4efe6_0%,#fffaf4_100%)]",
    points: [
      "Guided interviews and meaningful life-activity documentation.",
      "Curated highlight summary with premium packaging and flash disk.",
    ],
  },
  {
    title: "Family Lineage Poster",
    icon: TreePine,
    className:
      "lg:col-span-1 bg-[linear-gradient(145deg,#eef5ec_0%,#fbfffa_100%)]",
    points: [
      "Printed and framed, with expandable slots for future periods.",
      "Supports visual and accessible family-tree tracking.",
    ],
  },
  {
    title: "Photo Session & Large Prints",
    icon: Camera,
    className:
      "lg:col-span-2 bg-[linear-gradient(145deg,#f7f3eb_0%,#ffffff_100%)]",
    points: [
      "20R print output, 30 digital files, and 2 framed mini photos.",
      "Artistic visual documentation to complete each family's narrative.",
    ],
  },
];

const packagesEn = [
  {
    title: "Customized Biography Book",
    tag: "Signature",
    desc: "A personalized life-story book crafted as a timeless family legacy.",
    className:
      "lg:col-span-2 bg-[linear-gradient(145deg,#fff9ef_0%,#fff_100%)]",
    icon: BookOpenText,
    features: [
      "Hard cover, old + new photos, writing, design, and layout.",
      "Waterproof and unique packaging.",
      "Pop-up caricature and high-quality paper.",
    ],
  },
  {
    title: "Photo Session",
    tag: "Visual Legacy",
    desc: "Professional photo sessions to enrich every biography project.",
    className:
      "lg:col-span-2 bg-[linear-gradient(145deg,#f4f0e8_0%,#fffaf4_100%)]",
    icon: Camera,
    features: [
      "Final output in 20R print.",
      "30 high-resolution digital files.",
      "2 bonus smaller framed photos.",
    ],
  },
  {
    title: "Video Package",
    tag: "Documentary",
    desc: "Interview, activity documentation, and life-memory highlights.",
    className:
      "lg:col-span-1 bg-[linear-gradient(145deg,#f8f4ec_0%,#fff_100%)]",
    icon: Video,
    features: [
      "Premium video packaging.",
      "Includes flash disk and final package box.",
      "Narrative that protects the family's original message.",
    ],
  },
  {
    title: "Family Tree Printed & Framed",
    tag: "Legacy Map",
    desc: "Elegant lineage visualization that can grow across generations.",
    className:
      "lg:col-span-1 bg-[linear-gradient(145deg,#eef5ec_0%,#fff_100%)]",
    icon: TreePine,
    features: [
      "Printed and framed output.",
      "Additional slots for future generation updates.",
      "Recorded in Lifestory database with symbolic thank-you message.",
    ],
  },
];

const sectionVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: index * 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const staggerVariant: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

export default function AboutPage() {
  const { locale } = useLanguage();
  const isId = locale === "id";
  const reduceMotion = useReducedMotion();
  const viewportAmount = reduceMotion ? 0.16 : 0.24;
  const pageCopy = isId
    ? {
        aboutLabel: "Tentang Lifestory Co.",
        heroTitle: "Kisah hidup bukan untuk berhenti di satu generasi.",
        heroBody:
          "Lifestory Company adalah jasa pengabadian kisah hidup dan kenangan lama yang didedikasikan terutama untuk keturunan serta sanak saudara, agar jati diri dan keberadaan seseorang tetap hidup sebagai inspirasi dan pengetahuan keluarga.",
        storyLabel: "Emotional Storytelling",
        storyTitle: "Perjalanan kisah yang terasa sinematis saat digulir.",
        storyBody:
          "Setiap section hadir bertahap dengan transisi lembut agar pengunjung merasakan alur cerita, bukan sekadar membaca informasi.",
        whyLabel: "Mengapa Butuh Lifestory?",
        whyTitle: "Karena setiap orang hanya hidup sekali.",
        purposeLabel: "Apa Tujuan Lifestory?",
        purposeTitle: "Membangun warisan keluarga yang hidup, rapi, dan bermakna.",
        benefitLabel: "Apa Manfaatnya?",
        benefitTitle:
          "Memori keluarga jadi sumber pelajaran, bukan cerita yang hilang.",
        bentoLabel: "Grid Produk Bento",
        bentoTitle: "Berupa apa hasil akhirnya?",
        bentoBody:
          "Kombinasi produk fisik dan digital untuk menjaga cerita tetap utuh, mudah dibaca, dan bisa diwariskan lintas generasi.",
        packageLabel: "Bento Paket Layanan",
        packageTitle: "Pilihan paket yang fleksibel dengan layout modern.",
        packageBody:
          "Setiap kartu paket memiliki prioritas visual berbeda agar pengguna langsung memahami produk utama dan pendukung.",
        sideEffectLabel: "Efek Positif",
        sideEffectBody:
          "Kita bisa mengerti kehidupan orang lain, belajar dari pengalaman mereka, dan perlahan membagikan kasih Kristus saat hati mulai terbuka.",
        visionLabel: "Visi",
        missionLabel: "Misi",
        marketLabel: "Peluang Pasar",
        fromForLabel: "Dari dan Untuk Siapa",
        priorityLabel: "Yang Kami Utamakan",
        priorityTitle: "Selalu memberi yang spesial dan berkualitas.",
        priorityBody:
          "Kami membentuk citra merek yang kuat sambil mengedukasi masyarakat bahwa cerita kehidupan adalah sesuatu yang berharga untuk dicatat dan diabadikan.",
        consultCta: "Konsultasi Paket",
        exploreCta: "Jelajahi Pohon Keluarga",
      }
    : {
        aboutLabel: "About Lifestory Co.",
        heroTitle: "A life story should not stop at one generation.",
        heroBody:
          "Lifestory Company is a life-story preservation service dedicated not only to individuals, but especially to their descendants and relatives, so identity and legacy remain an inspiration for future families.",
        storyLabel: "Emotional Storytelling",
        storyTitle: "A cinematic story journey revealed while scrolling.",
        storyBody:
          "Each section appears progressively with soft transitions, so visitors can feel the narrative flow instead of consuming static blocks.",
        whyLabel: "Why We Need Lifestory",
        whyTitle: "Because each life is lived only once.",
        purposeLabel: "What Is Lifestory's Purpose?",
        purposeTitle:
          "To build a living, meaningful, and structured family legacy.",
        benefitLabel: "What Are the Benefits?",
        benefitTitle:
          "Family memories become lessons, not stories lost over time.",
        bentoLabel: "Product Bento Grid",
        bentoTitle: "What are the final deliverables?",
        bentoBody:
          "A blend of physical and digital products designed to preserve stories, improve readability, and pass legacy across generations.",
        packageLabel: "Service Package Bento",
        packageTitle: "Flexible packages presented with a modern layout.",
        packageBody:
          "Each package card has distinct visual weight to make flagship and supporting services clearer at a glance.",
        sideEffectLabel: "Positive Side Effect",
        sideEffectBody:
          "We can understand other people's lives, learn from their journeys, and gently share the love of Christ as hearts become open.",
        visionLabel: "Vision",
        missionLabel: "Mission",
        marketLabel: "Market Opportunity",
        fromForLabel: "From and For",
        priorityLabel: "What We Prioritize",
        priorityTitle: "Always delivering something special and high quality.",
        priorityBody:
          "We are building a strong brand image while educating the public that life stories are valuable records worth preserving.",
        consultCta: "Consult Packages",
        exploreCta: "Explore Family Tree",
      };
  const currentHeroHighlights = isId ? heroHighlights : heroHighlightsEn;
  const currentStoryMoments = isId ? storyMoments : storyMomentsEn;
  const currentWhyPoints = isId ? whyPoints : whyPointsEn;
  const currentPurposePoints = isId ? purposePoints : purposePointsEn;
  const currentBenefitPoints = isId ? benefitPoints : benefitPointsEn;
  const currentVisionPoints = isId ? visionPoints : visionPointsEn;
  const currentMissionPoints = isId ? missionPoints : missionPointsEn;
  const currentMarketPoints = isId ? marketPoints : marketPointsEn;
  const currentFromForPoints = isId ? fromForPoints : fromForPointsEn;
  const currentProductBento = isId ? productBento : productBentoEn;
  const currentPackages = isId ? packages : packagesEn;

  return (
    <div className="bg-cream-100 text-ink-700">
      <section className="relative overflow-hidden bg-gradient-to-b from-cream-50 via-cream-100 to-cream-200">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-32 h-[420px] w-[420px] rounded-full bg-brand-200/30 blur-3xl" />
          <div className="absolute -right-32 -top-10 h-[360px] w-[360px] rounded-full bg-accent-100/35 blur-3xl" />
          <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-40" />
        </div>

        {/* Timeline strip at the top */}
        <div className="relative border-b border-cream-300/60">
          <div className="mx-auto flex max-w-[1320px] items-center gap-4 overflow-x-auto px-6 py-3">
            <RibbonBadge className="hidden flex-none sm:inline-flex">
              {isId ? "Sejarah" : "Heritage"}
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

        <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-6 pb-20 pt-16 md:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-28 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0.01 : 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="inline-flex items-center gap-2 rounded-pill border border-cream-300 bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              {pageCopy.aboutLabel}
            </span>
            <h1 className="mt-6 font-serif font-medium text-[clamp(2.6rem,7.2vw,5.6rem)] leading-[0.96] tracking-[-0.025em] text-ink-800">
              {pageCopy.heroTitle}
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: reduceMotion ? 0.01 : 1,
                delay: 0.18,
                ease: "easeOut",
              }}
              className="mt-7 max-w-xl text-base leading-relaxed text-ink-500 md:text-lg"
            >
              {pageCopy.heroBody}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0.01 : 0.6,
                delay: 0.3,
                ease: "easeOut",
              }}
              className="mt-8 flex flex-wrap gap-2"
            >
              {currentHeroHighlights.map((item) => (
                <span
                  key={item}
                  className="rounded-pill border border-cream-300 bg-white/75 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500"
                >
                  {item}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0.01 : 0.6,
                delay: 0.42,
                ease: "easeOut",
              }}
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <Link href="/contact" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  block
                  iconRight={<ArrowRight className="h-4 w-4" />}
                  animateRightIcon
                  className="sm:w-auto"
                >
                  {pageCopy.consultCta}
                </Button>
              </Link>
              <Link href="/app" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" block className="sm:w-auto">
                  {pageCopy.exploreCta}
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* RIGHT — Polaroid-style photo cluster (no shared hero image) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: reduceMotion ? 0.01 : 0.8,
              delay: 0.2,
            }}
            className="relative hidden h-[520px] lg:block"
          >
            {[
              {
                src: "/cover-gallery/cover-2.png",
                style: "left-0 top-4 -rotate-6 z-10 h-[320px] w-[230px]",
                tag: "1965",
              },
              {
                src: "/cover-gallery/cover-3.png",
                style:
                  "left-1/2 top-12 -translate-x-1/2 rotate-2 z-30 h-[400px] w-[270px]",
                tag: "1992",
              },
              {
                src: "/cover-gallery/cover-4.png",
                style: "right-0 top-32 rotate-6 z-20 h-[300px] w-[210px]",
                tag: "Today",
              },
            ].map((p, i) => (
              <motion.figure
                key={p.src}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0.01 : 0.9,
                  delay: 0.5 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`absolute overflow-hidden rounded-[12px] border border-cream-400 bg-white p-2 shadow-deep ${p.style}`}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[6px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-pill bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700 shadow-soft">
                  {p.tag}
                </figcaption>
              </motion.figure>
            ))}
          </motion.div>

          {/* Mobile/tablet fallback — single horizontal photo strip */}
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0.01 : 0.7,
              delay: reduceMotion ? 0 : 0.4,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative -mx-2 flex items-end gap-3 overflow-hidden lg:hidden"
            aria-hidden
          >
            {["/cover-gallery/cover-2.png", "/cover-gallery/cover-3.png", "/cover-gallery/cover-4.png"].map(
              (src, i) => {
                const sizes = ["h-44 w-32", "h-56 w-36", "h-48 w-32"];
                const rotations = ["-rotate-3", "rotate-1", "rotate-3"];
                const tags = ["1965", "1992", "Today"];
                return (
                  <figure
                    key={src}
                    className={`relative flex-none overflow-hidden rounded-[10px] border border-cream-400 bg-white p-1.5 shadow-elev ${sizes[i]} ${rotations[i]}`}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-[6px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                    <figcaption className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-pill bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-brand-700 shadow-soft">
                      {tags[i]}
                    </figcaption>
                  </figure>
                );
              }
            )}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <motion.div
          variants={staggerVariant}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: viewportAmount }}
        >
          <motion.div variants={sectionVariant} custom={0} className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
              {pageCopy.storyLabel}
            </p>
            <h2 className="mt-3 font-serif text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.05] text-[#3f342d]">
              {pageCopy.storyTitle}
            </h2>
            <p className="mt-4 text-[#6c6055]">{pageCopy.storyBody}</p>
          </motion.div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {currentStoryMoments.map((moment, index) => {
              const Icon = moment.icon;
              return (
                <motion.article
                  key={moment.title}
                  variants={sectionVariant}
                  custom={index + 1}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#dfd3c2] p-6 shadow-[0_16px_30px_rgba(59,43,24,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_34px_rgba(59,43,24,0.14)] ${moment.className}`}
                >
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[rgba(202,162,79,0.12)] transition group-hover:scale-110" />
                  <div className="relative flex h-full flex-col">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a7c4e]">
                        {moment.phase}
                      </span>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ddc7a2] bg-white/80 text-[#b07f2f]">
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl leading-tight text-[#3f342d]">
                      {moment.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#6a5f55]">
                      {moment.body}
                    </p>
                    <p className="mt-auto pt-4 text-sm italic text-[#7b6d61]">
                      "{moment.note}"
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-24">
        <motion.div
          variants={staggerVariant}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: viewportAmount }}
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <motion.article
              variants={sectionVariant}
              custom={0}
              className="rounded-3xl border border-[#dfd2be] bg-white/80 p-7 shadow-[0_14px_24px_rgba(59,43,24,0.08)]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
                {pageCopy.whyLabel}
              </p>
              <h2 className="mt-3 font-serif text-[clamp(1.7rem,3.6vw,2.35rem)] text-[#3f342d]">
                {pageCopy.whyTitle}
              </h2>
              <div className="mt-5 space-y-3 text-[#6e6258]">
                {currentWhyPoints.map((point) => (
                  <p key={point} className="leading-relaxed">
                    {point}
                  </p>
                ))}
              </div>
            </motion.article>

            <motion.article
              variants={sectionVariant}
              custom={1}
              className="rounded-3xl border border-[#dfd2be] bg-white/80 p-7 shadow-[0_14px_24px_rgba(59,43,24,0.08)]"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
                {pageCopy.purposeLabel}
              </p>
              <h2 className="mt-3 font-serif text-[clamp(1.7rem,3.6vw,2.35rem)] text-[#3f342d]">
                {pageCopy.purposeTitle}
              </h2>
              <div className="mt-5 grid gap-2.5">
                {currentPurposePoints.map((point) => (
                  <p
                    key={point}
                    className="flex items-start gap-2.5 rounded-xl border border-[#eee1cb] bg-[#fffcf7] p-3 text-[#6e6258]"
                  >
                    <Check className="mt-0.5 h-4 w-4 flex-none text-[#c48b24]" />
                    <span>{point}</span>
                  </p>
                ))}
              </div>
            </motion.article>

            <motion.article
              variants={sectionVariant}
              custom={2}
              className="rounded-3xl border border-[#dfd2be] bg-white/82 p-7 shadow-[0_14px_24px_rgba(59,43,24,0.08)] lg:col-span-2"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
                {pageCopy.benefitLabel}
              </p>
              <h2 className="mt-3 font-serif text-[clamp(1.7rem,3.3vw,2.2rem)] text-[#3f342d]">
                {pageCopy.benefitTitle}
              </h2>
              <div className="mt-5 grid gap-2.5 md:grid-cols-2">
                {currentBenefitPoints.map((point) => (
                  <p
                    key={point}
                    className="flex items-start gap-2.5 rounded-xl border border-[#eee1cb] bg-[#fffcf7] p-3 text-[#6e6258]"
                  >
                    <Gem className="mt-0.5 h-4 w-4 flex-none text-[#c48b24]" />
                    <span>{point}</span>
                  </p>
                ))}
              </div>
            </motion.article>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: viewportAmount }}
          variants={staggerVariant}
        >
          <motion.div variants={sectionVariant} custom={0} className="mb-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
              {pageCopy.bentoLabel}
            </p>
            <h2 className="mt-3 font-serif text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.06] text-[#3f342d]">
              {pageCopy.bentoTitle}
            </h2>
            <p className="mt-4 text-[#6d6157]">
              {pageCopy.bentoBody}
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {currentProductBento.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  variants={sectionVariant}
                  custom={index + 1}
                  className={`group relative overflow-hidden rounded-3xl border border-[#dfd3c2] p-6 shadow-[0_18px_32px_rgba(61,47,28,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_36px_rgba(61,47,28,0.18)] ${item.className}`}
                >
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[rgba(202,162,79,0.1)] transition group-hover:scale-110" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#ddc7a2] bg-white/78 text-[#b07f2f]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-serif text-xl text-[#3f342d]">
                      {item.title}
                    </h3>
                    <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#665b51]">
                      {item.points.map((point) => (
                        <p key={point}>{point}</p>
                      ))}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: viewportAmount }}
          variants={staggerVariant}
        >
          <motion.div variants={sectionVariant} custom={0} className="mb-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
              {pageCopy.packageLabel}
            </p>
            <h2 className="mt-3 font-serif text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.06] text-[#3f342d]">
              {pageCopy.packageTitle}
            </h2>
            <p className="mt-4 text-[#6d6157]">
              {pageCopy.packageBody}
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {currentPackages.map((pkg, index) => {
              const Icon = pkg.icon;
              return (
                <motion.article
                  key={pkg.title}
                  variants={sectionVariant}
                  custom={index + 1}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className={`group rounded-3xl border border-[#dfd2be] p-7 shadow-[0_14px_24px_rgba(59,43,24,0.09)] transition hover:border-[#cda15a] hover:shadow-[0_20px_34px_rgba(59,43,24,0.15)] ${pkg.className}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfc9a1] bg-white/80 text-[#9d7641]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full border border-[#dfc9a1] bg-[#fff7e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9d7641]">
                      {pkg.tag}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl text-[#3f342d]">
                    {pkg.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#6f645a]">
                    {pkg.desc}
                  </p>
                  <div className="mt-5 grid gap-2.5">
                    {pkg.features.map((feature) => (
                      <p
                        key={feature}
                        className="flex items-start gap-2.5 rounded-xl bg-[#faf6ef] px-3 py-2.5 text-sm text-[#60554c]"
                      >
                        <Sparkles className="mt-0.5 h-4 w-4 flex-none text-[#bd892f]" />
                        <span>{feature}</span>
                      </p>
                    ))}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: viewportAmount }}
          variants={staggerVariant}
          className="grid gap-6 lg:grid-cols-3"
        >
          <motion.article
            variants={sectionVariant}
            custom={0}
            className="rounded-3xl border border-[#dfd2be] bg-white/85 p-7 shadow-[0_14px_24px_rgba(59,43,24,0.09)] lg:col-span-2"
          >
            <div className="flex items-center gap-2 text-[#9b845f]">
              <Quote className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                {pageCopy.sideEffectLabel}
              </p>
            </div>
            <p className="mt-4 text-lg leading-relaxed text-[#5f544b]">
              {pageCopy.sideEffectBody}
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div>
                <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
                  <Target className="h-4 w-4" />
                  {pageCopy.visionLabel}
                </p>
                <div className="space-y-2.5">
                  {currentVisionPoints.map((point) => (
                    <p key={point} className="text-sm leading-relaxed text-[#64584e]">
                      {point}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
                  <HeartHandshake className="h-4 w-4" />
                  {pageCopy.missionLabel}
                </p>
                <div className="space-y-2.5">
                  {currentMissionPoints.map((point) => (
                    <p key={point} className="text-sm leading-relaxed text-[#64584e]">
                      {point}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </motion.article>

          <motion.article
            variants={sectionVariant}
            custom={1}
            className="rounded-3xl border border-[#dfd2be] bg-white/85 p-7 shadow-[0_14px_24px_rgba(59,43,24,0.09)]"
          >
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
              <Building2 className="h-4 w-4" />
              {pageCopy.marketLabel}
            </p>
            <div className="mt-4 space-y-2.5">
              {currentMarketPoints.map((point) => (
                <p
                  key={point}
                  className="rounded-xl border border-[#ece2d3] bg-[#fffcf8] p-3 text-sm leading-relaxed text-[#65594f]"
                >
                  {point}
                </p>
              ))}
            </div>

            <div className="mt-6 border-t border-[#ebe0cf] pt-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
                {pageCopy.fromForLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {currentFromForPoints.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-[#dfcfb4] bg-[#fdf6ea] px-3 py-1.5 text-[11px] font-semibold text-[#786657]"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>
          </motion.article>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: viewportAmount }}
          transition={{ duration: reduceMotion ? 0.01 : 0.6, ease: "easeOut" }}
          className="mt-10 rounded-[30px] border border-[#d9c8ad] bg-[linear-gradient(140deg,#fff8ed_0%,#fff_100%)] px-6 py-10 text-center shadow-[0_18px_34px_rgba(59,43,24,0.12)] md:px-12"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
            {pageCopy.priorityLabel}
          </p>
          <h3 className="mt-4 font-serif text-[clamp(1.9rem,4vw,3rem)] text-[#3f342d]">
            {pageCopy.priorityTitle}
          </h3>
          <p className="mx-auto mt-4 max-w-3xl text-[#685d53]">
            {pageCopy.priorityBody}
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <Link href="/contact" className="w-full sm:w-auto">
              <Button
                size="lg"
                block
                iconRight={<ArrowRight className="h-4 w-4" />}
                animateRightIcon
                className="sm:w-auto"
              >
                {pageCopy.consultCta}
              </Button>
            </Link>
            <Link href="/app" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" block className="sm:w-auto">
                {pageCopy.exploreCta}
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

