import { createHash, randomBytes } from "crypto";

export const EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = 30;

export function generateEmailVerificationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashEmailVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getEmailVerificationExpiry(now = new Date()): Date {
  return new Date(
    now.getTime() + EMAIL_VERIFICATION_TOKEN_TTL_MINUTES * 60 * 1000
  );
}

export function getEmailVerificationUrl(origin: string, token: string): string {
  const url = new URL("/auth/verify-email", origin);
  url.searchParams.set("token", token);
  return url.toString();
}
