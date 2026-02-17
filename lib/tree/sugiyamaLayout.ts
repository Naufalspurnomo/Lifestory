import { FamilyNode, LayoutEdge, LayoutGraph } from "../types/tree";

const NODE_DIAMETER = 70;
const NODE_SPACING_X = 126;
const PARTNER_SPACING_X = 92;
const ROW_GAP = 150;
const GROUP_GAP = 72;
const PADDING_X = 120;
const PADDING_Y = 80;

type RuntimeNode = {
  id: string;
  node: FamilyNode;
  index: number;
  generation: number;
  parents: string[];
  partners: string[];
  children: string[];
  x: number;
  y: number;
};

type UnionNode = {
  id: string;
  partnerIds: string[];
  childIds: string[];
  generation: number;
  x: number;
  y: number;
};

type RowGroup = {
  ids: string[];
  parentKey: string;
  minIndex: number;
  anchor: number;
};

function uniq(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v))));
}

function sorted(ids: string[], runtime: Map<string, RuntimeNode>): string[] {
  return [...ids].sort(
    (a, b) => (runtime.get(a)?.index ?? Number.MAX_SAFE_INTEGER) - (runtime.get(b)?.index ?? Number.MAX_SAFE_INTEGER)
  );
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

function canonicalParentKey(parentIds: string[]): string {
  return [...parentIds].sort().join("|");
}

function pickPartnerInRow(
  id: string,
  rowSet: Set<string>,
  used: Set<string>,
  runtime: Map<string, RuntimeNode>
): string | null {
  const node = runtime.get(id);
  if (!node) return null;

  const candidates = node.partners.filter((partnerId) => rowSet.has(partnerId) && !used.has(partnerId));
  if (!candidates.length) return null;

  return candidates.sort((a, b) => (runtime.get(a)?.index ?? 0) - (runtime.get(b)?.index ?? 0))[0];
}

function orderPair(aId: string, bId: string, runtime: Map<string, RuntimeNode>): [string, string] {
  const a = runtime.get(aId)?.node;
  const b = runtime.get(bId)?.node;
  if (!a || !b) return [aId, bId];

  if (a.sex === "M" && b.sex === "F") return [aId, bId];
  if (a.sex === "F" && b.sex === "M") return [bId, aId];

  return (runtime.get(aId)?.index ?? 0) <= (runtime.get(bId)?.index ?? 0)
    ? [aId, bId]
    : [bId, aId];
}

function compactPartners(ids: string[], runtime: Map<string, RuntimeNode>): string[] {
  const rowSet = new Set(ids);
  const used = new Set<string>();
  const result: string[] = [];

  for (const id of ids) {
    if (used.has(id)) continue;
    used.add(id);

    const partnerId = pickPartnerInRow(id, rowSet, used, runtime);
    if (!partnerId) {
      result.push(id);
      continue;
    }

    used.add(partnerId);
    const [left, right] = orderPair(id, partnerId, runtime);
    result.push(left, right);
  }

  return result;
}

function buildRuntime(nodes: FamilyNode[]): Map<string, RuntimeNode> {
  const runtime = new Map<string, RuntimeNode>();

  nodes.forEach((node, index) => {
    runtime.set(node.id, {
      id: node.id,
      node,
      index,
      generation: 0,
      parents: [],
      partners: [],
      children: [],
      x: 0,
      y: 0,
    });
  });

  for (const r of runtime.values()) {
    r.parents = uniq([...(r.node.parentIds || []), r.node.parentId]).filter((id) => runtime.has(id));
    r.partners = uniq(r.node.partners || []).filter((id) => runtime.has(id));
    r.children = uniq(r.node.childrenIds || []).filter((id) => runtime.has(id));
  }

  for (const r of runtime.values()) {
    for (const parentId of r.parents) {
      const parent = runtime.get(parentId);
      if (!parent) continue;
      if (!parent.children.includes(r.id)) parent.children.push(r.id);
    }
  }

  for (const r of runtime.values()) {
    for (const partnerId of r.partners) {
      const partner = runtime.get(partnerId);
      if (!partner) continue;
      if (!partner.partners.includes(r.id)) partner.partners.push(r.id);
    }
  }

  return runtime;
}

function harmonizePartnerGenerations(runtime: Map<string, RuntimeNode>): boolean {
  const visited = new Set<string>();
  let changed = false;

  for (const node of runtime.values()) {
    if (visited.has(node.id)) continue;

    const stack = [node.id];
    const component: RuntimeNode[] = [];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const current = runtime.get(currentId);
      if (!current) continue;
      component.push(current);

      for (const partnerId of current.partners) {
        if (!visited.has(partnerId)) {
          stack.push(partnerId);
        }
      }
    }

    if (component.length <= 1) continue;

    const targetGeneration = Math.max(...component.map((member) => member.generation));
    for (const member of component) {
      if (member.generation !== targetGeneration) {
        member.generation = targetGeneration;
        changed = true;
      }
    }
  }

  return changed;
}

