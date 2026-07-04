import { createHash, createHmac } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type { FamilyNode } from "./types/tree";
import {
  deserializeRowsToTree,
  type DbEdge,
  type DbNode,
} from "./tree/persistence";

const DISCOVERY_MIN_SCORE = 6;
const HIGH_CONFIDENCE_SCORE = 12;
const PROFILE_RETENTION_DAYS = 180;
const BACKFILL_LIMIT = 200;

const TITLE_TOKENS = new Set([
  "alm",
  "almarhum",
  "almarhumah",
  "bapak",
  "bp",
  "bu",
  "dr",
  "dra",
  "h",
  "haji",
  "hj",
  "ibu",
  "ir",
  "prof",
  "sdr",
  "sdri",
]);

type MatchKeyType =
  | "self_birth"
  | "parent_pair"
  | "child_parent_pair"
  | "child_parent"
  | "grandparent_pair"
  | "hometown_parent_pair"
  | "sibling_group"
  | "document_claim";

const KEY_WEIGHTS: Record<MatchKeyType, number> = {
  self_birth: 3,
  parent_pair: 6,
  child_parent_pair: 8,
  child_parent: 3,
  grandparent_pair: 4,
  hometown_parent_pair: 3,
  sibling_group: 5,
  document_claim: 12,
};

export type DiscoveryProfileInput = {
  personName: string;
  birthYear?: number | null;
  fatherName?: string | null;
  motherName?: string | null;
  paternalGrandfatherName?: string | null;
  paternalGrandmotherName?: string | null;
  maternalGrandfatherName?: string | null;
  maternalGrandmotherName?: string | null;
  hometown?: string | null;
  siblingNames?: string[];
  documentNumber?: string | null;
  consentAccepted?: boolean;
};

export type FamilyMatchKeyDraft = {
  keyType: MatchKeyType;
  keyHash: string;
  weight: number;
  reason: string;
};

export type SafeFamilyCandidate = {
  familyIdentityId: string;
  treeId: string;
  displayName: string;
  maskedOwnerName: string;
  memberCount: number;
  confidence: number;
  confidenceLabel: "medium" | "high";
  matchReasons: string[];
  requestStatus: "none" | "pending" | "approved" | "rejected";
};

export class FamilyIdentityError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 403 | 404 | 409 = 400
  ) {
    super(message);
    this.name = "FamilyIdentityError";
  }
}

function getFamilyMatchSecret(): string {
  const secret =
    process.env.FAMILY_MATCH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "";

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("FAMILY_MATCH_SECRET or NEXTAUTH_SECRET is required");
  }

  return secret || "development-family-match-secret";
}

function hmacHex(value: string): string {
  return createHmac("sha256", getFamilyMatchSecret())
    .update(value)
    .digest("hex");
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeIdentityText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !TITLE_TOKENS.has(token))
    .join(" ")
    .trim();
}

function normalizedParts(parts: Array<string | number | null | undefined>) {
  return parts
    .map((part) =>
      typeof part === "number" ? String(part) : normalizeIdentityText(part)
    )
    .filter(Boolean);
}

function sortedNamePair(a?: string | null, b?: string | null): string[] {
  return normalizedParts([a, b]).sort((left, right) =>
    left.localeCompare(right, "id")
  );
}

function createMatchKey(
  keyType: MatchKeyType,
  parts: Array<string | number | null | undefined>,
  reason: string,
  weight = KEY_WEIGHTS[keyType]
): FamilyMatchKeyDraft | null {
  const normalized = normalizedParts(parts);
  if (normalized.length !== parts.filter((part) => part !== null && part !== undefined && String(part).trim() !== "").length) {
    return null;
  }
  if (normalized.length === 0) return null;

  return {
    keyType,
    keyHash: hmacHex(`${keyType}:${normalized.join("|")}`),
    weight,
    reason,
  };
}

function uniqueKeys(keys: Array<FamilyMatchKeyDraft | null>): FamilyMatchKeyDraft[] {
  const seen = new Set<string>();
  const result: FamilyMatchKeyDraft[] = [];
  for (const key of keys) {
    if (!key) continue;
    const id = `${key.keyType}:${key.keyHash}`;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(key);
  }
  return result;
}

