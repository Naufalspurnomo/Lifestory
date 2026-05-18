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
import { FinalCTA } from "../components/home/FinalCTA";
import { ScrollScale, SectionZoom } from "../components/ui/ScrollAnimations";

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
    ? "/auth/register"
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
          studioCity: "Surabaya",
          featuredLabel: "Featured",
          headlineLine1: "Kisah",
          headlineRotators: ["hidup", "ayah", "ibu", "keluarga", "warisan"],
          headlineLine2: "yang berharga",
          headlineAccent: "diabadikan",
          headlineLine3: "untuk generasi.",
          subheading:
            "Kami merangkai memori, foto lama, dan suara keluarga menjadi buku biografi premium, video dokumenter, dan pohon silsilah yang siap diwariskan.",
          primaryCta: !isLoggedIn
            ? "Mulai Cerita Anda"
            : isAdmin
            ? "Buka Dashboard"
            : isSubscribed
            ? "Lanjutkan Cerita"
            : "Aktifkan Paket",
          secondaryCta: !isLoggedIn ? "Lihat Galeri" : "Jelajahi Galeri",
          badge1: "Arsip privat keluarga",
          badge2: "Layout terkurasi",
          badge3: "Kolaborasi multi-perangkat",
          scrollHint: "Gulir",
        },
        stats: {
          eyebrow: "Karya yang berbicara",
          title: "Lebih dari sekadar buku — sebuah warisan yang dirawat tangan demi tangan.",
          stats: [
            {
              value: 50,
              suffix: "+",
              label: "Keluarga",
              description: "Telah mempercayakan kisah mereka kepada studio kami.",
            },
            {
              value: 200,
              suffix: " thn",
              label: "Cerita",
              description: "Total rentang waktu kisah yang sudah diabadikan.",
            },
            {
              value: 12000,
              suffix: "+",
              label: "Halaman ditulis",
              description: "Kalimat demi kalimat ditulis tangan oleh tim editor.",
            },
            {
              value: 8000,
              suffix: "+",
              label: "Foto direstorasi",
              description: "Foto lama dipulihkan agar siap dicetak premium.",
            },
            {
              value: 4,
              suffix: "",
              label: "Format",
              description: "Buku, video, poster silsilah, dan arsip digital.",
            },
            {
              value: 100,
              suffix: "%",
              label: "Kepuasan keluarga",
              description: "Kami merilis hanya saat keluarga benar-benar bangga.",
            },
          ],
        },
        howItWorks: {
          eyebrow: "Cara Kami Bekerja",
          title: "Dari percakapan hangat menjadi buku yang abadi.",
          lead: "Tiga babak yang dirancang untuk menjaga cerita tetap hidup, akurat, dan berhasil menyentuh siapa pun yang membacanya.",
          steps: [
            {
              title: "Mendengarkan dengan tenang.",
              body: "Kami memulai dengan sesi wawancara yang lambat dan hangat. Cerita yang lama tersimpan diberi ruang untuk muncul kembali tanpa dipaksa.",
              /* TODO: Taruh file di public/image/home-step-1.png */
              image: "/image/home-step-1.png",
              alt: "Sesi wawancara mendengarkan dengan tenang",
            },
            {
              title: "Merangkai narasi & visual.",
              body: "Tim penulis dan art director kami menyusun alur, memilih foto, dan merancang halaman demi halaman yang terasa personal sekaligus sinematik.",
              /* TODO: Taruh file di public/image/home-step-2.png */
              image: "/image/home-step-2.png",
              alt: "Proses merangkai narasi dan visual",
            },
            {
              title: "Mewariskan dengan upacara kecil.",
              body: "Buku, video, dan poster silsilah diserahkan dalam momen yang dirayakan bersama keluarga, lengkap dengan kemasan kelas heirloom.",
              /* TODO: Taruh file di public/image/home-step-3.png */
              image: "/image/home-step-3.png",
              alt: "Momen mewariskan dengan upacara kecil",
            },
          ],
        },
        deliverables: {
          eyebrow: "Apa yang Anda terima",
          title: "Empat keluaran yang dirancang sebagai satu kesatuan warisan.",
          lead: "Setiap keluarga menerima paket fisik dan digital yang saling melengkapi — supaya cerita bisa dibaca, ditonton, dipajang, dan dilanjutkan.",
          items: [
            {
              title: "Buku biografi premium",
              body: "Sampul keras kelas heirloom, kertas berbobot tinggi, layout custom dengan bagian pop-up. Setiap eksemplar diberi nomor seri dan kemasan tahan air.",
            },
            {
              title: "Foto direstorasi",
              body: "Foto lama dipulihkan, foto baru sesi studio Lifestory.",
            },
            {
              title: "Video dokumenter",
              body: "Wawancara terarah dirangkum menjadi tayangan sinematik dengan flash disk eksklusif.",
            },
            {
              title: "Pohon silsilah cetak & digital",
              body: "Diagram keluarga yang dibingkai indah, lengkap dengan slot untuk menambahkan generasi berikutnya. Tersinkron dengan dashboard digital Lifestory.",
            },
          ],
        },
        featured: {
          eyebrow: "Galeri biografi",
          title: "Beberapa kisah yang sudah kami abadikan.",
          lead: "Setiap sampul mewakili pendekatan berbeda — dari memoar personal hingga tribute lintas generasi. Klik untuk melihat detail dan baca naskahnya.",
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
            "Surabaya",
            "Yogyakarta",
            "Medan",
            "Bali",
            "Singapura",
          ],
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
          studioCity: "Jakarta",
          featuredLabel: "Featured",
          headlineLine1: "Stories of",
          headlineRotators: ["a life", "a father", "a mother", "a family", "a lineage"],
          headlineLine2: "remembered",
          headlineAccent: "preserved",
          headlineLine3: "for generations.",
          subheading:
            "We weave memories, vintage photos, and family voices into premium biography books, documentary films, and lineage trees ready to be passed down.",
          primaryCta: !isLoggedIn
            ? "Start Your Story"
            : isAdmin
            ? "Open Dashboard"
            : isSubscribed
            ? "Continue Story"
            : "Activate Plan",
          secondaryCta: !isLoggedIn ? "View Gallery" : "Explore Gallery",
          badge1: "Private family archive",
          badge2: "Curated layouts",
          badge3: "Multi-device collab",
          scrollHint: "Scroll",
        },
        stats: {
          eyebrow: "Work that speaks",
          title: "More than a book — a legacy carried by careful hands.",
          stats: [
            {
              value: 50,
              suffix: "+",
              label: "Families",
              description: "Have trusted our studio with their life stories.",
            },
            {
              value: 200,
              suffix: " yrs",
              label: "Stories",
              description: "Of cumulative timeline preserved into archives.",
            },
            {
              value: 12000,
              suffix: "+",
              label: "Pages written",
              description: "Hand-edited paragraph by paragraph.",
            },
            {
              value: 8000,
              suffix: "+",
              label: "Photos restored",
              description: "Old photos brought back to print quality.",
            },
            {
              value: 4,
              suffix: "",
              label: "Formats",
              description: "Book, film, lineage poster, and digital archive.",
            },
            {
              value: 100,
              suffix: "%",
              label: "Family approval",
              description: "We only release when the family is truly proud.",
            },
          ],
        },
        howItWorks: {
          eyebrow: "How we work",
          title: "From a warm conversation to an heirloom book.",
          lead: "Three acts designed to keep stories alive, accurate, and emotionally true to whoever reads them.",
          steps: [
            {
              title: "Listen, slowly.",
              body: "We open with calm, unhurried interviews. Stories that have been buried for decades are given space to surface again.",
              image: "/image/home-step-1.png",
              alt: "Calm interview session listening slowly",
            },
            {
              title: "Shape the narrative & visuals.",
              body: "Our writers and art director sequence the story, pick the photographs, and design pages that feel personal yet cinematic.",
              image: "/image/home-step-2.png",
              alt: "Shaping narrative and visuals process",
            },
            {
              title: "Pass it on with a small ceremony.",
              body: "The book, film, and lineage poster are handed over in a moment celebrated with the family, finished with heirloom-grade packaging.",
              image: "/image/home-step-3.png",
              alt: "Handover moment with a small ceremony",
            },
          ],
        },
        deliverables: {
          eyebrow: "What you receive",
          title: "Four deliverables designed as one cohesive heirloom.",
          lead: "Each family receives a physical and digital set that complement each other — a story you can read, watch, display, and continue.",
          items: [
            {
              title: "Premium biography book",
              body: "Heirloom-grade hard cover, heavy weight paper, custom layout with pop-up sections. Each copy is numbered with waterproof packaging.",
            },
            {
              title: "Restored photographs",
              body: "Old photos restored, fresh studio photos by Lifestory.",
            },
            {
              title: "Documentary film",
              body: "Guided interviews edited into a cinematic short with an exclusive flash drive.",
            },
            {
              title: "Printed & digital lineage tree",
              body: "A beautifully framed family diagram with slots for next generations. Synced with your Lifestory digital dashboard.",
            },
          ],
        },
        featured: {
          eyebrow: "Biography gallery",
          title: "A few of the stories we have preserved.",
          lead: "Each cover represents a different approach — from personal memoirs to multi-generation tributes. Tap to view details and read the manuscript.",
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
            "Surabaya",
            "Yogyakarta",
            "Medan",
            "Bali",
            "Singapore",
          ],
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
      <HomeHero
        status={status}
        isLoggedIn={isLoggedIn}
        firstName={firstName}
        copy={copy.hero}
        primaryCtaHref={primaryCtaHref}
        secondaryCtaHref={secondaryCtaHref}
      />
      <ScrollScale from={0.94} to={1}>
        <StatsStrip copy={copy.stats} />
      </ScrollScale>
      <SectionZoom>
        <HowItWorks copy={copy.howItWorks} />
      </SectionZoom>
      <ScrollScale from={0.95} to={1}>
        <Deliverables copy={copy.deliverables} />
      </ScrollScale>
      <SectionZoom from={0.96}>
        <FeaturedCollections copy={copy.featured} />
      </SectionZoom>
      <ScrollScale from={0.94} to={1}>
        <Testimonials copy={copy.testimonials} />
      </ScrollScale>
      <SectionZoom>
        <FAQ copy={copy.faq} />
      </SectionZoom>
      <ScrollScale from={0.93} to={1}>
        <FinalCTA
          copy={copy.finalCta}
          primaryHref={primaryCtaHref}
          secondaryHref="/subscribe"
        />
      </ScrollScale>
    </>
  );
}
