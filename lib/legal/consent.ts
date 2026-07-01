// Single source of truth for legal + consent copy and versioning.
//
// Any time the Privacy Policy or Terms & Conditions change materially, bump
// CONSENT_POLICY_VERSION and LEGAL_EFFECTIVE_DATE together. The version string
// is persisted alongside every accepted consent so we can always prove which
// policy revision a user agreed to (UU PDP accountability principle).

export type Locale = "id" | "en";

// Bump this (and LEGAL_EFFECTIVE_DATE) whenever legal copy changes materially.
export const CONSENT_POLICY_VERSION = "2026-07-01";

// Human-readable effective date rendered on the legal pages.
export const LEGAL_EFFECTIVE_DATE = "1 Juli 2026";

// Registration consent copy (checkbox on the sign-up form).
export const registerConsentCopy: Record<
  Locale,
  {
    intro: string;
    terms: string;
    mid: string;
    privacy: string;
    outro: string;
    note: string;
  }
> = {
  id: {
    intro: "Saya setuju dengan ",
    terms: "Syarat & Ketentuan",
    mid: " dan ",
    privacy: "Kebijakan Privasi",
    outro: " Lifestory.",
    note: "Persetujuan ini wajib untuk melanjutkan pendaftaran.",
  },
  en: {
    intro: "I agree to the ",
    terms: "Terms & Conditions",
    mid: " and ",
    privacy: "Privacy Policy",
    outro: " of Lifestory.",
    note: "This consent is required to continue registration.",
  },
};

// Contact / consultation consent copy.
export const contactConsentCopy: Record<
  Locale,
  { label: string; note: string; validationFailed: string }
> = {
  id: {
    label:
      "Saya setuju data yang saya kirim (nama, email, dan detail cerita keluarga) diproses oleh Lifestory sesuai Kebijakan Privasi.",
    note: "Persetujuan ini wajib untuk mengirim konsultasi. Kami hanya memakai data ini untuk merespons permintaan Anda.",
    validationFailed:
      "Lengkapi nama, email yang valid, pesan minimal 10 karakter, dan centang persetujuan pemrosesan data.",
  },
  en: {
    label:
      "I agree that the data I submit (name, email, and family story details) may be processed by Lifestory according to the Privacy Policy.",
    note: "This consent is required to send the consultation. We use this data only to respond to your request.",
    validationFailed:
      "Please enter a valid name, email, a message of at least 10 characters, and tick the data-processing consent.",
  },
};
