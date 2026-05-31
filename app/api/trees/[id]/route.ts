// Single tree endpoint: load entire family graph, or replace it wholesale.
// Replacement is the simplest consistency model; we can add incremental
// mutation endpoints later without breaking this one.

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "../../../../lib/auth-helpers";
import {
  deleteTree,
  getTreeForUser,
  replaceTreeNodes,
  TreeAccessError,
} from "../../../../lib/tree/repository";
import { BackupManager } from "../../../../lib/sync/BackupManager";
import type { FamilyNode } from "../../../../lib/types/tree";
import {
  formatZodErrors,
  treeNodesPayloadSchema,
  validateBody,
} from "../../../../lib/validations";

function isMissingTableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

function handleAccessError(error: unknown) {
  if (error instanceof TreeAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (isMissingTableError(error)) {
    return NextResponse.json(
      { error: "tree-tables-not-migrated" },
      { status: 503 }
    );
  }
  console.error("tree api error", error);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  try {
    const tree = await getTreeForUser(id, userId);
    return NextResponse.json({ tree });
  } catch (err) {
    return handleAccessError(err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const validation = validateBody(treeNodesPayloadSchema, body);
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
    const result = await replaceTreeNodes(
      id,
      userId,
      validation.data.nodes as FamilyNode[]
    );
    await new BackupManager().pruneOldSnapshots(id, 50).catch((error) => {
      console.error("tree snapshot pruning failed", error);
    });
    return NextResponse.json({ ok: true, newVersion: result.newVersion });
  } catch (err) {
    return handleAccessError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  try {
    await deleteTree(id, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleAccessError(err);
  }
}
