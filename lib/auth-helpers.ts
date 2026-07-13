import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "./auth/options";

// Extended session type with our custom user properties
interface AppSession extends Session {
  user?: Session["user"] & {
    id?: string;
    role?: string;
    subscriptionActive?: boolean;
    status?: string;
  };
}

export type AuthResult =
  | { success: true; session: AuthenticatedSession }
  | { success: false; response: NextResponse };

type AuthenticatedSession = AppSession & {
  user: NonNullable<AppSession["user"]> & { id: string };
};

/**
 * Require authenticated user (any role)
 */
export async function requireUser(): Promise<AuthResult> {
  const session = (await getServerSession(authOptions)) as AppSession | null;

  if (!session?.user?.id) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      ),
    };
  }

  if (
    session.user.status === "suspended" ||
    session.user.status === "inactive" ||
    session.user.status === "pending_email"
  ) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Forbidden - Account is not active" },
        { status: 403 }
      ),
    };
  }

  return { success: true, session: session as AuthenticatedSession };
}

/**
 * Require a paid subscriber for family-tree data operations.
 * Admins retain access for support and recovery workflows.
 */
export async function requireActiveSubscriber(): Promise<AuthResult> {
  const result = await requireUser();

  if (!result.success) {
    return result;
  }

  if (
    result.session.user.role !== "admin" &&
    !result.session.user.subscriptionActive
  ) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Forbidden - Active subscription required" },
        { status: 403 }
      ),
    };
  }

  return result;
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
  const result = await requireUser();
  return result.success ? result.session.user.id : null;
}