function alignLeafSpouses(runtime: Map<string, RuntimeNode>): boolean {
  let changed = false;

  for (const node of runtime.values()) {
    // Typical in-law leaf: no parents/children, only one spouse edge.
    if (node.parents.length > 0 || node.children.length > 0 || node.partners.length !== 1) {
      continue;
    }

    const spouse = runtime.get(node.partners[0]);
    if (!spouse) continue;

    if (node.generation !== spouse.generation) {
      node.generation = spouse.generation;
      changed = true;
    }
  }

  return changed;
}

function assignGenerations(runtime: Map<string, RuntimeNode>): void {
  for (const r of runtime.values()) {
    const raw = Number.isFinite(r.node.generation) ? r.node.generation : 0;
    r.generation = Math.max(0, raw);
  }

  // Main constraints:
  // 1) child >= max(parent) + 1
  // 2) partner-connected nodes are on same generation
  // 3) spouse-only leaf members should align with spouse generation
  const maxIterations = runtime.size * 6 + 32;
  for (let i = 0; i < maxIterations; i++) {
    let changed = false;

    for (const r of runtime.values()) {
      if (!r.parents.length) continue;
      const parentGen = Math.max(...r.parents.map((pid) => runtime.get(pid)?.generation ?? 0));
      const target = parentGen + 1;
      if (r.generation < target) {
        r.generation = target;
        changed = true;
      }
    }

    if (harmonizePartnerGenerations(runtime)) changed = true;
    if (alignLeafSpouses(runtime)) changed = true;

    if (!changed) break;
  }

  // Final guard for noisy import data to keep spouse rows consistent.
  harmonizePartnerGenerations(runtime);
  alignLeafSpouses(runtime);

  const minGen = Math.min(...Array.from(runtime.values()).map((r) => r.generation));
  if (minGen > 0) {
    for (const r of runtime.values()) {
      r.generation -= minGen;
    }
  }
}

function buildUnionMap(runtime: Map<string, RuntimeNode>): Map<string, UnionNode> {
  const unions = new Map<string, UnionNode>();

  const ensureUnion = (partnerIds: string[], childId?: string): UnionNode | null => {
    const cleaned = uniq(partnerIds).filter((id) => runtime.has(id));
    if (!cleaned.length) return null;

    const key =
      cleaned.length === 1
        ? `single:${cleaned[0]}`
        : `pair:${[...cleaned].sort().join("|")}`;

    if (!unions.has(key)) {
      const generation = Math.max(...cleaned.map((id) => runtime.get(id)?.generation ?? 0));
      unions.set(key, {
        id: `union-${key}`,
        partnerIds: cleaned,
        childIds: [],
        generation,
        x: 0,
        y: 0,
      });
    }

    const union = unions.get(key)!;
    if (childId && !union.childIds.includes(childId)) union.childIds.push(childId);
    union.generation = Math.max(
      union.generation,
      ...union.partnerIds.map((id) => runtime.get(id)?.generation ?? union.generation)
    );
    return union;
  };

  for (const node of runtime.values()) {
    if (node.parents.length > 0) {
      ensureUnion(sorted(node.parents, runtime), node.id);
    }
  }

  const seenPairs = new Set<string>();
  for (const node of runtime.values()) {
    for (const partnerId of node.partners) {
      if (!runtime.has(partnerId)) continue;
      const key = pairKey(node.id, partnerId);
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      ensureUnion([node.id, partnerId]);
    }
  }

  return unions;
}

