import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/auth-helpers";
import { prisma } from "../../../../../lib/db";
import { jsonBodyLimits, parseJsonBody } from "../../../../../lib/request-body";
import { applyRateLimit, rateLimitConfigs } from "../../../../../lib/rate-limit";
import { formatZodErrors, mediaAssetCreateSchema, validateBody } from "../../../../../lib/validations";
import { getTreeAccessContext, TreeAccessError } from "../../../../../lib/tree/repository";
import {
  createPresignedGetUrl,
  MediaStorageConfigurationError,
  requireMediaStorageConfig,
  storageKeyBelongsToTree,
} from "../../../../../lib/media/storage";

function errorResponse(error: unknown) {
  if (error instanceof TreeAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof MediaStorageConfigurationError) return NextResponse.json({ error: "Media storage is not configured" }, { status: 503 });
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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const { id } = await params;
  try {
    await getTreeAccessContext(id, authResult.session.user.id);
    const config = requireMediaStorageConfig();
    const assets = await prisma.mediaAsset.findMany({ where: { treeId: id }, orderBy: { createdAt: "desc" }, take: 500 });
    return NextResponse.json({
      assets: assets.map((asset) =>
        serializeMediaAsset(asset, createPresignedGetUrl(config, asset.storageKey))
      ),
    });
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
    if (validation.data.personId) {
      const person = await prisma.node.findFirst({ where: { id: validation.data.personId, treeId: id }, select: { id: true } });
      if (!person) return NextResponse.json({ error: "Person is not in this tree" }, { status: 400 });
    }
    const used = await prisma.mediaAsset.aggregate({ where: { treeId: id }, _sum: { sizeBytes: true } });
    const usedBytes = Number(used._sum.sizeBytes ?? 0n);
    if (usedBytes + validation.data.sizeBytes > access.entitlement.storageQuotaBytes) return NextResponse.json({ error: "Media quota exceeded", quotaBytes: access.entitlement.storageQuotaBytes, usedBytes }, { status: 413 });
    const asset = await prisma.mediaAsset.create({
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
    await prisma.treeAuditEvent.create({ data: { treeId: id, actorId: authResult.session.user.id, action: "media.registered", entityType: "media_asset", entityId: asset.id, metadata: { mimeType: asset.mimeType, sizeBytes: validation.data.sizeBytes } } });
    const readUrl = createPresignedGetUrl(config, asset.storageKey);
    return NextResponse.json({ asset: serializeMediaAsset(asset, readUrl) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
