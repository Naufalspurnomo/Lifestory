import { randomUUID } from "crypto";
import { prisma } from "./db";

type CreateTreeInviteInput = {
  token: string;
  treeName: string;
  treeData: string;
  createdById: string;
  createdByEmail: string;
  expiresAt: string;
};

export type StoredTreeInvite = {
  id: string;
  token: string;
  treeName: string;
  treeData: string;
  createdById: string;
  createdByEmail: string;
  createdAt: string;
  expiresAt: string;
};

let inviteTableReadyPromise: Promise<void> | null = null;

async function ensureInviteTable(): Promise<void> {
  if (!inviteTableReadyPromise) {
    inviteTableReadyPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "TreeInvite" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "token" TEXT NOT NULL,
          "treeName" TEXT NOT NULL,
          "treeData" TEXT NOT NULL,
          "createdById" TEXT NOT NULL,
          "createdByEmail" TEXT NOT NULL,
          "createdAt" TEXT NOT NULL,
          "expiresAt" TEXT NOT NULL
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "TreeInvite_token_key"
        ON "TreeInvite" ("token");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "TreeInvite_expiresAt_idx"
        ON "TreeInvite" ("expiresAt");
      `);
    })();
  }

  return inviteTableReadyPromise;
}

export async function createTreeInvite(
  input: CreateTreeInviteInput
): Promise<{ id: string; createdAt: string }> {
  await ensureInviteTable();

  const id = randomUUID().replace(/-/g, "");
  const createdAt = new Date().toISOString();

  await prisma.$executeRaw`
    INSERT INTO "TreeInvite"
      ("id", "token", "treeName", "treeData", "createdById", "createdByEmail", "createdAt", "expiresAt")
    VALUES
      (${id}, ${input.token}, ${input.treeName}, ${input.treeData}, ${input.createdById}, ${input.createdByEmail}, ${createdAt}, ${input.expiresAt})
  `;

  return { id, createdAt };
}

export async function getTreeInviteByToken(
  token: string
): Promise<StoredTreeInvite | null> {
  await ensureInviteTable();

  const rows = await prisma.$queryRaw<StoredTreeInvite[]>`
    SELECT
      "id",
      "token",
      "treeName",
      "treeData",
      "createdById",
      "createdByEmail",
      "createdAt",
      "expiresAt"
    FROM "TreeInvite"
    WHERE "token" = ${token}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function deleteExpiredTreeInvites(nowIso: string): Promise<void> {
  await ensureInviteTable();

  await prisma.$executeRaw`
    DELETE FROM "TreeInvite"
    WHERE "expiresAt" < ${nowIso}
  `;
}