function buildGroupsForRow(
  rowIds: string[],
  runtime: Map<string, RuntimeNode>
): RowGroup[] {
  const arranged = compactPartners(sorted(rowIds, runtime), runtime);
  const rowSet = new Set(arranged);
  const used = new Set<string>();
  const groups: RowGroup[] = [];

  for (const id of arranged) {
    if (used.has(id)) continue;
    const node = runtime.get(id);
    if (!node) continue;

    const partnerId = node.partners.find(
      (pid) => rowSet.has(pid) && !used.has(pid)
    );
    const ids = partnerId ? orderPair(id, partnerId, runtime) : [id];
    ids.forEach((nid) => used.add(nid));

    const allParents = uniq(ids.flatMap((nid) => runtime.get(nid)?.parents || []));
    const parentKey = allParents.length ? canonicalParentKey(allParents) : `solo:${ids[0]}`;
    const minIndex = Math.min(...ids.map((nid) => runtime.get(nid)?.index ?? Number.MAX_SAFE_INTEGER));
    const parentAnchors = allParents
      .map((pid) => runtime.get(pid)?.x)
      .filter((v): v is number => Number.isFinite(v));
    const spouseAnchors = ids
      .flatMap((nid) => runtime.get(nid)?.partners || [])
      .map((pid) => runtime.get(pid)?.x)
      .filter((v): v is number => Number.isFinite(v));
    const anchors = parentAnchors.length ? parentAnchors : spouseAnchors;
    const anchor = anchors.length
      ? anchors.reduce((acc, x) => acc + x, 0) / anchors.length
      : Number.POSITIVE_INFINITY;

    groups.push({ ids, parentKey, minIndex, anchor });
  }

  groups.sort((a, b) => {
    if (a.anchor !== b.anchor) return a.anchor - b.anchor;
    return a.minIndex - b.minIndex;
  });

  return groups;
}

function isPartnerPair(ids: string[], runtime: Map<string, RuntimeNode>): boolean {
  if (ids.length !== 2) return false;
  const [a, b] = ids;
  const left = runtime.get(a);
  if (!left) return false;
  return left.partners.includes(b);
}

function calculateRowWidth(groups: RowGroup[], runtime: Map<string, RuntimeNode>): number {
  if (!groups.length) return 0;

  let width = NODE_DIAMETER;

  groups.forEach((group, groupIndex) => {
    const intraGap = isPartnerPair(group.ids, runtime) ? PARTNER_SPACING_X : NODE_SPACING_X;
    width += Math.max(0, group.ids.length - 1) * intraGap;

    if (groupIndex < groups.length - 1) {
      width += NODE_SPACING_X + GROUP_GAP;
    }
  });

  return width;
}

function layoutRuntimeNodes(runtime: Map<string, RuntimeNode>): { width: number; height: number } {
  const rowsByGen = new Map<number, string[]>();
  for (const r of runtime.values()) {
    if (!rowsByGen.has(r.generation)) rowsByGen.set(r.generation, []);
    rowsByGen.get(r.generation)!.push(r.id);
  }

  const generations = Array.from(rowsByGen.keys()).sort((a, b) => a - b);
  const rowGroupMatrix = generations.map((gen) =>
    buildGroupsForRow(rowsByGen.get(gen) || [], runtime)
  );

  const rowWidths = rowGroupMatrix.map((groups) => calculateRowWidth(groups, runtime));
  const maxRowWidth = Math.max(NODE_DIAMETER, ...rowWidths);

  rowGroupMatrix.forEach((groups, rowIndex) => {
    const rowWidth = calculateRowWidth(groups, runtime);
    const startX = PADDING_X + (maxRowWidth - rowWidth) / 2 + NODE_DIAMETER / 2;
    const y = PADDING_Y + rowIndex * ROW_GAP + NODE_DIAMETER / 2;

    let cursorX = startX;
    groups.forEach((group, groupIndex) => {
      const intraGap = isPartnerPair(group.ids, runtime) ? PARTNER_SPACING_X : NODE_SPACING_X;
      group.ids.forEach((id, idx) => {
        const node = runtime.get(id);
        if (!node) return;
        node.x = cursorX;
        node.y = y;
        node.node.generation = rowIndex;
        if (idx < group.ids.length - 1) cursorX += intraGap;
      });

      if (groupIndex < groups.length - 1) cursorX += NODE_SPACING_X + GROUP_GAP;
    });
  });

  return {
    width: maxRowWidth + PADDING_X * 2,
    height: Math.max(1, generations.length) * ROW_GAP + PADDING_Y * 2,
  };
}

function positionUnions(unions: Map<string, UnionNode>, runtime: Map<string, RuntimeNode>): void {
  for (const union of unions.values()) {
    const partners = union.partnerIds
      .map((id) => runtime.get(id))
      .filter((p): p is RuntimeNode => Boolean(p))
      .sort((a, b) => a.x - b.x);

    if (!partners.length) continue;

    union.generation = Math.max(...partners.map((p) => p.generation));
    union.x =
      partners.length === 1
        ? partners[0].x
        : partners.reduce((acc, p) => acc + p.x, 0) / partners.length;
    union.y = partners.reduce((acc, p) => acc + p.y, 0) / partners.length;
  }
}

