import { NextResponse } from "next/server";
import { requireActiveSubscriber } from "../../../lib/auth-helpers";
import {
  FamilyIdentityError,
  listFamilyAccessRequests,
  requestFamilyAccess,
} from "../../../lib/family-identity";
import { sendFamilyAccessRequestEmail } from "../../../lib/email";
import { applyRateLimit, rateLimitConfigs } from "../../../lib/rate-limit";
import { jsonBodyLimits, parseJsonBody } from "../../../lib/request-body";
import {
  familyAccessRequestCreateSchema,
  formatZodErrors,
  validateBody,
} from "../../../lib/validations";

export async function GET(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "family-access-requests-list",
    rateLimitConfigs.api
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireActiveSubscriber();
  if (!authResult.success) return authResult.response;

  try {
    const requests = await listFamilyAccessRequests(authResult.session.user.id);
    return NextResponse.json(requests);
  } catch (error) {
    console.error("family access request list error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "family-access-request-create",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireActiveSubscriber();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  const bodyResult = await parseJsonBody(request, jsonBodyLimits.tiny);
  if (!bodyResult.success) return bodyResult.response;

  const validation = validateBody(
    familyAccessRequestCreateSchema,
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

  try {
    const result = await requestFamilyAccess({
      userId,
      familyIdentityId: validation.data.familyIdentityId,
      treeId: validation.data.treeId,
      requestedRole: validation.data.requestedRole,
    });
    if (result.notification) {
      const emailResult = await sendFamilyAccessRequestEmail({
        to: result.notification.ownerEmail,
        ownerName: result.notification.ownerName,
        requesterName: result.notification.requesterName,
        requesterEmail: result.notification.requesterEmail,
        treeName: result.notification.treeName,
        appUrl: new URL(request.url).origin,
      });

      if (!emailResult.ok) {
        console.warn(
          "[family-access] Request notification email was not sent",
          {
            reason: emailResult.skipped
              ? emailResult.reason
              : emailResult.error,
          }
        );
      }
    }

    const { notification, ...response } = result;
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof FamilyIdentityError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("family access request create error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
