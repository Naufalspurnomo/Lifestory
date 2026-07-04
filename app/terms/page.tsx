import type { Metadata } from "next";
import {
  CONSENT_POLICY_VERSION,
  LEGAL_EFFECTIVE_DATE,
} from "../../lib/legal/consent";
import { CONTACT_EMAIL } from "../../lib/contact-info";
import LegalDocumentView, {
  type LegalBlock,
} from "../../components/legal/LegalDocumentView";

// NOTE (internal, not shown to users): Operational legal draft. Have it
// reviewed by qualified counsel before treating it as final legal advice.
// Bump CONSENT_POLICY_VERSION when the copy changes materially.

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | Lifestory",
  description:
    "Ketentuan penggunaan Lifestory untuk konsultasi, akun, materi keluarga, hak cipta, izin publikasi, pembayaran, dan batas layanan.",
};

const content: Record<"id" | "en", LegalBlock> = {
  id: {
    title: "Syarat & Ketentuan",
    label: "Dokumen legal Lifestory",
    effectiveLabel: "Berlaku sejak",
    versionLabel: "Versi ketentuan",
    contentsLabel: "Isi dokumen",
    relatedLabel: "Dokumen terkait",
    reviewedLabel:
      "Draft operasional. Tinjauan penasihat hukum tetap diperlukan sebelum dipakai sebagai dasar legal final.",
    noticeTitle: "Baca bersama kontrak layanan",
    noticeBody:
      "Halaman ini mengatur penggunaan platform dan proses awal Lifestory. Ruang lingkup pekerjaan, biaya, jadwal, dan serah terima final tetap mengikuti kontrak layanan yang disepakati tertulis.",
    summaryItems: [
      {
        label: "Ruang lingkup",
        value: "Konsultasi, akun, arsip keluarga, biografi, galeri, dan akses undangan.",
      },
      {
        label: "Hak materi",
        value: "Materi keluarga tetap milik Anda atau keluarga yang berwenang.",
      },
      {
        label: "Publikasi",
        value: "Portofolio atau pemasaran hanya boleh dengan izin tertulis terpisah.",
      },
      {
        label: "Hukum",
        value: "Diatur menurut hukum Republik Indonesia kecuali kontrak menyatakan lain.",
      },
    ],
    links: [
      { href: "/privacy-policy", label: "Kebijakan Privasi" },
      { href: "/contact", label: "Hubungi Kami" },
      {
        href: "/legal/service-contract-template.md",
        label: "Template Kontrak Layanan",
        download: true,
      },
      {
        href: "/legal/release-form-template.md",
        label: "Template Release Form",
        download: true,
      },
    ],
    intro:
      "Syarat ini menjelaskan cara Lifestory digunakan, bagaimana materi keluarga diserahkan, kapan izin publikasi diperlukan, dan batas layanan kami. Tujuannya sederhana: cerita keluarga tetap rapi, hak keluarga jelas, dan proses kerja tidak abu-abu.",
    sections: [
      {
        title: "1. Penerimaan Ketentuan",
        body: "Dengan mengakses situs, membuat akun, mengirim konsultasi, menerima undangan keluarga, atau memakai layanan Lifestory, Anda menyetujui Syarat & Ketentuan ini serta Kebijakan Privasi yang berlaku pada tanggal persetujuan.",
        tone: "critical",
        badge: "Persetujuan",
      },
      {
        title: "2. Tentang Lifestory",
        body: "Lifestory membantu keluarga mengumpulkan, menata, dan menyajikan cerita keluarga melalui konsultasi, wawancara, arsip digital, galeri, pohon keluarga, dan materi biografi. Layanan yang benar-benar dikerjakan untuk setiap klien mengikuti ruang lingkup tertulis dalam kontrak layanan.",
      },
      {
        title: "3. Kewenangan Keluarga",
        body: "Anda menyatakan bahwa Anda berwenang mengirim data, foto, dokumen, cerita, dan materi keluarga yang diberikan kepada Lifestory. Jika materi menyangkut orang lain, anak, anggota keluarga yang sudah meninggal, atau informasi sensitif, Anda bertanggung jawab memperoleh izin keluarga yang patut sebelum membagikannya.",
        tone: "critical",
        badge: "Kewenangan",
      },
      {
        title: "4. Akun, Undangan, dan Akses",
        body: "Akun, tautan undangan, dan akses keluarga bersifat pribadi. Anda wajib menjaga kredensial dan hanya mengundang orang yang memang berhak melihat atau mengelola arsip keluarga. Kami dapat membatasi atau menangguhkan akses jika ada indikasi penyalahgunaan, pelanggaran privasi, atau risiko keamanan.",
        points: [
          "Jangan membagikan tautan undangan ke ruang publik.",
          "Segera hubungi kami jika akses diberikan ke orang yang salah.",
          "Perubahan anggota keluarga atau hak akses dapat diminta melalui pemilik proyek atau kontak resmi.",
        ],
      },
      {
        title: "5. Materi Keluarga dan Izin Pakai",
        body: "Materi keluarga tetap menjadi milik Anda atau pemilik haknya. Anda memberi Lifestory izin terbatas untuk menyimpan, memproses, mengedit, menata, dan menampilkan materi tersebut hanya sejauh diperlukan untuk menjalankan layanan yang Anda minta.",
        tone: "critical",
        badge: "Hak Materi",
      },
      {
        title: "6. Hak Cipta Hasil Karya",
        body: "Hak atas hasil akhir seperti naskah, halaman cerita, arsip visual, atau materi presentasi mengikuti kontrak layanan. Kecuali disepakati lain, Lifestory tetap memiliki metode kerja, struktur template, sistem desain, kode, dan alat internal yang dipakai untuk memproduksi layanan.",
      },
      {
        title: "7. Izin Publikasi",
        body: "Kami tidak akan mempublikasikan foto, cerita, nama keluarga, rekaman, atau hasil karya klien di website, media sosial, portofolio, iklan, atau materi pemasaran tanpa persetujuan tertulis terpisah. Persetujuan itu dapat dibuat melalui Release Form atau perjanjian lain yang jelas.",
        tone: "critical",
        badge: "Privasi Publik",
      },
      {
        title: "8. Materi yang Tidak Boleh Dikirim",
        body: "Anda tidak boleh mengirim materi yang melanggar hukum, memfitnah, melanggar hak cipta, membuka data pribadi tanpa kewenangan, mengandung malware, atau dibuat untuk melecehkan pihak lain. Kami dapat menolak, menghapus, atau meminta klarifikasi atas materi yang berisiko.",
      },
      {
        title: "9. Pembayaran, Jadwal, dan Revisi",
        body: "Biaya, uang muka, termin pembayaran, jadwal produksi, jumlah revisi, dan format penyerahan diatur dalam kontrak layanan. Perubahan besar pada materi, arah cerita, jumlah anggota keluarga, atau format deliverable dapat memengaruhi biaya dan jadwal.",
        tone: "critical",
        badge: "Kontrak",
      },
      {
        title: "10. Ketersediaan Platform",
        body: "Kami berupaya menjaga situs dan fitur digital tetap tersedia, tetapi pemeliharaan, pembaruan, gangguan penyedia infrastruktur, atau kondisi di luar kendali kami dapat memengaruhi akses. Kami dapat mengubah fitur platform untuk memperbaiki keamanan, kualitas, atau keberlanjutan layanan.",
      },
      {
        title: "11. Koreksi, Penarikan, dan Penghapusan",
        body: "Anda dapat meminta koreksi cerita, pembaruan data keluarga, pembatasan akses, atau penghapusan materi tertentu. Permintaan akan ditangani secara wajar dengan mempertimbangkan kontrak, arsip yang sudah diserahkan, hak anggota keluarga lain, dan kewajiban hukum yang berlaku.",
        tone: "critical",
        badge: "Hak Keluarga",
      },
      {
        title: "12. Batas Layanan",
        body: "Lifestory bukan penyedia nasihat hukum, medis, psikologis, pajak, atau verifikasi silsilah resmi. Kami membantu menata dan menyajikan cerita berdasarkan materi yang diberikan klien. Kecuali hukum melarang pembatasan tersebut, tanggung jawab kami dibatasi pada nilai layanan yang dibayarkan untuk proyek terkait.",
        tone: "critical",
        badge: "Batas Tanggung Jawab",
      },
      {
        title: "13. Hukum yang Berlaku dan Sengketa",
        body: "Syarat ini tunduk pada hukum Republik Indonesia. Jika terjadi sengketa, para pihak akan lebih dulu berupaya menyelesaikannya melalui musyawarah. Jika tidak selesai, penyelesaian dilakukan melalui forum yang berwenang sesuai kontrak layanan atau hukum yang berlaku.",
      },
      {
        title: "14. Kontak",
        body: `Pertanyaan tentang ketentuan ini, akses keluarga, atau permintaan koreksi dapat dikirim ke ${CONTACT_EMAIL}.`,
      },
    ],
  },
  en: {
    title: "Terms & Conditions",
    label: "Lifestory legal document",
    effectiveLabel: "Effective date",
    versionLabel: "Terms version",
    contentsLabel: "Contents",
    relatedLabel: "Related documents",
    reviewedLabel:
      "Operational draft. Qualified legal review is still required before treating this as final legal advice.",
    noticeTitle: "Read with the service contract",
    noticeBody:
      "This page governs platform use and the early Lifestory process. Final scope, fees, timeline, and delivery remain controlled by the written service contract.",
    summaryItems: [
      {
        label: "Scope",
        value: "Consultations, accounts, family archives, biographies, galleries, and invitations.",
      },
      {
        label: "Materials",
        value: "Family materials remain owned by you or the authorized family owner.",
      },
      {
        label: "Publication",
        value: "Portfolio or marketing use requires separate written permission.",
      },
      {
        label: "Law",
        value: "Governed by the laws of the Republic of Indonesia unless a contract says otherwise.",
      },
    ],
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/contact", label: "Contact Us" },
      {
        href: "/legal/service-contract-template.md",
        label: "Service Contract Template",
        download: true,
      },
      {
        href: "/legal/release-form-template.md",
        label: "Release Form Template",
        download: true,
      },
    ],
    intro:
      "These terms explain how Lifestory is used, how family materials are submitted, when publication permission is required, and where our service boundaries sit. The goal is simple: family stories stay orderly, family rights stay clear, and the process is not ambiguous.",
    sections: [
      {
        title: "1. Acceptance of Terms",
        body: "By accessing the site, creating an account, sending a consultation, accepting a family invitation, or using Lifestory, you agree to these Terms & Conditions and the Privacy Policy in effect on the date of consent.",
        tone: "critical",
        badge: "Consent",
      },
      {
        title: "2. About Lifestory",
        body: "Lifestory helps families collect, organize, and present family stories through consultations, interviews, digital archives, galleries, family trees, and biography materials. The actual service delivered to each client follows the written scope in the service contract.",
      },
      {
        title: "3. Family Authority",
        body: "You represent that you are authorized to submit the data, photos, documents, stories, and family materials provided to Lifestory. If the materials involve another person, a child, a deceased family member, or sensitive information, you are responsible for obtaining appropriate family permission before sharing them.",
        tone: "critical",
        badge: "Authority",
      },
      {
        title: "4. Accounts, Invitations, and Access",
        body: "Accounts, invitation links, and family access are personal. You must protect your credentials and invite only people who are entitled to view or manage the family archive. We may limit or suspend access if there are signs of misuse, privacy violations, or security risk.",
        points: [
          "Do not share invitation links in public channels.",
          "Contact us promptly if access was given to the wrong person.",
          "Family member or access changes can be requested through the project owner or official contact.",
        ],
      },
      {
        title: "5. Family Materials and Usage Permission",
        body: "Family materials remain owned by you or the rights holder. You give Lifestory a limited permission to store, process, edit, organize, and display those materials only as needed to provide the service you requested.",
        tone: "critical",
        badge: "Materials",
      },
      {
        title: "6. Copyright in Deliverables",
        body: "Rights in final deliverables such as manuscripts, story pages, visual archives, or presentation materials follow the service contract. Unless agreed otherwise, Lifestory keeps its working methods, template structures, design system, code, and internal tools.",
      },
      {
        title: "7. Publication Permission",
        body: "We will not publish client photos, stories, family names, recordings, or deliverables on the website, social media, portfolio, advertising, or marketing materials without separate written permission. That permission may be provided through a Release Form or another clear agreement.",
        tone: "critical",
        badge: "Public Privacy",
      },
      {
        title: "8. Prohibited Materials",
        body: "You may not submit materials that are unlawful, defamatory, copyright-infringing, disclose personal data without authority, contain malware, or are intended to harass another party. We may reject, remove, or request clarification for risky materials.",
      },
      {
        title: "9. Payment, Timeline, and Revisions",
        body: "Fees, deposits, payment milestones, production timeline, revision rounds, and delivery format are set in the service contract. Material changes to content, story direction, family-member count, or deliverable format may affect fees and timing.",
        tone: "critical",
        badge: "Contract",
      },
      {
        title: "10. Platform Availability",
        body: "We work to keep the site and digital features available, but maintenance, updates, infrastructure provider interruptions, or circumstances outside our control may affect access. We may change platform features to improve security, quality, or service sustainability.",
      },
      {
        title: "11. Corrections, Withdrawal, and Deletion",
        body: "You may request story corrections, family data updates, access restrictions, or deletion of certain materials. Requests will be handled reasonably while considering the contract, delivered archives, rights of other family members, and applicable legal obligations.",
        tone: "critical",
        badge: "Family Rights",
      },
      {
        title: "12. Service Limits",
        body: "Lifestory does not provide legal, medical, psychological, tax, or official genealogy verification services. We help organize and present stories based on materials provided by clients. Except where law prohibits such limitation, our liability is limited to the amount paid for the related project.",
        tone: "critical",
        badge: "Liability",
      },
      {
        title: "13. Governing Law and Disputes",
        body: "These terms are governed by the laws of the Republic of Indonesia. If a dispute arises, the parties will first try to resolve it through discussion. If it remains unresolved, it will be handled by the competent forum under the service contract or applicable law.",
      },
      {
        title: "14. Contact",
        body: `Questions about these terms, family access, or correction requests can be sent to ${CONTACT_EMAIL}.`,
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
