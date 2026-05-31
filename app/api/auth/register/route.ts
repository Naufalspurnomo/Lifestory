import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";
import {
  formatZodErrors,
  registerSchema,
  validateBody,
} from "../../../../lib/validations";

export async function POST(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "auth-register",
    rateLimitConfigs.register
  );
  if (rateLimitError) return rateLimitError;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validateBody(registerSchema, body);
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

  if (!name) {
    return NextResponse.json(
      { error: "Validation failed", details: ["name: Name is required"] },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: "user",
        subscriptionActive: false,
        status: "inactive",
      },
    });

    return NextResponse.json(
      {
        message: "Registration received",
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
