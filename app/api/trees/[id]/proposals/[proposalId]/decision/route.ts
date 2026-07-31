import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "../../../../../../../lib/auth-helpers";
import { prisma } from "../../../../../../../lib/db";
import { jsonBodyLimits, parseJsonBody } from "../../../../../../../lib/request-body";
import { proposalDecisionSchema, formatZodErrors, validateBody } from "../../../../../../../lib/validations";
import { getTreeAccessContext, TreeAccessError } from "../../../../../../../lib/tree/repository";
import { applyRateLimit, rateLimitConfigs } from "../../../../../../../lib/rate-limit";

class ProposalStateError extends Error {
  constructor() {
    super("PROPOSAL_NOT_PENDING");
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; proposalId: string }> }) {
  const rateLimitError = await applyRateLimit(request, "proposal-decision", rateLimitConfigs.sensitive);
  if (rateLimitError) return rateLimitError;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const { id, proposalId } = await params;
  const bodyResult = await parseJsonBody(request, jsonBodyLimits.auth);
  if (!bodyResult.success) return bodyResult.response;
  const validation = validateBody(proposalDecisionSchema, bodyResult.body);
  if (!validation.success) return NextResponse.json({ error: "Validation failed", details: formatZodErrors(validation.errors) }, { status: 400 });
  try {
    const access = await getTreeAccessContext(id, authResult.session.user.id);
    if (!access.capabilities.canManageMembers) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    const proposal = await prisma.contributionProposal.findFirst({ where: { id: proposalId, treeId: id }, select: { id: true, status: true } });
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    if (proposal.status !== "pending") return NextResponse.json({ error: "Proposal already reviewed" }, { status: 409 });
    const nextStatus = validation.data.decision === "approved" ? "approved" : "rejected";
    const updated = await prisma.$transaction(async (tx) => {
      const claimed = await tx.contributionProposal.updateMany({ where: { id: proposalId, treeId: id, status: "pending" }, data: { status: nextStatus, reviewedById: authResult.session.user.id, reviewedAt: new Date() } });
      if (claimed.count !== 1) throw new ProposalStateError();
      const result = await tx.contributionProposal.findUniqueOrThrow({ where: { id: proposalId } });
      await tx.treeAuditEvent.create({ data: { treeId: id, actorId: authResult.session.user.id, action: `contribution.${nextStatus}`, entityType: "contribution_proposal", entityId: proposalId, metadata: { previousStatus: proposal.status } } });
      return result;
    });
    return NextResponse.json({ proposal: updated });
  } catch (error) {
    if (error instanceof TreeAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ProposalStateError) return NextResponse.json({ error: "Proposal already reviewed" }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
    console.error("proposal decision error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
