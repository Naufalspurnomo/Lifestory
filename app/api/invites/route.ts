import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth-helpers";
import { createTreeInvite, deleteExpiredTreeInvites } from "../../../lib/invites";
import { applyRateLimit, rateLimitConfigs } from "../../../lib/rate-limit";
import {
  formatZodErrors,
  inviteCreateSchema,
  validateBody,
} from "../../../lib/validations";

const INVITE_EXPIRY_DAYS = 7;
const MAX_TREE_PAYLOAD_BYTES = 350_000;

export async function POST(request: Request) {
  const rateLimitError = applyRateLimit(
    request,
    "tree-invite-create",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireUser();
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

  const { treeName, treeData } = validation.data;

  const serialized = JSON.stringify(treeData);
  if (serialized.length > MAX_TREE_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: "Tree is too large to share with invite link" },
      { status: 413 }
    );
  }

  const token = randomUUID().replace(/-/g, "");
  const expiresAt = new Date(
    Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );
  const nowIso = new Date().toISOString();

  try {
    await deleteExpiredTreeInvites(nowIso);
    await createTreeInvite({
      token,
      treeName,
      treeData: serialized,
      createdById: userId,
      createdByEmail: authResult.session.user?.email || "unknown",
      expiresAt: expiresAt.toISOString(),
    });

    const origin = new URL(request.url).origin;
    const inviteLink = `${origin}/invite/${token}`;

    return NextResponse.json({
      token,
      inviteLink,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "An error occurred while creating invite link" },
      { status: 500 }
    );
  }
}
