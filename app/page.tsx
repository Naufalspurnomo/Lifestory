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
          studioCity: "Surabaya",
          featuredLabel: "Featured",
          headlineLine1: "Kisah",
          headlineRotators: ["hidup", "ayah", "ibu", "keluarga", "warisan"],
          headlineLine2: "yang berharga",
          headlineAccent: "diabadikan",
          headlineLine3: "untuk generasi selanjutnya.",
          subheading:
            "Jangan biarkan kisah hidupmu menghilang ditelan waktu. Setiap memori, setiap suara, setiap momen berharga layak diabadikan — sebelum terlambat.",
          primaryCta: !isLoggedIn
            ? "Lihat Keluarga Mu!"
            : isAdmin
            ? "Buka Dashboard"
            : isSubscribed
            ? "Lihat Keluarga Mu!"
            : "Aktifkan Paket",
          secondaryCta: !isLoggedIn ? "Galeri Lifestory" : "Galeri Lifestory",
          badge1: "Server yang aman",
          badge2: "Integrated family tree",
          badge3: "Reprint anytime",
          badge4: "Rewatch anytime",
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
          lead: "Dari pertemuan pertama hingga momen penyerahan — semuanya kami rancang agar bermakna.",
          steps: [
            {
              title: "Terkoneksi & merangkai narasi visual.",
              body: "Kami bertemu, mendengarkan, dan bersama-sama menyusun cerita keluarga Anda menjadi narasi visual yang utuh — dari foto lama hingga rekaman suara.",
              image: "/image/home-step-1.webp",
              alt: "Terkoneksi bersama dan merangkai narasi visual",
            },
            {
              title: "Upacara kecil penyerahan.",
              body: "Hasil akhir diserahkan dalam momen intim bersama keluarga — sebuah perayaan kecil yang menandai warisan resmi telah lahir.",
              image: "/image/home-step-2.webp",
              alt: "Upacara kecil penyerahan karya",
            },
            {
              title: "Update pohon keluarga secara bebas.",
              body: "Setelah selesai, Anda bebas memperbarui pohon silsilah digital kapan saja — tambah anggota baru, perbarui cerita, tanpa biaya tambahan.",
              image: "/image/home-step-3.webp",
              alt: "Update pohon keluarga secara mandiri",
            },
          ],
        },
        deliverables: {
          eyebrow: "Apa yang Anda terima",
          title: "Enam karya warisan untuk keluarga Anda.",
          lead: "Setiap keluarga menerima paket lengkap yang saling melengkapi — cerita yang bisa dibaca, ditonton, dirayakan, dan diteruskan lintas generasi.",
          items: [
            {
              title: "Buku biografi & album foto premium",
              body: "Naskah kehidupan ditulis dengan penuh kedalaman, dicetak di atas kertas berkualitas arsip, dan dilengkapi album foto yang dikurasi serta direstorasi secara profesional.",
            },
            {
              title: "Sesi foto keluarga bersama Lifestory",
              body: "Pemotretan profesional yang mengabadikan potret keluarga Anda hari ini — momen autentik yang kelak menjadi harta karun visual generasi berikutnya.",
            },
            {
              title: "Video dokumenter sinematik",
              body: "Film pendek berkualitas sinema yang menghidupkan kembali suara, ekspresi, dan emosi — sebuah warisan bergerak yang tak bisa ditangkap oleh tulisan saja.",
            },
            {
              title: "Pohon keluarga digital interaktif",
              body: "Akses seumur hidup ke silsilah digital Lifestory. Tambah anggota baru, perbarui cerita, dan kembangkan warisan Anda secara mandiri tanpa biaya tambahan.",
            },
            {
              title: "Makan malam perayaan keluarga",
              body: "Momen intim bersama orang-orang tercinta — merayakan kisah yang telah diabadikan sambil menikmati hidangan istimewa dan menyaksikan hasil karya untuk pertama kalinya.",
            },
            {
              title: "Karya seni kustom eksklusif",
              body: "Ilustrasi, lukisan, atau karya seni pilihan yang terinspirasi dari kisah keluarga Anda — sebuah sentuhan artistik unik yang menjadikan paket warisan benar-benar personal.",
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
        philosophy: {
          eyebrow: "Filosofi",
          title: "Tiga kematian yang menanti setiap manusia.",
          lead: "Dalam banyak tradisi dan pemikiran, manusia tidak hanya mati sekali. Ada tiga momen kepergian — dan hanya satu yang benar-benar bisa kita lawan.",
          items: [
            {
              title: "Kematian pertama — tubuh berhenti",
              body: "Saat jantung berhenti berdetak dan napas terakhir dihembuskan. Ini adalah kematian biologis yang tak bisa dihindari siapa pun.",
              reflection: "Setiap manusia akan mengalami ini. Tidak ada pengecualian, tidak ada penundaan yang abadi.",
            },
            {
              title: "Kematian kedua — dimakamkan dan dilupakan dunia",
              body: "Saat tubuh dikembalikan ke tanah dan dunia luar mulai melanjutkan hidup tanpa kehadiran Anda. Perlahan, nama Anda menghilang dari percakapan sehari-hari.",
              reflection: "Dunia terus berputar. Yang tersisa hanyalah ruang kosong di meja makan dan foto yang mulai berdebu.",
            },
            {
              title: "Kematian ketiga — nama Anda disebut untuk terakhir kalinya",
              body: "Inilah kematian sejati. Saat tidak ada lagi yang mengingat nama Anda, menceritakan kisah Anda, atau tahu bahwa Anda pernah ada di dunia ini.",
              reflection: "Kematian ketiga adalah yang paling tragis — dan satu-satunya yang bisa kita cegah. Itulah mengapa Lifestory ada.",
            },
          ],
          closing: "Lifestory hadir untuk memastikan kematian ketiga tidak pernah terjadi pada keluarga Anda. Karena selama cerita masih diceritakan, seseorang tidak benar-benar pergi.",
          badge: "Lifestory mencegah ini",
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
          headlineLine3: "for next generations.",
          subheading:
            "Don't let your story fade into silence. Every memory, every voice, every precious moment deserves to be preserved — before it's too late.",
          primaryCta: !isLoggedIn
            ? "See Your Family!"
            : isAdmin
            ? "Open Dashboard"
            : isSubscribed
            ? "See Your Family!"
            : "Activate Plan",
          secondaryCta: !isLoggedIn ? "Lifestory Gallery" : "Lifestory Gallery",
          badge1: "Secure servers",
          badge2: "Integrated family tree",
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
          lead: "From our first meeting to the handover moment — every step is designed to be meaningful.",
          steps: [
            {
              title: "Connect & craft the visual narrative.",
              body: "We meet, listen, and together shape your family story into a complete visual narrative — from old photographs to voice recordings.",
              image: "/image/home-step-1.webp",
              alt: "Connecting together and crafting the visual narrative",
            },
            {
              title: "A small handover ceremony.",
              body: "The finished work is presented in an intimate family moment — a small celebration marking the official birth of your legacy.",
              image: "/image/home-step-2.webp",
              alt: "Small ceremony handing over the work",
            },
            {
              title: "Update your family tree freely.",
              body: "Once complete, you can update your digital family tree anytime — add new members, refresh stories, at no extra cost.",
              image: "/image/home-step-3.webp",
              alt: "Freely updating the family tree",
            },
          ],
        },
        deliverables: {
          eyebrow: "What you receive",
          title: "Six legacy pieces crafted for your family.",
          lead: "Each family receives a complete package that works together — a story you can read, watch, celebrate, and pass down across generations.",
          items: [
            {
              title: "Biography book & premium photo album",
              body: "A life story written with depth, printed on archival-quality paper, paired with a professionally curated and restored photo album.",
            },
            {
              title: "Family portrait session with Lifestory",
              body: "A professional photoshoot capturing your family as you are today — authentic moments that become the next generation's visual treasure.",
            },
            {
              title: "Cinematic documentary film",
              body: "A cinema-grade short film that brings back voices, expressions, and emotions — a living legacy that words alone cannot capture.",
            },
            {
              title: "Interactive digital family tree",
              body: "Lifetime access to your Lifestory digital family tree. Add new members, refresh stories, and grow your legacy independently at no extra cost.",
            },
            {
              title: "Family celebration dinner",
              body: "An intimate moment with your loved ones — celebrating the story that has been preserved over a special meal while witnessing the finished work for the first time.",
            },
            {
              title: "Exclusive custom artwork",
              body: "Illustrations, paintings, or bespoke art pieces inspired by your family's story — a unique artistic touch that makes your legacy package truly personal.",
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
        philosophy: {
          eyebrow: "Philosophy",
          title: "Three deaths that await every human being.",
          lead: "Across many traditions and schools of thought, a person does not die just once. There are three moments of departure — and only one can truly be defied.",
          items: [
            {
              title: "The first death — the body stops",
              body: "When the heart ceases to beat and the final breath is drawn. This is the biological death that no one can escape.",
              reflection: "Every human will face this. No exceptions, no eternal postponement.",
            },
            {
              title: "The second death — buried and forgotten by the world",
              body: "When the body is returned to the earth and the outside world moves on without your presence. Slowly, your name fades from everyday conversation.",
              reflection: "The world keeps turning. All that remains is an empty chair at the table and a photo gathering dust.",
            },
            {
              title: "The third death — your name is spoken for the last time",
              body: "This is the true death. When no one remembers your name, tells your story, or knows you ever existed in this world.",
              reflection: "The third death is the most tragic — and the only one we can prevent. That is why Lifestory exists.",
            },
          ],
          closing: "Lifestory exists to ensure the third death never happens to your family. Because as long as a story is still being told, a person never truly leaves.",
          badge: "Lifestory prevents this",
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
      <StatsStrip copy={copy.stats} />
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
      <PhilosophyDeaths copy={copy.philosophy} />
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
