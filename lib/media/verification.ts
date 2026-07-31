import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import type { FamilyNode } from "../types/tree";
import {
  collectMediaReferences,
  collectReferencedMediaStorageKeys,
  getMediaStorageConfig,
  headMediaObject,
  storageKeyBelongsToTree,
} from "./storage";

export class MediaStorageVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaStorageVerificationError";
  }
}

export class InvalidMediaReferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMediaReferenceError";
  }
}

export class MediaUploadReservationError extends Error {
  constructor() {
    super("Media upload reservation is missing or expired");
    this.name = "MediaUploadReservationError";
  }
}

export type MediaTreeMutation = {
  payload: FamilyNode | null;
  previousPayload?: FamilyNode | null;
};

function newMediaStorageKeys(
  previousNodes: FamilyNode[],
  nextNodes: FamilyNode[]
): string[] {
  const previousKeys = collectReferencedMediaStorageKeys(previousNodes);
  return [...collectReferencedMediaStorageKeys(nextNodes)].filter(
    (key) => !previousKeys.has(key)
  );
}

export async function verifyNewMediaReferences(
  treeId: string,
  userId: string,
  mutations: MediaTreeMutation[]
): Promise<void> {
  const nextNodes = mutations.flatMap((mutation) =>
    mutation.payload ? [mutation.payload] : []
  );
  const nextReferences = collectMediaReferences(nextNodes);
  const previousKeys = collectReferencedMediaStorageKeys(
    mutations.flatMap((mutation) =>
      mutation.previousPayload ? [mutation.previousPayload] : []
    )
  );

  for (const key of nextReferences.keys()) {
    if (!storageKeyBelongsToTree(key, treeId)) {
      throw new InvalidMediaReferenceError(
        "Media storage key is outside this tree"
      );
    }
  }

  const newReferences = [...nextReferences.values()].filter(
    (reference) => !previousKeys.has(reference.storageKey)
  );
  if (newReferences.length === 0) return;

  const config = getMediaStorageConfig();
  if (!config) {
    throw new MediaStorageVerificationError("Media storage is not configured");
  }

  const reservations = await prisma.mediaUploadReservation.findMany({
    where: {
      treeId,
      userId,
      storageKey: { in: newReferences.map((reference) => reference.storageKey) },
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { storageKey: true },
  });
  const reservedKeys = new Set(
    reservations.map((reservation) => reservation.storageKey)
  );
  for (const reference of newReferences) {
    if (!reservedKeys.has(reference.storageKey)) {
      throw new MediaUploadReservationError();
    }
  }

  await Promise.all(
    newReferences.map(async (reference) => {
      let object;
      try {
        object = await headMediaObject(config, reference.storageKey);
      } catch {
        throw new MediaStorageVerificationError(reference.storageKey);
      }
      if (!object) {
        throw new InvalidMediaReferenceError("Media object was not found");
      }
      if (
        reference.sizeBytes !== null &&
        object.sizeBytes !== reference.sizeBytes
      ) {
        throw new InvalidMediaReferenceError(
          "Media object size does not match its tree metadata"
        );
      }
      if (
        reference.mimeType &&
        object.mimeType &&
        object.mimeType !== reference.mimeType.toLowerCase()
      ) {
        throw new InvalidMediaReferenceError(
          "Media object type does not match its tree metadata"
        );
      }
    })
  );
}

export async function assertActiveMediaUploadReservations(
  tx: Prisma.TransactionClient,
  treeId: string,
  userId: string,
  previousNodes: FamilyNode[],
  nextNodes: FamilyNode[]
): Promise<void> {
  const newKeys = newMediaStorageKeys(previousNodes, nextNodes);
  if (newKeys.length === 0) return;

  const reservations = await tx.mediaUploadReservation.findMany({
    where: {
      treeId,
      userId,
      storageKey: { in: newKeys },
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { storageKey: true },
  });
  const reservedKeys = new Set(
    reservations.map((reservation) => reservation.storageKey)
  );
  if (newKeys.some((key) => !reservedKeys.has(key))) {
    throw new MediaUploadReservationError();
  }
}

export async function filterUnreferencedMediaStorageKeys(
  treeId: string,
  candidateKeys: string[],
  currentNodes: FamilyNode[]
): Promise<string[]> {
  const treeReferences = collectReferencedMediaStorageKeys(currentNodes);
  const candidates = candidateKeys.filter(
    (key) => !treeReferences.has(key) && storageKeyBelongsToTree(key, treeId)
  );
  if (candidates.length === 0) return [];

  try {
    const [mediaAssets, deliverables, evidence] = await Promise.all([
      prisma.mediaAsset.findMany({
        where: { treeId, storageKey: { in: candidates } },
        select: { storageKey: true },
      }),
      prisma.studioDeliverable.findMany({
        where: { treeId, storageKey: { in: candidates } },
        select: { storageKey: true },
      }),
      prisma.familyEvidence.findMany({
        where: { storageKey: { in: candidates } },
        select: { storageKey: true },
      }),
    ]);
    const protectedKeys = new Set([
      ...mediaAssets.map((asset) => asset.storageKey),
      ...deliverables.map((deliverable) => deliverable.storageKey),
      ...evidence.map((item) => item.storageKey).filter((key): key is string => Boolean(key)),
    ]);
    return candidates.filter((key) => !protectedKeys.has(key));
  } catch (error) {
    console.error("media reference guard failed; skipping cleanup", error);
    return [];
  }
}
