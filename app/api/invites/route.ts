import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth-helpers";
import { createTreeInvite, deleteExpiredTreeInvites } from "../../../lib/invites";
import { applyRateLimit, rateLimitConfigs } from "../../../lib/rate-limit";

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

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const treeNameRaw =
    typeof (body as { treeName?: unknown }).treeName === "string"
      ? (body as { treeName: string }).treeName
      : "";
  const treeData = (body as { treeData?: unknown }).treeData;
  const treeName = treeNameRaw.trim();

  if (!treeName) {
    return NextResponse.json(
      { error: "treeName is required" },
      { status: 400 }
    );
  }

  if (!treeData || typeof treeData !== "object") {
    return NextResponse.json(
      { error: "treeData object is required" },
      { status: 400 }
    );
  }

  const nodes = (treeData as { nodes?: unknown }).nodes;
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return NextResponse.json(
      { error: "treeData.nodes must contain at least one node" },
      { status: 400 }
    );
  }

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
      createdById: authResult.session.user?.id || "unknown",
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
