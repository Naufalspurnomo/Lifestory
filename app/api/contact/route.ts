import { NextResponse } from "next/server";
import { sendContactInquiryEmail } from "../../../lib/email";
import { jsonBodyLimits, parseJsonBody } from "../../../lib/request-body";
import {
  applyRateLimit,
  getClientIdentifier,
  rateLimitConfigs,
} from "../../../lib/rate-limit";
import {
  contactInquirySchema,
  formatZodErrors,
  validateBody,
} from "../../../lib/validations";
import { prisma } from "../../../lib/db";
import { CONSENT_POLICY_VERSION } from "../../../lib/legal/consent";

function readUserAgent(request: Request): string | null {
  const value = request.headers.get("user-agent");
  if (!value) return null;
  return value.slice(0, 512);
}

export async function POST(request: Request) {
  const rateLimitError = await applyRateLimit(
    request,
    "contact-inquiry",
    rateLimitConfigs.contact
  );
  if (rateLimitError) return rateLimitError;

  const bodyResult = await parseJsonBody(request, jsonBodyLimits.contact);
  if (!bodyResult.success) return bodyResult.response;

  const validation = validateBody(contactInquirySchema, bodyResult.body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatZodErrors(validation.errors),
      },
      { status: 400 }
    );
  }

  const consentAcceptedAt = new Date();
  const consentIp = getClientIdentifier(request);
  const consentUserAgent = readUserAgent(request);
  const consentPolicyVersion = CONSENT_POLICY_VERSION;

  // Persist consent proof before sending the inquiry. If this fails, do not
  // process the submitted contact details further without an audit record.
  try {
    await prisma.$executeRaw`
      INSERT INTO "ContactConsentLog" (
        "email",
        "name",
        "consentAcceptedAt",
        "consentIp",
        "consentUserAgent",
        "consentPolicyVersion"
      ) VALUES (
        ${validation.data.email.toLowerCase().trim()},
        ${validation.data.name.trim()},
        ${consentAcceptedAt},
        ${consentIp},
        ${consentUserAgent},
        ${consentPolicyVersion}
      )
    `;
  } catch (error) {
    console.error("[contact] Failed to persist consent log", error);
    return NextResponse.json(
      { error: "Contact consent could not be recorded" },
      { status: 503 }
    );
  }

  const result = await sendContactInquiryEmail({
    name: validation.data.name,
    email: validation.data.email,
    message: validation.data.message,
    consentAcceptedAt,
    consentIp,
    consentPolicyVersion,
  });
  if (!result.ok) {
    console.warn("[contact] Contact inquiry email was not sent", {
      reason: result.skipped ? result.reason : result.error,
    });

    return NextResponse.json(
      {
        error: "Contact email could not be sent",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({ message: "Contact inquiry sent" });
}
