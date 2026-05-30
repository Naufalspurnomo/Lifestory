import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth/options";
import { getTreeForUser } from "../../../../../lib/tree/repository";
import { BackupManager } from "../../../../../lib/sync/BackupManager";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await getTreeForUser(params.id, session.user.id);
    const snapshots = await new BackupManager().listSnapshots(params.id);
    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("snapshot list error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tree = await getTreeForUser(params.id, session.user.id);
    const snapshot = await new BackupManager().createSnapshot(
      params.id,
      tree.version ?? 1
    );
    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error) {
    console.error("snapshot create error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
