import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "../../../../../lib/auth-helpers";
import {
  applyTreeMutations,
  getChangedNodeIdsSince,
  getTreeForUser,
  getTreeVersionForUser,
  InvalidTreeGraphError,
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
  if (error instanceof InvalidTreeGraphError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;
  const rawSinceVersion = new URL(request.url).searchParams.get("sinceVersion");
  const sinceVersion = Number(rawSinceVersion);

  if (!Number.isInteger(sinceVersion) || sinceVersion < 1) {
    return NextResponse.json(
      { error: "sinceVersion must be a positive integer" },
      { status: 400 }
    );
  }

  try {
    const currentVersion = await getTreeVersionForUser(id, userId);
    if (currentVersion === sinceVersion) {
      return NextResponse.json(
        { changed: false, currentVersion },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const tree = await getTreeForUser(id, userId);
    const targetVersion = tree.version ?? currentVersion;
    const changes =
      sinceVersion < targetVersion
        ? await getChangedNodeIdsSince(id, sinceVersion, targetVersion)
        : { complete: false, nodeIds: [] };

    return NextResponse.json(
      {
        changed: true,
        currentVersion: targetVersion,
        tree,
        changedNodeIds: changes.nodeIds,
        complete: changes.complete,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
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
      previousPayload: mutation.previousPayload as
        | FamilyNode
        | null
        | undefined,
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
