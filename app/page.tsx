"use client";

import { useSession } from "next-auth/react";
import { useLanguage } from "../components/providers/LanguageProvider";
import { HomeHero } from "../components/home/HomeHero";
import { StatsStrip } from "../components/home/StatsStrip";
import { HowItWorks } from "../components/home/HowItWorks";
import { Deliverables } from "../components/home/Deliverables";
import { FeaturedCollections } from "../components/home/FeaturedCollections";
import { Testimonials } from "../components/home/Testimonials";
import { FAQ } from "../components/home/FAQ";
import { PhilosophyDeaths } from "../components/home/PhilosophyDeaths";
import { FinalCTA } from "../components/home/FinalCTA";
import { STUDIO_CITY } from "../lib/contact-info";

export default function HomePage() {
  const { data: session, status } = useSession();
  const { locale } = useLanguage();
  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isAdmin = user?.role === "admin";
  const isSubscribed = Boolean(user?.subscriptionActive);

  const isId = locale === "id";
  const primaryCtaHref = !isLoggedIn
    ? "/auth/login"
    : isAdmin
    ? "/dashboard"
    : isSubscribed
    ? "/app"
    : "/subscribe";

  const secondaryCtaHref = !isLoggedIn
    ? "/gallery"
    : isAdmin
    ? "/app"
    : "/gallery";

  // ---- COPY ----
  const copy = isId
    ? {
        hero: {
          eyebrow: "Lifestory · Studio Biografi",
          studioCity: STUDIO_CITY,
          featuredLabel: "Featured",
          headlineLine1: "Kisah",
          headlineRotators: ["keluarga", "ayah", "ibu", "hidup", "warisan"],
          headlineLine2: "yang berharga",
          headlineAccent: "diabadikan",
          headlineLine3: "lintas generasi.",
          subheading:
            "Kami membantu keluarga merekam wawancara, merapikan arsip foto, dan menyusunnya jadi buku serta film yang bisa diwariskan.",
          primaryCta: !isLoggedIn
            ? "Mulai Konsultasi"
            : isAdmin
            ? "Buka Dashboard"
            : isSubscribed
            ? "Buka Arsip Keluarga"
            : "Aktifkan Paket",
          secondaryCta: !isLoggedIn ? "Galeri Lifestory" : "Galeri Lifestory",
          badge1: "Server aman",
          badge2: "Silsilah digital",
          badge3: "Cetak ulang kapan saja",
          badge4: "Tonton ulang kapan saja",
          scrollHint: "Gulir",
        },
        stats: {
          eyebrow: "Arsip Pilihan",
          title: "Kisah yang kini bisa diwariskan.",
          previousLabel: "Kisah sebelumnya",
          nextLabel: "Kisah berikutnya",
          photoLabel: "Arsip keluarga",
          videoLabel: "Film keluarga",
          interactionHint:
            "Pilih judul untuk menelusuri setiap arsip keluarga dengan ritme Anda sendiri.",
          items: [
            {
              src: "/cover-gallery/cover-1.webp",
              alt: "Buku biografi Wang Li Jien",
              title: "Wang Li Jien",
              subtitle: "Personal life memoir",
              type: "photo" as const,
            },
            {
              src: "/cover-gallery/cover-2.webp",
              alt: "Buku tribute Kisah Ibu Kami",
              title: "Kisah Ibu Kami",
              subtitle: "Family tribute edition",
              type: "photo" as const,
            },
            {
              src: "/cover-gallery/cover-3.webp",
              alt: "Buku kronik Pak Yohannes",
              title: "Kisah Pak Yohannes",
              subtitle: "Family photo chronicle",
              type: "photo" as const,
            },
            {
              src: "/cover-gallery/cover-4.webp",
              alt: "Buku memoar Bara yang Hangat",
              title: "Bara yang Hangat & Angin yang Sejuk",
              subtitle: "Legacy memory edition",
              type: "photo" as const,
            },
            {
              src: "/image/home-step-2.webp",
              alt: "Proses pembuatan video dokumenter keluarga",
              title: "Dokumenter Keluarga",
              subtitle: "Cinematic family film",
              type: "video" as const,
            },
            {
              src: "/image/home-step-1.webp",
              alt: "Sesi wawancara dan foto keluarga",
              title: "Sesi Keluarga",
              subtitle: "Behind the scenes",
              type: "photo" as const,
            },
          ],
        },
        howItWorks: {
          eyebrow: "Cara Kami Bekerja",
          title: "Tiga tahap kerja dari arsip mentah ke karya jadi.",
          lead: "Alurnya jelas: wawancara dan pengumpulan bahan, penyuntingan naskah serta visual, lalu penyerahan final bersama keluarga.",
          stepLabel: "Tahap",
          activeStepLabel: "Tahap aktif",
          steps: [
            {
              title: "Wawancara dan pengumpulan arsip.",
              body: "Kami menjadwalkan sesi wawancara, memetakan timeline keluarga, lalu mengumpulkan foto, dokumen, dan rekaman suara yang masih tersimpan.",
              note: "Minggu 1-3",
              points: ["Sesi wawancara terstruktur", "Audit foto & dokumen", "Pemetaan timeline keluarga"],
              image: "/image/home-step-1.webp",
              alt: "Sesi wawancara dan pengumpulan arsip keluarga",
            },
            {
              title: "Penyuntingan naskah, foto, dan film.",
              body: "Tim kami menulis naskah biografi, merestorasi foto terpilih, lalu menyusun layout buku dan potongan film dokumenter untuk direview bersama.",
              note: "Minggu 4-10",
              points: ["Penulisan naskah biografi", "Restorasi foto prioritas", "Review layout & rough cut"],
              image: "/image/home-step-2.webp",
              alt: "Proses penyuntingan naskah, foto, dan film dokumenter",
            },
            {
              title: "Penyerahan final dan aktivasi arsip digital.",
              body: "Setelah revisi akhir disetujui, buku dan film diserahkan ke keluarga, lalu akses pohon keluarga digital diaktifkan untuk pembaruan mandiri.",
              note: "Minggu 11-12",
              points: ["Final QC & approval", "Penyerahan buku dan film", "Aktivasi pohon keluarga digital"],
              image: "/image/home-step-3.webp",
              alt: "Penyerahan final karya dan aktivasi arsip digital keluarga",
            },
          ],
        },
        deliverables: {
          eyebrow: "Apa yang Anda terima",
          title: "Enam karya warisan untuk keluarga Anda.",
          lead: "Kami susun hasil akhir dalam tiga lapis: output utama, pendukung, dan tambahan personal agar keluarga tahu mana yang paling penting terlebih dahulu.",
          items: [
            {
              tag: "Output utama",
              title: "Buku biografi & album foto premium",
              body: "Naskah kehidupan ditulis dengan penuh kedalaman, dicetak di atas kertas berkualitas arsip, dan dilengkapi album foto yang dikurasi serta direstorasi secara profesional.",
            },
            {
              tag: "Output utama",
              title: "Sesi foto keluarga bersama Lifestory",
              body: "Pemotretan profesional yang mengabadikan potret keluarga Anda hari ini, menjadi momen autentik yang kelak menjadi harta karun visual generasi berikutnya.",
            },
            {
              tag: "Output utama",
              title: "Video dokumenter sinematik",
              body: "Film pendek berkualitas sinema yang menghidupkan kembali suara, ekspresi, dan emosi sebagai warisan bergerak yang tak bisa ditangkap oleh tulisan saja.",
            },
            {
              tag: "Pendukung",
              title: "Pohon keluarga digital interaktif",
              body: "Akses seumur hidup ke silsilah digital Lifestory. Tambah anggota baru, perbarui cerita, dan kembangkan warisan Anda secara mandiri tanpa biaya tambahan.",
            },
            {
              tag: "Pendukung",
              title: "Makan malam perayaan keluarga",
              body: "Momen intim bersama orang-orang tercinta untuk merayakan kisah yang telah diabadikan sambil menikmati hidangan istimewa dan menyaksikan hasil karya untuk pertama kalinya.",
            },
            {
              tag: "Tambahan",
              title: "Karya seni kustom eksklusif",
              body: "Ilustrasi, lukisan, atau karya seni pilihan yang terinspirasi dari kisah keluarga Anda, memberi sentuhan artistik unik yang menjadikan paket warisan benar-benar personal.",
            },
          ],
        },
        featured: {
          eyebrow: "Galeri biografi",
          title: "Kurasi sampul dengan konteks keluarga yang berbeda.",
          lead: "Setiap cover kami tampilkan bersama catatan era, palet visual, dan ringkasan cerita agar Anda bisa menilai pendekatan yang paling dekat dengan karakter keluarga.",
          viewMore: "Lihat detail",
        },
        testimonials: {
          eyebrow: "Suara keluarga",
          title: "Yang kami dengar setelah buku diserahkan.",
          lead: "Kalimat-kalimat ini kami tulis apa adanya, lengkap dengan detail kecil yang paling diingat keluarga.",
          items: [
            {
              quote:
                "Di halaman 47 ada resep tulisan tangan ibu yang kami kira sudah hilang. Malam itu cucu-cucu langsung minta dibacakan ceritanya, dan untuk pertama kalinya mereka merasa benar-benar kenal neneknya.",
              author: "Keluarga Tanuwijaya",
              role: "Edisi Tribute Ibu",
            },
            {
              quote:
                "Tim Lifestory datang lagi dua kali karena saya masih ragu menyebut beberapa nama lama. Mereka tidak buru-buru; justru membantu kami cek ulang foto dan kronologi sampai ceritanya terasa jujur.",
              author: "Pak Yohannes",
              role: "Memoar Personal",
            },
            {
              quote:
                "Saya kira saya sudah siap saat proof PDF dikirim. Ternyata saya menangis di bagian surat untuk ayah. Layout-nya sederhana, tapi urutan fotonya persis seperti yang kami kenang di rumah lama.",
              author: "Suwati",
              role: "Memoar Lintas Generasi",
            },
          ],
          pressLabel: "Dipercaya oleh keluarga di",
          pressLogos: [
            "Jakarta",
            "Bandung",
            STUDIO_CITY,
            "Yogyakarta",
            "Medan",
            "Bali",
            "Singapura",
          ],
        },
        philosophy: {
          quote:
            "Manusia mati tiga kali: saat napas terhenti, saat raga dikuburkan, dan saat nama tak lagi disebut oleh orang-orang yang pernah mencintainya. Lifestory mengabadikan kisah Anda agar cerita, nama, dan warisan keluarga tetap hidup lintas generasi, karena selama kisah masih diceritakan, kematian ketiga tak pernah benar-benar terjadi.",
          quoteLines: [
            "Manusia mati tiga kali:",
            "saat napas terhenti, saat raga dikuburkan,",
            "dan saat nama tak lagi disebut oleh orang-orang yang pernah mencintainya.",
            "Lifestory mengabadikan kisah Anda agar cerita, nama, dan warisan keluarga tetap hidup lintas generasi.",
            "Karena selama kisah masih diceritakan, kematian ketiga tak pernah benar-benar terjadi.",
          ],
          intro: "Manusia mati tiga kali.",
          beats: [
            {
              kicker: "Pertama",
              title: "Napas terhenti",
              body: "Saat tubuh selesai berjuang dan waktu tidak bisa ditawar lagi.",
            },
            {
              kicker: "Kedua",
              title: "Raga dikuburkan",
              body: "Saat dunia mulai bergerak lagi tanpa kehadiran Anda di dalamnya.",
            },
            {
              kicker: "Ketiga",
              title: "Nama tak lagi disebut",
              body: "Saat cerita berhenti diwariskan dan seseorang hilang dari ingatan keluarga.",
            },
          ],
          closing:
            "Lifestory mengabadikan kisah Anda agar kematian ketiga tak pernah terjadi.",
          highlight: "kematian ketiga",
          attribution: "Lifestory",
        },
        faq: {
          eyebrow: "Pertanyaan",
          title: "Yang biasanya ditanyakan keluarga sebelum memulai.",
          items: [
            {
              q: "Berapa lama proses dari awal sampai buku diserahkan?",
              a: "Rata-rata 12 sampai 16 minggu, tergantung kompleksitas keluarga, jumlah narasumber, dan banyaknya material foto yang harus direstorasi.",
            },
            {
              q: "Apakah seluruh proses bisa dilakukan jarak jauh?",
              a: "Bisa. Wawancara dan diskusi visual bisa dilakukan via video call. Untuk sesi foto kami punya tim mobile yang bisa datang ke kota Anda.",
            },
            {
              q: "Siapa yang memiliki hak cipta atas naskah dan video?",
              a: "Hak penuh ada di pihak keluarga. Lifestory hanya pemegang lisensi terbatas untuk dokumentasi portfolio jika Anda mengizinkan.",
            },
            {
              q: "Bagaimana jika ada perbedaan ingatan antar anggota keluarga?",
              a: "Itu normal. Kami merangkum berbagai versi, mengonfirmasi ulang, dan menulis dengan bahasa yang menghormati semua perspektif tanpa memaksa satu versi tunggal.",
            },
            {
              q: "Apakah desain buku bisa disesuaikan?",
              a: "Setiap buku dirancang khusus. Kami punya beberapa direction visual sebagai titik mulai, lalu disesuaikan dengan kepribadian dan estetika keluarga.",
            },
          ],
          asideTitle: "Butuh bantuan menentukan paket?",
          asideBody:
            "Kami sediakan konsultasi 30 menit tanpa biaya untuk memetakan kebutuhan keluarga dan estimasi alur kerja.",
          asideCta: "Jadwalkan sesi",
        },
        finalCta: {
          eyebrow: "Konsultasi awal",
          title: "Mulai dengan konsultasi singkat.",
          lead: "Dalam satu sesi awal, kami bantu tentukan narasumber utama, bahan arsip yang perlu disiapkan, dan format hasil akhir yang paling tepat.",
          primaryCta: !isLoggedIn ? "Mulai Cerita" : "Lanjutkan Cerita",
          secondaryCta: "Lihat semua paket",
        },
      }
    : {
        hero: {
          eyebrow: "Lifestory · Biography Studio",
          studioCity: STUDIO_CITY,
          featuredLabel: "Featured",
          headlineLine1: "Stories of",
          headlineRotators: ["a family", "a father", "a mother", "a life", "a lineage"],
          headlineLine2: "worth keeping",
          headlineAccent: "preserved",
          headlineLine3: "for generations.",
          subheading:
            "We help families record interviews, restore photo archives, and shape them into books and films that can be passed forward.",
          primaryCta: !isLoggedIn
            ? "Start Consultation"
            : isAdmin
            ? "Open Dashboard"
            : isSubscribed
            ? "Open Family Archive"
            : "Activate Plan",
          secondaryCta: !isLoggedIn ? "Lifestory Gallery" : "Lifestory Gallery",
          badge1: "Secure servers",
          badge2: "Digital family tree",
          badge3: "Reprint anytime",
          badge4: "Rewatch anytime",
          scrollHint: "Scroll",
        },
        stats: {
          eyebrow: "Selected Archives",
          title: "Stories made tangible.",
          previousLabel: "Previous story",
          nextLabel: "Next story",
          photoLabel: "Family archive",
          videoLabel: "Family film",
          interactionHint:
            "Select a title to explore each family archive at your own pace.",
          items: [
            {
              src: "/cover-gallery/cover-1.webp",
              alt: "Biography book Wang Li Jien",
              title: "Wang Li Jien",
              subtitle: "Personal life memoir",
              type: "photo" as const,
            },
            {
              src: "/cover-gallery/cover-2.webp",
              alt: "Tribute book Kisah Ibu Kami",
              title: "Kisah Ibu Kami",
              subtitle: "Family tribute edition",
              type: "photo" as const,
            },
            {
              src: "/cover-gallery/cover-3.webp",
              alt: "Chronicle book Pak Yohannes",
              title: "Kisah Pak Yohannes",
              subtitle: "Family photo chronicle",
              type: "photo" as const,
            },
            {
              src: "/cover-gallery/cover-4.webp",
              alt: "Memoir book Bara yang Hangat",
              title: "Bara yang Hangat & Angin yang Sejuk",
              subtitle: "Legacy memory edition",
              type: "photo" as const,
            },
            {
              src: "/image/home-step-2.webp",
              alt: "Family documentary film production",
              title: "Family Documentary",
              subtitle: "Cinematic family film",
              type: "video" as const,
            },
            {
              src: "/image/home-step-1.webp",
              alt: "Family interview and photo session",
              title: "Family Session",
              subtitle: "Behind the scenes",
              type: "photo" as const,
            },
          ],
        },
        howItWorks: {
          eyebrow: "How we work",
          title: "Three working stages from raw archives to final delivery.",
          lead: "The flow is clear: interviews and material collection, editorial production, then final handover with family-ready digital access.",
          stepLabel: "Step",
          activeStepLabel: "Active step",
          steps: [
            {
              title: "Interviews and archive collection.",
              body: "We schedule interviews, map the family timeline, and gather available photographs, documents, and voice recordings.",
              note: "Week 1-3",
              points: ["Structured interview sessions", "Photo and document audit", "Family timeline mapping"],
              image: "/image/home-step-1.webp",
              alt: "Interview session and family archive collection",
            },
            {
              title: "Editorial production for book, photos, and film.",
              body: "Our team writes the biography manuscript, restores selected photos, and builds the book layout plus documentary edit for review.",
              note: "Week 4-10",
              points: ["Biography manuscript writing", "Priority photo restoration", "Layout and rough-cut review"],
              image: "/image/home-step-2.webp",
              alt: "Editorial production for manuscript, photos, and documentary film",
            },
            {
              title: "Final handover and digital archive activation.",
              body: "After final approval, the book and film are delivered, and your digital family tree access is activated for independent updates.",
              note: "Week 11-12",
              points: ["Final QC and approval", "Book and film handover", "Digital family tree activation"],
              image: "/image/home-step-3.webp",
              alt: "Final handover and digital family archive activation",
            },
          ],
        },
        deliverables: {
          eyebrow: "What you receive",
          title: "Six legacy pieces crafted for your family.",
          lead: "Each family receives a complete package that works together: a story you can read, watch, celebrate, and pass down across generations.",
          items: [
            {
              title: "Biography book & premium photo album",
              body: "A life story written with depth, printed on archival-quality paper, paired with a professionally curated and restored photo album.",
            },
            {
              title: "Family portrait session with Lifestory",
              body: "A professional photoshoot capturing your family as you are today, preserving authentic moments that become the next generation's visual treasure.",
            },
            {
              title: "Cinematic documentary film",
              body: "A cinema-grade short film that brings back voices, expressions, and emotions as a living legacy that words alone cannot capture.",
            },
            {
              title: "Interactive digital family tree",
              body: "Lifetime access to your Lifestory digital family tree. Add new members, refresh stories, and grow your legacy independently at no extra cost.",
            },
            {
              title: "Family celebration dinner",
              body: "An intimate moment with your loved ones to celebrate the preserved story over a special meal while witnessing the finished work for the first time.",
            },
            {
              title: "Exclusive custom artwork",
              body: "Illustrations, paintings, or bespoke art pieces inspired by your family's story, adding a unique artistic touch that makes your legacy package truly personal.",
            },
          ],
        },
        featured: {
          eyebrow: "Biography gallery",
          title: "Curated covers with distinct family contexts.",
          lead: "Each cover is presented with era notes, visual palette, and story summary so you can evaluate which direction best fits your family narrative.",
          viewMore: "View detail",
        },
        testimonials: {
          eyebrow: "Family voices",
          title: "What we hear after the book is delivered.",
          lead: "These are shared as spoken, including the small details families remember most.",
          items: [
            {
              quote:
                "On page 47 we found my mother's handwritten recipe that we thought was gone. That night, the grandchildren asked us to read the story aloud, and for the first time they felt they truly knew her.",
              author: "The Tanuwijaya Family",
              role: "Mother Tribute Edition",
            },
            {
              quote:
                "The Lifestory team came back twice because I was still unsure about a few old names. They never rushed us; they helped verify photos and chronology until the story finally felt honest.",
              author: "Pak Yohannes",
              role: "Personal Memoir",
            },
            {
              quote:
                "I thought I was ready when the PDF proof arrived. I cried at the letter-to-father spread. The layout was simple, but the photo sequence matched exactly how we remembered that old house.",
              author: "Suwati",
              role: "Cross-Generation Memoir",
            },
          ],
          pressLabel: "Trusted by families in",
          pressLogos: [
            "Jakarta",
            "Bandung",
            STUDIO_CITY,
            "Yogyakarta",
            "Medan",
            "Bali",
            "Singapore",
          ],
        },
        philosophy: {
          quote:
            "A person dies three times: when the breath stops, when the body is buried, and when the name is no longer spoken by the people who once loved them. Lifestory preserves your story so memory, name, and family legacy can keep living across generations, because as long as a story is still told, the third death never truly arrives.",
          quoteLines: [
            "A person dies three times:",
            "when the breath stops, when the body is buried,",
            "and when the name is no longer spoken by the people who once loved them.",
            "Lifestory preserves your story so memory, name, and family legacy can keep living across generations.",
            "Because as long as a story is still told, the third death never truly arrives.",
          ],
          intro: "A person dies three times.",
          beats: [
            {
              kicker: "First",
              title: "The breath stops",
              body: "When the body finishes its fight and time can no longer be negotiated.",
            },
            {
              kicker: "Second",
              title: "The body is buried",
              body: "When the world slowly continues without your presence in it.",
            },
            {
              kicker: "Third",
              title: "The name is no longer spoken",
              body: "When the story stops being passed down and a person fades from family memory.",
            },
          ],
          closing:
            "Lifestory preserves your story so the third death never comes.",
          highlight: "third death",
          attribution: "Lifestory",
        },
        faq: {
          eyebrow: "Questions",
          title: "What families usually ask before starting.",
          items: [
            {
              q: "How long does the full process take?",
              a: "Typically 12 to 16 weeks, depending on family complexity, number of interviewees, and how much photo restoration is required.",
            },
            {
              q: "Can the entire process be done remotely?",
              a: "Yes. Interviews and visual reviews can happen over video calls. For photo sessions we have a mobile team that can travel to your city.",
            },
            {
              q: "Who owns the rights to the manuscript and film?",
              a: "Full rights remain with the family. Lifestory only holds limited license for portfolio documentation if you allow it.",
            },
            {
              q: "What if family members remember things differently?",
              a: "That is normal. We summarize multiple versions, cross-confirm, and write in a voice that honors every perspective without forcing a single version.",
            },
            {
              q: "Can the book design be customized?",
              a: "Every book is custom designed. We start from a few visual directions and tailor it to the family's personality and aesthetic.",
            },
          ],
          asideTitle: "Need help choosing a package?",
          asideBody:
            "We offer a no-cost 30-minute consult to map family needs and define a practical project scope.",
          asideCta: "Book a session",
        },
        finalCta: {
          eyebrow: "Initial consultation",
          title: "Start with a short consultation.",
          lead: "In one early session, we define key interview subjects, archive materials to prepare, and the most suitable final format.",
          primaryCta: !isLoggedIn ? "Start the Story" : "Continue Story",
          secondaryCta: "View all packages",
        },
      };

  return (
    <>
      <div id="hero">
        <HomeHero
          isId={isId}
          copy={copy.hero}
          primaryCtaHref={primaryCtaHref}
          secondaryCtaHref={secondaryCtaHref}
        />
      </div>
      <div id="showcase">
        <StatsStrip copy={copy.stats} />
      </div>
      <div id="process">
        <HowItWorks copy={copy.howItWorks} />
      </div>
      <div id="deliverables">
        <Deliverables copy={copy.deliverables} />
      </div>
      <div id="gallery">
        <FeaturedCollections copy={copy.featured} />
      </div>
      <div id="voices">
        <Testimonials copy={copy.testimonials} />
      </div>
      <div id="philosophy">
        <PhilosophyDeaths copy={copy.philosophy} />
      </div>
      <div id="faq">
        <FAQ copy={copy.faq} />
      </div>
      <div id="begin">
        <FinalCTA
          copy={copy.finalCta}
          primaryHref={primaryCtaHref}
          secondaryHref="/subscribe"
        />
      </div>
    </>
  );
}
