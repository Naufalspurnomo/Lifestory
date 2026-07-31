import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { jsonBodyLimits, parseJsonBody } from "../../../../lib/request-body";
import { applyRateLimit, checkRateLimit, getClientIdentifier, rateLimitConfigs } from "../../../../lib/rate-limit";
import { contributionSubmissionSchema, formatZodErrors, validateBody } from "../../../../lib/validations";
import { hashContributionToken } from "../../../../lib/contributions";
import { verifyTurnstileToken } from "../../../../lib/turnstile";

function invalid() {
  return NextResponse.json({ error: "Tautan kontribusi tidak berlaku atau sudah kedaluwarsa." }, { status: 404 });
}

async function findOpenRequest(token: string) {
  const request = await prisma.contributionRequest.findUnique({
    where: { tokenHash: hashContributionToken(token) },
    include: { targetPerson: { select: { id: true, label: true } }, tree: { select: { name: true } } },
  });
  if (!request || request.status !== "open" || request.usedAt || request.expiresAt <= new Date()) return null;
  return request;
}

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const rateLimitError = await applyRateLimit(request, "guest-contribution-read", rateLimitConfigs.api);
  if (rateLimitError) return rateLimitError;

  const { token } = await params;
  try {
    const request = await findOpenRequest(token);
    if (!request) return invalid();
    return NextResponse.json(
      { request: { prompt: request.prompt, treeName: request.tree.name, targetPerson: request.targetPerson } },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
    console.error("contribution public get error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ip = getClientIdentifier(request);
  const tokenRateLimitError = await checkRateLimit(
    hashContributionToken(token),
    "guest-contribution-token",
    { windowMs: 60 * 60 * 1000, maxRequests: 5 }
  );
  if (tokenRateLimitError) return tokenRateLimitError;
  const ipRateLimitError = await checkRateLimit(
    ip,
    "guest-contribution-ip",
    { windowMs: 24 * 60 * 60 * 1000, maxRequests: 30 }
  );
  if (ipRateLimitError) return ipRateLimitError;
  const bodyResult = await parseJsonBody(request, jsonBodyLimits.auth);
  if (!bodyResult.success) return bodyResult.response;
  const validation = validateBody(contributionSubmissionSchema, bodyResult.body);
  if (!validation.success) return NextResponse.json({ error: "Validation failed", details: formatZodErrors(validation.errors) }, { status: 400 });
  const turnstile = await verifyTurnstileToken((bodyResult.body as { turnstileToken?: string }).turnstileToken, ip);
  if (!turnstile.ok) return NextResponse.json({ error: "Bot verification failed" }, { status: 400 });
  try {
    const contribution = await findOpenRequest(token);
    if (!contribution) return invalid();
    const proposal = await prisma.$transaction(async (tx) => {
      const created = await tx.contributionProposal.create({
        data: {
          treeId: contribution.treeId,
          requestId: contribution.id,
          kind: validation.data.kind,
          payload: validation.data.payload as Prisma.InputJsonValue,
        },
      });
      await tx.contributionRequest.update({ where: { id: contribution.id }, data: { usedAt: new Date(), status: "submitted" } });
      await tx.treeAuditEvent.create({ data: { treeId: contribution.treeId, action: "contribution.submitted", entityType: "contribution_proposal", entityId: created.id, metadata: { kind: created.kind } } });
      return created;
    });
    return NextResponse.json({ message: "Terima kasih. Kontribusi Anda menunggu persetujuan keluarga.", proposalId: proposal.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "Tautan kontribusi sudah digunakan." }, { status: 409 });
    console.error("contribution public submit error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
