import type { FamilyGraph, FamilyNode, FamilyUnion } from "../types/tree";
import { buildFamilyGraph } from "./familyGraph";

export type RadialViewMode = "ancestors" | "descendants" | "family";

export type RadialRelation =
  | "focus"
  | "ancestor"
  | "descendant"
  | "partner"
  | "collateral"
  | "unknown";

export type RadialPerson = {
  node: FamilyNode;
  depth: number;
  relation: RadialRelation;
};

const DEFAULT_MAX_DEPTH = 3;

function placeholderNode(id: string, label: string): FamilyNode {
  return {
    id,
    label,
    year: null,
    deathYear: null,
    parentId: null,
    parentIds: [],
    adoptiveParentIds: [],
    partners: [],
    childrenIds: [],
    generation: 0,
    line: "default",
    imageUrl: null,
    content: { description: "", media: [] },
    works: [],
  };
}

function parentUnitsByChild(graph: FamilyGraph) {
  const unions = new Map(graph.unions.map((union) => [union.id, union]));
  const result = new Map<string, FamilyUnion[]>();

  for (const link of graph.parentChildLinks) {
    const unit = unions.get(link.parentUnitId);
    if (!unit) continue;
    result.set(link.childId, [...(result.get(link.childId) || []), unit]);
  }

  return result;
}

function childrenByParent(graph: FamilyGraph) {
  const unions = new Map(graph.unions.map((union) => [union.id, union]));
  const result = new Map<string, Set<string>>();

  for (const link of graph.parentChildLinks) {
    const unit = unions.get(link.parentUnitId);
    if (!unit) continue;
    for (const parentId of unit.partnerIds) {
      const children = result.get(parentId) || new Set<string>();
      children.add(link.childId);
      result.set(parentId, children);
    }
  }

  return result;
}

function connectedPersonIds(graph: FamilyGraph, focusId: string) {
  const adjacency = new Map<string, Set<string>>();
  const connect = (left: string, right: string) => {
    const leftLinks = adjacency.get(left) || new Set<string>();
    const rightLinks = adjacency.get(right) || new Set<string>();
    leftLinks.add(right);
    rightLinks.add(left);
    adjacency.set(left, leftLinks);
    adjacency.set(right, rightLinks);
  };
  const unions = new Map(graph.unions.map((union) => [union.id, union]));

  for (const union of graph.unions) {
    for (const left of union.partnerIds) {
      for (const right of union.partnerIds) {
        if (left !== right) connect(left, right);
      }
    }
  }
  for (const link of graph.parentChildLinks) {
    for (const parentId of unions.get(link.parentUnitId)?.partnerIds || []) {
      connect(parentId, link.childId);
    }
  }

  const visited = new Set([focusId]);
  const queue = [focusId];
  while (queue.length > 0) {
    const personId = queue.shift()!;
    for (const linkedId of adjacency.get(personId) || []) {
      if (visited.has(linkedId)) continue;
      visited.add(linkedId);
      queue.push(linkedId);
    }
  }
  return visited;
}

function resolveAncestors(
  graph: FamilyGraph,
  focusId: string,
  maxDepth: number,
  includeUnknown: boolean
) {
  const persons = new Map(graph.persons.map((person) => [person.id, person]));
  const unitsByChild = parentUnitsByChild(graph);
  const result: RadialPerson[] = [];
  let frontier = [focusId];

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const next: string[] = [];
    for (const childId of frontier) {
      const units = unitsByChild.get(childId) || [];
      const parentIds = Array.from(
        new Set(units.flatMap((unit) => unit.partnerIds).filter((id) => persons.has(id)))
      );

      for (const parentId of parentIds) {
        const node = persons.get(parentId);
        if (!node || result.some((entry) => entry.node.id === parentId)) continue;
        result.push({ node, depth, relation: "ancestor" });
        next.push(parentId);
      }

      if (includeUnknown && parentIds.length < 2) {
        for (let slot = parentIds.length; slot < 2; slot += 1) {
          result.push({
            node: placeholderNode(
              `radial-unknown-${childId}-${depth}-${slot}`,
              "Orang tua belum diketahui"
            ),
            depth,
            relation: "unknown",
          });
        }
      }
    }
    frontier = next;
  }

  return result;
}

function resolveDescendants(
  graph: FamilyGraph,
  focusId: string,
  maxDepth: number
) {
  const persons = new Map(graph.persons.map((person) => [person.id, person]));
  const childIdsByParent = childrenByParent(graph);
  const result: RadialPerson[] = [];
  let frontier = [focusId];

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const next: string[] = [];
    for (const parentId of frontier) {
      for (const childId of childIdsByParent.get(parentId) || []) {
        const node = persons.get(childId);
        if (!node || result.some((entry) => entry.node.id === childId)) continue;
        result.push({ node, depth, relation: "descendant" });
        next.push(childId);
      }
    }
    frontier = next;
  }

  return result;
}

export function resolveRadialPeople(
  nodes: FamilyNode[],
  focusId: string,
  mode: RadialViewMode,
  graph: FamilyGraph = buildFamilyGraph(nodes),
  maxDepth = DEFAULT_MAX_DEPTH
): RadialPerson[] {
  const persons = new Map(graph.persons.map((person) => [person.id, person]));
  const focus = persons.get(focusId);
  if (!focus) return [];

  if (mode === "ancestors") {
    return [
      { node: focus, depth: 0, relation: "focus" },
      ...resolveAncestors(graph, focusId, maxDepth, true),
    ];
  }

  if (mode === "descendants") {
    return [
      { node: focus, depth: 0, relation: "focus" },
      ...resolveDescendants(graph, focusId, maxDepth),
    ];
  }

  const ancestors = resolveAncestors(graph, focusId, maxDepth, false);
  const descendants = resolveDescendants(graph, focusId, maxDepth);
  const directIds = new Set([
    focusId,
    ...ancestors.map((entry) => entry.node.id),
    ...descendants.map((entry) => entry.node.id),
  ]);
  const connectedIds = connectedPersonIds(graph, focusId);
  const partnerIds = new Set(focus.partners || []);
  const collateral = graph.persons
    .filter(
      (person) =>
        connectedIds.has(person.id) &&
        !directIds.has(person.id) &&
        !partnerIds.has(person.id)
    )
    .map((node) => ({ node, depth: 1, relation: "collateral" as const }));
  const partners = Array.from(partnerIds)
    .map((id) => persons.get(id))
    .filter((node): node is FamilyNode => Boolean(node))
    .map((node) => ({ node, depth: 0, relation: "partner" as const }));

  return [
    { node: focus, depth: 0, relation: "focus" },
    ...ancestors,
    ...descendants,
    ...partners,
    ...collateral,
  ];
}
