import type { FamilyNode } from "../types/tree";

export type SiblingBranch = {
  id: string;
  nodeIds: string[];
  siblingNodeIds: string[];
};

export type SiblingBranchGroup = {
  parentKey: string;
  sourceBranchId: string;
  branches: SiblingBranch[];
};

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function parentKey(node: FamilyNode) {
  return uniq([
    ...(node.parentIds || []),
    ...(node.parentId ? [node.parentId] : []),
  ])
    .sort()
    .join("::");
}

function collectPartnerBranch(
  byId: Map<string, FamilyNode>,
  startId: string
): string[] {
  const visited = new Set<string>();
  const queue = [startId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = byId.get(currentId);
    if (!current) continue;
    for (const partnerId of current.partners || []) {
      if (byId.has(partnerId) && !visited.has(partnerId)) {
        queue.push(partnerId);
      }
    }
  }

  return Array.from(visited).sort();
}

export function getSiblingBranchGroup(
  nodes: FamilyNode[],
  sourceNodeId: string
): SiblingBranchGroup | null {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let source = byId.get(sourceNodeId);
  if (!source) return null;

  let sourceParentKey = parentKey(source);

  // Jika node yang di-drag tidak punya orang tua (contoh: pasangan / menantu),
  // cek apakah mereka menikah dengan orang yang punya orang tua sedarah.
  // Jika ya, kita oper sumber drag-nya ke orang tersebut agar sekeluarga ikut ter-drag.
  if (!sourceParentKey && source.partners && source.partners.length > 0) {
    for (const partnerId of source.partners) {
      const partner = byId.get(partnerId);
      if (partner) {
        const partnerParentKey = parentKey(partner);
        if (partnerParentKey) {
          source = partner;
          sourceNodeId = partner.id;
          sourceParentKey = partnerParentKey;
          break;
        }
      }
    }
  }

  if (!sourceParentKey) return null;

  const branches = new Map<string, SiblingBranch>();
  for (const sibling of nodes) {
    if (parentKey(sibling) !== sourceParentKey) continue;

    const nodeIds = collectPartnerBranch(byId, sibling.id);
    const id = nodeIds.join("::");
    const existing = branches.get(id);
    const siblingNodeIds = uniq([
      ...(existing?.siblingNodeIds || []),
      sibling.id,
    ]).sort();
    branches.set(id, { id, nodeIds, siblingNodeIds });
  }

  const sourceBranchId = collectPartnerBranch(byId, sourceNodeId).join("::");
  if (!branches.has(sourceBranchId) || branches.size < 2) return null;

  return {
    parentKey: sourceParentKey,
    sourceBranchId,
    branches: Array.from(branches.values()),
  };
}

export function getSiblingOrderUpdates(
  nodes: FamilyNode[],
  sourceNodeId: string,
  orderedBranchIds: string[]
): { nodeId: string; data: Pick<FamilyNode, "siblingOrder"> }[] {
  const group = getSiblingBranchGroup(nodes, sourceNodeId);
  if (!group) return [];

  const expected = new Set(group.branches.map((branch) => branch.id));
  if (
    orderedBranchIds.length !== expected.size ||
    new Set(orderedBranchIds).size !== expected.size ||
    orderedBranchIds.some((id) => !expected.has(id))
  ) {
    return [];
  }

  const branchById = new Map(group.branches.map((branch) => [branch.id, branch]));
  return orderedBranchIds.flatMap((branchId, index) => {
    const branch = branchById.get(branchId);
    if (!branch) return [];
    return branch.siblingNodeIds.map((nodeId) => ({
      nodeId,
      data: { siblingOrder: index },
    }));
  });
}
