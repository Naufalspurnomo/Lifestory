"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
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

const heroImage = "/hero-bg.jpg";

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
      "md:col-span-2 md:row-span-2 bg-[linear-gradient(140deg,#fff5df_0%,#fffaf0_58%,#fff_100%)]",
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
      "md:col-span-1 md:row-span-1 bg-[linear-gradient(145deg,#f4efe6_0%,#fffaf4_100%)]",
    points: [
      "Wawancara terarah dan dokumentasi aktivitas bermakna.",
      "Rangkuman momen terbaik dalam kemasan eksklusif + flash disk.",
    ],
  },
  {
    title: "Poster Pohon Keturunan",
    icon: TreePine,
    className:
      "md:col-span-1 md:row-span-1 bg-[linear-gradient(145deg,#eef5ec_0%,#fbfffa_100%)]",
    points: [
      "Dicetak dan dibingkai, dengan slot tambahan untuk periode selanjutnya.",
      "Mendukung pelacakan silsilah secara visual dan mudah dipahami.",
    ],
  },
  {
    title: "Sesi Foto & Cetak Besar",
    icon: Camera,
    className:
      "md:col-span-2 md:row-span-1 bg-[linear-gradient(145deg,#f7f3eb_0%,#ffffff_100%)]",
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
      "md:col-span-2 md:row-span-2 bg-[linear-gradient(140deg,#fff5df_0%,#fffaf0_58%,#fff_100%)]",
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
      "md:col-span-1 md:row-span-1 bg-[linear-gradient(145deg,#f4efe6_0%,#fffaf4_100%)]",
    points: [
      "Guided interviews and meaningful life-activity documentation.",
      "Curated highlight summary with premium packaging and flash disk.",
    ],
  },
  {
    title: "Family Lineage Poster",
    icon: TreePine,
    className:
      "md:col-span-1 md:row-span-1 bg-[linear-gradient(145deg,#eef5ec_0%,#fbfffa_100%)]",
    points: [
      "Printed and framed, with expandable slots for future periods.",
      "Supports visual and accessible family-tree tracking.",
    ],
  },
  {
    title: "Photo Session & Large Prints",
    icon: Camera,
    className:
      "md:col-span-2 md:row-span-1 bg-[linear-gradient(145deg,#f7f3eb_0%,#ffffff_100%)]",
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
    features: [
      "Printed and framed output.",
      "Additional slots for future generation updates.",
      "Recorded in Lifestory database with symbolic thank-you message.",
    ],
  },
];

