import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "../../../../../lib/auth-helpers";
import { prisma } from "../../../../../lib/db";
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
import { jsonBodyLimits, parseJsonBody } from "../../../../../lib/request-body";
import { applyRateLimit, rateLimitConfigs } from "../../../../../lib/rate-limit";
import {
  collectReferencedMediaStorageKeys,
  deleteMediaObject,
  getMediaStorageConfig,
} from "../../../../../lib/media/storage";
import {
  InvalidMediaReferenceError,
  MediaStorageVerificationError,
  MediaUploadReservationError,
  filterUnreferencedMediaStorageKeys,
  verifyNewMediaReferences,
} from "../../../../../lib/media/verification";

function isMissingTableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

function isTransientDatabaseError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P1001", "P1002", "P2024", "P2028", "P2034"].includes(error.code))
  );
}

function isForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}

function isSyncVersionUniqueError(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.includes("treeId") && target.includes("version");
  }
  return String(target ?? "").includes("TreeSyncReceipt_treeId_version_key");
}

function handleError(error: unknown) {
  if (error instanceof TreeAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof InvalidTreeGraphError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof InvalidMediaReferenceError) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }
  if (error instanceof MediaStorageVerificationError) {
    return NextResponse.json({ error: "Media object could not be verified" }, { status: 503 });
  }
  if (error instanceof MediaUploadReservationError) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }
  if (isForeignKeyError(error)) {
    return NextResponse.json(
      { error: "Invalid tree relationship data" },
      { status: 400 }
    );
  }
  if (isMissingTableError(error)) {
    return NextResponse.json(
      { error: "tree-database-schema-not-ready" },
      { status: 503 }
    );
  }
  if (isTransientDatabaseError(error)) {
    console.warn("tree sync temporary database error", error);
    return NextResponse.json(
      { error: "tree-sync-temporary-database-error" },
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
  const rateLimitError = await applyRateLimit(
    request,
    "tree-sync-read",
    rateLimitConfigs.treeSync
  );
  if (rateLimitError) return rateLimitError;

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
  const rateLimitError = await applyRateLimit(
    request,
    "tree-sync",
    rateLimitConfigs.treeSync
  );
  if (rateLimitError) return rateLimitError;

  const { id } = await params;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  const bodyResult = await parseJsonBody(request, jsonBodyLimits.treeMutation);
  if (!bodyResult.success) return bodyResult.response;

  const validation = validateBody(treeSyncPayloadSchema, bodyResult.body);
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
    const previousNodes = mutations.flatMap((mutation) =>
      mutation.previousPayload ? [mutation.previousPayload] : []
    );
    await verifyNewMediaReferences(id, userId, mutations);

    const result = await applyTreeMutations(
      id,
      userId,
      validation.data.batchId,
      validation.data.clientVersion,
      mutations
    );

    const committedMediaKeys = result.nodes
      ? collectReferencedMediaStorageKeys(result.nodes)
      : collectReferencedMediaStorageKeys(
          mutations.flatMap((mutation) =>
            mutation.payload ? [mutation.payload] : []
          )
        );
    if (committedMediaKeys.size > 0) {
      await prisma.mediaUploadReservation.updateMany({
        where: {
          treeId: id,
          userId,
          storageKey: { in: [...committedMediaKeys] },
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });
    }

    if (result.nodes) {
      const storageConfig = getMediaStorageConfig();
      const referencedKeys = collectReferencedMediaStorageKeys(result.nodes);
      const previousKeys = collectReferencedMediaStorageKeys(previousNodes);
      const removedMediaKeys = [...previousKeys].filter(
        (key) => !referencedKeys.has(key)
      );
      const cleanupKeys = await filterUnreferencedMediaStorageKeys(
        id,
        removedMediaKeys,
        result.nodes
      );
      if (storageConfig && cleanupKeys.length > 0) {
        const cleanupResults = await Promise.allSettled(
          cleanupKeys.map((key) => deleteMediaObject(storageConfig, key))
        );
        cleanupResults.forEach((cleanupResult, index) => {
          if (cleanupResult.status === "rejected") {
            console.error(
              "orphaned media cleanup failed",
              cleanupKeys[index],
              cleanupResult.reason
            );
          }
        });
      }
    }

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
    if (isSyncVersionUniqueError(error)) {
      const current = await getTreeForUser(id, userId);
      return NextResponse.json(
        {
          error: "version-conflict",
          currentVersion: current.version,
          serverState: current.nodes,
          conflictingNodeIds: validation.data.mutations.map(
            (mutation) => mutation.nodeId
          ),
        },
        { status: 409 }
      );
    }
    return handleError(error);
  }
}
