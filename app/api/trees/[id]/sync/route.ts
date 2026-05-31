import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireActiveSubscriber } from "../../../../../lib/auth-helpers";
import {
  applyTreeMutations,
  getChangedNodeIdsSince,
  getTreeForUser,
  pruneOldSyncReceipts,
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireActiveSubscriber();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

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
      id,
      userId,
      validation.data.batchId,
      validation.data.clientVersion,
      mutations
    );

    await Promise.all([
      new BackupManager().pruneOldSnapshots(id, 50).catch((error) => {
        console.error("tree snapshot pruning failed", error);
      }),
      pruneOldSyncReceipts(id).catch((error) => {
        console.error("tree sync receipt pruning failed", error);
      }),
    ]);

    return NextResponse.json({
      success: true,
      newVersion: result.newVersion,
      acknowledgedSeqNos: result.acknowledgedSeqNos,
    });
  } catch (error) {
    if (error instanceof VersionConflictError) {
      const current = await getTreeForUser(id, userId);
      const requestedNodeIds = new Set(
        validation.data.mutations.map((mutation) => mutation.nodeId)
      );
      const changes = await getChangedNodeIdsSince(
        id,
        validation.data.clientVersion,
        error.currentVersion
      );
      const changedNodeIds = new Set(changes.nodeIds);
      return NextResponse.json(
        {
          error: "version-conflict",
          currentVersion: error.currentVersion,
          serverState: current.nodes,
          conflictingNodeIds: changes.complete
            ? [...requestedNodeIds].filter((id) => changedNodeIds.has(id))
            : [...requestedNodeIds],
        },
        { status: 409 }
      );
    }
    return handleError(error);
  }
}
