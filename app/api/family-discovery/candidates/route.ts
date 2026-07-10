import { NextResponse } from "next/server";
import { requireUser } from "../../../../lib/auth-helpers";
import {
  FamilyIdentityError,
  getFamilyCandidatesForUser,
} from "../../../../lib/family-identity";
import { applyRateLimit, rateLimitConfigs } from "../../../../lib/rate-limit";

export async function GET(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "family-discovery-candidates",
    rateLimitConfigs.api
  );
  if (rateLimitError) return rateLimitError;

  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;

  try {
    const candidates = await getFamilyCandidatesForUser(
      authResult.session.user.id
    );
    return NextResponse.json({ candidates });
  } catch (error) {
    if (error instanceof FamilyIdentityError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("family discovery candidates error", error);
    return NextResponse.json(
      { error: "Family discovery is temporarily unavailable" },
      { status: 500 }
    );
  }
}
