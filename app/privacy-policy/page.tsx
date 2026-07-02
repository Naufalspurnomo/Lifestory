import type { Metadata } from "next";
import {
  CONSENT_POLICY_VERSION,
  LEGAL_EFFECTIVE_DATE,
} from "../../lib/legal/consent";
import { CONTACT_EMAIL, STUDIO_ADDRESS } from "../../lib/contact-info";
import LegalDocumentView from "../../components/legal/LegalDocumentView";

// NOTE (internal, not shown to users): This is an operational draft aligned with
// UU PDP (UU No. 27/2022) structure. Have it reviewed by legal counsel before
// treating it as final. Bump CONSENT_POLICY_VERSION when the copy changes.

export const metadata: Metadata = {
  title: "Kebijakan Privasi | Lifestory",
  description:
    "Bagaimana Lifestory mengumpulkan, memakai, menyimpan, dan melindungi data keluarga Anda sesuai UU Pelindungan Data Pribadi.",
};

const content = {
  id: {
    title: "Kebijakan Privasi",
    label: "Dokumen legal",
    effectiveLabel: "Berlaku sejak",
    versionLabel: "Versi kebijakan",
    contentsLabel: "Isi dokumen",
    reviewedLabel:
      "Dokumen operasional ini perlu ditinjau penasihat hukum sebelum dipakai sebagai nasihat legal final.",
    links: [
      { href: "/terms", label: "Syarat & Ketentuan" },
      { href: "/contact", label: "Hubungi Kami" },
      { href: "/legal/release-form-template.md", label: "Release Form", download: true },
    ],
    intro:
      "Kebijakan ini menjelaskan bagaimana Lifestory mengumpulkan, memakai, menyimpan, dan melindungi data pribadi Anda serta materi keluarga yang Anda percayakan kepada kami, sesuai dengan Undang-Undang Pelindungan Data Pribadi (UU No. 27 Tahun 2022).",
    sections: [
      {
        title: "1. Pengendali Data",
        body: `Lifestory.co bertindak sebagai pengendali data pribadi. Untuk pertanyaan terkait privasi atau permintaan hak Anda, hubungi kami di ${CONTACT_EMAIL}. Alamat studio: ${STUDIO_ADDRESS}.`,
      },
      {
        title: "2. Data yang Kami Kumpulkan",
        body: "Kami mengumpulkan data yang Anda berikan secara sukarela dan data teknis terbatas:",
        tone: "critical",
        badge: "Data Sensitif",
        points: [
          "Data identitas dan kontak: nama, email, nomor WhatsApp.",
          "Materi keluarga: foto, video, rekaman suara, kisah hidup, nama dan riwayat keluarga.",
          "Data konsultasi: pesan dan informasi yang Anda sampaikan lewat form.",
          "Data persetujuan: waktu, alamat IP, user agent, dan versi kebijakan saat consent diberikan.",
        ],
      },
      {
        title: "3. Dasar Hukum Pemrosesan",
        body: "Kami memproses data berdasarkan persetujuan Anda (consent), pelaksanaan kontrak layanan, serta kepentingan sah yang wajar untuk menjalankan layanan dan menjaga keamanan.",
      },
      {
        title: "4. Tujuan Penggunaan",
        body: "Data dipakai untuk menanggapi konsultasi, menyiapkan dan menjalankan layanan biografi, memproses onboarding, komunikasi terkait proyek, dan memenuhi kewajiban hukum. Publikasi materi keluarga di web atau materi pemasaran hanya dilakukan dengan izin tertulis terpisah (Release Form).",
        tone: "critical",
        badge: "Izin Publikasi",
      },
      {
        title: "5. Penyimpanan dan Retensi",
        body: "Kami menyimpan data selama diperlukan untuk tujuan di atas atau selama diwajibkan hukum. Setelah tidak diperlukan, data akan dihapus atau dianonimkan. Bukti persetujuan disimpan sebagai catatan kepatuhan.",
        tone: "critical",
        badge: "Retensi",
      },
      {
        title: "6. Pihak Ketiga",
        body: "Kami menggunakan penyedia layanan tepercaya untuk menjalankan platform:",
        tone: "critical",
        badge: "Berbagi Data",
        points: [
          "Penyedia email transaksional (Resend) untuk notifikasi.",
          "Penyedia hosting dan infrastruktur (Vercel) untuk menjalankan situs.",
          "Penyedia penyimpanan objek untuk media yang diunggah.",
          "Kami tidak menjual data pribadi Anda kepada pihak mana pun.",
        ],
      },
      {
        title: "7. Hak Subjek Data",
        body: "Sesuai UU PDP, Anda berhak mengakses, memperbaiki, menghapus, dan membatasi pemrosesan data, meminta salinan data, serta menarik persetujuan kapan saja. Penarikan persetujuan tidak memengaruhi keabsahan pemrosesan sebelum penarikan. Ajukan permintaan lewat kontak di atas.",
        tone: "critical",
        badge: "Hak Anda",
      },
      {
        title: "8. Keamanan",
        body: "Kami menerapkan pembatasan akses, enkripsi saat transit, dan kontrol internal untuk melindungi data. Tidak ada sistem yang sepenuhnya bebas risiko, jadi materi paling sensitif sebaiknya hanya dibagikan saat benar-benar diperlukan.",
      },
      {
        title: "9. Cookie",
        body: "Kami menggunakan penyimpanan lokal secukupnya (mis. preferensi bahasa) dan cookie fungsional yang diperlukan agar situs berjalan. Kami tidak memakai cookie iklan pihak ketiga.",
      },
      {
        title: "10. Perubahan Kebijakan",
        body: "Kebijakan ini dapat diperbarui. Setiap perubahan material akan menaikkan versi kebijakan dan tanggal berlaku yang tertera di halaman ini.",
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    label: "Legal document",
    effectiveLabel: "Effective date",
    versionLabel: "Policy version",
    contentsLabel: "Contents",
    reviewedLabel:
      "This operational document should be reviewed by legal counsel before being treated as final legal advice.",
    links: [
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/contact", label: "Contact Us" },
      { href: "/legal/release-form-template.md", label: "Release Form", download: true },
    ],
    intro:
      "This policy explains how Lifestory collects, uses, stores, and protects your personal data and the family materials you entrust to us, in line with Indonesia's Personal Data Protection Law (Law No. 27 of 2022).",
    sections: [
      {
        title: "1. Data Controller",
        body: `Lifestory.co acts as the personal data controller. For privacy questions or to exercise your rights, contact us at ${CONTACT_EMAIL}. Studio address: ${STUDIO_ADDRESS}.`,
      },
      {
        title: "2. Data We Collect",
        body: "We collect data you provide voluntarily and limited technical data:",
        tone: "critical",
        badge: "Sensitive Data",
        points: [
          "Identity and contact data: name, email, WhatsApp number.",
          "Family materials: photos, videos, audio recordings, life stories, names and family history.",
          "Consultation data: messages and information you submit through the form.",
          "Consent data: timestamp, IP address, user agent, and policy version when consent is given.",
        ],
      },
      {
        title: "3. Legal Basis for Processing",
        body: "We process data based on your consent, performance of the service contract, and reasonable legitimate interests in operating the service and maintaining security.",
      },
      {
        title: "4. How We Use It",
        body: "Data is used to respond to consultations, prepare and deliver biography services, handle onboarding, communicate about your project, and meet legal obligations. Publishing family materials on the web or in marketing only happens with separate written permission (Release Form).",
        tone: "critical",
        badge: "Publication Permission",
      },
      {
        title: "5. Storage and Retention",
        body: "We retain data for as long as needed for the purposes above or as required by law. When no longer needed, data is deleted or anonymized. Consent proof is retained as a compliance record.",
        tone: "critical",
        badge: "Retention",
      },
      {
        title: "6. Third Parties",
        body: "We use trusted service providers to run the platform:",
        tone: "critical",
        badge: "Data Sharing",
        points: [
          "Transactional email provider (Resend) for notifications.",
          "Hosting and infrastructure provider (Vercel) to run the site.",
          "Object storage provider for uploaded media.",
          "We do not sell your personal data to anyone.",
        ],
      },
      {
        title: "7. Your Rights",
        body: "Under the PDP Law, you may access, correct, erase, and restrict processing of your data, request a copy, and withdraw consent at any time. Withdrawal does not affect processing carried out before withdrawal. Submit requests via the contact above.",
        tone: "critical",
        badge: "Your Rights",
      },
      {
        title: "8. Security",
        body: "We apply access restrictions, encryption in transit, and internal controls to protect data. No system is completely risk-free, so the most sensitive materials should only be shared when truly necessary.",
      },
      {
        title: "9. Cookies",
        body: "We use minimal local storage (e.g. language preference) and functional cookies required for the site to work. We do not use third-party advertising cookies.",
      },
      {
        title: "10. Changes to This Policy",
        body: "This policy may be updated. Any material change will raise the policy version and effective date shown on this page.",
      },
    ],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentView
      content={content}
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      policyVersion={CONSENT_POLICY_VERSION}
    />
  );
}