function safeString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 160) : null;
}

function safeSiblingNames(values: string[] | undefined): string[] {
  return (values ?? [])
    .map((value) => safeString(value))
    .filter((value): value is string => Boolean(value))
    .slice(0, 12);
}

export function sanitizeDiscoveryProfile(
  input: DiscoveryProfileInput
): DiscoveryProfileInput {
  return {
    personName: safeString(input.personName) ?? "",
    birthYear: input.birthYear ?? null,
    fatherName: safeString(input.fatherName),
    motherName: safeString(input.motherName),
    paternalGrandfatherName: safeString(input.paternalGrandfatherName),
    paternalGrandmotherName: safeString(input.paternalGrandmotherName),
    maternalGrandfatherName: safeString(input.maternalGrandfatherName),
    maternalGrandmotherName: safeString(input.maternalGrandmotherName),
    hometown: safeString(input.hometown),
    siblingNames: safeSiblingNames(input.siblingNames),
    documentNumber: safeString(input.documentNumber),
    consentAccepted: Boolean(input.consentAccepted),
  };
}

export function hashSensitiveIdentifier(value: string): string {
  return hmacHex(`document:${normalizeIdentityText(value).replace(/\s/g, "")}`);
}

function profileHash(input: DiscoveryProfileInput): string {
  const clean = sanitizeDiscoveryProfile(input);
  return sha256Hex(
    JSON.stringify({
      personName: normalizeIdentityText(clean.personName),
      birthYear: clean.birthYear ?? null,
      fatherName: normalizeIdentityText(clean.fatherName),
      motherName: normalizeIdentityText(clean.motherName),
      hometown: normalizeIdentityText(clean.hometown),
      siblingNames: (clean.siblingNames ?? []).map(normalizeIdentityText).sort(),
    })
  );
}

export function buildDiscoveryMatchKeys(
  input: DiscoveryProfileInput
): FamilyMatchKeyDraft[] {
  const clean = sanitizeDiscoveryProfile(input);
  const parentPair = sortedNamePair(clean.fatherName, clean.motherName);
  const paternalGrandparents = sortedNamePair(
    clean.paternalGrandfatherName,
    clean.paternalGrandmotherName
  );
  const maternalGrandparents = sortedNamePair(
    clean.maternalGrandfatherName,
    clean.maternalGrandmotherName
  );
  const siblingNames = [...(clean.siblingNames ?? []), clean.personName]
    .map(normalizeIdentityText)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "id"));

  return uniqueKeys([
    clean.birthYear
      ? createMatchKey(
          "self_birth",
          [clean.personName, clean.birthYear],
          "Nama dan tahun lahir cocok"
        )
      : null,
    parentPair.length === 2
      ? createMatchKey(
          "parent_pair",
          parentPair,
          "Pasangan orang tua cocok"
        )
      : null,
    parentPair.length === 2
      ? createMatchKey(
          "child_parent_pair",
          [clean.personName, ...parentPair],
          "Nama dan pasangan orang tua cocok"
        )
      : null,
    clean.fatherName
      ? createMatchKey(
          "child_parent",
          [clean.personName, clean.fatherName],
          "Satu relasi orang tua cocok"
        )
      : null,
    clean.motherName
      ? createMatchKey(
          "child_parent",
          [clean.personName, clean.motherName],
          "Satu relasi orang tua cocok"
        )
      : null,
    parentPair.length === 2 && clean.hometown
      ? createMatchKey(
          "hometown_parent_pair",
          [...parentPair, clean.hometown],
          "Asal keluarga dan pasangan orang tua cocok"
        )
      : null,
    paternalGrandparents.length === 2
      ? createMatchKey(
          "grandparent_pair",
          paternalGrandparents,
          "Pasangan kakek nenek cocok"
        )
      : null,
    maternalGrandparents.length === 2
      ? createMatchKey(
          "grandparent_pair",
          maternalGrandparents,
          "Pasangan kakek nenek cocok"
        )
      : null,
    parentPair.length === 2 && siblingNames.length >= 2
      ? createMatchKey(
          "sibling_group",
          [...parentPair, ...siblingNames],
          "Kelompok saudara cocok"
        )
      : null,
    clean.documentNumber
      ? createMatchKey(
          "document_claim",
          [hashSensitiveIdentifier(clean.documentNumber)],
          "Bukti dokumen cocok"
        )
      : null,
  ]);
}

