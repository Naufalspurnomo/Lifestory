// Tree repository: Prisma-backed operations for tree load/save.
// Keeps the persistence adapter isolated from HTTP/session concerns.

import { prisma } from "../db";
import {
  deserializeRowsToTree,
  serializeTreeToRows,
  type DbEdge,
  type DbNode,
} from "./persistence";
import type { FamilyNode, TreeData } from "../types/tree";

export class TreeAccessError extends Error {
  constructor(
    message: string,
    public readonly status: 403 | 404 = 403
  ) {
    super(message);
    this.name = "TreeAccessError";
  }
}

async function assertMembership(
  treeId: string,
  userId: string,
  writable: boolean
): Promise<void> {
  const tree = await prisma.tree.findUnique({
    where: { id: treeId },
    select: {
      ownerId: true,
      memberships: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!tree) throw new TreeAccessError("Tree not found", 404);

  const isOwner = tree.ownerId === userId;
  const membership = tree.memberships[0];

  if (!isOwner && !membership) {
    throw new TreeAccessError("Not a member of this tree");
  }

  if (writable && !isOwner && membership?.role !== "editor") {
    throw new TreeAccessError("Read-only access");
  }
}

export async function listTreesForUser(userId: string) {
  return prisma.tree.findMany({
    where: {
      OR: [{ ownerId: userId }, { memberships: { some: { userId } } }],
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getTreeForUser(
  treeId: string,
  userId: string
): Promise<TreeData> {
  await assertMembership(treeId, userId, false);

  const [tree, nodes, edges] = await Promise.all([
    prisma.tree.findUnique({ where: { id: treeId } }),
    prisma.node.findMany({ where: { treeId } }),
    prisma.edge.findMany({ where: { treeId } }),
  ]);

  if (!tree) throw new TreeAccessError("Tree not found", 404);

  const dbNodes: DbNode[] = nodes.map((n) => ({
    id: n.id,
    label: n.label,
    sex: n.sex,
    birthYear: n.birthYear,
    deathYear: n.deathYear,
    line: n.line,
    imageUrl: n.imageUrl,
    description: n.description,
    media: n.media,
    works: n.works,
    socialInstagram: n.socialInstagram,
    socialTiktok: n.socialTiktok,
    socialLinkedin: n.socialLinkedin,
    generationCached: n.generationCached,
  }));

  const dbEdges: DbEdge[] = edges.map((e) => ({
    fromId: e.fromId,
    toId: e.toId,
    kind: e.kind as DbEdge["kind"],
    startYear: e.startYear,
    endYear: e.endYear,
  }));

  const familyNodes = deserializeRowsToTree({
    nodes: dbNodes,
    edges: dbEdges,
  });

  return {
    id: tree.id,
    name: tree.name,
    ownerId: tree.ownerId,
    nodes: familyNodes,
    createdAt: tree.createdAt.toISOString(),
    updatedAt: tree.updatedAt.toISOString(),
  };
}

export async function createTreeForUser(
  userId: string,
  name: string
): Promise<TreeData> {
  const tree = await prisma.tree.create({
    data: {
      name,
      ownerId: userId,
    },
  });

  return {
    id: tree.id,
    name: tree.name,
    ownerId: tree.ownerId,
    nodes: [],
    createdAt: tree.createdAt.toISOString(),
    updatedAt: tree.updatedAt.toISOString(),
  };
}

export async function replaceTreeNodes(
  treeId: string,
  userId: string,
  nodes: FamilyNode[]
): Promise<void> {
  await assertMembership(treeId, userId, true);

  const snapshot = serializeTreeToRows(nodes);

  await prisma.$transaction(async (tx) => {
    await tx.edge.deleteMany({ where: { treeId } });
    await tx.node.deleteMany({ where: { treeId } });

    if (snapshot.nodes.length > 0) {
      await tx.node.createMany({
        data: snapshot.nodes.map((n) => ({
          id: n.id,
          treeId,
          label: n.label,
          sex: n.sex,
          birthYear: n.birthYear,
          deathYear: n.deathYear,
          line: n.line,
          imageUrl: n.imageUrl,
          description: n.description,
          media: n.media as any,
          works: n.works as any,
          socialInstagram: n.socialInstagram,
          socialTiktok: n.socialTiktok,
          socialLinkedin: n.socialLinkedin,
          generationCached: n.generationCached,
        })),
      });
    }

    if (snapshot.edges.length > 0) {
      await tx.edge.createMany({
        data: snapshot.edges.map((e) => ({
          treeId,
          fromId: e.fromId,
          toId: e.toId,
          kind: e.kind,
          startYear: e.startYear ?? null,
          endYear: e.endYear ?? null,
        })),
        skipDuplicates: true,
      });
    }

    await tx.tree.update({
      where: { id: treeId },
      data: { updatedAt: new Date() },
    });
  });
}

export async function deleteTree(treeId: string, userId: string) {
  const tree = await prisma.tree.findUnique({
    where: { id: treeId },
    select: { ownerId: true },
  });
  if (!tree) throw new TreeAccessError("Tree not found", 404);
  if (tree.ownerId !== userId)
    throw new TreeAccessError("Only the owner can delete");

  await prisma.tree.delete({ where: { id: treeId } });
}
