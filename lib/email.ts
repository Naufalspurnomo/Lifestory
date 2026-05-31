type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
};

type PasswordChangedEmailInput = {
  to: string;
};

type EmailResult =
  | { ok: true; skipped?: false }
  | {
      ok: false;
      skipped: true;
      reason: "missing-config" | "invalid-config";
    }
  | { ok: false; skipped?: false; error: string };

const EMAIL_REQUEST_TIMEOUT_MS = 10_000;
const PLACEHOLDER_VALUES = new Set(["replace_me", "your-resend-api-key"]);

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL;

  if (!apiKey || !from) {
    return { ok: false, skipped: true, reason: "missing-config" };
  }

  if (PLACEHOLDER_VALUES.has(apiKey.trim().toLowerCase())) {
    return { ok: false, skipped: true, reason: "invalid-config" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMAIL_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      return { ok: false, error: errorText || response.statusText };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Email transport failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailInput): Promise<EmailResult> {
  const safeResetUrl = escapeHtml(resetUrl);
  const subject = "Reset password Lifestory";
  const text = [
    "Kami menerima permintaan reset password untuk akun Lifestory Anda.",
    "",
    `Buka tautan ini untuk membuat password baru: ${resetUrl}`,
    "",
    `Tautan ini berlaku ${expiresInMinutes} menit.`,
    "Jika Anda tidak meminta reset password, abaikan email ini.",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#40342c">
      <h1 style="font-size:22px;margin:0 0 16px">Reset password Lifestory</h1>
      <p>Kami menerima permintaan reset password untuk akun Lifestory Anda.</p>
      <p>
        <a href="${safeResetUrl}" style="display:inline-block;background:#9b6b18;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700">
          Buat password baru
        </a>
      </p>
      <p style="font-size:14px;color:#73685f">Tautan ini berlaku ${expiresInMinutes} menit.</p>
      <p style="font-size:14px;color:#73685f">Jika tombol tidak bisa dibuka, salin tautan ini:</p>
      <p style="font-size:13px;word-break:break-all;color:#73685f">${safeResetUrl}</p>
      <p style="font-size:14px;color:#73685f">Jika Anda tidak meminta reset password, abaikan email ini.</p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

export async function sendPasswordChangedEmail({
  to,
}: PasswordChangedEmailInput): Promise<EmailResult> {
  const subject = "Password Lifestory Anda telah diubah";
  const text = [
    "Password akun Lifestory Anda baru saja diubah.",
    "",
    "Jika Anda tidak melakukan perubahan ini, segera hubungi admin Lifestory.",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#40342c">
      <h1 style="font-size:22px;margin:0 0 16px">Password Lifestory telah diubah</h1>
      <p>Password akun Lifestory Anda baru saja diubah.</p>
      <p style="font-size:14px;color:#73685f">Jika Anda tidak melakukan perubahan ini, segera hubungi admin Lifestory.</p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
}
