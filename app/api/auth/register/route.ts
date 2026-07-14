import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import {
  applyRateLimit,
  getClientIdentifier,
  rateLimitConfigs,
} from "../../../../lib/rate-limit";
import {
  formatZodErrors,
  registerSchema,
  validateBody,
} from "../../../../lib/validations";
import { jsonBodyLimits, parseJsonBody } from "../../../../lib/request-body";
import { CONSENT_POLICY_VERSION } from "../../../../lib/legal/consent";
import {
  generateEmailVerificationToken,
  getEmailVerificationExpiry,
  getEmailVerificationUrl,
  hashEmailVerificationToken,
  EMAIL_VERIFICATION_TOKEN_TTL_MINUTES,
} from "../../../../lib/auth/email-verification";
import { sendEmailVerificationEmail } from "../../../../lib/email";
import { verifyTurnstileToken } from "../../../../lib/turnstile";

function readUserAgent(request: Request): string | null {
  const value = request.headers.get("user-agent");
  if (!value) return null;
  // Keep the stored value bounded to avoid unbounded header abuse.
  return value.slice(0, 512);
}

export async function POST(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "auth-register",
    rateLimitConfigs.register
  );
  if (rateLimitError) return rateLimitError;

  const bodyResult = await parseJsonBody(request, jsonBodyLimits.auth);
  if (!bodyResult.success) return bodyResult.response;

  const validation = validateBody(registerSchema, bodyResult.body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodErrors(validation.errors),
      },
      { status: 400 }
    );
  }

  const name = validation.data.name.trim();
  const email = validation.data.email.toLowerCase().trim();
  const phone = validation.data.phone.trim();
  const password = validation.data.password;
  const consentAcceptedAt = new Date();
  const consentIp = getClientIdentifier(request);
  const consentUserAgent = readUserAgent(request);
  const consentPolicyVersion = CONSENT_POLICY_VERSION;

  const turnstile = await verifyTurnstileToken(
    validation.data.turnstileToken,
    consentIp
  );
  if (!turnstile.ok) {
    return NextResponse.json(
      { error: "Bot verification failed" },
      { status: 400 }
    );
  }

  if (!name) {
    return NextResponse.json(
      { error: "Validation failed", details: ["name: Name is required"] },
      { status: 400 }
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "Registration received",
          account:
            existingUser.status === "pending_email" ? "pending_email" : "existing",
        },
        { status: 200 }
      );
    }

    const passwordHash = await hash(password, 10);
    const verificationToken = generateEmailVerificationToken();
    const verificationUrl = getEmailVerificationUrl(
      process.env.NEXTAUTH_URL || new URL(request.url).origin,
      verificationToken
    );

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role: "user",
          subscriptionActive: false,
          status: "pending_email",
          emailVerifiedAt: null,
          consentAcceptedAt,
          consentIp,
          consentUserAgent,
          consentPolicyVersion,
        },
      });
      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashEmailVerificationToken(verificationToken),
          expiresAt: getEmailVerificationExpiry(),
        },
      });
    });

    const emailResult = await sendEmailVerificationEmail({
      to: email,
      verificationUrl,
      expiresInMinutes: EMAIL_VERIFICATION_TOKEN_TTL_MINUTES,
    });

    return NextResponse.json(
      {
        message: "Registration received",
        ...(process.env.NODE_ENV !== "production" &&
        !emailResult.ok
          ? { verificationUrl }
          : {}),
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Registration received" },
        { status: 201 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating account" },
      { status: 500 }
    );
  }
}
