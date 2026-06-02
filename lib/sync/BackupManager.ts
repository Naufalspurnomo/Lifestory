import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import {
  assertTreeGraphValid,
  assertTreeWritable,
  TreeAccessError,
} from "../tree/repository";
import {
  deserializeRowsToTree,
  type DbEdge,
  type DbNode,
  type DbTreeSnapshot,
} from "../tree/persistence";

export type TreeSnapshotMeta = {
  id: string;
  treeId: string;
  version: number;
  nodeCount: number;
  createdAt: Date;
};

export type TreeSnapshot = TreeSnapshotMeta & {
  data: DbTreeSnapshot;
};

function mapNode(row: {
  id: string;
  label: string;
  sex: string | null;
  birthYear: number | null;
  deathYear: number | null;
  line: string;
  imageUrl: string | null;
  description: string;
  media: unknown;
  works: unknown;
  socialInstagram: string | null;
  socialTiktok: string | null;
  socialLinkedin: string | null;
  generationCached: number;
}): DbNode {
  return {
    id: row.id,
    label: row.label,
    sex: row.sex,
    birthYear: row.birthYear,
    deathYear: row.deathYear,
    line: row.line,
    imageUrl: row.imageUrl,
    description: row.description,
    media: row.media,
    works: row.works,
    socialInstagram: row.socialInstagram,
    socialTiktok: row.socialTiktok,
    socialLinkedin: row.socialLinkedin,
    generationCached: row.generationCached,
  };
}

function mapEdge(row: {
  fromId: string;
  toId: string;
  kind: string;
  startYear: number | null;
  endYear: number | null;
}): DbEdge {
  return {
    fromId: row.fromId,
    toId: row.toId,
    kind: row.kind as DbEdge["kind"],
    startYear: row.startYear,
    endYear: row.endYear,
  };
}

function parseSnapshotData(data: unknown): DbTreeSnapshot {
  const snapshot = data as Partial<DbTreeSnapshot>;
  return {
    nodes: Array.isArray(snapshot.nodes) ? (snapshot.nodes as DbNode[]) : [],
    edges: Array.isArray(snapshot.edges) ? (snapshot.edges as DbEdge[]) : [],
  };
}

export class BackupManager {
  async createSnapshot(treeId: string): Promise<TreeSnapshot> {
    const { data, snapshot } = await prisma.$transaction(
      async (tx) => {
        const tree = await tx.tree.findUnique({
          where: { id: treeId },
          select: { version: true },
        });
        if (!tree) throw new Error("Tree not found");

        const [nodes, edges] = await Promise.all([
          tx.node.findMany({ where: { treeId } }),
          tx.edge.findMany({ where: { treeId } }),
        ]);
        const data: DbTreeSnapshot = {
          nodes: nodes.map(mapNode),
          edges: edges.map(mapEdge),
        };
        const snapshot = await tx.treeSnapshot.create({
          data: {
            treeId,
            version: tree.version,
            nodeCount: data.nodes.length,
            data: data as any,
          },
        });
        return { data, snapshot };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
    );

    await this.pruneOldSnapshots(treeId, 50);

    return {
      id: snapshot.id,
      treeId: snapshot.treeId,
      version: snapshot.version,
      nodeCount: snapshot.nodeCount,
      data,
      createdAt: snapshot.createdAt,
    };
  }

  async listSnapshots(treeId: string): Promise<TreeSnapshotMeta[]> {
    return prisma.treeSnapshot.findMany({
      where: { treeId },
      select: {
        id: true,
        treeId: true,
        version: true,
        nodeCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSnapshot(snapshotId: string): Promise<TreeSnapshot> {
    const snapshot = await prisma.treeSnapshot.findUnique({
      where: { id: snapshotId },
    });
    if (!snapshot) throw new Error("Snapshot not found");
    return {
      id: snapshot.id,
      treeId: snapshot.treeId,
      version: snapshot.version,
      nodeCount: snapshot.nodeCount,
      data: parseSnapshotData(snapshot.data),
      createdAt: snapshot.createdAt,
    };
  }

  async restoreSnapshot(
    treeId: string,
    snapshotId: string,
    userId: string
  ): Promise<void> {
    await assertTreeWritable(treeId, userId);
    const snapshot = await this.getSnapshot(snapshotId);
    if (snapshot.treeId !== treeId) throw new Error("Snapshot belongs to another tree");
    assertTreeGraphValid(deserializeRowsToTree(snapshot.data));

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.tree.updateMany({
        where: { id: treeId, deletedAt: null },
        data: { version: { increment: 1 }, updatedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new TreeAccessError("Tree not found", 404);
      }
      const tree = await tx.tree.findUniqueOrThrow({
        where: { id: treeId },
        select: { version: true },
      });
      const [currentNodes, currentEdges] = await Promise.all([
        tx.node.findMany({ where: { treeId } }),
        tx.edge.findMany({ where: { treeId } }),
      ]);

      const preRestore: DbTreeSnapshot = {
        nodes: currentNodes.map(mapNode),
        edges: currentEdges.map(mapEdge),
      };

      await tx.treeSnapshot.create({
        data: {
          treeId,
          version: tree.version - 1,
          nodeCount: preRestore.nodes.length,
          data: preRestore as any,
        },
      });

      await tx.edge.deleteMany({ where: { treeId } });
      await tx.node.deleteMany({ where: { treeId } });

      if (snapshot.data.nodes.length > 0) {
        await tx.node.createMany({
          data: snapshot.data.nodes.map((node) => ({
            id: node.id,
            treeId,
            label: node.label,
            sex: node.sex,
            birthYear: node.birthYear,
            deathYear: node.deathYear,
            line: node.line,
            imageUrl: node.imageUrl,
            description: node.description,
            media: node.media as any,
            works: node.works as any,
            socialInstagram: node.socialInstagram,
            socialTiktok: node.socialTiktok,
            socialLinkedin: node.socialLinkedin,
            generationCached: node.generationCached,
          })),
        });
      }

      if (snapshot.data.edges.length > 0) {
        await tx.edge.createMany({
          data: snapshot.data.edges.map((edge) => ({
            treeId,
            fromId: edge.fromId,
            toId: edge.toId,
            kind: edge.kind,
            startYear: edge.startYear ?? null,
            endYear: edge.endYear ?? null,
          })),
          skipDuplicates: true,
        });
      }

    });

    await this.pruneOldSnapshots(treeId, 50);
  }

  async pruneOldSnapshots(treeId: string, maxCount: number): Promise<void> {
    const oldSnapshots = await prisma.treeSnapshot.findMany({
      where: { treeId },
      orderBy: { createdAt: "desc" },
      skip: maxCount,
      select: { id: true },
    });

    if (oldSnapshots.length === 0) return;

    await prisma.treeSnapshot.deleteMany({
      where: { id: { in: oldSnapshots.map((snapshot) => snapshot.id) } },
    });
  }
}
