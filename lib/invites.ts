import { createHash, randomUUID } from "crypto";
import { prisma } from "./db";

type CreateTreeInviteInput = {
  token: string;
  treeId: string;
  createdById: string;
  role: "editor" | "viewer";
  expiresAt: Date;
};

export type StoredTreeInvite = {
  id: string;
  treeId: string;
  treeName: string;
  createdByName: string;
  role: string;
  expiresAt: Date;
  acceptedAt: Date | null;
};

export class TreeInviteError extends Error {
  constructor(
    message: string,
    public readonly status: 404 | 409 | 410
  ) {
    super(message);
    this.name = "TreeInviteError";
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createTreeInvite(
  input: CreateTreeInviteInput
): Promise<{ id: string; createdAt: Date }> {
  return prisma.treeInvite.create({
    data: {
      id: randomUUID().replace(/-/g, ""),
      tokenHash: hashToken(input.token),
      treeId: input.treeId,
      createdById: input.createdById,
      role: input.role,
      expiresAt: input.expiresAt,
    },
    select: { id: true, createdAt: true },
  });
}

export async function getTreeInviteByToken(
  token: string
): Promise<StoredTreeInvite | null> {
  const invite = await prisma.treeInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      treeId: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      tree: { select: { name: true, deletedAt: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!invite || invite.tree.deletedAt) return null;
  return {
    id: invite.id,
    treeId: invite.treeId,
    treeName: invite.tree.name,
    createdByName: invite.createdBy.name,
    role: invite.role,
    expiresAt: invite.expiresAt,
    acceptedAt: invite.acceptedAt,
  };
}

export async function acceptTreeInvite(
  token: string,
  userId: string
): Promise<{ treeId: string; treeName: string; role: string }> {
  return prisma.$transaction(async (tx) => {
    const invite = await tx.treeInvite.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        tree: { select: { id: true, name: true, ownerId: true, deletedAt: true } },
      },
    });

    if (!invite) throw new TreeInviteError("Invite not found", 404);
    if (invite.tree.deletedAt) {
      throw new TreeInviteError("Invite not found", 404);
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new TreeInviteError("Invite has expired", 410);
    }
    if (invite.acceptedAt && invite.acceptedById !== userId) {
      throw new TreeInviteError("Invite has already been used", 409);
    }

    if (invite.tree.ownerId !== userId) {
      await tx.treeMember.upsert({
        where: {
          treeId_userId: { treeId: invite.treeId, userId },
        },
        create: {
          treeId: invite.treeId,
          userId,
          role: invite.role,
        },
        update: {
          role: invite.role,
        },
      });
    }

    if (!invite.acceptedAt) {
      const claimed = await tx.treeInvite.updateMany({
        where: { id: invite.id, acceptedAt: null },
        data: { acceptedAt: new Date(), acceptedById: userId },
      });
      if (claimed.count !== 1) {
        throw new TreeInviteError("Invite has already been used", 409);
      }
    }

    return {
      treeId: invite.treeId,
      treeName: invite.tree.name,
      role: invite.role,
    };
  });
}

export async function deleteExpiredTreeInvites(now = new Date()): Promise<void> {
  await prisma.treeInvite.deleteMany({
    where: { expiresAt: { lt: now } },
  });
}
