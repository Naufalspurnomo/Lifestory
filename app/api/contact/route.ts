import { NextResponse } from "next/server";
import { sendContactInquiryEmail } from "../../../lib/email";
import { jsonBodyLimits, parseJsonBody } from "../../../lib/request-body";
import { applyRateLimit, rateLimitConfigs } from "../../../lib/rate-limit";
import {
  contactInquirySchema,
  formatZodErrors,
  validateBody,
} from "../../../lib/validations";

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

  const result = await sendContactInquiryEmail(validation.data);
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
