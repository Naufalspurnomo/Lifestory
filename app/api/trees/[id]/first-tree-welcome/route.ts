import { NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/auth-helpers";
import {
  dismissFirstTreeWelcome,
  TreeAccessError,
} from "../../../../../lib/tree/repository";
import { applyRateLimit, rateLimitConfigs } from "../../../../../lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitError = await applyRateLimit(
    request,
    "tree-first-welcome-dismiss",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;

  const { id } = await params;
  try {
    await dismissFirstTreeWelcome(id, authResult.session.user.id);
    return NextResponse.json({ dismissed: true });
  } catch (error) {
    if (error instanceof TreeAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("first tree welcome dismiss error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
