import type { FamilyGraph, FamilyNode } from "../types/tree";
import { buildFamilyGraph } from "./familyGraph";

export type TreeFocusContext = {
  nodeIds: Set<string>;
  unionIds: Set<string>;
  entityIds: Set<string>;
};

export function resolveTreeFocusContext(
  nodes: FamilyNode[],
  focusId: string,
  graph: FamilyGraph = buildFamilyGraph(nodes)
): TreeFocusContext {
  const nodeIds = new Set<string>();
  const unionIds = new Set<string>();
  const persons = new Set(graph.persons.map((person) => person.id));
  if (!persons.has(focusId)) {
    return { nodeIds, unionIds, entityIds: new Set<string>() };
  }

  const unionsById = new Map(graph.unions.map((union) => [union.id, union]));
  const parentLinksByChild = new Map<string, typeof graph.parentChildLinks>();
  const childLinksByParent = new Map<string, typeof graph.parentChildLinks>();

  for (const link of graph.parentChildLinks) {
    parentLinksByChild.set(link.childId, [
      ...(parentLinksByChild.get(link.childId) || []),
      link,
    ]);
    const unit = unionsById.get(link.parentUnitId);
    for (const parentId of unit?.partnerIds || []) {
      childLinksByParent.set(parentId, [
        ...(childLinksByParent.get(parentId) || []),
        link,
      ]);
    }
  }

  const ancestorQueue = [focusId];
  const seenAncestors = new Set(ancestorQueue);
  while (ancestorQueue.length > 0) {
    const childId = ancestorQueue.shift()!;
    nodeIds.add(childId);
    for (const link of parentLinksByChild.get(childId) || []) {
      unionIds.add(link.parentUnitId);
      for (const parentId of unionsById.get(link.parentUnitId)?.partnerIds || []) {
        nodeIds.add(parentId);
        if (!seenAncestors.has(parentId)) {
          seenAncestors.add(parentId);
          ancestorQueue.push(parentId);
        }
      }
    }
  }

  const descendantQueue = [focusId];
  const seenDescendants = new Set(descendantQueue);
  while (descendantQueue.length > 0) {
    const parentId = descendantQueue.shift()!;
    nodeIds.add(parentId);
    for (const link of childLinksByParent.get(parentId) || []) {
      const unit = unionsById.get(link.parentUnitId);
      unionIds.add(link.parentUnitId);
      for (const partnerId of unit?.partnerIds || []) nodeIds.add(partnerId);
      nodeIds.add(link.childId);
      if (!seenDescendants.has(link.childId)) {
        seenDescendants.add(link.childId);
        descendantQueue.push(link.childId);
      }
    }
  }

  for (const union of graph.unions) {
    if (union.partnerIds.includes(focusId)) {
      unionIds.add(union.id);
      for (const partnerId of union.partnerIds) nodeIds.add(partnerId);
    }
  }

  return {
    nodeIds,
    unionIds,
    entityIds: new Set([...nodeIds, ...unionIds]),
  };
}
