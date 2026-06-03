import { NextResponse } from "next/server";
import { requireUser } from "../../../../lib/auth-helpers";
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
import {
  formatZodErrors,
  mediaDeleteSchema,
  validateBody,
} from "../../../../lib/validations";
import { jsonBodyLimits, parseJsonBody } from "../../../../lib/request-body";

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
  console.error("media delete error", error);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export async function POST(request: Request) {
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
    await deleteMediaObject(requireMediaStorageConfig(), data.storageKey);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