function combinations(values: string[], size: number): string[][] {
  const result: string[][] = [];
  const walk = (start: number, selected: string[]) => {
    if (selected.length === size) {
      result.push([...selected]);
      return;
    }
    for (let index = start; index < values.length; index += 1) {
      selected.push(values[index]);
      walk(index + 1, selected);
      selected.pop();
    }
  };
  walk(0, []);
  return result;
}

export function buildTreeMatchKeys(nodes: FamilyNode[]): FamilyMatchKeyDraft[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const keys: Array<FamilyMatchKeyDraft | null> = [];

  for (const node of nodes) {
    if (node.year) {
      keys.push(
        createMatchKey(
          "self_birth",
          [node.label, node.year],
          "Nama dan tahun lahir cocok"
        )
      );
    }

    const parentNames = (node.parentIds ?? [])
      .map((id) => byId.get(id)?.label)
      .filter((name): name is string => Boolean(name))
      .map(normalizeIdentityText)
      .filter(Boolean);

    for (const parentName of parentNames) {
      keys.push(
        createMatchKey(
          "child_parent",
          [node.label, parentName],
          "Satu relasi orang tua cocok"
        )
      );
    }

    for (const pair of combinations(parentNames, 2)) {
      const sorted = pair.sort((a, b) => a.localeCompare(b, "id"));
      keys.push(
        createMatchKey(
          "parent_pair",
          sorted,
          "Pasangan orang tua cocok"
        )
      );
      keys.push(
        createMatchKey(
          "child_parent_pair",
          [node.label, ...sorted],
          "Nama dan pasangan orang tua cocok"
        )
      );
    }

    for (const partnerId of node.partners ?? []) {
      const partner = byId.get(partnerId);
      if (!partner || node.id.localeCompare(partner.id) > 0) continue;
      keys.push(
        createMatchKey(
          "parent_pair",
          sortedNamePair(node.label, partner.label),
          "Pasangan orang tua cocok"
        )
      );
    }
  }

  const childrenByParentPair = new Map<string, string[]>();
  for (const node of nodes) {
    const parentNames = (node.parentIds ?? [])
      .map((id) => byId.get(id)?.label)
      .filter((name): name is string => Boolean(name))
      .map(normalizeIdentityText)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "id"));
    if (parentNames.length < 2) continue;
    const key = parentNames.slice(0, 2).join("|");
    childrenByParentPair.set(key, [
      ...(childrenByParentPair.get(key) ?? []),
      normalizeIdentityText(node.label),
    ]);
  }

  for (const [parentKey, childNames] of childrenByParentPair.entries()) {
    const children = childNames
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "id"));
    if (children.length < 2) continue;
    keys.push(
      createMatchKey(
        "sibling_group",
        [...parentKey.split("|"), ...children],
        "Kelompok saudara cocok"
      )
    );
  }

  return uniqueKeys(keys);
}

export function scoreMatchedFamilyKeys(
  submittedKeys: FamilyMatchKeyDraft[],
  storedKeys: FamilyMatchKeyDraft[]
): { score: number; reasons: string[] } {
  const submittedByKey = new Map(
    submittedKeys.map((key) => [`${key.keyType}:${key.keyHash}`, key])
  );
  const reasons = new Set<string>();
  let score = 0;

  for (const stored of storedKeys) {
    const submitted = submittedByKey.get(`${stored.keyType}:${stored.keyHash}`);
    if (!submitted) continue;
    score += Math.max(stored.weight, submitted.weight);
    reasons.add(submitted.reason);
  }

  return { score, reasons: Array.from(reasons) };
}

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Keluarga";
  if (parts.length === 1) return `${parts[0][0]?.toUpperCase() ?? "K"}.`;
  return `${parts[0]} ${parts[1][0]?.toUpperCase() ?? ""}.`.trim();
}

