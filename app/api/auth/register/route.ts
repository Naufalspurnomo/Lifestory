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
  const rateLimitError = applyRateLimit(
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
  const password = validation.data.password;

  if (!name) {
    return NextResponse.json(
      { error: "Validation failed", details: ["name: Name is required"] },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "user",
        subscriptionActive: false,
        status: "inactive",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionActive: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred while creating account" },
      { status: 500 }
    );
  }
}