const sectionVariant: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerVariant: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export default function AboutPage() {
  const { locale } = useLanguage();
  const isId = locale === "id";
  const pageCopy = isId
    ? {
        aboutLabel: "Tentang Lifestory Co.",
        heroTitle: "Kisah hidup bukan untuk berhenti di satu generasi.",
        heroBody:
          "Lifestory Company adalah jasa pengabadian kisah hidup dan kenangan lama yang didedikasikan terutama untuk keturunan serta sanak saudara, agar jati diri dan keberadaan seseorang tetap hidup sebagai inspirasi dan pengetahuan keluarga.",
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
        packageLabel: "Paket Interaktif",
        packageTitle: "Paket layanan yang elegan dan fleksibel.",
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
        packageLabel: "Interactive Packages",
        packageTitle: "Elegant and flexible service packages.",
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
    <div className="bg-[#f7f5f1] text-[#40342c]">
      <section className="relative min-h-[88vh] overflow-hidden">
        <div
          className="absolute inset-0 scale-[1.02] bg-cover bg-center"
          style={{ backgroundImage: `url("${heroImage}")` }}
        />
        <div className="absolute inset-0 bg-[rgba(245,236,219,0.72)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.74)_0%,rgba(245,236,219,0.3)_45%,rgba(247,245,241,0.96)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.55),transparent_42%),radial-gradient(circle_at_82%_4%,rgba(228,191,112,0.2),transparent_34%)]" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl items-center px-6 pb-20 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <p className="mb-6 inline-flex items-center rounded-full border border-[#dccfb7] bg-[rgba(255,255,255,0.72)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7b6f63] backdrop-blur-sm">
              {pageCopy.aboutLabel}
            </p>
            <h1 className="font-serif text-[clamp(2.8rem,7.6vw,6rem)] leading-[0.96] tracking-[-0.02em] text-[#3f342d]">
              {pageCopy.heroTitle}
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.1, delay: 0.2, ease: "easeOut" }}
              className="mt-6 max-w-3xl text-[clamp(1rem,2vw,1.45rem)] leading-relaxed text-[#73685f]"
            >
              {pageCopy.heroBody}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
              className="mt-9 flex flex-wrap gap-2.5"
            >
              {["React", "Tailwind CSS", "Framer Motion"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#d8cab1] bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6f645b]"
                >
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <motion.div
          variants={staggerVariant}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-16"
        >
          <motion.article
            variants={sectionVariant}
            className="grid gap-6 rounded-3xl border border-[#dfd2be] bg-white/75 p-7 shadow-[0_16px_30px_rgba(59,43,24,0.08)] md:grid-cols-[220px,1fr]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
              {pageCopy.whyLabel}
            </p>
            <div className="space-y-4">
              <h2 className="font-serif text-[clamp(1.7rem,4vw,2.5rem)] text-[#3f342d]">
                {pageCopy.whyTitle}
              </h2>
              <div className="space-y-3 text-[#6e6258]">
                {currentWhyPoints.map((point) => (
                  <p key={point} className="leading-relaxed">
                    {point}
                  </p>
                ))}
              </div>
            </div>
          </motion.article>

          <motion.article
            variants={sectionVariant}
            className="grid gap-6 rounded-3xl border border-[#dfd2be] bg-white/75 p-7 shadow-[0_16px_30px_rgba(59,43,24,0.08)] md:grid-cols-[220px,1fr]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
              {pageCopy.purposeLabel}
            </p>
            <div className="space-y-4">
              <h2 className="font-serif text-[clamp(1.7rem,4vw,2.5rem)] text-[#3f342d]">
                {pageCopy.purposeTitle}
              </h2>
              <div className="grid gap-2.5">
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
            </div>
          </motion.article>

          <motion.article
            variants={sectionVariant}
            className="grid gap-6 rounded-3xl border border-[#dfd2be] bg-white/75 p-7 shadow-[0_16px_30px_rgba(59,43,24,0.08)] md:grid-cols-[220px,1fr]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
              {pageCopy.benefitLabel}
            </p>
            <div className="space-y-4">
              <h2 className="font-serif text-[clamp(1.7rem,4vw,2.5rem)] text-[#3f342d]">
                {pageCopy.benefitTitle}
              </h2>
              <div className="grid gap-2.5">
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
            </div>
          </motion.article>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerVariant}
        >
          <motion.div variants={sectionVariant} className="mb-10 max-w-3xl">
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

          <div className="grid gap-5 md:grid-cols-3 md:auto-rows-[220px]">
            {currentProductBento.map((item) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  variants={sectionVariant}
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
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerVariant}
        >
          <motion.div variants={sectionVariant} className="mb-10 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b845f]">
              {pageCopy.packageLabel}
            </p>
            <h2 className="mt-3 font-serif text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.06] text-[#3f342d]">
              {pageCopy.packageTitle}
            </h2>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {currentPackages.map((pkg) => (
              <motion.article
                key={pkg.title}
                variants={sectionVariant}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group rounded-3xl border border-[#dfd2be] bg-white p-7 shadow-[0_14px_24px_rgba(59,43,24,0.09)] transition hover:border-[#cda15a] hover:shadow-[0_20px_34px_rgba(59,43,24,0.15)]"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-serif text-2xl text-[#3f342d]">
                    {pkg.title}
                  </h3>
                  <span className="rounded-full border border-[#dfc9a1] bg-[#fff7e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9d7641]">
                    {pkg.tag}
                  </span>
                </div>
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
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerVariant}
          className="grid gap-6 lg:grid-cols-3"
        >
          <motion.article
            variants={sectionVariant}
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
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
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
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#e6ab2f] to-[#cc8a12] px-7 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-white shadow-[0_14px_30px_rgba(169,116,21,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(169,116,21,0.4)]"
            >
              {pageCopy.consultCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center rounded-full border border-[#d7c4a1] bg-white px-7 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-[#6a584a] transition hover:bg-[#fffaf0]"
            >
              {pageCopy.exploreCta}
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
