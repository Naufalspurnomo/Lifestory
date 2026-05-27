import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { sendPasswordResetEmail } from "../../../../lib/email";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";
import {
  PASSWORD_RESET_TOKEN_TTL_MINUTES,
  generatePasswordResetToken,
  getPasswordResetExpiry,
  getPasswordResetUrl,
  hashPasswordResetToken,
} from "../../../../lib/auth/password-reset";
import {
  forgotPasswordSchema,
  formatZodErrors,
  validateBody,
} from "../../../../lib/validations";

const genericMessage =
  "If the email is registered, a password reset link will be sent.";

function getOrigin(request: Request): string {
  return process.env.NEXTAUTH_URL || new URL(request.url).origin;
}

export async function POST(request: Request) {
  const rateLimitError = applyRateLimit(
    request,
    "auth-forgot-password",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validateBody(forgotPasswordSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodErrors(validation.errors),
      },
      { status: 400 }
    );
  }

  const email = validation.data.email.toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ message: genericMessage });
    }

    const token = generatePasswordResetToken();
    const resetUrl = getPasswordResetUrl(getOrigin(request), token);
    const expiresAt = getPasswordResetExpiry();

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      }),
      prisma.passwordResetToken.create({
        data: {
          tokenHash: hashPasswordResetToken(token),
          userId: user.id,
          expiresAt,
        },
      }),
    ]);

    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      expiresInMinutes: PASSWORD_RESET_TOKEN_TTL_MINUTES,
    });

    if (!emailResult.ok) {
      console.warn("Password reset email was not sent", {
        email: user.email,
        reason: emailResult.skipped ? emailResult.reason : emailResult.error,
      });
    }

    return NextResponse.json({
      message: genericMessage,
      resetUrl:
        process.env.NODE_ENV !== "production" && emailResult.skipped
          ? resetUrl
          : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred while preparing password reset" },
      { status: 500 }
    );
  }
}
