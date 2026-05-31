// Trees collection: list current user's trees, create a new one.
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireActiveSubscriber, requireUser } from "../../../lib/auth-helpers";
import { createTreeForUser, listTreesForUser } from "../../../lib/tree/repository";
import type { FamilyNode } from "../../../lib/types/tree";
import {
  formatZodErrors,
  treeCreateSchema,
  validateBody,
} from "../../../lib/validations";

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
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  try {
    const trees = await listTreesForUser(userId);
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
  const authResult = await requireActiveSubscriber();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  const body = await request.json().catch(() => ({}));
  const validation = validateBody(treeCreateSchema, body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodErrors(validation.errors),
      },
      { status: 400 }
    );
  }

  try {
    const tree = await createTreeForUser(
      userId,
      validation.data.name,
      validation.data.nodes as FamilyNode[],
      validation.data.id
    );
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
