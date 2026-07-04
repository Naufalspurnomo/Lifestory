import { NextResponse } from "next/server";
import { requireActiveSubscriber } from "../../../../lib/auth-helpers";
import {
  FamilyIdentityError,
  reviewFamilyAccessRequest,
} from "../../../../lib/family-identity";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";
import { jsonBodyLimits, parseJsonBody } from "../../../../lib/request-body";
import {
  familyAccessRequestReviewSchema,
  formatZodErrors,
  validateBody,
} from "../../../../lib/validations";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const rateLimitError = await applyRateLimit(
    request,
    "family-access-request-review",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireActiveSubscriber();
  if (!authResult.success) return authResult.response;

  const bodyResult = await parseJsonBody(request, jsonBodyLimits.tiny);
  if (!bodyResult.success) return bodyResult.response;

  const validation = validateBody(
    familyAccessRequestReviewSchema,
    bodyResult.body
  );
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodErrors(validation.errors),
      },
      { status: 400 }
    );
  }

  const { id } = await params;
  if (!id || id.length > 128) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  try {
    const result = await reviewFamilyAccessRequest({
      ownerId: authResult.session.user.id,
      requestId: id,
      decision: validation.data.decision,
      role: validation.data.role,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof FamilyIdentityError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("family access request review error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
