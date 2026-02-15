import { NextResponse } from "next/server";
import {
  getTreeInviteByToken,
  deleteExpiredTreeInvites,
} from "../../../../lib/invites";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";

type Params = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const rateLimitError = applyRateLimit(
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
    await deleteExpiredTreeInvites(new Date().toISOString());
    const invite = await getTreeInviteByToken(token);

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
    }

    let treeData: unknown = null;
    try {
      treeData = JSON.parse(invite.treeData);
    } catch {
      return NextResponse.json(
        { error: "Invite data is corrupted" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      treeName: invite.treeName,
      treeData,
      createdByEmail: invite.createdByEmail,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error("Error loading invite:", error);
    return NextResponse.json(
      { error: "An error occurred while loading invite" },
      { status: 500 }
    );
  }
}
