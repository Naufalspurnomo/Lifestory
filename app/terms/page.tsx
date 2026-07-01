import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CONSENT_POLICY_VERSION,
  LEGAL_EFFECTIVE_DATE,
} from "../../lib/legal/consent";
import { CONTACT_EMAIL } from "../../lib/contact-info";

// NOTE (internal, not shown to users): Operational draft. Have it reviewed by
// legal counsel before treating it as final. Bump CONSENT_POLICY_VERSION when
// the copy changes materially.

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | Lifestory",
  description:
    "Aturan penggunaan layanan Lifestory, dari konsultasi, hak cipta, izin publikasi, pembayaran, hingga penyerahan materi keluarga.",
};

type Section = { title: string; body: string; points?: string[] };

const content: Record<"id" | "en", { title: string; intro: string; sections: Section[] }> = {
  id: {
    title: "Syarat & Ketentuan",
    intro:
      "Syarat & Ketentuan ini mengatur penggunaan layanan Lifestory, dari konsultasi hingga penyerahan materi keluarga. Dengan menggunakan layanan kami, Anda menyetujui ketentuan ini.",
    sections: [
      {
        title: "1. Penggunaan Layanan",
        body: "Layanan hanya boleh dipakai untuk tujuan yang sah. Anda bertanggung jawab atas keakuratan data dan materi yang dikirim, serta memastikan Anda berhak membagikannya kepada kami.",
      },
      {
        title: "2. Akun dan Persetujuan",
        body: "Saat mendaftar atau mengirim konsultasi, Anda diminta menyetujui Syarat & Ketentuan dan Kebijakan Privasi. Kami mencatat waktu, alamat IP, dan versi kebijakan sebagai bukti persetujuan.",
      },
      {
        title: "3. Hak Cipta dan Kepemilikan",
        body: "Materi keluarga (foto, rekaman, kisah) tetap menjadi milik Anda. Hasil karya yang kami produksi diserahkan sesuai kontrak layanan. Lifestory mempertahankan hak atas metode kerja dan template internalnya.",
      },
      {
        title: "4. Izin Publikasi",
        body: "Publikasi materi keluarga di web, portofolio, atau materi pemasaran hanya dilakukan bila ada izin tertulis terpisah melalui Release Form yang ditandatangani. Tanpa itu, materi diperlakukan sebagai rahasia.",
      },
      {
        title: "5. Pembayaran",
        body: "Biaya, uang muka, dan jadwal pelunasan diatur dalam kontrak layanan yang disepakati saat onboarding. Pekerjaan dimulai setelah ketentuan pembayaran awal terpenuhi.",
      },
      {
        title: "6. Penyerahan Materi Keluarga",
        body: "Materi asli (foto, rekaman) diserahkan setelah kontrak layanan dan Release Form ditandatangani. Ini melindungi kedua pihak dan memastikan ruang lingkup jelas sebelum pekerjaan dimulai.",
      },
      {
        title: "7. Batasan Layanan",
        body: "Kami berupaya menjaga kualitas, tetapi hasil akhir bergantung pada kelengkapan materi, persetujuan keluarga, dan ruang lingkup proyek. Tanggung jawab kami terbatas pada nilai layanan yang disepakati.",
      },
      {
        title: "8. Kontak",
        body: `Pertanyaan tentang ketentuan ini dapat dikirim ke ${CONTACT_EMAIL}.`,
      },
    ],
  },
  en: {
    title: "Terms & Conditions",
    intro:
      "These Terms & Conditions govern the use of Lifestory, from consultation to family material submission. By using our service, you agree to these terms.",
    sections: [
      {
        title: "1. Use of Service",
        body: "The service may only be used for lawful purposes. You are responsible for the accuracy of the data and materials you submit, and for ensuring you have the right to share them with us.",
      },
      {
        title: "2. Accounts and Consent",
        body: "When registering or submitting a consultation, you are asked to agree to the Terms & Conditions and Privacy Policy. We record the timestamp, IP address, and policy version as proof of consent.",
      },
      {
        title: "3. Copyright and Ownership",
        body: "Family materials (photos, recordings, stories) remain yours. Produced works are delivered per the service contract. Lifestory retains rights to its working methods and internal templates.",
      },
      {
        title: "4. Publication Permission",
        body: "Publishing family materials on the website, portfolio, or marketing only happens with separate written permission through a signed Release Form. Without it, materials are treated as confidential.",
      },
      {
        title: "5. Payment",
        body: "Fees, deposits, and settlement schedules are set out in the service contract agreed at onboarding. Work begins once the initial payment terms are met.",
      },
      {
        title: "6. Family Material Submission",
        body: "Original materials (photos, recordings) are handed over after the service contract and Release Form are signed. This protects both parties and ensures a clear scope before work begins.",
      },
      {
        title: "7. Service Limits",
        body: "We strive for quality, but the final result depends on the completeness of the materials, family approval, and project scope. Our liability is limited to the agreed value of the service.",
      },
      {
        title: "8. Contact",
        body: `Questions about these terms can be sent to ${CONTACT_EMAIL}.`,
      },
    ],
  },
};

export default function TermsPage() {
  return (
    <main className="bg-cream-50 text-ink-900">
      <section className="mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-20">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-700">Legal</p>
        <h1 className="mt-4 font-serif text-[clamp(2.4rem,5vw,4.6rem)] font-light leading-[0.98] tracking-[-0.03em]">
          Syarat &amp; Ketentuan / Terms &amp; Conditions
        </h1>
        <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-500">
          Berlaku sejak {LEGAL_EFFECTIVE_DATE} · Versi {CONSENT_POLICY_VERSION}
        </p>

        <div className="mt-12 grid gap-10 border-t border-cream-300 pt-10 md:grid-cols-2">
          {(Object.entries(content) as Array<[keyof typeof content, (typeof content)["id"]]>).map(
            ([locale, block]) => (
              <article key={locale} className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                    {locale === "id" ? "Bahasa Indonesia" : "English"}
                  </p>
                  <h2 className="mt-3 font-serif text-3xl font-light text-ink-900">{block.title}</h2>
                </div>
                <p className="text-[0.98rem] leading-[1.8] text-ink-600">{block.intro}</p>
                <div className="space-y-5">
                  {block.sections.map((section) => (
                    <div key={section.title} className="rounded-2xl border border-cream-300 bg-cream-50 p-5">
                      <h3 className="font-serif text-lg font-medium text-ink-900">{section.title}</h3>
                      <p className="mt-3 text-[0.95rem] leading-[1.8] text-ink-600">{section.body}</p>
                      {section.points && (
                        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.92rem] leading-[1.7] text-ink-600">
                          {section.points.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            )
          )}
        </div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-cream-300 pt-8">
          <a
            href="/legal/service-contract-template.md"
            download
            className="group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand-700"
          >
            Service Contract Template
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <a
            href="/legal/release-form-template.md"
            download
            className="group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand-700"
          >
            Release Form Template
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <Link href="/privacy-policy" className="group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
            Kebijakan Privasi
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link href="/contact" className="group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
            Hubungi Kami
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </main>
  );
}
