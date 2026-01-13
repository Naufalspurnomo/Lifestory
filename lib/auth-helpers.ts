import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "./auth/options";

// Extended session type with our custom user properties
interface AppSession extends Session {
  user?: Session["user"] & {
    id?: string;
    role?: string;
    subscriptionActive?: boolean;
  };
}

export type AuthResult =
  | { success: true; session: AppSession }
  | { success: false; response: NextResponse };

/**
 * Require authenticated user (any role)
 */
export async function requireUser(): Promise<AuthResult> {
  const session = (await getServerSession(authOptions)) as AppSession | null;

  if (!session?.user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      ),
    };
  }

  return { success: true, session };
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireUser();

  if (!result.success) {
    return result;
  }

  if (result.session.user?.role !== "admin") {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      ),
    };
  }

  return result;
}

/**
 * Require owner of resource OR admin
 * Anti-IDOR: Don't trust userId from body/query, use session
 */
export async function requireOwnerOrAdmin(
  resourceOwnerId: string
): Promise<AuthResult> {
  const result = await requireUser();

  if (!result.success) {
    return result;
  }

  const isOwner = result.session.user?.id === resourceOwnerId;
  const isAdmin = result.session.user?.role === "admin";

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Forbidden - You don't have access to this resource" },
        { status: 403 }
      ),
    };
  }

  return result;
}

/**
 * Get current user ID from session (for ownership checks)
 * Use this instead of trusting userId from request body
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = (await getServerSession(authOptions)) as AppSession | null;
  return session?.user?.id ?? null;
}
