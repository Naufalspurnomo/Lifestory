// Tree repository: Prisma-backed operations for tree load/save.
// Keeps the persistence adapter isolated from HTTP/session concerns.

import { Prisma } from "@prisma/client";
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

export async function assertTreeWritable(
  treeId: string,
  userId: string
): Promise<void> {
  await assertMembership(treeId, userId, true);
}

async function writeGraph(
  tx: Prisma.TransactionClient,
  treeId: string,
  nodes: FamilyNode[]
) {
  const snapshot = serializeTreeToRows(nodes);

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

  return snapshot;
}

async function createSnapshot(
  tx: Prisma.TransactionClient,
  treeId: string,
  version: number,
  data: ReturnType<typeof serializeTreeToRows>
) {
  await tx.treeSnapshot.create({
    data: {
      treeId,
      version,
      nodeCount: data.nodes.length,
      data: data as any,
    },
  });
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
      version: true,
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
    version: tree.version,
    nodes: familyNodes,
    createdAt: tree.createdAt.toISOString(),
    updatedAt: tree.updatedAt.toISOString(),
  };
}

export async function createTreeForUser(
  userId: string,
  name: string,
  nodes: FamilyNode[] = [],
  requestedId?: string
): Promise<TreeData> {
  if (requestedId) {
    const existing = await prisma.tree.findUnique({
      where: { id: requestedId },
      select: { ownerId: true },
    });
    if (existing) {
      if (existing.ownerId !== userId) {
        throw new TreeAccessError("Tree ID is already in use");
      }
      return getTreeForUser(requestedId, userId);
    }
  }

  let tree;
  try {
    tree = await prisma.$transaction(async (tx) => {
      const created = await tx.tree.create({
        data: {
          ...(requestedId ? { id: requestedId } : {}),
          name,
          ownerId: userId,
        },
      });
      const snapshot = await writeGraph(tx, created.id, nodes);
      await createSnapshot(tx, created.id, created.version, snapshot);
      return created;
    });
  } catch (error) {
    if (
      requestedId &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return getTreeForUser(requestedId, userId);
    }
    throw error;
  }

  return {
    id: tree.id,
    name: tree.name,
    ownerId: tree.ownerId,
    version: tree.version,
    nodes,
    createdAt: tree.createdAt.toISOString(),
    updatedAt: tree.updatedAt.toISOString(),
  };
}

