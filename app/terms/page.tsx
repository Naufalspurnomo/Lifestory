import type { Metadata } from "next";
import {
  CONSENT_POLICY_VERSION,
  LEGAL_EFFECTIVE_DATE,
} from "../../lib/legal/consent";
import { CONTACT_EMAIL } from "../../lib/contact-info";
import LegalDocumentView from "../../components/legal/LegalDocumentView";

// NOTE (internal, not shown to users): Operational draft. Have it reviewed by
// legal counsel before treating it as final. Bump CONSENT_POLICY_VERSION when
// the copy changes materially.

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | Lifestory",
  description:
    "Aturan penggunaan layanan Lifestory, dari konsultasi, hak cipta, izin publikasi, pembayaran, hingga penyerahan materi keluarga.",
};


const content = {
  id: {
    title: "Syarat & Ketentuan",
    label: "Dokumen legal",
    effectiveLabel: "Berlaku sejak",
    versionLabel: "Versi ketentuan",
    contentsLabel: "Isi dokumen",
    reviewedLabel: "Dokumen operasional ini perlu ditinjau penasihat hukum sebelum dipakai sebagai nasihat legal final.",
    links: [
      { href: "/privacy-policy", label: "Kebijakan Privasi" },
      { href: "/contact", label: "Hubungi Kami" },
      { href: "/legal/service-contract-template.md", label: "Kontrak Layanan", download: true },
      { href: "/legal/release-form-template.md", label: "Release Form", download: true },
    ],
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
        tone: "critical",
        badge: "Persetujuan",
      },
      {
        title: "3. Hak Cipta dan Kepemilikan",
        body: "Materi keluarga (foto, rekaman, kisah) tetap menjadi milik Anda. Hasil karya yang kami produksi diserahkan sesuai kontrak layanan. Lifestory mempertahankan hak atas metode kerja dan template internalnya.",
      },
      {
        title: "4. Izin Publikasi",
        body: "Publikasi materi keluarga di web, portofolio, atau materi pemasaran hanya dilakukan bila ada izin tertulis terpisah melalui Release Form yang ditandatangani. Tanpa itu, materi diperlakukan sebagai rahasia.",
        tone: "critical",
        badge: "Izin Publikasi",
      },
      {
        title: "5. Pembayaran",
        body: "Biaya, uang muka, dan jadwal pelunasan diatur dalam kontrak layanan yang disepakati saat onboarding. Pekerjaan dimulai setelah ketentuan pembayaran awal terpenuhi.",
        tone: "critical",
        badge: "Pembayaran",
      },
      {
        title: "6. Penyerahan Materi Keluarga",
        body: "Materi asli (foto, rekaman) diserahkan setelah kontrak layanan dan Release Form ditandatangani. Ini melindungi kedua pihak dan memastikan ruang lingkup jelas sebelum pekerjaan dimulai.",
        tone: "critical",
        badge: "Serah Terima",
      },
      {
        title: "7. Batasan Layanan",
        body: "Kami berupaya menjaga kualitas, tetapi hasil akhir bergantung pada kelengkapan materi, persetujuan keluarga, dan ruang lingkup proyek. Tanggung jawab kami terbatas pada nilai layanan yang disepakati.",
        tone: "critical",
        badge: "Batas Tanggung Jawab",
      },
      {
        title: "8. Kontak",
        body: `Pertanyaan tentang ketentuan ini dapat dikirim ke ${CONTACT_EMAIL}.`,
      },
    ],
  },
  en: {
    title: "Terms & Conditions",
    label: "Legal document",
    effectiveLabel: "Effective date",
    versionLabel: "Terms version",
    contentsLabel: "Contents",
    reviewedLabel: "This operational document should be reviewed by legal counsel before being treated as final legal advice.",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/contact", label: "Contact Us" },
      { href: "/legal/service-contract-template.md", label: "Service Contract", download: true },
      { href: "/legal/release-form-template.md", label: "Release Form", download: true },
    ],
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
        tone: "critical",
        badge: "Consent",
      },
      {
        title: "3. Copyright and Ownership",
        body: "Family materials (photos, recordings, stories) remain yours. Produced works are delivered per the service contract. Lifestory retains rights to its working methods and internal templates.",
      },
      {
        title: "4. Publication Permission",
        body: "Publishing family materials on the website, portfolio, or marketing only happens with separate written permission through a signed Release Form. Without it, materials are treated as confidential.",
        tone: "critical",
        badge: "Publication Permission",
      },
      {
        title: "5. Payment",
        body: "Fees, deposits, and settlement schedules are set out in the service contract agreed at onboarding. Work begins once the initial payment terms are met.",
        tone: "critical",
        badge: "Payment",
      },
      {
        title: "6. Family Material Submission",
        body: "Original materials (photos, recordings) are handed over after the service contract and Release Form are signed. This protects both parties and ensures a clear scope before work begins.",
        tone: "critical",
        badge: "Handover",
      },
      {
        title: "7. Service Limits",
        body: "We strive for quality, but the final result depends on the completeness of the materials, family approval, and project scope. Our liability is limited to the agreed value of the service.",
        tone: "critical",
        badge: "Liability",
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
    <LegalDocumentView
      content={content}
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      policyVersion={CONSENT_POLICY_VERSION}
    />
  );
}
