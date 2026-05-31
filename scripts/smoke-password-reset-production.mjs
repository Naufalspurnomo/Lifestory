import "dotenv/config";
import { randomUUID } from "crypto";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.PASSWORD_RESET_SMOKE_BASE_URL?.replace(/\/$/, "");

if (process.env.ALLOW_PASSWORD_RESET_SMOKE !== "1" || !baseUrl) {
  throw new Error(
    "Set ALLOW_PASSWORD_RESET_SMOKE=1 and PASSWORD_RESET_SMOKE_BASE_URL before running password reset smoke."
  );
}

const prisma = new PrismaClient();
const runId = `${Date.now()}-${randomUUID()}`;
const userId = `password-reset-smoke-${runId}`;
const email = `delivered+password-reset-${runId}@resend.dev`;
let smokeResult;

try {
  await prisma.user.create({
    data: {
      id: userId,
      name: "Password Reset Smoke",
      email,
      passwordHash: await hash(randomUUID(), 10),
      role: "user",
      status: "inactive",
      subscriptionActive: false,
    },
  });

  const response = await fetch(`${baseUrl}/api/auth/forgot`, {
    method: "POST",
    headers: {
      Origin: baseUrl,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (response.status !== 200) {
    throw new Error(
      `Forgot-password endpoint: expected HTTP 200, got ${response.status}`
    );
  }

  const tokenCount = await prisma.passwordResetToken.count({
    where: { userId },
  });

  if (tokenCount !== 1) {
    throw new Error(
      "Password-reset email was not accepted. Check the deployed RESEND_API_KEY, PASSWORD_RESET_FROM_EMAIL, and verified Resend sender domain."
    );
  }

  smokeResult = {
    forgotPasswordStatus: response.status,
    resetTokenPersisted: true,
  };
} finally {
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
}

console.log(JSON.stringify({ ...smokeResult, syntheticUserCleaned: true }));
