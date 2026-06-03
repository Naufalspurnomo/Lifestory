// Persistence adapter: translates between FamilyNode[] (app runtime shape)
// and the relational {Node, Edge} rows Prisma manages.
//
// Design:
// - A `Node` row stores only per-person facts.
// - Every relationship is a row in `Edge` with an explicit `kind`. This keeps
//   remarriage, adoption, divorce, and partnerships cleanly separable — not
//   collapsed into a single "parentIds" array.
//
// Edge kinds:
//   biological-parent : fromId is the biological parent of toId
//   adoptive-parent   : fromId is the adoptive/guardian parent of toId
//   partner           : bidirectional; stored once with canonical ordering
//   ex-partner        : historical partnership; preserved for later divorce UI

import type { FamilyNode, NodeContent, MediaItem, WorkItem } from "../types/tree";

export type DbNode = {
  id: string;
  label: string;
  sex: string | null;
  birthYear: number | null;
  deathYear: number | null;
  line: string;
  imageUrl: string | null;
  imageStorageKey: string | null;
  imageMimeType: string | null;
  imageSizeBytes: number | null;
  description: string;
  media: unknown;
  works: unknown;
  socialInstagram: string | null;
  socialTiktok: string | null;
  socialLinkedin: string | null;
  generationCached: number;
};

export type DbEdge = {
  fromId: string;
  toId: string;
  kind:
    | "biological-parent"
    | "adoptive-parent"
    | "partner"
    | "ex-partner";
  startYear?: number | null;
  endYear?: number | null;
};

export type DbTreeSnapshot = {
  nodes: DbNode[];
  edges: DbEdge[];
};

const uniq = <T>(arr: T[]): T[] =>
  Array.from(new Set(arr.filter((v): v is T => Boolean(v))));

const parseJsonArray = <T>(raw: unknown, guard: (v: unknown) => v is T): T[] => {
  if (Array.isArray(raw)) return raw.filter(guard);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(guard) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const isMediaItem = (v: unknown): v is MediaItem =>
  typeof v === "object" &&
  v !== null &&
  "type" in (v as any) &&
  "url" in (v as any);

const isWorkItem = (v: unknown): v is WorkItem =>
  typeof v === "object" && v !== null && "type" in (v as any);

function partnerKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

// ---------- Convert FamilyNode[] -> DB snapshot ----------

export function serializeTreeToRows(nodes: FamilyNode[]): DbTreeSnapshot {
  const dbNodes: DbNode[] = nodes.map((n) => ({
    id: n.id,
    label: n.label,
    sex: n.sex ?? null,
    birthYear: n.year ?? null,
    deathYear: n.deathYear ?? null,
    line: n.line || "default",
    imageUrl: n.imageUrl ?? null,
    imageStorageKey: n.imageStorageKey ?? null,
    imageMimeType: n.imageMimeType ?? null,
    imageSizeBytes: n.imageSizeBytes ?? null,
    description: n.content?.description ?? "",
    media: n.content?.media ?? [],
    works: n.works ?? [],
    socialInstagram: n.content?.instagram ?? null,
    socialTiktok: n.content?.tiktok ?? null,
    socialLinkedin: n.content?.linkedin ?? null,
    generationCached: n.generation ?? 0,
  }));

  const seenPartner = new Set<string>();
  const edges: DbEdge[] = [];

  for (const n of nodes) {
    const bioParents = uniq([
      ...(n.parentIds || []),
      ...(n.parentId ? [n.parentId] : []),
    ]);
    for (const parentId of bioParents) {
      edges.push({ fromId: parentId, toId: n.id, kind: "biological-parent" });
    }

    for (const adoptiveId of uniq(n.adoptiveParentIds || [])) {
      // Don't duplicate if already biological.
      if (bioParents.includes(adoptiveId)) continue;
      edges.push({ fromId: adoptiveId, toId: n.id, kind: "adoptive-parent" });
    }

    for (const partnerId of uniq(n.partners || [])) {
      const [a, b] = partnerKey(n.id, partnerId);
      const key = `${a}::${b}`;
      if (seenPartner.has(key)) continue;
      seenPartner.add(key);
      edges.push({ fromId: a, toId: b, kind: "partner" });
    }
  }

  return { nodes: dbNodes, edges };
}

// ---------- Convert DB snapshot -> FamilyNode[] ----------

export function deserializeRowsToTree(
  snapshot: DbTreeSnapshot
): FamilyNode[] {
  const byId = new Map<string, FamilyNode>();

  for (const row of snapshot.nodes) {
    const content: NodeContent = {
      description: row.description || "",
      media: parseJsonArray(row.media, isMediaItem),
      ...(row.socialInstagram ? { instagram: row.socialInstagram } : {}),
      ...(row.socialTiktok ? { tiktok: row.socialTiktok } : {}),
      ...(row.socialLinkedin ? { linkedin: row.socialLinkedin } : {}),
    };

    byId.set(row.id, {
      id: row.id,
      label: row.label,
      sex:
        row.sex === "M" || row.sex === "F" || row.sex === "X"
          ? row.sex
          : undefined,
      year: row.birthYear,
      deathYear: row.deathYear,
      parentId: null,
      parentIds: [],
      adoptiveParentIds: [],
      partners: [],
      childrenIds: [],
      generation: row.generationCached ?? 0,
      line: (row.line as FamilyNode["line"]) || "default",
      imageUrl: row.imageUrl,
      imageStorageKey: row.imageStorageKey,
      imageMimeType: row.imageMimeType,
      imageSizeBytes: row.imageSizeBytes,
      content,
      works: parseJsonArray(row.works, isWorkItem),
    });
  }

  for (const edge of snapshot.edges) {
    if (edge.kind === "biological-parent") {
      const parent = byId.get(edge.fromId);
      const child = byId.get(edge.toId);
      if (!parent || !child) continue;
      parent.childrenIds = uniq([...parent.childrenIds, child.id]);
      child.parentIds = uniq([...(child.parentIds || []), parent.id]);
      child.parentId = child.parentIds[0] ?? null;
    } else if (edge.kind === "adoptive-parent") {
      const parent = byId.get(edge.fromId);
      const child = byId.get(edge.toId);
      if (!parent || !child) continue;
      child.adoptiveParentIds = uniq([
        ...(child.adoptiveParentIds || []),
        parent.id,
      ]);
    } else if (edge.kind === "partner") {
      const a = byId.get(edge.fromId);
      const b = byId.get(edge.toId);
      if (!a || !b) continue;
      a.partners = uniq([...a.partners, b.id]);
      b.partners = uniq([...b.partners, a.id]);
    }
    // "ex-partner" intentionally not projected onto the live graph yet.
  }

  return Array.from(byId.values());
}

// Round-trip helper: serialize then deserialize. Useful as a sanity test.
export function roundTripTree(nodes: FamilyNode[]): FamilyNode[] {
  return deserializeRowsToTree(serializeTreeToRows(nodes));
}
