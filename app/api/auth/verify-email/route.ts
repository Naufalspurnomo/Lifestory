import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { verifyEmailSchema, validateBody } from "../../../../lib/validations";
import { hashEmailVerificationToken } from "../../../../lib/auth/email-verification";
import { jsonBodyLimits, parseJsonBody } from "../../../../lib/request-body";
import {
  enqueueVerifiedAccountWelcome,
  processWhatsAppWelcomeJob,
} from "../../../../lib/whatsapp";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";

export async function POST(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "verify-email",
    rateLimitConfigs.resendVerification
  );
  if (rateLimitError) return rateLimitError;

  const bodyResult = await parseJsonBody(request, jsonBodyLimits.auth);
  if (!bodyResult.success) return bodyResult.response;
  const validation = validateBody(verifyEmailSchema, bodyResult.body);
  if (!validation.success) {
    return NextResponse.json({ error: "Verification link is invalid" }, { status: 400 });
  }

  const tokenHash = hashEmailVerificationToken(validation.data.token);
  const now = new Date();
  const token = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!token || token.usedAt || token.expiresAt <= now) {
    return NextResponse.json(
      { error: "Tautan verifikasi tidak berlaku atau sudah kedaluwarsa." },
      { status: 400 }
    );
  }

  const verification = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: token.userId },
      select: { id: true, phone: true, status: true },
    });
    if (!user || user.status === "suspended") return null;
    const activatesAccount = user.status === "pending_email";
    await tx.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: now },
    });
    await tx.user.update({
      where: { id: token.userId },
      data: {
        emailVerifiedAt: now,
        status: activatesAccount ? "active" : user.status,
      },
    });
    const welcomeJob =
      activatesAccount && user.phone
        ? await enqueueVerifiedAccountWelcome(tx, {
            userId: user.id,
            phone: user.phone,
          })
        : null;
    return { welcomeJobId: welcomeJob?.id ?? null };
  });

  if (!verification) {
    return NextResponse.json({ error: "Akun tidak dapat diverifikasi." }, { status: 400 });
  }

  if (verification.welcomeJobId) {
    try {
      await processWhatsAppWelcomeJob(
        verification.welcomeJobId,
        process.env.NEXTAUTH_URL || new URL(request.url).origin
      );
    } catch (error) {
      console.error("Verified account WhatsApp welcome dispatch failed", error);
    }
  }
  return NextResponse.json(
    { message: "Email berhasil diverifikasi" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
