import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth-helpers";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";
import {
  validateBody,
  updateUserStatusSchema,
  formatZodErrors,
} from "../../../../lib/validations";
import { prisma } from "../../../../lib/db";

type Params = {
  params: Promise<{ id: string }>;
};

// PATCH - Update user status/subscription - PROTECTED: Admin only
export async function PATCH(request: Request, { params }: Params) {
  // Rate limiting
  const rateLimitError = applyRateLimit(
    request,
    "admin-update-user",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  // Auth check
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  try {
    const { id } = await params;

    // Validate ID
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Parse and validate body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Zod validation
    const validation = validateBody(updateUserStatusSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: formatZodErrors(validation.errors),
        },
        { status: 400 }
      );
    }

    const { status, subscriptionActive } = validation.data;

    // Check if target user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update data
    const updateData: {
      status?: string;
      subscriptionActive?: boolean;
    } = {};

    if (status !== undefined) {
      updateData.status = status;
      updateData.subscriptionActive = status === "active";
    }

    if (subscriptionActive !== undefined) {
      updateData.subscriptionActive = subscriptionActive;
      if (subscriptionActive) {
        updateData.status = "active";
      } else if (status === undefined) {
        updateData.status = "inactive";
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionActive: true,
        status: true,
        // passwordHash: EXCLUDED
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "An error occurred while updating user" },
      { status: 500 }
    );
  }
}

// GET - Get single user - PROTECTED: Admin only
export async function GET(request: Request, { params }: Params) {
  // Rate limiting
  const rateLimitError = applyRateLimit(
    request,
    "admin-get-user",
    rateLimitConfigs.admin
  );
  if (rateLimitError) return rateLimitError;

  // Auth check
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionActive: true,
        status: true,
        createdAt: true,
        // passwordHash: EXCLUDED
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching user" },
      { status: 500 }
    );
  }
}
