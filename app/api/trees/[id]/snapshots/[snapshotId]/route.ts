import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth/options";
import { getTreeForUser } from "../../../../../../lib/tree/repository";
import { BackupManager } from "../../../../../../lib/sync/BackupManager";

export async function GET(
  _request: Request,
  { params }: { params: { id: string; snapshotId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await getTreeForUser(params.id, session.user.id);
    const snapshot = await new BackupManager().getSnapshot(params.snapshotId);
    if (snapshot.treeId !== params.id) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
    }
    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error("snapshot detail error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
