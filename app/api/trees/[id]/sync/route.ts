import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "../../../../../lib/auth/options";
import {
  applyTreeMutations,
  getTreeForUser,
  TreeAccessError,
  VersionConflictError,
} from "../../../../../lib/tree/repository";
import { BackupManager } from "../../../../../lib/sync/BackupManager";
import {
  formatZodErrors,
  treeSyncPayloadSchema,
  validateBody,
} from "../../../../../lib/validations";
import type { FamilyNode } from "../../../../../lib/types/tree";

function isMissingTableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2021"
  );
}

function handleError(error: unknown) {
  if (error instanceof TreeAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (isMissingTableError(error)) {
    return NextResponse.json(
      { error: "tree-tables-not-migrated" },
      { status: 503 }
    );
  }
  console.error("tree sync error", error);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const validation = validateBody(treeSyncPayloadSchema, body);
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
    const mutations = validation.data.mutations.map((mutation) => ({
      ...mutation,
      payload: mutation.payload as FamilyNode | null,
    }));

    const result = await applyTreeMutations(
      params.id,
      session.user.id,
      validation.data.clientVersion,
      mutations
    );

    const backup = new BackupManager();
    await backup.createSnapshot(params.id, result.newVersion).catch((error) => {
      console.error("tree snapshot creation failed", error);
    });

    return NextResponse.json({
      success: true,
      newVersion: result.newVersion,
      acknowledgedSeqNos: result.acknowledgedSeqNos,
    });
  } catch (error) {
    if (error instanceof VersionConflictError) {
      const current = await getTreeForUser(params.id, session.user.id);
      const requestedNodeIds = new Set(
        validation.data.mutations.map((mutation) => mutation.nodeId)
      );
      const serverNodeIds = new Set(current.nodes.map((node) => node.id));
      return NextResponse.json(
        {
          error: "version-conflict",
          currentVersion: error.currentVersion,
          serverState: current.nodes,
          conflictingNodeIds: [...requestedNodeIds].filter((id) =>
            serverNodeIds.has(id)
          ),
        },
        { status: 409 }
      );
    }
    return handleError(error);
  }
}
