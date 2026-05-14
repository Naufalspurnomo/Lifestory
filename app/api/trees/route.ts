// Trees collection: list current user's trees, create a new one.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "../../../lib/auth/options";
import { createTreeForUser, listTreesForUser } from "../../../lib/tree/repository";

// Graceful fallback for P2021 (table does not exist). This lets the app
// keep working in local/offline mode even when the family-tree migration
// has not been applied to the connected database yet.
function isMissingTableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const trees = await listTreesForUser(session.user.id);
    return NextResponse.json({ trees });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { trees: [], warning: "tree-tables-not-migrated" },
        { status: 200 }
      );
    }
    console.error("trees list error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const tree = await createTreeForUser(session.user.id, name);
    return NextResponse.json({ tree }, { status: 201 });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "tree-tables-not-migrated" },
        { status: 503 }
      );
    }
    console.error("tree create error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