export async function replaceTreeNodes(
  treeId: string,
  userId: string,
  nodes: FamilyNode[]
): Promise<{ newVersion: number }> {
  await assertMembership(treeId, userId, true);

  return prisma.$transaction(async (tx) => {
    const updatedTree = await tx.tree.update({
      where: { id: treeId },
      data: { version: { increment: 1 }, updatedAt: new Date() },
      select: { version: true },
    });
    const snapshot = await writeGraph(tx, treeId, nodes);
    await createSnapshot(tx, treeId, updatedTree.version, snapshot);
    return { newVersion: updatedTree.version };
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

export async function applyTreeMutations(
  treeId: string,
  userId: string,
  batchId: string,
  clientVersion: number,
  mutations: Array<{
    seqNo: number;
    type: "add" | "update" | "delete";
    nodeId: string;
    payload: FamilyNode | null;
  }>
): Promise<{
  newVersion: number;
  acknowledgedSeqNos: number[];
  duplicate: boolean;
}> {
  await assertMembership(treeId, userId, true);

  return prisma.$transaction(async (tx) => {
    const existingReceipt = await tx.treeSyncReceipt.findUnique({
      where: { id: batchId },
    });
    if (existingReceipt) {
      if (existingReceipt.treeId !== treeId) {
        throw new TreeAccessError("Sync batch ID is already in use");
      }
      return {
        newVersion: existingReceipt.version,
        acknowledgedSeqNos: existingReceipt.acknowledgedSeqNos as number[],
        duplicate: true,
      };
    }

    // Claim this version before reading and replacing the graph. PostgreSQL
    // serializes concurrent claims on this row, so only one writer can win.
    const claim = await tx.tree.updateMany({
      where: { id: treeId, version: clientVersion },
      data: { version: { increment: 1 }, updatedAt: new Date() },
    });
    if (claim.count !== 1) {
      const receiptAfterClaim = await tx.treeSyncReceipt.findUnique({
        where: { id: batchId },
      });
      if (receiptAfterClaim?.treeId === treeId) {
        return {
          newVersion: receiptAfterClaim.version,
          acknowledgedSeqNos: receiptAfterClaim.acknowledgedSeqNos as number[],
          duplicate: true,
        };
      }

      const current = await tx.tree.findUnique({
        where: { id: treeId },
        select: { version: true },
      });
      if (!current) throw new TreeAccessError("Tree not found", 404);
      throw new VersionConflictError(current.version);
    }

    const [nodes, edges] = await Promise.all([
      tx.node.findMany({ where: { treeId } }),
      tx.edge.findMany({ where: { treeId } }),
    ]);

    const currentNodes = deserializeRowsToTree({
      nodes: nodes.map((n) => ({
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
      })),
      edges: edges.map((e) => ({
        fromId: e.fromId,
        toId: e.toId,
        kind: e.kind as DbEdge["kind"],
        startYear: e.startYear,
        endYear: e.endYear,
      })),
    });

    const byId = new Map(currentNodes.map((node) => [node.id, node]));
    const ordered = [...mutations].sort((a, b) => a.seqNo - b.seqNo);

    for (const mutation of ordered) {
      if (mutation.type === "delete") {
        byId.delete(mutation.nodeId);
        for (const node of byId.values()) {
          node.parentIds = (node.parentIds || []).filter(
            (id) => id !== mutation.nodeId
          );
          node.parentId =
            node.parentId === mutation.nodeId ? node.parentIds[0] ?? null : node.parentId;
          node.adoptiveParentIds = (node.adoptiveParentIds || []).filter(
            (id) => id !== mutation.nodeId
          );
          node.partners = (node.partners || []).filter(
            (id) => id !== mutation.nodeId
          );
          node.childrenIds = (node.childrenIds || []).filter(
            (id) => id !== mutation.nodeId
          );
        }
      } else if (mutation.payload) {
        byId.set(mutation.nodeId, mutation.payload);
      }
    }

    const snapshot = await writeGraph(tx, treeId, Array.from(byId.values()));
    const newVersion = clientVersion + 1;
    const acknowledgedSeqNos = ordered.map((mutation) => mutation.seqNo);
    await tx.treeSyncReceipt.create({
      data: {
        id: batchId,
        treeId,
        clientVersion,
        version: newVersion,
        acknowledgedSeqNos,
        nodeIds: Array.from(new Set(ordered.map((mutation) => mutation.nodeId))),
      },
    });
    await createSnapshot(tx, treeId, newVersion, snapshot);

    return {
      newVersion,
      acknowledgedSeqNos,
      duplicate: false,
    };
  });
}

export async function getChangedNodeIdsSince(
  treeId: string,
  clientVersion: number,
  currentVersion: number
): Promise<{ complete: boolean; nodeIds: string[] }> {
  const receipts = await prisma.treeSyncReceipt.findMany({
    where: {
      treeId,
      version: { gt: clientVersion, lte: currentVersion },
    },
    select: { clientVersion: true, version: true, nodeIds: true },
    orderBy: { version: "asc" },
  });

  let expectedVersion = clientVersion + 1;
  const nodeIds = new Set<string>();
  for (const receipt of receipts) {
    if (
      receipt.version !== expectedVersion ||
      receipt.clientVersion !== receipt.version - 1
    ) {
      return { complete: false, nodeIds: [] };
    }
    for (const nodeId of receipt.nodeIds as string[]) nodeIds.add(nodeId);
    expectedVersion += 1;
  }

  return {
    complete: expectedVersion === currentVersion + 1,
    nodeIds: Array.from(nodeIds),
  };
}

export async function pruneOldSyncReceipts(
  treeId: string,
  maxCount = 1000
): Promise<void> {
  const oldReceipts = await prisma.treeSyncReceipt.findMany({
    where: { treeId },
    orderBy: { createdAt: "desc" },
    skip: maxCount,
    select: { id: true },
  });
  if (oldReceipts.length === 0) return;

  await prisma.treeSyncReceipt.deleteMany({
    where: { id: { in: oldReceipts.map((receipt) => receipt.id) } },
  });
}

export class VersionConflictError extends Error {
  constructor(public readonly currentVersion: number) {
    super("Tree version conflict");
    this.name = "VersionConflictError";
  }
}
