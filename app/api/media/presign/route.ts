import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "../../../../lib/auth-helpers";
import { prisma } from "../../../../lib/db";
import {
  assertTreeWritable,
  getTreeAccessContext,
  TreeAccessError,
} from "../../../../lib/tree/repository";
import {
  calculateStoredMediaUsage,
  countStoredGalleryItems,
  formatBytes,
} from "../../../../lib/media/quota";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";
import {
  createMediaStorageKey,
  createPresignedPutUrl,
  isAllowedMediaContentType,
  MediaStorageConfigurationError,
  requireMediaStorageConfig,
} from "../../../../lib/media/storage";
import {
  formatZodErrors,
  mediaUploadIntentSchema,
  validateBody,
} from "../../../../lib/validations";
import { jsonBodyLimits, parseJsonBody } from "../../../../lib/request-body";

const MAX_GALLERY_ITEMS_PER_NODE = 10;

class MediaQuotaExceededError extends Error {
  constructor(
    public readonly usedBytes: number,
    public readonly reservedBytes: number,
    public readonly quotaBytes: number
  ) {
    super("Tree media quota exceeded");
    this.name = "MediaQuotaExceededError";
  }
}

class GalleryLimitError extends Error {
  constructor() {
    super("Gallery item limit reached for this family member");
    this.name = "GalleryLimitError";
  }
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
  if (error instanceof MediaQuotaExceededError) {
    return NextResponse.json(
      {
        error: `Tree media quota exceeded. Used ${formatBytes(
          error.usedBytes + error.reservedBytes
        )} of ${formatBytes(error.quotaBytes)}.`,
        quotaBytes: error.quotaBytes,
        usedBytes: error.usedBytes,
        reservedBytes: error.reservedBytes,
      },
      { status: 413 }
    );
  }
  if (error instanceof GalleryLimitError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  console.error("media presign error", error);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export async function POST(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "media-presign",
    rateLimitConfigs.api
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;

  const bodyResult = await parseJsonBody(request, jsonBodyLimits.auth);
  if (!bodyResult.success) return bodyResult.response;

  const validation = validateBody(mediaUploadIntentSchema, bodyResult.body);
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

  if (!isAllowedMediaContentType(data.contentType)) {
    return NextResponse.json(
      { error: "Unsupported media type" },
      { status: 415 }
    );
  }

  try {
    const config = requireMediaStorageConfig();
    if (data.sizeBytes > config.maxFileBytes) {
      return NextResponse.json(
        {
          error: `File exceeds ${formatBytes(config.maxFileBytes)} limit`,
          maxBytes: config.maxFileBytes,
        },
        { status: 413 }
      );
    }

    await assertTreeWritable(data.treeId, authResult.session.user.id);
    const access = await getTreeAccessContext(data.treeId, authResult.session.user.id);
    const entitlementQuota = access.entitlement.storageQuotaBytes;
    const effectiveQuota = Math.min(config.treeQuotaBytes, entitlementQuota);
    const reservationTtlMs = config.uploadUrlTtlSeconds * 1000;
    const reservation = await prisma.$transaction(async (tx) => {
      // Serialize reservations with tree sync's versioned writes. Without a
      // row lock, two concurrent presigns can both observe the same free
      // quota and over-allocate object storage.
      await tx.$executeRaw(
        Prisma.sql`SELECT "id" FROM "Tree" WHERE "id" = ${data.treeId} FOR UPDATE`
      );

      const now = new Date();
      await tx.mediaUploadReservation.deleteMany({
        where: {
          treeId: data.treeId,
          OR: [
            { expiresAt: { lte: now } },
            { consumedAt: { not: null } },
          ],
        },
      });

      const nodes = await tx.node.findMany({
        where: { treeId: data.treeId },
        select: {
          id: true,
          imageUrl: true,
          imageStorageKey: true,
          imageSizeBytes: true,
          media: true,
        },
      });
      const usage = calculateStoredMediaUsage(nodes);
      const registeredAssets = await tx.mediaAsset.aggregate({
        where: { treeId: data.treeId },
        _sum: { sizeBytes: true },
      });
      const registeredAssetBytes = Number(registeredAssets._sum.sizeBytes ?? 0n);
      const storedObjectBytes = usage.objectBytes + registeredAssetBytes;
      const reserved = await tx.mediaUploadReservation.aggregate({
        where: {
          treeId: data.treeId,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        _sum: { sizeBytes: true },
      });
      const reservedBytes = Number(reserved._sum.sizeBytes ?? 0n);

      if (storedObjectBytes + reservedBytes + data.sizeBytes > effectiveQuota) {
        throw new MediaQuotaExceededError(
          storedObjectBytes,
          reservedBytes,
          effectiveQuota
        );
      }

      if (
        data.purpose === "gallery" &&
        countStoredGalleryItems(nodes, data.nodeId) >= MAX_GALLERY_ITEMS_PER_NODE
      ) {
        throw new GalleryLimitError();
      }

      const storageKey = createMediaStorageKey({
        treeId: data.treeId,
        nodeId: data.nodeId,
        userId: authResult.session.user.id,
        purpose: data.purpose,
        contentType: data.contentType,
      });
      await tx.mediaUploadReservation.create({
        data: {
          treeId: data.treeId,
          userId: authResult.session.user.id,
          storageKey,
          purpose: data.purpose,
          sizeBytes: BigInt(data.sizeBytes),
          expiresAt: new Date(now.getTime() + reservationTtlMs),
        },
      });

      return { storageKey, usedBytes: storedObjectBytes, reservedBytes };
    });
    const presigned = createPresignedPutUrl(
      config,
      reservation.storageKey,
      new Date(),
      data.contentType
    );
    const uploadedAt = new Date().toISOString();

    return NextResponse.json({
      uploadUrl: presigned.uploadUrl,
      method: "PUT",
      headers: {
        "Content-Type": data.contentType,
      },
      expiresAt: presigned.expiresAt,
      asset: {
        type: "image",
        url: presigned.objectUrl,
        storageKey: presigned.storageKey,
        mimeType: data.contentType,
        sizeBytes: data.sizeBytes,
        uploadedAt,
      },
      quota: {
        usedBytes: reservation.usedBytes,
        reservedBytes: reservation.reservedBytes + data.sizeBytes,
        quotaBytes: effectiveQuota,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
