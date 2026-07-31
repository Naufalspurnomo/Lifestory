import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/auth-helpers";
import { prisma } from "../../../../../lib/db";
import { getTreeAccessContext, TreeAccessError } from "../../../../../lib/tree/repository";
import { applyRateLimit, rateLimitConfigs } from "../../../../../lib/rate-limit";

function errorResponse(error: unknown) {
  if (error instanceof TreeAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
  console.error("proposal list error", error);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitError = await applyRateLimit(request, "proposal-list", rateLimitConfigs.api);
  if (rateLimitError) return rateLimitError;

  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const { id } = await params;
  try {
    const access = await getTreeAccessContext(id, authResult.session.user.id);
    if (!access.capabilities.canManageMembers) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    const proposals = await prisma.contributionProposal.findMany({
      where: { treeId: id },
      include: { request: { include: { targetPerson: { select: { id: true, label: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      { proposals },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
