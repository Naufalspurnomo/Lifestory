import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../../lib/auth/options";
import { BackupManager } from "../../../../../../../lib/sync/BackupManager";
import { TreeAccessError } from "../../../../../../../lib/tree/repository";

export async function POST(
  _request: Request,
  { params }: { params: { id: string; snapshotId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await new BackupManager().restoreSnapshot(
      params.id,
      params.snapshotId,
      session.user.id
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TreeAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("snapshot restore error", error);
    return NextResponse.json(
      { error: "Restore could not be completed" },
      { status: 500 }
    );
  }
}
