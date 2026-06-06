// Tree repository: Prisma-backed operations for tree load/save.
// Keeps the persistence adapter isolated from HTTP/session concerns.

import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { applyNodeMutations } from "../sync/applyMutations";
import { IntegrityValidator } from "../sync/IntegrityValidator";
import {
  deserializeRowsToTree,
  serializeTreeToRows,
  type DbEdge,
  type DbNode,
} from "./persistence";
import type { FamilyNode, TreeData } from "../types/tree";
import { nonEmptyFamilyTreeNodesSchema } from "../validations";

export const TREE_WRITE_TRANSACTION_OPTIONS = {
  maxWait: 5_000,
  timeout: 20_000,
} as const;

export class TreeAccessError extends Error {
  constructor(
    message: string,
    public readonly status: 403 | 404 = 403
  ) {
    super(message);
    this.name = "TreeAccessError";
  }
}

export class InvalidTreeGraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTreeGraphError";
  }
}

export function assertTreeGraphValid(nodes: FamilyNode[]): void {
  const shape = nonEmptyFamilyTreeNodesSchema.safeParse(nodes);
  if (!shape.success) {
    throw new InvalidTreeGraphError(
      shape.error.errors.map((error) => error.message).join("; ")
    );
  }

  const integrity = new IntegrityValidator().validate(nodes);
  if (!integrity.valid) {
    throw new InvalidTreeGraphError(
      integrity.errors.map((error) => error.details).join("; ")
    );
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
      deletedAt: true,
      memberships: {
        where: { userId },
        select: { role: true },
      },
    },
  });

  if (!tree) throw new TreeAccessError("Tree not found", 404);
  if (tree.deletedAt) throw new TreeAccessError("Tree not found", 404);

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

export async function assertTreeOwner(
  treeId: string,
  userId: string
): Promise<void> {
  const tree = await prisma.tree.findUnique({
    where: { id: treeId },
    select: { ownerId: true, deletedAt: true },
  });
  if (!tree) throw new TreeAccessError("Tree not found", 404);
  if (tree.deletedAt) throw new TreeAccessError("Tree not found", 404);
  if (tree.ownerId !== userId) {
    throw new TreeAccessError("Only the owner can invite collaborators");
  }
}

async function writeGraph(
  tx: Prisma.TransactionClient,
  treeId: string,
  nodes: FamilyNode[]
) {
  assertTreeGraphValid(nodes);
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
        imageStorageKey: n.imageStorageKey,
        imageMimeType: n.imageMimeType,
        imageSizeBytes: n.imageSizeBytes,
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

function toNodeCreateData(treeId: string, n: DbNode) {
  return {
    id: n.id,
    treeId,
    label: n.label,
    sex: n.sex,
    birthYear: n.birthYear,
    deathYear: n.deathYear,
    line: n.line,
    imageUrl: n.imageUrl,
    imageStorageKey: n.imageStorageKey,
    imageMimeType: n.imageMimeType,
    imageSizeBytes: n.imageSizeBytes,
    description: n.description,
    media: n.media as any,
    works: n.works as any,
    socialInstagram: n.socialInstagram,
    socialTiktok: n.socialTiktok,
    socialLinkedin: n.socialLinkedin,
    generationCached: n.generationCached,
  };
}

function toNodeUpdateData(n: DbNode) {
  const { id, treeId, ...data } = toNodeCreateData("", n);
  void id;
  void treeId;
  return data;
}

function dbNodeFingerprint(n: DbNode): string {
  return JSON.stringify([
    n.label,
    n.sex,
    n.birthYear,
    n.deathYear,
    n.line,
    n.imageUrl,
    n.imageStorageKey,
    n.imageMimeType,
    n.imageSizeBytes,
    n.description,
    n.media ?? [],
    n.works ?? [],
    n.socialInstagram,
    n.socialTiktok,
    n.socialLinkedin,
    n.generationCached,
  ]);
}

async function writeMutatedGraph(
  tx: Prisma.TransactionClient,
  treeId: string,
  currentNodes: DbNode[],
  nodes: FamilyNode[]
) {
  assertTreeGraphValid(nodes);
  const snapshot = serializeTreeToRows(nodes);
  const currentById = new Map(currentNodes.map((node) => [node.id, node]));
  const nextIds = new Set(snapshot.nodes.map((node) => node.id));
  const deletedIds = currentNodes
    .filter((node) => !nextIds.has(node.id))
    .map((node) => node.id);

  await tx.edge.deleteMany({ where: { treeId } });

  if (deletedIds.length > 0) {
    await tx.node.deleteMany({
      where: { treeId, id: { in: deletedIds } },
    });
  }

  for (const node of snapshot.nodes) {
    const current = currentById.get(node.id);
    if (!current) {
      await tx.node.create({ data: toNodeCreateData(treeId, node) });
      continue;
    }

    if (dbNodeFingerprint(current) !== dbNodeFingerprint(node)) {
      await tx.node.update({
        where: { id: node.id },
        data: toNodeUpdateData(node),
      });
    }
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
      deletedAt: null,
      OR: [{ ownerId: userId }, { memberships: { some: { userId } } }],
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
      version: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { nodes: true } },
    },
    orderBy: { updatedAt: "desc" },
  }).then((trees) =>
    trees.map(({ _count, ...tree }) => ({
      ...tree,
      nodeCount: _count.nodes,
    }))
  );
}

