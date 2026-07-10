const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp?: string | null
): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    return process.env.NODE_ENV === "production"
      ? { ok: false, reason: "Turnstile is not configured" }
      : { ok: true };
  }

  if (!token || token.length > 2048) {
    return { ok: false, reason: "Turnstile token is missing" };
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, reason: "Turnstile verification failed" };
    const result = (await response.json()) as { success?: boolean };
    return result.success
      ? { ok: true }
      : { ok: false, reason: "Turnstile verification failed" };
  } catch {
    return { ok: false, reason: "Turnstile verification unavailable" };
  }
}
