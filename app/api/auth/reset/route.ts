import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { hashPasswordResetToken } from "../../../../lib/auth/password-reset";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";
import {
  formatZodErrors,
  resetPasswordSchema,
  validateBody,
} from "../../../../lib/validations";

class InvalidResetTokenError extends Error {}

export async function POST(request: Request) {
  const rateLimitError = applyRateLimit(
    request,
    "auth-reset-password",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validateBody(resetPasswordSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodErrors(validation.errors),
      },
      { status: 400 }
    );
  }

  const tokenHash = hashPasswordResetToken(validation.data.token);
  const passwordHash = await hash(validation.data.password, 10);
  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const resetToken = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { id: true, userId: true, usedAt: true, expiresAt: true },
      });

      if (
        !resetToken ||
        resetToken.usedAt ||
        resetToken.expiresAt.getTime() <= now.getTime()
      ) {
        throw new InvalidResetTokenError("Invalid or expired reset token");
      }

      const markedUsed = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (markedUsed.count !== 1) {
        throw new InvalidResetTokenError("Invalid or expired reset token");
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
        },
      });
    });

    return NextResponse.json({ message: "Password reset successful" });
  } catch (error) {
    if (error instanceof InvalidResetTokenError) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "An error occurred while resetting password" },
      { status: 500 }
    );
  }
}
