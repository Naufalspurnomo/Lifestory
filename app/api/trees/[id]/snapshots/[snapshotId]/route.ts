import { NextResponse } from "next/server";
import { requireUser } from "../../../../../../lib/auth-helpers";
import {
  getTreeForUser,
  TreeAccessError,
} from "../../../../../../lib/tree/repository";
import { BackupManager } from "../../../../../../lib/sync/BackupManager";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  const { id, snapshotId } = await params;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  try {
    await getTreeForUser(id, userId);
    const snapshot = await new BackupManager().getSnapshot(snapshotId);
    if (snapshot.treeId !== id) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }
    return NextResponse.json({ snapshot });
  } catch (error) {
    if (error instanceof TreeAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("snapshot detail error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
