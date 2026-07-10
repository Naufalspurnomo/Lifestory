import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin, requireUser } from "../../../../../lib/auth-helpers";
import { prisma } from "../../../../../lib/db";
import { jsonBodyLimits, parseJsonBody } from "../../../../../lib/request-body";
import { getTreeAccessContext, TreeAccessError } from "../../../../../lib/tree/repository";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const { id } = await params;
  try {
    const access = await getTreeAccessContext(id, authResult.session.user.id);
    return NextResponse.json({ entitlement: access.entitlement, myRole: access.myRole, capabilities: access.capabilities });
  } catch (error) {
    if (error instanceof TreeAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.response;
  const { id } = await params;
  const bodyResult = await parseJsonBody(request, jsonBodyLimits.tiny);
  if (!bodyResult.success) return bodyResult.response;
  if (!bodyResult.body || typeof bodyResult.body !== "object" || Array.isArray(bodyResult.body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const body = bodyResult.body as Record<string, unknown>;
  const allowedTier = new Set(["FREE", "LEGACY_UNLIMITED", "STUDIO"]);
  const tier = typeof body.tier === "string" && allowedTier.has(body.tier) ? body.tier : undefined;
  const studioVideoAllowed = typeof body.studioVideoAllowed === "boolean" ? body.studioVideoAllowed : undefined;
  if (!tier && studioVideoAllowed === undefined) return NextResponse.json({ error: "No entitlement change supplied" }, { status: 400 });
  try {
    const entitlement = await prisma.treeEntitlement.update({ where: { treeId: id }, data: { ...(tier ? { tier } : {}), ...(studioVideoAllowed === undefined ? {} : { studioVideoAllowed }) } });
    await prisma.treeAuditEvent.create({
      data: {
        treeId: id,
        actorId: authResult.session.user.id,
        action: "entitlement.updated",
        entityType: "tree_entitlement",
        entityId: entitlement.id,
        metadata: { tier: entitlement.tier, studioVideoAllowed: entitlement.studioVideoAllowed },
      },
    });
    return NextResponse.json({ entitlement: { ...entitlement, storageQuotaBytes: Number(entitlement.storageQuotaBytes) } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
    console.error("entitlement update error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
