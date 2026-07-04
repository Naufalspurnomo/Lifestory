import { NextResponse } from "next/server";
import { requireActiveSubscriber } from "../../../lib/auth-helpers";
import {
  createFamilyEvidence,
  FamilyIdentityError,
} from "../../../lib/family-identity";
import { applyRateLimit, rateLimitConfigs } from "../../../lib/rate-limit";
import { jsonBodyLimits, parseJsonBody } from "../../../lib/request-body";
import {
  familyEvidenceCreateSchema,
  formatZodErrors,
  validateBody,
} from "../../../lib/validations";

export async function POST(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "family-evidence-create",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireActiveSubscriber();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  const bodyResult = await parseJsonBody(request, jsonBodyLimits.auth);
  if (!bodyResult.success) return bodyResult.response;

  const validation = validateBody(familyEvidenceCreateSchema, bodyResult.body);
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
    const evidence = await createFamilyEvidence({
      userId,
      kind: validation.data.kind,
      familyIdentityId: validation.data.familyIdentityId,
      accessRequestId: validation.data.accessRequestId,
      documentValue: validation.data.documentValue,
      documentHash: validation.data.documentHash,
      storageBucket: validation.data.storageBucket,
      storageKey: validation.data.storageKey,
      retentionUntil: validation.data.retentionUntil
        ? new Date(validation.data.retentionUntil)
        : null,
      metadata: validation.data.metadata,
    });
    return NextResponse.json(evidence, { status: 201 });
  } catch (error) {
    if (error instanceof FamilyIdentityError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("family evidence create error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
