import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/auth-helpers";
import { prisma } from "../../../../../lib/db";
import { jsonBodyLimits, parseJsonBody } from "../../../../../lib/request-body";
import { applyRateLimit, rateLimitConfigs } from "../../../../../lib/rate-limit";
import { formatZodErrors, mediaAssetCreateSchema, validateBody } from "../../../../../lib/validations";
import { getTreeAccessContext, TreeAccessError } from "../../../../../lib/tree/repository";
import { canViewMediaAsset } from "../../../../../lib/media/access";
import { calculateStoredMediaUsage } from "../../../../../lib/media/quota";
import {
  createPresignedGetUrl,
  headMediaObject,
  MediaStorageConfigurationError,
  requireMediaStorageConfig,
  storageKeyBelongsToTree,
} from "../../../../../lib/media/storage";

class MediaAssetQuotaError extends Error {
  constructor(
    public readonly usedBytes: number,
    public readonly quotaBytes: number
  ) {
    super("Media quota exceeded");
    this.name = "MediaAssetQuotaError";
  }
}

class MediaAssetPersonError extends Error {
  constructor() {
    super("Person is not in this tree");
    this.name = "MediaAssetPersonError";
  }
}

class MediaAssetReservationError extends Error {
  constructor() {
    super("Media upload reservation is missing or expired");
    this.name = "MediaAssetReservationError";
  }
}

