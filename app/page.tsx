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
  const displayName = user?.name?.trim() || (isId ? "Anggota" : "Member");
  const firstName = displayName.split(" ")[0];

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
          welcomeBack: "Selamat datang kembali",
          eyebrow: "Lifestory · Studio Biografi",
          studioCity: STUDIO_CITY,
          featuredLabel: "Featured",
          headlineLine1: "Kisah",
          headlineRotators: ["hidup", "ayah", "ibu", "keluarga", "warisan"],
          headlineLine2: "yang berharga",
          headlineAccent: "diabadikan",
          headlineLine3: "lintas generasi.",
          subheading:
            "Jangan biarkan kisah keluarga hilang bersama waktu. Setiap memori, suara, dan momen berharga layak dijaga sebelum terlambat.",
          primaryCta: !isLoggedIn
            ? "Lihat Keluargamu!"
            : isAdmin
            ? "Buka Dashboard"
            : isSubscribed
            ? "Lihat Keluargamu!"
            : "Aktifkan Paket",
          secondaryCta: !isLoggedIn ? "Galeri Lifestory" : "Galeri Lifestory",
          badge1: "Server aman",
          badge2: "Silsilah digital",
          badge3: "Cetak ulang kapan saja",
          badge4: "Tonton ulang kapan saja",
          scrollHint: "Gulir",
        },
        stats: {
          eyebrow: "Karya Kami",
          title: "Setiap keluarga, satu cerita unik yang diabadikan.",
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
          title: "Tiga langkah sederhana menuju warisan abadi.",
          lead: "Dari pertemuan pertama hingga momen penyerahan, setiap langkah kami rancang agar bermakna.",
          steps: [
            {
              title: "Terkoneksi & merangkai narasi visual.",
              body: "Kami bertemu, mendengarkan, dan bersama-sama menyusun cerita keluarga Anda menjadi narasi visual yang utuh, dari foto lama hingga rekaman suara.",
              image: "/image/home-step-1.webp",
              alt: "Terkoneksi bersama dan merangkai narasi visual",
            },
            {
              title: "Upacara kecil penyerahan.",
              body: "Hasil akhir diserahkan dalam momen intim bersama keluarga, sebagai perayaan kecil yang menandai warisan resmi telah lahir.",
              image: "/image/home-step-2.webp",
              alt: "Upacara kecil penyerahan karya",
            },
            {
              title: "Update pohon keluarga secara bebas.",
              body: "Setelah selesai, Anda bebas memperbarui pohon silsilah digital kapan saja. Tambah anggota baru, perbarui cerita, tanpa biaya tambahan.",
              image: "/image/home-step-3.webp",
              alt: "Update pohon keluarga secara mandiri",
            },
          ],
        },
        deliverables: {
          eyebrow: "Apa yang Anda terima",
          title: "Enam karya warisan untuk keluarga Anda.",
          lead: "Setiap keluarga menerima paket lengkap yang saling melengkapi: cerita yang bisa dibaca, ditonton, dirayakan, dan diteruskan lintas generasi.",
          items: [
            {
              title: "Buku biografi & album foto premium",
              body: "Naskah kehidupan ditulis dengan penuh kedalaman, dicetak di atas kertas berkualitas arsip, dan dilengkapi album foto yang dikurasi serta direstorasi secara profesional.",
            },
            {
              title: "Sesi foto keluarga bersama Lifestory",
              body: "Pemotretan profesional yang mengabadikan potret keluarga Anda hari ini, menjadi momen autentik yang kelak menjadi harta karun visual generasi berikutnya.",
            },
            {
              title: "Video dokumenter sinematik",
              body: "Film pendek berkualitas sinema yang menghidupkan kembali suara, ekspresi, dan emosi sebagai warisan bergerak yang tak bisa ditangkap oleh tulisan saja.",
            },
            {
              title: "Pohon keluarga digital interaktif",
              body: "Akses seumur hidup ke silsilah digital Lifestory. Tambah anggota baru, perbarui cerita, dan kembangkan warisan Anda secara mandiri tanpa biaya tambahan.",
            },
            {
              title: "Makan malam perayaan keluarga",
              body: "Momen intim bersama orang-orang tercinta untuk merayakan kisah yang telah diabadikan sambil menikmati hidangan istimewa dan menyaksikan hasil karya untuk pertama kalinya.",
            },
            {
              title: "Karya seni kustom eksklusif",
              body: "Ilustrasi, lukisan, atau karya seni pilihan yang terinspirasi dari kisah keluarga Anda, memberi sentuhan artistik unik yang menjadikan paket warisan benar-benar personal.",
            },
          ],
        },
        featured: {
          eyebrow: "Galeri biografi",
          title: "Beberapa kisah yang sudah kami abadikan.",
          lead: "Setiap sampul mewakili pendekatan berbeda, dari memoar personal hingga tribute lintas generasi. Klik untuk melihat detail dan baca naskahnya.",
          viewMore: "Lihat detail",
        },
        testimonials: {
          eyebrow: "Suara keluarga",
          title: "Yang kami dengar setelah buku diserahkan.",
          lead: "Beberapa kalimat tulus dari keluarga yang sudah memegang hasil akhirnya.",
          items: [
            {
              quote:
                "Buku ini terasa seperti mendengar suara ibu kembali. Anak cucu kami akhirnya tahu bagaimana beliau berbicara, bukan cuma seperti apa wajahnya.",
              author: "Keluarga Tanuwijaya",
              role: "Edisi Tribute Ibu",
            },
            {
              quote:
                "Tim Lifestory menjaga setiap detail. Mereka mau wawancara berkali-kali sampai ceritanya benar-benar utuh, bukan sekadar lengkap.",
              author: "Pak Yohannes",
              role: "Memoar Personal",
            },
            {
              quote:
                "Saya tidak menyangka bisa menangis hanya karena melihat layout halaman. Hasilnya jauh melebihi ekspektasi saya.",
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
          asideTitle: "Belum yakin paket mana yang cocok?",
          asideBody:
            "Kami punya sesi konsultasi 30 menit tanpa biaya untuk membahas keluarga Anda dan merancang pendekatan yang paling masuk akal.",
          asideCta: "Jadwalkan konsultasi",
        },
        finalCta: {
          eyebrow: "Mulai sekarang",
          title: "Cerita yang berharga tidak menunggu lebih lama.",
          lead: "Kami bisa mulai dari satu wawancara sederhana dengan orang tua atau kakek nenek Anda hari ini. Sisanya, biarkan kami yang menjaga.",
          primaryCta: !isLoggedIn ? "Mulai Cerita" : "Lanjutkan Cerita",
          secondaryCta: "Lihat semua paket",
        },
      }
    : {
        hero: {
          welcomeBack: "Welcome back",
          eyebrow: "Lifestory · Biography Studio",
          studioCity: STUDIO_CITY,
          featuredLabel: "Featured",
          headlineLine1: "Stories of",
          headlineRotators: ["a life", "a father", "a mother", "a family", "a lineage"],
          headlineLine2: "worth keeping",
          headlineAccent: "preserved",
          headlineLine3: "for generations.",
          subheading:
            "Don't let your family's story fade with time. Every memory, voice, and precious moment deserves to be preserved before it's too late.",
          primaryCta: !isLoggedIn
            ? "See Your Family!"
            : isAdmin
            ? "Open Dashboard"
            : isSubscribed
            ? "See Your Family!"
            : "Activate Plan",
          secondaryCta: !isLoggedIn ? "Lifestory Gallery" : "Lifestory Gallery",
          badge1: "Secure servers",
          badge2: "Digital family tree",
          badge3: "Reprint anytime",
          badge4: "Rewatch anytime",
          scrollHint: "Scroll",
        },
        stats: {
          eyebrow: "Our Work",
          title: "Every family, one unique story preserved.",
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
          title: "Three simple steps toward a lasting legacy.",
          lead: "From our first meeting to the handover moment, every step is designed to be meaningful.",
          steps: [
            {
              title: "Connect & craft the visual narrative.",
              body: "We meet, listen, and together shape your family story into a complete visual narrative, from old photographs to voice recordings.",
              image: "/image/home-step-1.webp",
              alt: "Connecting together and crafting the visual narrative",
            },
            {
              title: "A small handover ceremony.",
              body: "The finished work is presented in an intimate family moment, a small celebration marking the official birth of your legacy.",
              image: "/image/home-step-2.webp",
              alt: "Small ceremony handing over the work",
            },
            {
              title: "Update your family tree freely.",
              body: "Once complete, you can update your digital family tree anytime. Add new members, refresh stories, at no extra cost.",
              image: "/image/home-step-3.webp",
              alt: "Freely updating the family tree",
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
          title: "A few of the stories we have preserved.",
          lead: "Each cover represents a different approach, from personal memoirs to multi-generation tributes. Tap to view details and read the manuscript.",
          viewMore: "View detail",
        },
        testimonials: {
          eyebrow: "Family voices",
          title: "What we hear after the book is delivered.",
          lead: "A few honest words from families who already hold the finished work.",
          items: [
            {
              quote:
                "It feels like hearing my mother's voice again. Our grandchildren now know how she actually spoke, not just how she looked.",
              author: "The Tanuwijaya Family",
              role: "Mother Tribute Edition",
            },
            {
              quote:
                "The Lifestory team protects every detail. They returned for several rounds of interviews until the story was truly whole, not just complete.",
              author: "Pak Yohannes",
              role: "Personal Memoir",
            },
            {
              quote:
                "I did not expect to cry over a page layout. The result far exceeded my expectations.",
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
          asideTitle: "Not sure which package fits?",
          asideBody:
            "We offer a 30-minute discovery call at no cost to discuss your family and design the most sensible approach.",
          asideCta: "Schedule consult",
        },
        finalCta: {
          eyebrow: "Begin now",
          title: "Stories worth telling do not wait any longer.",
          lead: "We can start from a single simple interview with your parents or grandparents today. The rest, leave it to us.",
          primaryCta: !isLoggedIn ? "Start the Story" : "Continue Story",
          secondaryCta: "View all packages",
        },
      };

  return (
    <>
      <div id="hero">
        <HomeHero
          status={status}
          isLoggedIn={isLoggedIn}
          firstName={firstName}
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