function requestSummary(input: DiscoveryProfileInput) {
  const clean = sanitizeDiscoveryProfile(input);
  return {
    personName: clean.personName,
    birthYear: clean.birthYear ?? null,
    fatherName: clean.fatherName ?? null,
    motherName: clean.motherName ?? null,
    hometown: clean.hometown ?? null,
    siblingCount: clean.siblingNames?.length ?? 0,
  };
}

async function readTreeNodesForIdentity(
  tx: Prisma.TransactionClient,
  treeId: string
): Promise<FamilyNode[]> {
  const [nodes, edges] = await Promise.all([
    tx.node.findMany({ where: { treeId } }),
    tx.edge.findMany({ where: { treeId } }),
  ]);

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
    siblingOrder: n.siblingOrder,
  }));
  const dbEdges: DbEdge[] = edges.map((e) => ({
    fromId: e.fromId,
    toId: e.toId,
    kind: e.kind as DbEdge["kind"],
    startYear: e.startYear,
    endYear: e.endYear,
    metadata: (e.metadata as Record<string, unknown>) ?? {},
  }));

  return deserializeRowsToTree({ nodes: dbNodes, edges: dbEdges });
}

export async function syncFamilyIdentityForTreeTx(
  tx: Prisma.TransactionClient,
  treeId: string
): Promise<string | null> {
  const tree = await tx.tree.findUnique({
    where: { id: treeId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      familyIdentityId: true,
      deletedAt: true,
    },
  });
  if (!tree || tree.deletedAt) return null;

  let familyIdentityId = tree.familyIdentityId;
  if (!familyIdentityId) {
    const existing = await tx.familyIdentity.findUnique({
      where: { canonicalTreeId: tree.id },
      select: { id: true },
    });

    if (existing) {
      familyIdentityId = existing.id;
    } else {
      const created = await tx.familyIdentity.create({
        data: {
          displayName: tree.name,
          canonicalTreeId: tree.id,
          createdById: tree.ownerId,
        },
        select: { id: true },
      });
      familyIdentityId = created.id;
    }

    await tx.tree.update({
      where: { id: tree.id },
      data: { familyIdentityId },
    });
  }

  const nodes = await readTreeNodesForIdentity(tx, tree.id);
  const keys = buildTreeMatchKeys(nodes);
  await tx.familyMatchKey.deleteMany({ where: { familyIdentityId } });
  if (keys.length > 0) {
    await tx.familyMatchKey.createMany({
      data: keys.map((key) => ({
        familyIdentityId: familyIdentityId!,
        keyType: key.keyType,
        keyHash: key.keyHash,
        weight: key.weight,
      })),
      skipDuplicates: true,
    });
  }

  return familyIdentityId;
}

export async function syncFamilyIdentityForTree(treeId: string): Promise<void> {
  await prisma.$transaction((tx) => syncFamilyIdentityForTreeTx(tx, treeId));
}

async function backfillRecentFamilyIdentities(): Promise<void> {
  const trees = await prisma.tree.findMany({
    where: { familyIdentityId: null, deletedAt: null },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
    take: BACKFILL_LIMIT,
  });

  for (const tree of trees) {
    await syncFamilyIdentityForTree(tree.id).catch((error) => {
      console.error("family identity backfill failed", tree.id, error);
    });
  }
}

