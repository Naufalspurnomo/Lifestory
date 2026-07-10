import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth-helpers";
import { prisma } from "../../../lib/db";
import { jsonBodyLimits, parseJsonBody } from "../../../lib/request-body";
import { applyRateLimit, rateLimitConfigs } from "../../../lib/rate-limit";
import { formatZodErrors, studioLeadSchema, validateBody } from "../../../lib/validations";
import { getTreeAccessContext, TreeAccessError } from "../../../lib/tree/repository";

export async function POST(request: Request) {
  const rateLimitError = await applyRateLimit(request, "studio-consultation", rateLimitConfigs.consultation);
  if (rateLimitError) return rateLimitError;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const bodyResult = await parseJsonBody(request, jsonBodyLimits.auth);
  if (!bodyResult.success) return bodyResult.response;
  const validation = validateBody(studioLeadSchema, bodyResult.body);
  if (!validation.success) return NextResponse.json({ error: "Validation failed", details: formatZodErrors(validation.errors) }, { status: 400 });
  try {
    if (validation.data.treeId) await getTreeAccessContext(validation.data.treeId, authResult.session.user.id);
    const lead = await prisma.studioLead.create({
      data: {
        userId: authResult.session.user.id,
        treeId: validation.data.treeId ?? null,
        packageInterest: validation.data.packageInterest,
        milestone: validation.data.milestone ?? null,
        consentAt: new Date(),
      },
    });
    if (lead.treeId) await prisma.treeAuditEvent.create({ data: { treeId: lead.treeId, actorId: lead.userId, action: "studio.consultation_requested", entityType: "studio_lead", entityId: lead.id, metadata: { packageInterest: lead.packageInterest } } });
    return NextResponse.json({ lead: { id: lead.id, status: lead.status } }, { status: 201 });
  } catch (error) {
    if (error instanceof TreeAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
    console.error("studio lead error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
