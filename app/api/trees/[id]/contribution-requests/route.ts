import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/auth-helpers";
import { prisma } from "../../../../../lib/db";
import { jsonBodyLimits, parseJsonBody } from "../../../../../lib/request-body";
import { applyRateLimit, rateLimitConfigs } from "../../../../../lib/rate-limit";
import { contributionRequestSchema, formatZodErrors, validateBody } from "../../../../../lib/validations";
import { generateContributionToken, getContributionExpiry, getContributionUrl, hashContributionToken } from "../../../../../lib/contributions";
import { getTreeAccessContext, TreeAccessError } from "../../../../../lib/tree/repository";

function handleError(error: unknown) {
  if (error instanceof TreeAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
  console.error("contribution request error", error);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitError = await applyRateLimit(request, "contribution-request-list", rateLimitConfigs.api);
  if (rateLimitError) return rateLimitError;

  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const { id } = await params;
  try {
    const access = await getTreeAccessContext(id, authResult.session.user.id);
    if (!access.capabilities.canManageMembers) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    const requests = await prisma.contributionRequest.findMany({
      where: { treeId: id, createdById: authResult.session.user.id },
      include: { targetPerson: { select: { id: true, label: true } }, proposal: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      { requests, canCreate: true },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitError = await applyRateLimit(request, "contribution-request", rateLimitConfigs.api);
  if (rateLimitError) return rateLimitError;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const { id } = await params;
  const bodyResult = await parseJsonBody(request, jsonBodyLimits.auth);
  if (!bodyResult.success) return bodyResult.response;
  const validation = validateBody(contributionRequestSchema, bodyResult.body);
  if (!validation.success) return NextResponse.json({ error: "Validation failed", details: formatZodErrors(validation.errors) }, { status: 400 });
  try {
    const access = await getTreeAccessContext(id, authResult.session.user.id);
    if (!access.capabilities.canManageMembers) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthCount = await prisma.contributionRequest.count({ where: { treeId: id, createdById: authResult.session.user.id, createdAt: { gte: monthStart } } });
    if (monthCount >= access.entitlement.contributionLinksPerMonth) return NextResponse.json({ error: "Batas contribution link bulan ini tercapai" }, { status: 429 });
    if (validation.data.targetPersonId) {
      const person = await prisma.node.findFirst({ where: { id: validation.data.targetPersonId, treeId: id }, select: { id: true } });
      if (!person) return NextResponse.json({ error: "Target person is not in this tree" }, { status: 400 });
    }
    const rawToken = generateContributionToken();
    const origin = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    const contributionUrl = getContributionUrl(origin, rawToken);
    const contribution = await prisma.$transaction(async (tx) => {
      const created = await tx.contributionRequest.create({
        data: {
          treeId: id,
          targetPersonId: validation.data.targetPersonId ?? null,
          createdById: authResult.session.user.id,
          prompt: validation.data.prompt,
          tokenHash: hashContributionToken(rawToken),
          expiresAt: getContributionExpiry(),
        },
        include: { targetPerson: { select: { id: true, label: true } } },
      });
      await tx.treeAuditEvent.create({
        data: { treeId: id, actorId: authResult.session.user.id, action: "contribution.requested", entityType: "contribution_request", entityId: created.id, metadata: { targetPersonId: created.targetPersonId } },
      });
      return created;
    });
    return NextResponse.json({ request: contribution, contributionUrl, whatsappText: `Halo, boleh bantu mengisi arsip keluarga? ${contributionUrl}` }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