export async function saveFamilyDiscoveryProfile(
  userId: string,
  input: DiscoveryProfileInput
) {
  const clean = sanitizeDiscoveryProfile(input);
  if (!clean.personName) {
    throw new FamilyIdentityError("Nama diri wajib diisi");
  }
  if (!clean.consentAccepted) {
    throw new FamilyIdentityError("Persetujuan pencocokan keluarga wajib diisi");
  }

  const now = new Date();
  const retentionUntil = new Date(
    now.getTime() + PROFILE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  return prisma.familyDiscoveryProfile.upsert({
    where: { userId },
    create: {
      userId,
      personName: clean.personName,
      birthYear: clean.birthYear ?? null,
      fatherName: clean.fatherName,
      motherName: clean.motherName,
      paternalGrandfatherName: clean.paternalGrandfatherName,
      paternalGrandmotherName: clean.paternalGrandmotherName,
      maternalGrandfatherName: clean.maternalGrandfatherName,
      maternalGrandmotherName: clean.maternalGrandmotherName,
      hometown: clean.hometown,
      siblingNames: clean.siblingNames ?? [],
      profileHash: profileHash(clean),
      consentAcceptedAt: now,
      retentionUntil,
    },
    update: {
      personName: clean.personName,
      birthYear: clean.birthYear ?? null,
      fatherName: clean.fatherName,
      motherName: clean.motherName,
      paternalGrandfatherName: clean.paternalGrandfatherName,
      paternalGrandmotherName: clean.paternalGrandmotherName,
      maternalGrandfatherName: clean.maternalGrandfatherName,
      maternalGrandmotherName: clean.maternalGrandmotherName,
      hometown: clean.hometown,
      siblingNames: clean.siblingNames ?? [],
      profileHash: profileHash(clean),
      consentAcceptedAt: now,
      retentionUntil,
    },
  });
}

async function loadDiscoveryProfile(
  userId: string
): Promise<DiscoveryProfileInput | null> {
  const profile = await prisma.familyDiscoveryProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;
  return {
    personName: profile.personName,
    birthYear: profile.birthYear,
    fatherName: profile.fatherName,
    motherName: profile.motherName,
    paternalGrandfatherName: profile.paternalGrandfatherName,
    paternalGrandmotherName: profile.paternalGrandmotherName,
    maternalGrandfatherName: profile.maternalGrandfatherName,
    maternalGrandmotherName: profile.maternalGrandmotherName,
    hometown: profile.hometown,
    siblingNames: Array.isArray(profile.siblingNames)
      ? (profile.siblingNames as string[])
      : [],
    consentAccepted: true,
  };
}

export async function findFamilyCandidatesForProfile(
  userId: string,
  input: DiscoveryProfileInput
): Promise<SafeFamilyCandidate[]> {
  await backfillRecentFamilyIdentities();

  const submittedKeys = buildDiscoveryMatchKeys(input);
  if (submittedKeys.length === 0) return [];

  const submittedByLookup = new Map(
    submittedKeys.map((key) => [`${key.keyType}:${key.keyHash}`, key])
  );
  const matches = await prisma.familyMatchKey.findMany({
    where: {
      OR: submittedKeys.map((key) => ({
        keyType: key.keyType,
        keyHash: key.keyHash,
      })),
    },
    include: {
      familyIdentity: {
        include: {
          canonicalTree: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              deletedAt: true,
              owner: { select: { name: true } },
              memberships: {
                where: { userId },
                select: { role: true },
              },
              _count: { select: { nodes: true } },
            },
          },
        },
      },
    },
  });

  const grouped = new Map<
    string,
    {
      score: number;
      reasons: Set<string>;
      identity: (typeof matches)[number]["familyIdentity"];
    }
  >();

  for (const match of matches) {
    const identity = match.familyIdentity;
    const tree = identity.canonicalTree;
    if (!tree || tree.deletedAt || identity.status !== "active") continue;
    if (tree.ownerId === userId || tree.memberships.length > 0) continue;

    const submitted = submittedByLookup.get(`${match.keyType}:${match.keyHash}`);
    if (!submitted) continue;
    const current = grouped.get(identity.id) ?? {
      score: 0,
      reasons: new Set<string>(),
      identity,
    };
    current.score += Math.max(match.weight, submitted.weight);
    current.reasons.add(submitted.reason);
    grouped.set(identity.id, current);
  }

  const visible = Array.from(grouped.values())
    .filter((candidate) => candidate.score >= DISCOVERY_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  if (visible.length === 0) return [];

  const requestStatuses = await prisma.familyAccessRequest.findMany({
    where: {
      requesterId: userId,
      familyIdentityId: { in: visible.map((candidate) => candidate.identity.id) },
    },
    select: { familyIdentityId: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const latestStatus = new Map<string, SafeFamilyCandidate["requestStatus"]>();
  for (const request of requestStatuses) {
    if (!latestStatus.has(request.familyIdentityId)) {
      latestStatus.set(
        request.familyIdentityId,
        request.status as SafeFamilyCandidate["requestStatus"]
      );
    }
  }

  return visible.map((candidate) => {
    const tree = candidate.identity.canonicalTree!;
    const maskedOwnerName = maskName(tree.owner.name);
    return {
      familyIdentityId: candidate.identity.id,
      treeId: tree.id,
      displayName: `Keluarga ${maskedOwnerName}`,
      maskedOwnerName,
      memberCount: tree._count.nodes,
      confidence: candidate.score,
      confidenceLabel:
        candidate.score >= HIGH_CONFIDENCE_SCORE ? "high" : "medium",
      matchReasons: Array.from(candidate.reasons).slice(0, 4),
      requestStatus: latestStatus.get(candidate.identity.id) ?? "none",
    };
  });
}

export async function getFamilyCandidatesForUser(
  userId: string
): Promise<SafeFamilyCandidate[]> {
  const profile = await loadDiscoveryProfile(userId);
  if (!profile) return [];
  return findFamilyCandidatesForProfile(userId, profile);
}

export async function requestFamilyAccess(input: {
  userId: string;
  familyIdentityId: string;
  treeId: string;
  requestedRole?: "editor" | "viewer";
}) {
  const profile = await loadDiscoveryProfile(input.userId);
  if (!profile) {
    throw new FamilyIdentityError("Isi profil pencocokan keluarga terlebih dahulu");
  }

  const candidates = await findFamilyCandidatesForProfile(input.userId, profile);
  const candidate = candidates.find(
    (item) =>
      item.familyIdentityId === input.familyIdentityId &&
      item.treeId === input.treeId
  );
  if (!candidate) {
    throw new FamilyIdentityError("Kandidat keluarga tidak tersedia", 404);
  }

  const existingApproved = await prisma.familyAccessRequest.findFirst({
    where: {
      requesterId: input.userId,
      treeId: input.treeId,
      status: "approved",
    },
    select: { id: true, status: true },
  });
  if (existingApproved) return existingApproved;

  return prisma.familyAccessRequest.upsert({
    where: {
      treeId_requesterId_status: {
        treeId: input.treeId,
        requesterId: input.userId,
        status: "pending",
      },
    },
    create: {
      familyIdentityId: input.familyIdentityId,
      treeId: input.treeId,
      requesterId: input.userId,
      requestedRole: input.requestedRole ?? "editor",
      confidence: candidate.confidence,
      matchReasons: candidate.matchReasons,
      requesterSummary: requestSummary(profile),
    },
    update: {
      requestedRole: input.requestedRole ?? "editor",
      confidence: candidate.confidence,
      matchReasons: candidate.matchReasons,
      requesterSummary: requestSummary(profile),
    },
    select: { id: true, status: true },
  });
}

export async function listFamilyAccessRequests(userId: string) {
  const [incoming, outgoing] = await Promise.all([
    prisma.familyAccessRequest.findMany({
      where: {
        status: "pending",
        tree: { ownerId: userId, deletedAt: null },
      },
      include: {
        tree: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.familyAccessRequest.findMany({
      where: { requesterId: userId },
      include: {
        tree: {
          select: {
            id: true,
            name: true,
            owner: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  return {
    incoming: incoming.map((request) => ({
      id: request.id,
      treeId: request.treeId,
      treeName: request.tree.name,
      requesterName: request.requester.name,
      requesterEmail: request.requester.email,
      requestedRole: request.requestedRole,
      confidence: request.confidence,
      matchReasons: request.matchReasons,
      requesterSummary: request.requesterSummary,
      createdAt: request.createdAt.toISOString(),
    })),
    outgoing: outgoing.map((request) => ({
      id: request.id,
      treeId: request.treeId,
      treeName: request.tree.name,
      ownerName: maskName(request.tree.owner.name),
      status: request.status,
      requestedRole: request.requestedRole,
      confidence: request.confidence,
      createdAt: request.createdAt.toISOString(),
      reviewedAt: request.reviewedAt?.toISOString() ?? null,
    })),
  };
}

export async function reviewFamilyAccessRequest(input: {
  ownerId: string;
  requestId: string;
  decision: "approved" | "rejected";
  role?: "editor" | "viewer";
}) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.familyAccessRequest.findUnique({
      where: { id: input.requestId },
      include: { tree: { select: { id: true, ownerId: true, name: true } } },
    });
    if (!request) throw new FamilyIdentityError("Request tidak ditemukan", 404);
    if (request.tree.ownerId !== input.ownerId) {
      throw new FamilyIdentityError("Hanya owner pohon yang bisa review request", 403);
    }
    if (request.requesterId === input.ownerId) {
      throw new FamilyIdentityError("Owner tidak bisa approve request sendiri", 403);
    }

    if (request.status !== "pending") {
      return { id: request.id, status: request.status, treeId: request.treeId };
    }

    const role = input.role ?? (request.requestedRole as "editor" | "viewer");
    if (input.decision === "approved") {
      await tx.treeMember.upsert({
        where: {
          treeId_userId: {
            treeId: request.treeId,
            userId: request.requesterId,
          },
        },
        create: {
          treeId: request.treeId,
          userId: request.requesterId,
          role,
        },
        update: { role },
      });
    }

    const updated = await tx.familyAccessRequest.update({
      where: { id: request.id },
      data: {
        status: input.decision,
        requestedRole: role,
        reviewedById: input.ownerId,
        reviewedAt: new Date(),
      },
      select: { id: true, status: true, treeId: true },
    });
    return updated;
  });
}

export async function createFamilyEvidence(input: {
  userId: string;
  kind: "kk" | "nik" | "family_document" | "profile_claim" | "other";
  documentValue?: string | null;
  documentHash?: string | null;
  storageBucket?: string | null;
  storageKey?: string | null;
  familyIdentityId?: string | null;
  accessRequestId?: string | null;
  retentionUntil?: Date | null;
  metadata?: Record<string, unknown>;
}) {
  const documentHash = input.documentValue
    ? hashSensitiveIdentifier(input.documentValue)
    : safeString(input.documentHash);

  if (!documentHash && !input.storageKey) {
    throw new FamilyIdentityError("Evidence harus berisi hash atau storage key");
  }

  if (input.accessRequestId) {
    const request = await prisma.familyAccessRequest.findUnique({
      where: { id: input.accessRequestId },
      include: { tree: { select: { ownerId: true } } },
    });
    if (!request) throw new FamilyIdentityError("Request tidak ditemukan", 404);
    if (
      request.requesterId !== input.userId &&
      request.tree.ownerId !== input.userId
    ) {
      throw new FamilyIdentityError("Tidak punya akses ke evidence request ini", 403);
    }
  }

  if (input.familyIdentityId && !input.accessRequestId) {
    const identity = await prisma.familyIdentity.findUnique({
      where: { id: input.familyIdentityId },
      include: { canonicalTree: { select: { ownerId: true } } },
    });
    if (!identity) throw new FamilyIdentityError("Family identity tidak ditemukan", 404);
    if (identity.canonicalTree?.ownerId !== input.userId) {
      throw new FamilyIdentityError("Hanya owner yang bisa menambah evidence keluarga", 403);
    }
  }

  return prisma.familyEvidence.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      documentHash,
      storageBucket: safeString(input.storageBucket),
      storageKey: safeString(input.storageKey),
      familyIdentityId: input.familyIdentityId ?? null,
      accessRequestId: input.accessRequestId ?? null,
      retentionUntil: input.retentionUntil ?? null,
      consentAcceptedAt: new Date(),
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    select: { id: true, createdAt: true },
  });
}
