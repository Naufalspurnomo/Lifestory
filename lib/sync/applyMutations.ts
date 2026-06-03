import type { FamilyNode } from "../types/tree";

type NodeMutation = {
  type: "add" | "update" | "delete";
  nodeId: string;
  payload: FamilyNode | null;
  previousPayload?: FamilyNode | null;
};

const SET_FIELDS = new Set<keyof FamilyNode>([
  "parentIds",
  "adoptiveParentIds",
  "partners",
  "childrenIds",
]);

function stableValue(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function applySetDelta(
  currentValue: unknown,
  previousValue: unknown,
  nextValue: unknown
): unknown {
  if (
    !Array.isArray(currentValue) ||
    !Array.isArray(previousValue) ||
    !Array.isArray(nextValue)
  ) {
    return nextValue;
  }

  const previous = new Set(previousValue as string[]);
  const next = new Set(nextValue as string[]);
  const removed = new Set(
    [...previous].filter((value) => !next.has(value))
  );
  const merged = (currentValue as string[]).filter(
    (value) => !removed.has(value)
  );
  for (const value of nextValue as string[]) {
    if (!previous.has(value) && !merged.includes(value)) merged.push(value);
  }
  return merged;
}

function mergeNodeUpdate(
  current: FamilyNode,
  previous: FamilyNode,
  next: FamilyNode
): FamilyNode {
  const merged = { ...current };
  const fields = new Set<keyof FamilyNode>([
    ...(Object.keys(previous) as Array<keyof FamilyNode>),
    ...(Object.keys(next) as Array<keyof FamilyNode>),
  ]);
  for (const field of fields) {
    if (field === "id" || field === "x" || field === "y") continue;
    const previousValue = previous[field];
    const nextValue = next[field];
    if (stableValue(previousValue) === stableValue(nextValue)) continue;
    (merged as unknown as Record<string, unknown>)[field] = SET_FIELDS.has(field)
      ? applySetDelta(current[field], previousValue, nextValue)
      : nextValue;
  }
  return merged;
}

export function deleteNodeFromGraph(
  byId: Map<string, FamilyNode>,
  nodeId: string
): void {
  byId.delete(nodeId);
  for (const node of byId.values()) {
    node.parentIds = (node.parentIds || []).filter((id) => id !== nodeId);
    node.parentId =
      node.parentId === nodeId ? node.parentIds[0] ?? null : node.parentId;
    node.adoptiveParentIds = (node.adoptiveParentIds || []).filter(
      (id) => id !== nodeId
    );
    node.partners = (node.partners || []).filter((id) => id !== nodeId);
    node.childrenIds = (node.childrenIds || []).filter((id) => id !== nodeId);
  }
}

export function applyNodeMutation(
  byId: Map<string, FamilyNode>,
  mutation: NodeMutation
): void {
  if (mutation.type === "delete") {
    deleteNodeFromGraph(byId, mutation.nodeId);
    return;
  }
  if (!mutation.payload) return;

  const current = byId.get(mutation.nodeId);
  if (
    mutation.type === "add" ||
    !current ||
    !mutation.previousPayload
  ) {
    byId.set(mutation.nodeId, mutation.payload);
    return;
  }

  byId.set(
    mutation.nodeId,
    mergeNodeUpdate(current, mutation.previousPayload, mutation.payload)
  );
}

export function applyNodeMutations(
  nodes: FamilyNode[],
  mutations: NodeMutation[]
): FamilyNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  for (const mutation of mutations) applyNodeMutation(byId, mutation);
  return Array.from(byId.values());
}
