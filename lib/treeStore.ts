import { randomUUID } from "crypto";
import { prisma } from "./db";
import type { TreeData } from "./types/tree";

type StoredTreeRow = {
  id: string;
  ownerId: string;
  treeName: string;
  treeData: string;
  createdAt: string;
  updatedAt: string;
};

let treeTableReadyPromise: Promise<void> | null = null;

async function ensureTreeTable(): Promise<void> {
  if (!treeTableReadyPromise) {
    treeTableReadyPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "UserTree" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "ownerId" TEXT NOT NULL,
          "treeName" TEXT NOT NULL,
          "treeData" TEXT NOT NULL,
          "createdAt" TEXT NOT NULL,
          "updatedAt" TEXT NOT NULL
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "UserTree_ownerId_key"
        ON "UserTree" ("ownerId");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "UserTree_updatedAt_idx"
        ON "UserTree" ("updatedAt");
      `);
    })();
  }

  return treeTableReadyPromise;
}

export async function getTreeByOwnerId(ownerId: string): Promise<TreeData | null> {
  await ensureTreeTable();

  const rows = await prisma.$queryRaw<StoredTreeRow[]>`
    SELECT
      "id",
      "ownerId",
      "treeName",
      "treeData",
      "createdAt",
      "updatedAt"
    FROM "UserTree"
    WHERE "ownerId" = ${ownerId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  let parsedTree: unknown = null;
  try {
    parsedTree = JSON.parse(row.treeData);
  } catch {
    return null;
  }

  if (!parsedTree || typeof parsedTree !== "object") return null;

  const tree = parsedTree as Partial<TreeData>;
  if (!Array.isArray(tree.nodes)) return null;

  return {
    id: row.id,
    ownerId: row.ownerId,
    name: row.treeName,
    nodes: tree.nodes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function upsertTreeForOwner(
  ownerId: string,
  input: { name: string; nodes: TreeData["nodes"] }
): Promise<TreeData> {
  await ensureTreeTable();

  const now = new Date().toISOString();
  const treeName = input.name.trim() || "Keluarga";
  const treeData = JSON.stringify({ nodes: input.nodes });

  const existing = await prisma.$queryRaw<StoredTreeRow[]>`
    SELECT
      "id",
      "ownerId",
      "treeName",
      "treeData",
      "createdAt",
      "updatedAt"
    FROM "UserTree"
    WHERE "ownerId" = ${ownerId}
    LIMIT 1
  `;

  if (existing[0]) {
    await prisma.$executeRaw`
      UPDATE "UserTree"
      SET
        "treeName" = ${treeName},
        "treeData" = ${treeData},
        "updatedAt" = ${now}
      WHERE "ownerId" = ${ownerId}
    `;

    return {
      id: existing[0].id,
      ownerId,
      name: treeName,
      nodes: input.nodes,
      createdAt: existing[0].createdAt,
      updatedAt: now,
    };
  }

  const id = randomUUID().replace(/-/g, "");
  await prisma.$executeRaw`
    INSERT INTO "UserTree"
      ("id", "ownerId", "treeName", "treeData", "createdAt", "updatedAt")
    VALUES
      (${id}, ${ownerId}, ${treeName}, ${treeData}, ${now}, ${now})
  `;

  return {
    id,
    ownerId,
    name: treeName,
    nodes: input.nodes,
    createdAt: now,
    updatedAt: now,
  };
}
