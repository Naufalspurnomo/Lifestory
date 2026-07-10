import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { verifyEmailSchema, validateBody } from "../../../../lib/validations";
import { hashEmailVerificationToken } from "../../../../lib/auth/email-verification";
import { jsonBodyLimits, parseJsonBody } from "../../../../lib/request-body";

export async function POST(request: Request) {
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

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: token.userId },
      select: { id: true, status: true },
    });
    if (!user || user.status === "suspended") return false;
    await tx.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: now },
    });
    await tx.user.update({
      where: { id: token.userId },
      data: { emailVerifiedAt: now, status: user.status === "pending_email" ? "active" : user.status },
    });
    return true;
  });

  if (!updated) {
    return NextResponse.json({ error: "Akun tidak dapat diverifikasi." }, { status: 400 });
  }
  return NextResponse.json({ message: "Email berhasil diverifikasi" });
}
