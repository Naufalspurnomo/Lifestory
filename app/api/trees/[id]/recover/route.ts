import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/auth-helpers";
import { applyRateLimit, rateLimitConfigs } from "../../../../../lib/rate-limit";
import {
  recoverDeletedTree,
  TreeAccessError,
} from "../../../../../lib/tree/repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitError = await applyRateLimit(
    request,
    "admin-tree-recover",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;

  const { id } = await params;
  try {
    const result = await recoverDeletedTree(id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TreeAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("tree recovery error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
