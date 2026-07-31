// Single tree endpoint: load entire family graph, or replace it wholesale.
// Replacement is the simplest consistency model; we can add incremental
// mutation endpoints later without breaking this one.

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "../../../../lib/auth-helpers";
import { prisma } from "../../../../lib/db";
import {
  deleteTree,
  getTreeForUser,
  InvalidTreeGraphError,
  replaceTreeNodes,
  TreeAccessError,
  VersionConflictError,
} from "../../../../lib/tree/repository";
import { BackupManager } from "../../../../lib/sync/BackupManager";
import type { FamilyNode } from "../../../../lib/types/tree";
import {
  formatZodErrors,
  treeNodesPayloadSchema,
  validateBody,
} from "../../../../lib/validations";
import { jsonBodyLimits, parseJsonBody } from "../../../../lib/request-body";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";
import {
  collectReferencedMediaStorageKeys,
  deleteMediaObject,
  getMediaStorageConfig,
} from "../../../../lib/media/storage";
import {
  InvalidMediaReferenceError,
  MediaStorageVerificationError,
  MediaUploadReservationError,
  filterUnreferencedMediaStorageKeys,
  verifyNewMediaReferences,
} from "../../../../lib/media/verification";

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
  if (error instanceof InvalidTreeGraphError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof VersionConflictError) {
    return NextResponse.json(
      { error: "version-conflict", currentVersion: error.currentVersion },
      { status: 409 }
    );
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitError = await applyRateLimit(request, "tree-read", rateLimitConfigs.api);
  if (rateLimitError) return rateLimitError;

  const { id } = await params;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  try {
    const tree = await getTreeForUser(id, userId);
    return NextResponse.json(
      { tree },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    return handleAccessError(err);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitError = await applyRateLimit(
    request,
    "tree-replace",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const { id } = await params;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  const bodyResult = await parseJsonBody(request, jsonBodyLimits.treeMutation);
  if (!bodyResult.success) return bodyResult.response;

  const validation = validateBody(treeNodesPayloadSchema, bodyResult.body);
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
    const current = await getTreeForUser(id, userId);
    const currentById = new Map(current.nodes.map((node) => [node.id, node]));
    const nextById = new Map(validation.data.nodes.map((node) => [node.id, node as FamilyNode]));
    const mediaMutations = [
      ...current.nodes.map((node) => ({
        previousPayload: node,
        payload: nextById.get(node.id) ?? null,
      })),
      ...validation.data.nodes
        .filter((node) => !currentById.has(node.id))
        .map((node) => ({ previousPayload: null, payload: node as FamilyNode })),
    ];
    await verifyNewMediaReferences(id, userId, mediaMutations);

    const result = await replaceTreeNodes(
      id,
      userId,
      validation.data.expectedVersion,
      validation.data.nodes as FamilyNode[]
    );

    const committedMediaKeys = collectReferencedMediaStorageKeys(
      validation.data.nodes as FamilyNode[]
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

    const removedMediaKeys = [
      ...collectReferencedMediaStorageKeys(current.nodes),
    ].filter((key) => !committedMediaKeys.has(key));
    const storageConfig = getMediaStorageConfig();
    const cleanupKeys = await filterUnreferencedMediaStorageKeys(
      id,
      removedMediaKeys,
      validation.data.nodes as FamilyNode[]
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

    await new BackupManager().pruneOldSnapshots(id, 50).catch((error) => {
      console.error("tree snapshot pruning failed", error);
    });
    return NextResponse.json({ ok: true, newVersion: result.newVersion });
  } catch (err) {
    return handleAccessError(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitError = await applyRateLimit(
    request,
    "tree-delete",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

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
