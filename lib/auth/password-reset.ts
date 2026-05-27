import { createHash, randomBytes } from "crypto";

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpiry(now = new Date()): Date {
  return new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);
}

export function getPasswordResetUrl(origin: string, token: string): string {
  const resetUrl = new URL("/auth/reset", origin);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}
