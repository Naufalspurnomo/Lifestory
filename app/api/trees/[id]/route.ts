// Single tree endpoint: load entire family graph, or replace it wholesale.
// Replacement is the simplest consistency model; we can add incremental
// mutation endpoints later without breaking this one.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "../../../../lib/auth/options";
import {
  deleteTree,
  getTreeForUser,
  replaceTreeNodes,
  TreeAccessError,
} from "../../../../lib/tree/repository";
import type { FamilyNode } from "../../../../lib/types/tree";

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
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tree = await getTreeForUser(params.id, session.user.id);
    return NextResponse.json({ tree });
  } catch (err) {
    return handleAccessError(err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const nodes = body?.nodes;
  if (!Array.isArray(nodes)) {
    return NextResponse.json(
      { error: "Body must include an array of nodes" },
      { status: 400 }
    );
  }

  try {
    await replaceTreeNodes(
      params.id,
      session.user.id,
      nodes as FamilyNode[]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleAccessError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteTree(params.id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleAccessError(err);
  }
}
