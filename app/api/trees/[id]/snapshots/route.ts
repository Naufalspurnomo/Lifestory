import { NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/auth-helpers";
import { applyRateLimit, rateLimitConfigs } from "../../../../../lib/rate-limit";
import {
  assertTreeWritable,
  getTreeForUser,
  TreeAccessError,
} from "../../../../../lib/tree/repository";
import { BackupManager } from "../../../../../lib/sync/BackupManager";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  try {
    await getTreeForUser(id, userId);
    const snapshots = await new BackupManager().listSnapshots(id);
    return NextResponse.json({ snapshots });
  } catch (error) {
    if (error instanceof TreeAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("snapshot list error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitError = await applyRateLimit(
    request,
    "tree-snapshot-create",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const { id } = await params;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  try {
    await assertTreeWritable(id, userId);
    const snapshot = await new BackupManager().createSnapshot(id);
    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error) {
    if (error instanceof TreeAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("snapshot create error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