export async function getTreeForUser(
  treeId: string,
  userId: string
): Promise<TreeData> {
  await assertMembership(treeId, userId, false);

  const [tree, nodes, edges] = await Promise.all([
    prisma.tree.findFirst({ where: { id: treeId, deletedAt: null } }),
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
    imageStorageKey: n.imageStorageKey,
    imageMimeType: n.imageMimeType,
    imageSizeBytes: n.imageSizeBytes,
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

export async function getTreeVersionForUser(
  treeId: string,
  userId: string
): Promise<number> {
  const tree = await prisma.tree.findFirst({
    where: {
      id: treeId,
      deletedAt: null,
      OR: [{ ownerId: userId }, { memberships: { some: { userId } } }],
    },
    select: { version: true },
  });

  if (!tree) throw new TreeAccessError("Tree not found", 404);
  return tree.version;
}

export async function createTreeForUser(
  userId: string,
  name: string,
  nodes: FamilyNode[],
  requestedId?: string
): Promise<TreeData> {
  const existingOwnedTrees = await prisma.tree.findMany({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true, updatedAt: true, _count: { select: { nodes: true } } },
  });
  const canonicalOwnedTree = existingOwnedTrees.sort(
    (a, b) =>
      b._count.nodes - a._count.nodes ||
      b.updatedAt.getTime() - a.updatedAt.getTime()
  )[0];
  if (canonicalOwnedTree) {
    return getTreeForUser(canonicalOwnedTree.id, userId);
  }

  if (requestedId) {
    const existing = await prisma.tree.findUnique({
      where: { id: requestedId },
      select: { ownerId: true, deletedAt: true },
    });
    if (existing) {
      if (existing.deletedAt) {
        throw new TreeAccessError("Tree ID is already in use");
      }
      if (existing.ownerId !== userId) {
        throw new TreeAccessError("Tree ID is already in use");
      }
      return getTreeForUser(requestedId, userId);
    }
  }

  let tree;
  try {
    tree = await prisma.$transaction(
      async (tx) => {
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
      },
      TREE_WRITE_TRANSACTION_OPTIONS
    );
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
  expectedVersion: number,
  nodes: FamilyNode[]
): Promise<{ newVersion: number }> {
  await assertMembership(treeId, userId, true);

  return prisma.$transaction(
    async (tx) => {
      const claim = await tx.tree.updateMany({
        where: { id: treeId, deletedAt: null, version: expectedVersion },
        data: { version: { increment: 1 }, updatedAt: new Date() },
      });
      if (claim.count !== 1) {
        const current = await tx.tree.findUnique({
          where: { id: treeId },
          select: { version: true, deletedAt: true },
        });
        if (!current || current.deletedAt) {
          throw new TreeAccessError("Tree not found", 404);
        }
        throw new VersionConflictError(current.version);
      }

      const snapshot = await writeGraph(tx, treeId, nodes);
      const newVersion = expectedVersion + 1;
      await createSnapshot(tx, treeId, newVersion, snapshot);
      return { newVersion };
    },
    TREE_WRITE_TRANSACTION_OPTIONS
  );
}

export async function deleteTree(treeId: string, userId: string) {
  const tree = await prisma.tree.findUnique({
    where: { id: treeId },
    select: { ownerId: true, deletedAt: true },
  });
  if (!tree) throw new TreeAccessError("Tree not found", 404);
  if (tree.ownerId !== userId)
    throw new TreeAccessError("Only the owner can delete");
  if (tree.deletedAt) return;

  await prisma.tree.update({
    where: { id: treeId },
    data: { deletedAt: new Date(), updatedAt: new Date() },
  });
}

export async function recoverDeletedTree(treeId: string): Promise<{
  id: string;
  recovered: boolean;
}> {
  const tree = await prisma.tree.findUnique({
    where: { id: treeId },
    select: { id: true, deletedAt: true },
  });
  if (!tree) throw new TreeAccessError("Tree not found", 404);
  if (!tree.deletedAt) return { id: tree.id, recovered: false };

  await prisma.tree.update({
    where: { id: tree.id },
    data: { deletedAt: null, updatedAt: new Date() },
  });
  return { id: tree.id, recovered: true };
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
    previousPayload?: FamilyNode | null;
  }>
): Promise<{
  newVersion: number;
  acknowledgedSeqNos: number[];
  duplicate: boolean;
}> {
  await assertMembership(treeId, userId, true);

  return prisma.$transaction(
    async (tx) => {
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
        where: { id: treeId, deletedAt: null, version: clientVersion },
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
          select: { version: true, deletedAt: true },
        });
        if (!current || current.deletedAt) {
          throw new TreeAccessError("Tree not found", 404);
        }
        throw new VersionConflictError(current.version);
      }

      const [nodes, edges] = await Promise.all([
        tx.node.findMany({ where: { treeId } }),
        tx.edge.findMany({ where: { treeId } }),
      ]);

      const currentDbNodes: DbNode[] = nodes.map((n) => ({
          id: n.id,
          label: n.label,
          sex: n.sex,
          birthYear: n.birthYear,
          deathYear: n.deathYear,
          line: n.line,
          imageUrl: n.imageUrl,
          imageStorageKey: n.imageStorageKey,
          imageMimeType: n.imageMimeType,
          imageSizeBytes: n.imageSizeBytes,
          description: n.description,
          media: n.media,
          works: n.works,
          socialInstagram: n.socialInstagram,
          socialTiktok: n.socialTiktok,
          socialLinkedin: n.socialLinkedin,
          generationCached: n.generationCached,
        }));
      const currentNodes = deserializeRowsToTree({
        nodes: currentDbNodes,
        edges: edges.map((e) => ({
          fromId: e.fromId,
          toId: e.toId,
          kind: e.kind as DbEdge["kind"],
          startYear: e.startYear,
          endYear: e.endYear,
        })),
      });

      const ordered = [...mutations].sort((a, b) => a.seqNo - b.seqNo);
      const snapshot = await writeMutatedGraph(
        tx,
        treeId,
        currentDbNodes,
        applyNodeMutations(currentNodes, ordered)
      );
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
    },
    TREE_WRITE_TRANSACTION_OPTIONS
  );
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
