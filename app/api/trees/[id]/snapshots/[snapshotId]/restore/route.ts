import { NextResponse } from "next/server";
import { requireUser } from "../../../../../../../lib/auth-helpers";
import { BackupManager } from "../../../../../../../lib/sync/BackupManager";
import {
  InvalidTreeGraphError,
  TreeAccessError,
} from "../../../../../../../lib/tree/repository";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; snapshotId: string }> }
) {
  const { id, snapshotId } = await params;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  try {
    await new BackupManager().restoreSnapshot(
      id,
      snapshotId,
      userId
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TreeAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof InvalidTreeGraphError) {
      return NextResponse.json(
        { error: "Snapshot data failed integrity validation" },
        { status: 409 }
      );
    }
    console.error("snapshot restore error", error);
    return NextResponse.json(
      { error: "Restore could not be completed" },
      { status: 500 }
    );
  }
}