function errorResponse(error: unknown) {
  if (error instanceof TreeAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof MediaStorageConfigurationError) return NextResponse.json({ error: "Media storage is not configured" }, { status: 503 });
  if (error instanceof MediaAssetQuotaError) return NextResponse.json({ error: error.message, quotaBytes: error.quotaBytes, usedBytes: error.usedBytes }, { status: 413 });
  if (error instanceof MediaAssetPersonError) return NextResponse.json({ error: error.message }, { status: 400 });
  if (error instanceof MediaAssetReservationError) return NextResponse.json({ error: error.message }, { status: 422 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
  console.error("media asset route error", error);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

function serializeMediaAsset(
  asset: { sizeBytes: bigint; storageKey: string } & Record<string, unknown>,
  readUrl?: { readUrl: string; expiresAt: string }
) {
  return {
    ...asset,
    sizeBytes: Number(asset.sizeBytes),
    readUrl: readUrl?.readUrl,
    readUrlExpiresAt: readUrl?.expiresAt,
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitError = await applyRateLimit(request, "media-asset-list", rateLimitConfigs.api);
  if (rateLimitError) return rateLimitError;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const { id } = await params;
  try {
    await getTreeAccessContext(id, authResult.session.user.id);
    const config = requireMediaStorageConfig();
    const userId = authResult.session.user.id;
    const assets = await prisma.mediaAsset.findMany({
      where: {
        treeId: id,
        OR: [
          { visibility: "tree" },
          { visibility: { in: ["private", "selected"] }, uploaderId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json({
      assets: assets.map((asset) =>
        serializeMediaAsset(
          asset,
          canViewMediaAsset(asset, userId)
            ? createPresignedGetUrl(config, asset.storageKey)
            : undefined
        )
      ),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitError = await applyRateLimit(request, "media-asset-register", rateLimitConfigs.api);
  if (rateLimitError) return rateLimitError;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const { id } = await params;
  const bodyResult = await parseJsonBody(request, jsonBodyLimits.auth);
  if (!bodyResult.success) return bodyResult.response;
  const validation = validateBody(mediaAssetCreateSchema, bodyResult.body);
  if (!validation.success) return NextResponse.json({ error: "Validation failed", details: formatZodErrors(validation.errors) }, { status: 400 });
  try {
    const access = await getTreeAccessContext(id, authResult.session.user.id);
    if (!access.capabilities.canEdit) return NextResponse.json({ error: "Read-only access" }, { status: 403 });
    const config = requireMediaStorageConfig();
    if (!storageKeyBelongsToTree(validation.data.storageKey, id)) return NextResponse.json({ error: "Storage key is outside tree namespace" }, { status: 400 });
    let objectMetadata;
    try {
      objectMetadata = await headMediaObject(config, validation.data.storageKey);
    } catch (error) {
      console.error("media asset object verification failed", error);
      return NextResponse.json({ error: "Media object could not be verified" }, { status: 503 });
    }
    if (!objectMetadata) return NextResponse.json({ error: "Media object was not found" }, { status: 422 });
    if (objectMetadata.sizeBytes !== validation.data.sizeBytes) return NextResponse.json({ error: "Media object size does not match the upload metadata" }, { status: 422 });
    if (objectMetadata.mimeType && objectMetadata.mimeType !== validation.data.mimeType) return NextResponse.json({ error: "Media object type does not match the upload metadata" }, { status: 422 });

    const asset = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`SELECT "id" FROM "Tree" WHERE "id" = ${id} FOR UPDATE`);
      const reservation = await tx.mediaUploadReservation.findFirst({
        where: {
          treeId: id,
          userId: authResult.session.user.id,
          storageKey: validation.data.storageKey,
          sizeBytes: BigInt(validation.data.sizeBytes),
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      });
      if (!reservation) throw new MediaAssetReservationError();
      if (validation.data.personId) {
        const person = await tx.node.findFirst({ where: { id: validation.data.personId, treeId: id }, select: { id: true } });
        if (!person) throw new MediaAssetPersonError();
      }
      const [nodes, used, reserved] = await Promise.all([
        tx.node.findMany({
          where: { treeId: id },
          select: {
            id: true,
            imageUrl: true,
            imageStorageKey: true,
            imageSizeBytes: true,
            media: true,
          },
        }),
        tx.mediaAsset.aggregate({ where: { treeId: id }, _sum: { sizeBytes: true } }),
        tx.mediaUploadReservation.aggregate({
          where: { treeId: id, consumedAt: null, expiresAt: { gt: new Date() } },
          _sum: { sizeBytes: true },
        }),
      ]);
      const nodeUsage = calculateStoredMediaUsage(nodes);
      const registeredBytes = Number(used._sum.sizeBytes ?? 0n);
      const reservedBytes = Number(reserved._sum.sizeBytes ?? 0n);
      const usedBytes = nodeUsage.objectBytes + registeredBytes + reservedBytes;
      const effectiveQuota = Math.min(config.treeQuotaBytes, access.entitlement.storageQuotaBytes);
      if (usedBytes > effectiveQuota) {
        throw new MediaAssetQuotaError(usedBytes, effectiveQuota);
      }
      const created = await tx.mediaAsset.create({
        data: {
          treeId: id,
          personId: validation.data.personId ?? null,
          storageKey: validation.data.storageKey,
          checksum: validation.data.checksum,
          mimeType: validation.data.mimeType,
          sizeBytes: BigInt(validation.data.sizeBytes),
          caption: validation.data.caption ?? null,
          capturedAt: validation.data.capturedAt ? new Date(validation.data.capturedAt) : null,
          uploaderId: authResult.session.user.id,
          visibility: validation.data.visibility,
          consentStatus: "unknown",
        },
      });
      const now = new Date();
      await tx.mediaUploadReservation.updateMany({
        where: {
          treeId: id,
          userId: authResult.session.user.id,
          storageKey: validation.data.storageKey,
          consumedAt: null,
          expiresAt: { gt: now },
        },
        data: { consumedAt: now },
      });
      await tx.treeAuditEvent.create({ data: { treeId: id, actorId: authResult.session.user.id, action: "media.registered", entityType: "media_asset", entityId: created.id, metadata: { mimeType: created.mimeType, sizeBytes: validation.data.sizeBytes } } });
      return created;
    });
    const readUrl = createPresignedGetUrl(config, asset.storageKey);
    return NextResponse.json({ asset: serializeMediaAsset(asset, readUrl) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
