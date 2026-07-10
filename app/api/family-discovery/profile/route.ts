import { NextResponse } from "next/server";
import { requireUser } from "../../../../lib/auth-helpers";
import {
  FamilyIdentityError,
  findFamilyCandidatesForProfile,
  saveFamilyDiscoveryProfile,
} from "../../../../lib/family-identity";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";
import { jsonBodyLimits, parseJsonBody } from "../../../../lib/request-body";
import {
  familyDiscoveryProfileSchema,
  formatZodErrors,
  validateBody,
} from "../../../../lib/validations";

export async function POST(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "family-discovery-profile",
    rateLimitConfigs.sensitive
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const userId = authResult.session.user.id;

  const bodyResult = await parseJsonBody(request, jsonBodyLimits.auth);
  if (!bodyResult.success) return bodyResult.response;

  const validation = validateBody(familyDiscoveryProfileSchema, bodyResult.body);
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
    await saveFamilyDiscoveryProfile(userId, validation.data);
    const candidates = await findFamilyCandidatesForProfile(
      userId,
      validation.data
    );
    return NextResponse.json({ candidates });
  } catch (error) {
    if (error instanceof FamilyIdentityError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("family discovery profile error", error);
    return NextResponse.json(
      { error: "Family discovery is temporarily unavailable" },
      { status: 500 }
    );
  }
}
