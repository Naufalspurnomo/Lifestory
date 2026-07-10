import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/auth-helpers";
import { jsonBodyLimits, parseJsonBody } from "../../../../../lib/request-body";
import { applyRateLimit, rateLimitConfigs } from "../../../../../lib/rate-limit";
import {
  formatZodErrors,
  storyCreateSchema,
  validateBody,
} from "../../../../../lib/validations";
import {
  getTreeAccessContext,
  TreeAccessError,
} from "../../../../../lib/tree/repository";
import { prisma } from "../../../../../lib/db";

function errorResponse(error: unknown) {
  if (error instanceof TreeAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
  }
  console.error("stories route error", error);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

function serializeStory(story: Record<string, any>) {
  return {
    ...story,
    assets: Array.isArray(story.assets)
      ? story.assets.map((asset: Record<string, any>) => ({
          ...asset,
          mediaAsset: asset.mediaAsset
            ? {
                ...asset.mediaAsset,
                sizeBytes: Number(asset.mediaAsset.sizeBytes),
              }
            : null,
        }))
      : [],
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const { id } = await params;
  try {
    await getTreeAccessContext(id, authResult.session.user.id);
    const stories = await prisma.story.findMany({
      where: {
        treeId: id,
        OR: [{ visibility: { not: "private" } }, { authorId: authResult.session.user.id }],
      },
      include: {
        people: { include: { person: { select: { id: true, label: true, birthYear: true, deathYear: true } } } },
        assets: { include: { mediaAsset: true } },
      },
      orderBy: [{ approximateYear: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ stories: stories.map(serializeStory) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitError = await applyRateLimit(request, "story-create", rateLimitConfigs.api);
  if (rateLimitError) return rateLimitError;
  const authResult = await requireUser();
  if (!authResult.success) return authResult.response;
  const { id } = await params;
  const bodyResult = await parseJsonBody(request, jsonBodyLimits.treeMutation);
  if (!bodyResult.success) return bodyResult.response;
  const validation = validateBody(storyCreateSchema, bodyResult.body);
  if (!validation.success) {
    return NextResponse.json({ error: "Validation failed", details: formatZodErrors(validation.errors) }, { status: 400 });
  }
  try {
    const access = await getTreeAccessContext(id, authResult.session.user.id);
    if (!access.capabilities.canEdit) return NextResponse.json({ error: "Read-only access" }, { status: 403 });
    const personIds = validation.data.personIds ?? [];
    if (personIds.length > 0) {
      const peopleCount = await prisma.node.count({ where: { treeId: id, id: { in: personIds } } });
      if (peopleCount !== new Set(personIds).size) {
        return NextResponse.json({ error: "Story contains a person from another tree" }, { status: 400 });
      }
    }
    const story = await prisma.$transaction(async (tx) => {
      const created = await tx.story.create({
        data: {
          treeId: id,
          title: validation.data.title,
          body: validation.data.body,
          approximateYear: validation.data.approximateYear ?? null,
          location: validation.data.location ?? null,
          status: validation.data.status,
          visibility: validation.data.visibility,
          authorId: authResult.session.user.id,
          people: personIds.length
            ? { create: personIds.map((personId) => ({ personId, role: "subject" })) }
            : undefined,
        },
        include: { people: true },
      });
      await tx.treeAuditEvent.create({
        data: {
          treeId: id,
          actorId: authResult.session.user.id,
          action: "story.created",
          entityType: "story",
          entityId: created.id,
          metadata: { status: created.status, personCount: personIds.length },
        },
      });
      return created;
    });
    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
