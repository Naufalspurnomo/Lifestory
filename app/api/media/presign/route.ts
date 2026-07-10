import { NextResponse } from "next/server";
import { requireUser } from "../../../../lib/auth-helpers";
import {
  assertTreeWritable,
  getTreeForUser,
  getTreeAccessContext,
  TreeAccessError,
} from "../../../../lib/tree/repository";
import {
  calculateTreeMediaUsage,
  countNodeGalleryItems,
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
    const tree = await getTreeForUser(data.treeId, authResult.session.user.id);
    const access = await getTreeAccessContext(data.treeId, authResult.session.user.id);
    const entitlementQuota = access.entitlement.storageQuotaBytes;
    const effectiveQuota = Math.min(config.treeQuotaBytes, entitlementQuota);
    const usage = calculateTreeMediaUsage(tree.nodes);

    if (usage.objectBytes + data.sizeBytes > effectiveQuota) {
      return NextResponse.json(
        {
          error: `Tree media quota exceeded. Used ${formatBytes(
            usage.objectBytes
          )} of ${formatBytes(effectiveQuota)}.`,
            quotaBytes: effectiveQuota,
          usedBytes: usage.objectBytes,
        },
        { status: 413 }
      );
    }

    if (
      data.purpose === "gallery" &&
      countNodeGalleryItems(tree.nodes, data.nodeId) >= MAX_GALLERY_ITEMS_PER_NODE
    ) {
      return NextResponse.json(
        { error: "Gallery item limit reached for this family member" },
        { status: 409 }
      );
    }

    const storageKey = createMediaStorageKey({
      treeId: data.treeId,
      nodeId: data.nodeId,
      userId: authResult.session.user.id,
      purpose: data.purpose,
      contentType: data.contentType,
    });
    const presigned = createPresignedPutUrl(config, storageKey);
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
        usedBytes: usage.objectBytes,
        quotaBytes: effectiveQuota,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
