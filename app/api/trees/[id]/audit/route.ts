import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/auth-helpers";
import { prisma } from "../../../../../lib/db";
import { getTreeAccessContext, TreeAccessError } from "../../../../../lib/tree/repository";
import { applyRateLimit, rateLimitConfigs } from "../../../../../lib/rate-limit";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitError = await applyRateLimit(request, "tree-audit-list", rateLimitConfigs.api);
  if (rateLimitError) return rateLimitError;

  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const { id } = await params;
  try {
    const access = await getTreeAccessContext(id, authResult.session.user.id);
    if (!access.capabilities.canManageMembers) return NextResponse.json({ error: "Owner access required" }, { status: 403 });
    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
    const events = await prisma.treeAuditEvent.findMany({ where: { treeId: id }, orderBy: { createdAt: "desc" }, take: limit });
    return NextResponse.json(
      { events },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    if (error instanceof TreeAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
    console.error("tree audit error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