function buildUnionLaneMap(unions: Map<string, UnionNode>): Map<string, number> {
  const unionsPerGeneration = new Map<number, UnionNode[]>();

  for (const union of unions.values()) {
    if (!union.childIds.length) continue;
    if (!unionsPerGeneration.has(union.generation)) {
      unionsPerGeneration.set(union.generation, []);
    }
    unionsPerGeneration.get(union.generation)!.push(union);
  }

  const laneByUnionId = new Map<string, number>();

  for (const generationUnions of unionsPerGeneration.values()) {
    generationUnions
      .sort((a, b) => a.x - b.x)
      .forEach((union, lane) => laneByUnionId.set(union.id, lane));
  }

  return laneByUnionId;
}

function buildEdges(runtime: Map<string, RuntimeNode>, unions: Map<string, UnionNode>): LayoutEdge[] {
  const edges: LayoutEdge[] = [];
  const spouseEdgeSeen = new Set<string>();
  const laneByUnionId = buildUnionLaneMap(unions);
  const laneStep = 14;

  for (const union of unions.values()) {
    if (union.partnerIds.length < 2) continue;
    const [aId, bId] = union.partnerIds;
    const a = runtime.get(aId);
    const b = runtime.get(bId);
    if (!a || !b) continue;

    const key = pairKey(aId, bId);
    if (spouseEdgeSeen.has(key)) continue;
    spouseEdgeSeen.add(key);

    edges.push({
      id: `edge-spouse-${key}`,
      source: aId,
      target: bId,
      type: "spouse",
      path: [
        { x: a.x, y: a.y },
        { x: b.x, y: b.y },
      ],
    });
  }

  for (const union of unions.values()) {
    if (!union.childIds.length) continue;

    const startX = union.x;
    const startY = union.y + NODE_DIAMETER / 2;
    const children = union.childIds
      .map((id) => runtime.get(id))
      .filter((node): node is RuntimeNode => Boolean(node))
      .sort((a, b) => a.x - b.x);
    if (!children.length) continue;

    const lane = laneByUnionId.get(union.id) ?? 0;
    const minChildTop = Math.min(...children.map((child) => child.y - NODE_DIAMETER / 2));
    const preferredBusY = startY + 26 + lane * laneStep;
    const maxBusY = minChildTop - 18;
    const busY = Math.max(startY + 14, Math.min(preferredBusY, maxBusY));
    const childXs = children.map((child) => child.x);
    const busMinX = Math.min(startX, ...childXs);
    const busMaxX = Math.max(startX, ...childXs);

    // Draw shared trunk and bus once per union so connectors don't look tangled.
    edges.push({
      id: `edge-parent-trunk-${union.id}`,
      source: union.id,
      target: union.id,
      type: "union-child",
      path: [
        { x: startX, y: startY },
        { x: startX, y: busY },
      ],
    });

    if (busMaxX > busMinX) {
      edges.push({
        id: `edge-parent-bus-${union.id}`,
        source: union.id,
        target: union.id,
        type: "union-child",
        path: [
          { x: busMinX, y: busY },
          { x: busMaxX, y: busY },
        ],
      });
    }

    for (const child of children) {
      const childTop = child.y - NODE_DIAMETER / 2;
      edges.push({
        id: `edge-parent-drop-${union.id}-${child.id}`,
        source: union.id,
        target: child.id,
        type: "union-child",
        path: [
          { x: child.x, y: busY },
          { x: child.x, y: childTop },
        ],
      });
    }
  }

  return edges;
}

export function calculateSugiyamaLayout(nodes: FamilyNode[]): LayoutGraph {
  if (!nodes.length) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  const runtime = buildRuntime(nodes);
  assignGenerations(runtime);
  const { width, height } = layoutRuntimeNodes(runtime);
  const unions = buildUnionMap(runtime);
  positionUnions(unions, runtime);
  const edges = buildEdges(runtime, unions);

  const layoutNodes = nodes.map((node) => {
    const r = runtime.get(node.id)!;
    return {
      ...node,
      x: r.x,
      y: r.y,
      generation: r.node.generation,
    };
  });

  return {
    nodes: layoutNodes,
    unions: Array.from(unions.values()).map((union) => ({
      id: union.id,
      partnerIds: union.partnerIds,
      childrenIds: union.childIds,
      type: union.partnerIds.length > 1 ? "marriage" : "relationship",
      layer: union.generation,
      x: union.x,
      y: union.y,
    })),
    edges,
    width,
    height,
  };
}
