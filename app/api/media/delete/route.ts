import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "../../../../lib/auth-helpers";
import { prisma } from "../../../../lib/db";
import {
  assertTreeWritable,
  TreeAccessError,
} from "../../../../lib/tree/repository";
import {
  deleteMediaObject,
  MediaStorageConfigurationError,
  requireMediaStorageConfig,
  storageKeyBelongsToTree,
} from "../../../../lib/media/storage";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";
import {
  formatZodErrors,
  mediaDeleteSchema,
  validateBody,
} from "../../../../lib/validations";
import { jsonBodyLimits, parseJsonBody } from "../../../../lib/request-body";

class MediaDeleteReservationError extends Error {
  constructor() {
    super("Media upload reservation is missing or expired");
    this.name = "MediaDeleteReservationError";
  }
}

class MediaDeleteReferenceError extends Error {
  constructor() {
    super("Media object is still in use");
    this.name = "MediaDeleteReferenceError";
  }
}

function containsStorageKey(value: unknown, storageKey: string): boolean {
  if (!Array.isArray(value)) return false;
  return value.some(
    (item) =>
      item &&
      typeof item === "object" &&
      "storageKey" in item &&
      (item as { storageKey?: unknown }).storageKey === storageKey
  );
}

function errorResponse(error: unknown) {
  if (error instanceof TreeAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof MediaStorageConfigurationError) {
    return NextResponse.json(
      { error: "Media storage is not configured" },
      { status: 503 }
    );
  }
  if (error instanceof MediaDeleteReservationError) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }
  if (error instanceof MediaDeleteReferenceError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  console.error("media delete error", error);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export async function POST(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "media-delete",
    rateLimitConfigs.api
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;

  const bodyResult = await parseJsonBody(request, jsonBodyLimits.auth);
  if (!bodyResult.success) return bodyResult.response;

  const validation = validateBody(mediaDeleteSchema, bodyResult.body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodErrors(validation.errors),
      },
      { status: 400 }
    );
  }

  const data = validation.data;
  if (!storageKeyBelongsToTree(data.storageKey, data.treeId)) {
    return NextResponse.json({ error: "Invalid storage key" }, { status: 400 });
  }

  try {
    await assertTreeWritable(data.treeId, authResult.session.user.id);
    const config = requireMediaStorageConfig();
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(
        Prisma.sql`SELECT "id" FROM "Tree" WHERE "id" = ${data.treeId} FOR UPDATE`
      );

      const reservation = await tx.mediaUploadReservation.findFirst({
        where: {
          treeId: data.treeId,
          userId: authResult.session.user.id,
          storageKey: data.storageKey,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      });
      if (!reservation) throw new MediaDeleteReservationError();

      const [nodes, mediaAsset, deliverable, evidence] = await Promise.all([
        tx.node.findMany({
          where: { treeId: data.treeId },
          select: { imageStorageKey: true, media: true },
        }),
        tx.mediaAsset.findFirst({
          where: { treeId: data.treeId, storageKey: data.storageKey },
          select: { id: true },
        }),
        tx.studioDeliverable.findFirst({
          where: { treeId: data.treeId, storageKey: data.storageKey },
          select: { id: true },
        }),
        tx.familyEvidence.findFirst({
          where: { storageKey: data.storageKey },
          select: { id: true },
        }),
      ]);

      const referencedByNode = nodes.some(
        (node) =>
          node.imageStorageKey === data.storageKey ||
          containsStorageKey(node.media, data.storageKey)
      );
      if (referencedByNode || mediaAsset || deliverable || evidence) {
        throw new MediaDeleteReferenceError();
      }

      await deleteMediaObject(config, data.storageKey);
      await tx.mediaUploadReservation.update({
        where: { id: reservation.id },
        data: { consumedAt: new Date() },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
