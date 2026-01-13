import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth-helpers";
import { applyRateLimit, rateLimitConfigs } from "../../../lib/rate-limit";
import { prisma } from "../../../lib/db";

// GET all users (for admin dashboard) - PROTECTED: Admin only
export async function GET(request: Request) {
  // Rate limiting
  const rateLimitError = applyRateLimit(
    request,
    "admin-users",
    rateLimitConfigs.admin
  );
  if (rateLimitError) return rateLimitError;

  // Auth check
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  try {
    // Only select necessary fields (data minimization)
    // NEVER include: passwordHash, resetToken, etc.
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionActive: true,
        status: true,
        createdAt: true,
        // passwordHash: EXCLUDED
        // updatedAt: EXCLUDED (internal)
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    // Don't expose internal errors to client
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching users" },
      { status: 500 }
    );
  }
}
