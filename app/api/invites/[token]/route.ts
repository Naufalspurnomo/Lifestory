import { NextResponse } from "next/server";
import {
  acceptTreeInvite,
  getTreeInviteByToken,
  deleteExpiredTreeInvites,
  TreeInviteError,
} from "../../../../lib/invites";
import { requireUser } from "../../../../lib/auth-helpers";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";

type Params = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const rateLimitError = await applyRateLimit(
    request,
    "tree-invite-get",
    rateLimitConfigs.api
  );
  if (rateLimitError) return rateLimitError;

  const { token } = await params;
  if (!token || !/^[a-zA-Z0-9]+$/.test(token)) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
  }

  try {
    const invite = await getTreeInviteByToken(token);

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      await deleteExpiredTreeInvites().catch((cleanupError) => {
        console.error("Error deleting expired invites:", cleanupError);
      });
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
    }

    return NextResponse.json({
      treeName: invite.treeName,
      createdByName: invite.createdByName,
      expiresAt: invite.expiresAt.toISOString(),
      role: invite.role,
      accepted: Boolean(invite.acceptedAt),
    });
  } catch (error) {
    console.error("Error loading invite:", error);
    return NextResponse.json(
      { error: "An error occurred while loading invite" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  const rateLimitError = await applyRateLimit(
    request,
    "tree-invite-accept",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;
  const { token } = await params;
  if (!token || !/^[a-zA-Z0-9]+$/.test(token)) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
  }

  try {
    const result = await acceptTreeInvite(token, userId);
    return NextResponse.json({ tree: result });
  } catch (error) {
    if (error instanceof TreeInviteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "An error occurred while accepting invite" },
      { status: 500 }
    );
  }
}
