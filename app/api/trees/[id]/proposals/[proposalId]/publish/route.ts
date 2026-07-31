import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "../../../../../../../lib/auth-helpers";
import { prisma } from "../../../../../../../lib/db";
import { jsonBodyLimits, parseJsonBody } from "../../../../../../../lib/request-body";
import { formatZodErrors, proposalPublishSchema, validateBody } from "../../../../../../../lib/validations";
import { getTreeAccessContext, TreeAccessError } from "../../../../../../../lib/tree/repository";
import { applyRateLimit, rateLimitConfigs } from "../../../../../../../lib/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; proposalId: string }> }) {
  const rateLimitError = await applyRateLimit(request, "proposal-publish", rateLimitConfigs.sensitive);
  if (rateLimitError) return rateLimitError;
  const auth = await requireUser();
  if (!auth.success) return auth.response;
  const { id, proposalId } = await params;
  const body = await parseJsonBody(request, jsonBodyLimits.treeMutation);
  if (!body.success) return body.response;
  const validation = validateBody(proposalPublishSchema, body.body);
  if (!validation.success) return NextResponse.json({ error: "Validation failed", details: formatZodErrors(validation.errors) }, { status: 400 });
  try {
    const access = await getTreeAccessContext(id, auth.session.user.id);
    if (!access.capabilities.canManageMembers) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    const personIds = validation.data.personIds ?? [];
    if (personIds.length && await prisma.node.count({ where: { treeId: id, id: { in: personIds } } }) !== new Set(personIds).size) {
      return NextResponse.json({ error: "Story contains a person from another tree" }, { status: 400 });
    }
    const result = await prisma.$transaction(async (tx) => {
      const proposal = await tx.contributionProposal.findFirst({ where: { id: proposalId, treeId: id, status: "pending" } });
      if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");
      const story = await tx.story.create({ data: {
        treeId: id, title: validation.data.title, body: validation.data.body,
        approximateYear: validation.data.approximateYear ?? null, location: validation.data.location ?? null,
        visibility: validation.data.visibility, status: "published", authorId: auth.session.user.id,
        people: personIds.length ? { create: personIds.map((personId) => ({ personId, role: "subject" })) } : undefined,
      } });
      const claimed = await tx.contributionProposal.updateMany({ where: { id: proposalId, treeId: id, status: "pending" }, data: { status: "approved", reviewedById: auth.session.user.id, reviewedAt: new Date() } });
      if (claimed.count !== 1) throw new Error("PROPOSAL_NOT_FOUND");
      await tx.treeAuditEvent.create({ data: { treeId: id, actorId: auth.session.user.id, action: "contribution.published", entityType: "story", entityId: story.id, metadata: { proposalId, personCount: personIds.length } } });
      return story;
    });
    return NextResponse.json({ story: result }, { status: 201 });
  } catch (error) {
    if (error instanceof TreeAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.message === "PROPOSAL_NOT_FOUND") return NextResponse.json({ error: "Proposal not found or already reviewed" }, { status: 404 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
    console.error("proposal publish error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
