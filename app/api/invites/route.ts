import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireActiveSubscriber } from "../../../lib/auth-helpers";
import { createTreeInvite, deleteExpiredTreeInvites } from "../../../lib/invites";
import { applyRateLimit, rateLimitConfigs } from "../../../lib/rate-limit";
import { assertTreeOwner, TreeAccessError } from "../../../lib/tree/repository";
import {
  formatZodErrors,
  inviteCreateSchema,
  validateBody,
} from "../../../lib/validations";

const INVITE_EXPIRY_DAYS = 7;

export async function POST(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "tree-invite-create",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireActiveSubscriber();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized - Invalid session" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validation = validateBody(inviteCreateSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodErrors(validation.errors),
      },
      { status: 400 }
    );
  }

  const { treeId, role } = validation.data;

  const token = randomUUID().replace(/-/g, "");
  const expiresAt = new Date(
    Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );
  const nowIso = new Date().toISOString();

  try {
    await assertTreeOwner(treeId, userId);
    await deleteExpiredTreeInvites(new Date(nowIso));
    await createTreeInvite({
      token,
      treeId,
      createdById: userId,
      role: role ?? "editor",
      expiresAt,
    });

    const origin = new URL(request.url).origin;
    const inviteLink = `${origin}/invite/${token}`;

    return NextResponse.json({
      token,
      inviteLink,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof TreeAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "An error occurred while creating invite link" },
      { status: 500 }
    );
  }
}
