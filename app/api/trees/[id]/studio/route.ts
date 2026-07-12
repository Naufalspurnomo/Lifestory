import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/auth-helpers";
import { prisma } from "../../../../../lib/db";
import { getTreeAccessContext, TreeAccessError } from "../../../../../lib/tree/repository";
import {
  createPresignedGetUrl,
  MediaStorageConfigurationError,
  requireMediaStorageConfig,
  storageKeyBelongsToTree,
} from "../../../../../lib/media/storage";

function errorResponse(error: unknown) {
  if (error instanceof TreeAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
    return NextResponse.json({ error: "archive-tables-not-migrated" }, { status: 503 });
  }
  if (error instanceof MediaStorageConfigurationError) {
    return NextResponse.json({ error: "Media storage is not configured" }, { status: 503 });
  }
  console.error("studio journey route error", error);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.success) return auth.response;
  const { id } = await params;

  try {
    const access = await getTreeAccessContext(id, auth.session.user.id);
    const [lead, deliverables, storyCount, mediaCount] = await Promise.all([
      prisma.studioLead.findFirst({
        where: { treeId: id },
        orderBy: { createdAt: "desc" },
        select: { id: true, packageInterest: true, milestone: true, status: true, createdAt: true, updatedAt: true },
      }),
      prisma.studioDeliverable.findMany({
        where: { treeId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          kind: true,
          title: true,
          storageKey: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
      }),
      prisma.story.count({ where: { treeId: id, status: "published" } }),
      prisma.mediaAsset.count({ where: { treeId: id } }),
    ]);

    const storage = deliverables.length > 0 ? requireMediaStorageConfig() : null;
    const stageIndex = deliverables.length > 0
      ? 4
      : lead?.status === "won"
        ? 2
        : lead?.status === "qualified"
          ? 1
          : 0;

    return NextResponse.json({
      lead: lead
        ? { ...lead, createdAt: lead.createdAt.toISOString(), updatedAt: lead.updatedAt.toISOString() }
        : null,
      myRole: access.myRole,
      stageIndex,
      progress: { publishedStories: storyCount, archivedMedia: mediaCount },
      deliverables: deliverables.map(({ storageKey, ...item }) => {
        if (!storage || !storageKeyBelongsToTree(storageKey, id)) {
          throw new Error("Studio deliverable storage key is outside the tree namespace");
        }
        const read = createPresignedGetUrl(storage, storageKey);
        return {
          ...item,
          sizeBytes: Number(item.sizeBytes),
          createdAt: item.createdAt.toISOString(),
          readUrl: read.readUrl,
          readUrlExpiresAt: read.expiresAt,
        };
      }),
    }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
