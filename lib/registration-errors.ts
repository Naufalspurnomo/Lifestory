export type RegistrationLocale = "id" | "en";

type RegistrationErrorPayload = {
  details?: unknown;
  retryAfter?: unknown;
};

const validationMessages: Record<RegistrationLocale, Record<string, string>> = {
  id: {
    name: "Periksa nama lengkap Anda (minimal 2 karakter).",
    email: "Masukkan alamat email yang valid.",
    phone: "Masukkan nomor WhatsApp yang valid (minimal 8 digit).",
    password:
      "Password harus minimal 8 karakter dan berisi huruf besar, huruf kecil, serta angka.",
    consentAccepted:
      "Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi untuk mendaftar.",
  },
  en: {
    name: "Check your full name (at least 2 characters).",
    email: "Enter a valid email address.",
    phone: "Enter a valid WhatsApp number (at least 8 digits).",
    password:
      "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
    consentAccepted:
      "You must agree to the Terms & Conditions and Privacy Policy to register.",
  },
};

const fallbackMessages: Record<RegistrationLocale, string> = {
  id: "Gagal mendaftarkan akun. Silakan periksa data Anda dan coba lagi.",
  en: "Failed to register account. Check your details and try again.",
};

function payloadRecord(payload: unknown): RegistrationErrorPayload {
  return payload !== null && typeof payload === "object"
    ? (payload as RegistrationErrorPayload)
    : {};
}

function validationMessage(payload: unknown, locale: RegistrationLocale): string {
  const { details } = payloadRecord(payload);
  if (!Array.isArray(details)) return fallbackMessages[locale];

  const fields = details
    .filter((detail): detail is string => typeof detail === "string")
    .map((detail) => detail.split(":", 1)[0])
    .filter((field) => field in validationMessages[locale]);

  const uniqueFields = [...new Set(fields)];
  if (uniqueFields.length === 0) return fallbackMessages[locale];

  return uniqueFields
    .map((field) => validationMessages[locale][field])
    .join(" ");
}

function retryMessage(payload: unknown, locale: RegistrationLocale): string {
  const retryAfter = payloadRecord(payload).retryAfter;
  const seconds =
    typeof retryAfter === "number" && Number.isFinite(retryAfter)
      ? Math.max(1, Math.ceil(retryAfter))
      : null;

  if (seconds === null) {
    return locale === "id"
      ? "Terlalu banyak percobaan pendaftaran. Silakan coba lagi nanti."
      : "Too many registration attempts. Please try again later.";
  }

  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return locale === "id"
    ? `Terlalu banyak percobaan pendaftaran. Coba lagi dalam ${minutes} menit.`
    : `Too many registration attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export function getRegistrationErrorMessage(
  status: number,
  payload: unknown,
  locale: RegistrationLocale
): string {
  if (status === 400) return validationMessage(payload, locale);
  if (status === 413) {
    return locale === "id"
      ? "Data pendaftaran terlalu besar. Periksa kembali isian Anda."
      : "Registration data is too large. Check your entries.";
  }
  if (status === 429) return retryMessage(payload, locale);
  if (status >= 500) {
    return locale === "id"
      ? "Server sedang bermasalah dan akun belum dapat dibuat. Silakan coba lagi beberapa saat lagi."
      : "The server is having trouble and could not create the account. Please try again shortly.";
  }

  return fallbackMessages[locale];
}
