import type { Metadata } from "next";
import {
  CONSENT_POLICY_VERSION,
  LEGAL_EFFECTIVE_DATE,
} from "../../lib/legal/consent";
import { CONTACT_EMAIL, STUDIO_ADDRESS } from "../../lib/contact-info";
import LegalDocumentView, {
  type LegalBlock,
} from "../../components/legal/LegalDocumentView";

// NOTE (internal, not shown to users): Operational privacy draft aligned to
// Indonesian PDP principles. Have it reviewed by qualified counsel before
// treating it as final legal advice. Bump CONSENT_POLICY_VERSION when the copy
// changes materially.

export const metadata: Metadata = {
  title: "Kebijakan Privasi | Lifestory",
  description:
    "Bagaimana Lifestory mengumpulkan, memakai, menyimpan, melindungi, dan menghapus data pribadi serta materi keluarga.",
};

const content: Record<"id" | "en", LegalBlock> = {
  id: {
    title: "Kebijakan Privasi",
    label: "Dokumen privasi Lifestory",
    effectiveLabel: "Berlaku sejak",
    versionLabel: "Versi kebijakan",
    contentsLabel: "Isi dokumen",
    relatedLabel: "Dokumen terkait",
    reviewedLabel:
      "Draft operasional. Tinjauan penasihat hukum tetap diperlukan sebelum dipakai sebagai dasar legal final.",
    noticeTitle: "Privasi keluarga adalah ruang utama",
    noticeBody:
      "Lifestory menangani foto, cerita, rekaman, dan riwayat keluarga yang sering kali bersifat pribadi. Kebijakan ini menjelaskan batas pemrosesan kami, bukan izin untuk memakai data di luar kebutuhan layanan.",
    summaryItems: [
      {
        label: "Data utama",
        value: "Identitas, kontak, akun, materi keluarga, media, persetujuan, dan log keamanan.",
      },
      {
        label: "Tujuan",
        value: "Menjalankan konsultasi, proyek arsip keluarga, akses keluarga, dan keamanan layanan.",
      },
      {
        label: "Publikasi",
        value: "Materi klien tidak dipakai untuk portofolio tanpa izin tertulis terpisah.",
      },
      {
        label: "Hak Anda",
        value: "Akses, koreksi, penghapusan, pembatasan, portabilitas, dan penarikan persetujuan.",
      },
    ],
    links: [
      { href: "/terms", label: "Syarat & Ketentuan" },
      { href: "/contact", label: "Hubungi Kami" },
      {
        href: "/legal/release-form-template.md",
        label: "Template Release Form",
        download: true,
      },
    ],
    intro:
      "Kebijakan ini menjelaskan bagaimana Lifestory mengumpulkan, menggunakan, menyimpan, membagikan, melindungi, dan menghapus data pribadi serta materi keluarga. Dokumen ini disusun dengan memperhatikan Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi dan aturan sistem elektronik Indonesia yang relevan.",
    sections: [
      {
        title: "1. Pengendali Data",
        body: `Lifestory bertindak sebagai pengendali data pribadi untuk layanan yang kami jalankan. Pertanyaan privasi, permintaan hak data, atau keluhan dapat dikirim ke ${CONTACT_EMAIL}. Alamat operasional: ${STUDIO_ADDRESS}.`,
        tone: "critical",
        badge: "Kontak Privasi",
      },
      {
        title: "2. Data yang Kami Kumpulkan",
        body: "Kami hanya mengumpulkan data yang relevan untuk konsultasi, akun, proyek keluarga, akses undangan, keamanan, dan kewajiban hukum. Sebagian materi keluarga dapat memuat data pribadi yang bersifat spesifik, misalnya data anak, foto yang dapat mengidentifikasi seseorang, riwayat keluarga, keyakinan, kesehatan, atau informasi sensitif lain yang muncul dalam cerita.",
        tone: "critical",
        badge: "Data Pribadi",
        points: [
          "Data identitas dan kontak: nama, email, nomor WhatsApp, alamat jika diberikan, dan preferensi komunikasi.",
          "Data akun dan akses: kredensial terenkripsi, undangan keluarga, peran akses, serta aktivitas dasar untuk menjaga keamanan.",
          "Materi keluarga: foto, dokumen, video, rekaman suara, catatan wawancara, kisah hidup, silsilah, nama anggota keluarga, tanggal penting, dan konteks sejarah keluarga.",
          "Data consent dan teknis: waktu persetujuan, versi kebijakan, alamat IP, user agent, log keamanan, preferensi bahasa, dan metadata upload.",
        ],
      },
      {
        title: "3. Sumber Data",
        body: "Data dapat berasal dari Anda langsung, anggota keluarga yang Anda undang, formulir konsultasi, unggahan media, wawancara, dokumen proyek, komunikasi dengan tim Lifestory, dan data teknis yang dihasilkan saat Anda memakai platform.",
      },
      {
        title: "4. Dasar Pemrosesan",
        body: "Kami memproses data berdasarkan persetujuan Anda, pelaksanaan kontrak atau langkah pra-kontrak, kewajiban hukum, dan kepentingan sah yang wajar untuk menjalankan layanan, menjaga keamanan, mencegah penyalahgunaan, serta membuktikan persetujuan.",
        tone: "critical",
        badge: "Dasar Hukum",
      },
      {
        title: "5. Tujuan Penggunaan",
        body: "Data digunakan untuk menanggapi konsultasi, membuat dan mengelola akun, menata arsip keluarga, menyusun biografi atau galeri, mengelola akses keluarga, memproses onboarding, mengirim notifikasi layanan, menjaga keamanan, memperbaiki kualitas platform, dan memenuhi kewajiban hukum.",
      },
      {
        title: "6. Anak, Keluarga, dan Materi Sensitif",
        body: "Jika Anda membagikan data anak atau anggota keluarga lain, Anda menyatakan memiliki kewenangan keluarga yang patut untuk melakukannya. Kami dapat meminta klarifikasi, membatasi pemrosesan, atau menolak materi yang tampak terlalu sensitif, tidak relevan, atau berisiko melanggar hak orang lain.",
        tone: "critical",
        badge: "Materi Sensitif",
      },
      {
        title: "7. Publikasi dan Portofolio",
        body: "Lifestory tidak menjual data pribadi dan tidak memakai materi keluarga untuk iklan, portofolio, media sosial, studi kasus, atau halaman publik tanpa izin tertulis terpisah. Izin tersebut dapat ditarik untuk penggunaan berikutnya, dengan tetap memperhatikan arsip atau materi yang sudah terlanjur diproduksi sesuai perjanjian.",
        tone: "critical",
        badge: "Bukan Iklan",
      },
      {
        title: "8. Pihak Ketiga dan Pemroses",
        body: "Kami memakai penyedia layanan tepercaya untuk menjalankan platform, misalnya hosting, database, penyimpanan media, email transaksional, pemantauan keamanan, dan alat operasional proyek. Mereka hanya boleh memproses data sesuai instruksi kami, kebutuhan layanan, dan kewajiban perlindungan data yang relevan.",
        points: [
          "Kami tidak menjual data pribadi kepada broker data atau jaringan iklan.",
          "Akses internal dan akses vendor dibatasi berdasarkan kebutuhan kerja.",
          "Jika penyedia berubah, prinsip pembatasan tujuan dan keamanan tetap berlaku.",
        ],
      },
      {
        title: "9. Transfer Lintas Negara",
        body: "Sebagian penyedia infrastruktur dapat memproses atau menyimpan data di luar Indonesia. Jika transfer lintas negara terjadi, kami berupaya memastikan adanya dasar yang sah, perlindungan kontraktual, dan langkah keamanan yang sesuai dengan hukum yang berlaku.",
      },
      {
        title: "10. Retensi dan Penghapusan",
        body: "Kami menyimpan data selama diperlukan untuk tujuan layanan, kontrak, keamanan, pembuktian persetujuan, penyelesaian sengketa, atau kewajiban hukum. Setelah tidak diperlukan, data akan dihapus, dianonimkan, atau dibatasi aksesnya. Permintaan penghapusan akan diproses setelah verifikasi identitas dan kewenangan pemohon.",
        tone: "critical",
        badge: "Retensi",
      },
      {
        title: "11. Keamanan",
        body: "Kami menerapkan pembatasan akses, autentikasi, enkripsi saat transit, kontrol upload, pencatatan persetujuan, dan praktik keamanan aplikasi untuk mengurangi risiko. Tidak ada sistem yang sepenuhnya bebas risiko, sehingga materi paling sensitif sebaiknya hanya dibagikan jika benar-benar diperlukan untuk proyek.",
      },
      {
        title: "12. Insiden Keamanan",
        body: "Jika terjadi insiden yang berdampak pada data pribadi, kami akan menilai risiko, mengambil langkah penanganan, dan memberikan pemberitahuan kepada pihak yang relevan sesuai kewajiban hukum yang berlaku.",
        tone: "critical",
        badge: "Insiden",
      },
      {
        title: "13. Hak Subjek Data",
        body: "Sesuai UU PDP, Anda dapat meminta akses, koreksi, pembaruan, penghapusan, pembatasan pemrosesan, keberatan atas pemrosesan tertentu, salinan data, dan penarikan persetujuan. Penarikan persetujuan tidak membatalkan pemrosesan yang sudah sah dilakukan sebelum penarikan.",
        tone: "critical",
        badge: "Hak Anda",
        points: [
          "Kirim permintaan melalui email kontak privasi di halaman ini.",
          "Kami dapat meminta verifikasi identitas atau bukti kewenangan keluarga.",
          "Beberapa permintaan dapat dibatasi jika berbenturan dengan hak keluarga lain, kontrak, keamanan, atau kewajiban hukum.",
        ],
      },
      {
        title: "14. Cookie dan Penyimpanan Lokal",
        body: "Kami menggunakan cookie dan penyimpanan lokal yang diperlukan untuk menjalankan situs, menjaga sesi, menyimpan preferensi bahasa, dan melindungi layanan. Kami tidak menggunakan cookie iklan pihak ketiga untuk menjual atau menargetkan data keluarga.",
      },
      {
        title: "15. Perubahan Kebijakan",
        body: "Kami dapat memperbarui kebijakan ini ketika layanan, vendor, fitur, atau kewajiban hukum berubah. Perubahan material akan menaikkan versi kebijakan dan tanggal berlaku yang tampil di halaman ini.",
      },
      {
        title: "16. Kontak",
        body: `Untuk pertanyaan privasi, penghapusan data, permintaan akses, atau keluhan, hubungi ${CONTACT_EMAIL}.`,
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    label: "Lifestory privacy document",
    effectiveLabel: "Effective date",
    versionLabel: "Policy version",
    contentsLabel: "Contents",
    relatedLabel: "Related documents",
    reviewedLabel:
      "Operational draft. Qualified legal review is still required before treating this as final legal advice.",
    noticeTitle: "Family privacy is the primary space",
    noticeBody:
      "Lifestory handles photos, stories, recordings, and family histories that are often personal. This policy explains the limits of our processing; it is not permission to use data outside the service need.",
    summaryItems: [
      {
        label: "Core data",
        value: "Identity, contact, account, family materials, media, consent, and security logs.",
      },
      {
        label: "Purpose",
        value: "Consultations, family archive projects, family access, and service security.",
      },
      {
        label: "Publication",
        value: "Client materials are not used in portfolios without separate written permission.",
      },
      {
        label: "Your rights",
        value: "Access, correction, erasure, restriction, portability, and consent withdrawal.",
      },
    ],
    links: [
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/contact", label: "Contact Us" },
      {
        href: "/legal/release-form-template.md",
        label: "Release Form Template",
        download: true,
      },
    ],
    intro:
      "This policy explains how Lifestory collects, uses, stores, shares, protects, and deletes personal data and family materials. It is written with attention to Indonesia's Law No. 27 of 2022 on Personal Data Protection and relevant Indonesian electronic-system rules.",
    sections: [
      {
        title: "1. Data Controller",
        body: `Lifestory acts as the personal data controller for the services we operate. Privacy questions, rights requests, or complaints can be sent to ${CONTACT_EMAIL}. Operational address: ${STUDIO_ADDRESS}.`,
        tone: "critical",
        badge: "Privacy Contact",
      },
      {
        title: "2. Data We Collect",
        body: "We collect only data relevant to consultations, accounts, family projects, invitation access, security, and legal obligations. Some family materials may include specific personal data, such as child data, photos that identify a person, family history, beliefs, health information, or other sensitive information that appears in a story.",
        tone: "critical",
        badge: "Personal Data",
        points: [
          "Identity and contact data: name, email, WhatsApp number, address if provided, and communication preferences.",
          "Account and access data: encrypted credentials, family invitations, access roles, and basic activity needed for security.",
          "Family materials: photos, documents, videos, audio recordings, interview notes, life stories, family trees, family names, important dates, and family historical context.",
          "Consent and technical data: consent timestamp, policy version, IP address, user agent, security logs, language preference, and upload metadata.",
        ],
      },
      {
        title: "3. Sources of Data",
        body: "Data may come directly from you, family members you invite, consultation forms, media uploads, interviews, project documents, communications with the Lifestory team, and technical data generated when you use the platform.",
      },
      {
        title: "4. Basis for Processing",
        body: "We process data based on your consent, performance of a contract or pre-contract steps, legal obligations, and reasonable legitimate interests in operating the service, maintaining security, preventing misuse, and proving consent.",
        tone: "critical",
        badge: "Legal Basis",
      },
      {
        title: "5. How We Use Data",
        body: "Data is used to respond to consultations, create and manage accounts, organize family archives, prepare biographies or galleries, manage family access, handle onboarding, send service notifications, maintain security, improve platform quality, and meet legal obligations.",
      },
      {
        title: "6. Children, Family, and Sensitive Materials",
        body: "If you share data about children or other family members, you represent that you have appropriate family authority to do so. We may request clarification, limit processing, or reject materials that appear too sensitive, irrelevant, or likely to violate another person's rights.",
        tone: "critical",
        badge: "Sensitive Materials",
      },
      {
        title: "7. Publication and Portfolio Use",
        body: "Lifestory does not sell personal data and does not use family materials for advertising, portfolios, social media, case studies, or public pages without separate written permission. That permission may be withdrawn for future use, while considering archives or materials already produced under an agreement.",
        tone: "critical",
        badge: "Not Ads",
      },
      {
        title: "8. Third Parties and Processors",
        body: "We use trusted service providers to run the platform, such as hosting, database, media storage, transactional email, security monitoring, and project operations tools. They may process data only under our instructions, service needs, and relevant data-protection obligations.",
        points: [
          "We do not sell personal data to data brokers or advertising networks.",
          "Internal and vendor access is limited by work need.",
          "If providers change, the purpose-limitation and security principles still apply.",
        ],
      },
      {
        title: "9. Cross-Border Transfers",
        body: "Some infrastructure providers may process or store data outside Indonesia. If a cross-border transfer occurs, we work to ensure a lawful basis, contractual safeguards, and security steps appropriate under applicable law.",
      },
      {
        title: "10. Retention and Deletion",
        body: "We retain data for as long as needed for the service, contract, security, consent evidence, dispute handling, or legal obligations. When no longer needed, data is deleted, anonymized, or access-restricted. Deletion requests are processed after identity and authority verification.",
        tone: "critical",
        badge: "Retention",
      },
      {
        title: "11. Security",
        body: "We apply access restrictions, authentication, encryption in transit, upload controls, consent logging, and application-security practices to reduce risk. No system is completely risk-free, so the most sensitive materials should only be shared when truly needed for the project.",
      },
      {
        title: "12. Security Incidents",
        body: "If an incident affects personal data, we will assess the risk, take response steps, and notify relevant parties according to applicable legal obligations.",
        tone: "critical",
        badge: "Incident",
      },
      {
        title: "13. Data Subject Rights",
        body: "Under Indonesia's PDP Law, you may request access, correction, updates, erasure, processing restriction, objection to certain processing, a copy of data, and withdrawal of consent. Withdrawal does not invalidate processing lawfully carried out before withdrawal.",
        tone: "critical",
        badge: "Your Rights",
        points: [
          "Send requests through the privacy email listed on this page.",
          "We may request identity verification or proof of family authority.",
          "Some requests may be limited when they conflict with another family member's rights, contract, security, or legal obligations.",
        ],
      },
      {
        title: "14. Cookies and Local Storage",
        body: "We use cookies and local storage needed to run the site, maintain sessions, save language preference, and protect the service. We do not use third-party advertising cookies to sell or target family data.",
      },
      {
        title: "15. Changes to This Policy",
        body: "We may update this policy when services, vendors, features, or legal obligations change. Material changes will increase the policy version and effective date shown on this page.",
      },
      {
        title: "16. Contact",
        body: `For privacy questions, data deletion, access requests, or complaints, contact ${CONTACT_EMAIL}.`,
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
