import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import {
  applyRateLimit,
  checkRateLimit,
  getClientIdentifier,
  rateLimitConfigs,
} from "../../../../lib/rate-limit";
import { jsonBodyLimits, parseJsonBody } from "../../../../lib/request-body";
import { formatZodErrors, resendVerificationSchema, validateBody } from "../../../../lib/validations";
import {
  EMAIL_VERIFICATION_TOKEN_TTL_MINUTES,
  generateEmailVerificationToken,
  getEmailVerificationExpiry,
  getEmailVerificationUrl,
  hashEmailVerificationToken,
} from "../../../../lib/auth/email-verification";
import { sendEmailVerificationEmail } from "../../../../lib/email";
import { verifyTurnstileToken } from "../../../../lib/turnstile";

const GENERIC_RESPONSE = {
  message: "Jika akun membutuhkan verifikasi, instruksi baru akan dikirim ke email tersebut.",
};

export async function POST(request: Request) {
  const ipLimit = await applyRateLimit(request, "auth-resend-verification", rateLimitConfigs.resendVerification);
  if (ipLimit) return ipLimit;
  const bodyResult = await parseJsonBody(request, jsonBodyLimits.auth);
  if (!bodyResult.success) return bodyResult.response;
  const validation = validateBody(resendVerificationSchema, bodyResult.body);
  if (!validation.success) {
    return NextResponse.json({ error: "Validation failed", details: formatZodErrors(validation.errors) }, { status: 400 });
  }
  const email = validation.data.email.toLowerCase().trim();
  const accountLimit = await checkRateLimit(email, "auth-resend-verification-account", rateLimitConfigs.resendVerification);
  if (accountLimit) return accountLimit;
  const turnstile = await verifyTurnstileToken(validation.data.turnstileToken, getClientIdentifier(request));
  if (!turnstile.ok) return NextResponse.json({ error: "Bot verification failed" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, status: true } });
  if (!user || user.status !== "pending_email") return NextResponse.json(GENERIC_RESPONSE);

  const rawToken = generateEmailVerificationToken();
  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await tx.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashEmailVerificationToken(rawToken),
        expiresAt: getEmailVerificationExpiry(),
      },
    });
  });
  const verificationUrl = getEmailVerificationUrl(process.env.NEXTAUTH_URL || new URL(request.url).origin, rawToken);
  const emailResult = await sendEmailVerificationEmail({
    to: email,
    verificationUrl,
    expiresInMinutes: EMAIL_VERIFICATION_TOKEN_TTL_MINUTES,
  });
  return NextResponse.json({
    ...GENERIC_RESPONSE,
    ...(process.env.NODE_ENV !== "production" && !emailResult.ok && emailResult.skipped ? { verificationUrl } : {}),
  });
}
