// Shared tree builders for real-family fixtures. Keeps fixture files concise
// and readable.

import type { FamilyNode } from "../../../lib/types/tree";

export function node(
  id: string,
  label: string,
  extra: Partial<FamilyNode> = {}
): FamilyNode {
  return {
    id,
    label,
    sex: extra.sex ?? "X",
    year: extra.year ?? null,
    deathYear: extra.deathYear ?? null,
    parentId: null,
    parentIds: [],
    adoptiveParentIds: [],
    partners: [],
    childrenIds: [],
    generation: extra.generation ?? 0,
    line: extra.line ?? "default",
    imageUrl: extra.imageUrl ?? null,
    content: extra.content ?? { description: "", media: [] },
    works: extra.works,
  };
}

const uniq = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean)));

export type TreeBuilder = {
  add: (n: FamilyNode) => void;
  get: (id: string) => FamilyNode;
  nodes: () => FamilyNode[];
};

export function buildTree(): TreeBuilder {
  const list: FamilyNode[] = [];
  const byId = new Map<string, FamilyNode>();
  return {
    add(n) {
      if (byId.has(n.id)) return;
      list.push(n);
      byId.set(n.id, n);
    },
    get(id) {
      const found = byId.get(id);
      if (!found) throw new Error(`Builder missing node "${id}"`);
      return found;
    },
    nodes() {
      return list;
    },
  };
}

export const link = {
  partner(b: TreeBuilder, a: string, c: string) {
    const left = b.get(a);
    const right = b.get(c);
    left.partners = uniq([...left.partners, c]);
    right.partners = uniq([...right.partners, a]);
  },
  child(b: TreeBuilder, parentIds: string[], childId: string) {
    const child = b.get(childId);
    child.parentIds = uniq([...(child.parentIds || []), ...parentIds]);
    child.parentId = child.parentIds[0] ?? null;
    for (const pid of parentIds) {
      const parent = b.get(pid);
      parent.childrenIds = uniq([...parent.childrenIds, childId]);
    }
  },
  adopt(b: TreeBuilder, adoptiveParentIds: string[], childId: string) {
    const child = b.get(childId);
    child.adoptiveParentIds = uniq([
      ...(child.adoptiveParentIds || []),
      ...adoptiveParentIds,
    ]);
  },
};
