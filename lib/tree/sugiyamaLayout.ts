import { FamilyNode, LayoutEdge, LayoutGraph } from "../types/tree";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 58;
const ROW_GAP = 170;
const COL_GAP = 52;
const GROUP_GAP = 96;
const PADDING_X = 140;
const PADDING_Y = 80;

type RuntimeNode = {
  node: FamilyNode;
  id: string;
  generation: number;
  parents: string[];
  partners: string[];
  children: string[];
  order: number;
  x: number;
  y: number;
};

function uniq(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

function edgeKey(a: string, b: string): string {
  return [a, b].sort().join("::");
}

function sortByLabel(ids: string[], runtime: Map<string, RuntimeNode>): string[] {
  return [...ids].sort((a, b) =>
    runtime
      .get(a)
      ?.node.label.localeCompare(runtime.get(b)?.node.label || "", "id", {
        sensitivity: "base",
      }) || 0
  );
}

function pickPartnerInRow(
  id: string,
  rowSet: Set<string>,
  used: Set<string>,
  runtime: Map<string, RuntimeNode>
): string | null {
  const node = runtime.get(id);
  if (!node) return null;

  const candidates = node.partners.filter(
    (partnerId) => rowSet.has(partnerId) && !used.has(partnerId)
  );
  if (!candidates.length) return null;

  return sortByLabel(candidates, runtime)[0];
}

function orderPair(aId: string, bId: string, runtime: Map<string, RuntimeNode>): [string, string] {
  const a = runtime.get(aId)?.node;
  const b = runtime.get(bId)?.node;
  if (!a || !b) return [aId, bId];

  // Keep common male-left/female-right reading order when available.
  if (a.sex === "M" && b.sex === "F") return [aId, bId];
  if (a.sex === "F" && b.sex === "M") return [bId, aId];

  return a.label.localeCompare(b.label, "id", { sensitivity: "base" }) <= 0
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

function assignGenerations(runtime: Map<string, RuntimeNode>): void {
  // Start from stored generation when available, otherwise 0.
  for (const node of runtime.values()) {
    const raw = Number.isFinite(node.node.generation) ? node.node.generation : 0;
    node.generation = Math.max(0, raw);
  }

  // Relaxation pass so every child is at least one row below max(parent generation).
  const limit = runtime.size * 4 + 16;
  for (let i = 0; i < limit; i++) {
    let changed = false;
    for (const node of runtime.values()) {
      if (!node.parents.length) continue;
      const parentGen = Math.max(
        ...node.parents.map((parentId) => runtime.get(parentId)?.generation ?? 0)
      );
      const target = parentGen + 1;
      if (node.generation < target) {
        node.generation = target;
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Normalize minimum generation to 0.
  const minGen = Math.min(...Array.from(runtime.values()).map((node) => node.generation));
  if (minGen > 0) {
    for (const node of runtime.values()) {
      node.generation -= minGen;
    }
  }
}

function buildRuntime(nodes: FamilyNode[]): Map<string, RuntimeNode> {
  const runtime = new Map<string, RuntimeNode>();

  for (const node of nodes) {
    runtime.set(node.id, {
      node,
      id: node.id,
      generation: 0,
      parents: [],
      partners: [],
      children: [],
      order: 0,
      x: 0,
      y: 0,
    });
  }

  for (const r of runtime.values()) {
    const parents = uniq([...(r.node.parentIds || []), r.node.parentId]).filter((id) =>
      runtime.has(id)
    );
    const partners = uniq(r.node.partners || []).filter((id) => runtime.has(id));
    const children = uniq(r.node.childrenIds || []).filter((id) => runtime.has(id));

    r.parents = parents;
    r.partners = partners;
    r.children = children;
  }

  // Sync children from parent references.
  for (const r of runtime.values()) {
    for (const parentId of r.parents) {
      const parent = runtime.get(parentId);
      if (!parent) continue;
      if (!parent.children.includes(r.id)) parent.children.push(r.id);
    }
  }

  // Sync partners bidirectionally.
  for (const r of runtime.values()) {
    for (const partnerId of r.partners) {
      const partner = runtime.get(partnerId);
      if (!partner) continue;
      if (!partner.partners.includes(r.id)) partner.partners.push(r.id);
    }
  }

  assignGenerations(runtime);
  return runtime;
}

function buildRows(runtime: Map<string, RuntimeNode>): string[][] {
  const byGen = new Map<number, string[]>();
  for (const r of runtime.values()) {
    if (!byGen.has(r.generation)) byGen.set(r.generation, []);
    byGen.get(r.generation)!.push(r.id);
  }

  const generations = Array.from(byGen.keys()).sort((a, b) => a - b);
  const rows: string[][] = [];

  for (let gi = 0; gi < generations.length; gi++) {
    const gen = generations[gi];
    const rowIds = sortByLabel(byGen.get(gen) || [], runtime);

    if (gi === 0) {
      const arranged = compactPartners(rowIds, runtime);
      rows.push(arranged);
      arranged.forEach((id, idx) => {
        const node = runtime.get(id);
        if (node) node.order = idx;
      });
      continue;
    }

    const groups = new Map<string, string[]>();
    for (const id of rowIds) {
      const r = runtime.get(id)!;
      const key = r.parents.length
        ? [...r.parents].sort().join("|")
        : `solo:${id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(id);
    }

    const grouped = Array.from(groups.entries()).map(([key, ids]) => {
      const sortedIds = sortByLabel(ids, runtime);
      const anchors = sortedIds.flatMap((id) =>
        runtime.get(id)!.parents.map((pid) => runtime.get(pid)?.order ?? 0)
      );
      const anchor = anchors.length
        ? anchors.reduce((acc, v) => acc + v, 0) / anchors.length
        : Number.POSITIVE_INFINITY;
      return { key, ids: compactPartners(sortedIds, runtime), anchor };
    });

    grouped.sort((a, b) => {
      if (a.anchor !== b.anchor) return a.anchor - b.anchor;
      return a.key.localeCompare(b.key);
    });

    const arranged: string[] = [];
    grouped.forEach((group, index) => {
      arranged.push(...group.ids);
      if (index < grouped.length - 1) arranged.push("__GROUP_BREAK__");
    });

    let order = 0;
    const finalRow = arranged.filter((id) => id !== "__GROUP_BREAK__");
    finalRow.forEach((id) => {
      const node = runtime.get(id);
      if (node) node.order = order++;
    });
    rows.push(arranged);
  }

  return rows;
}

function positionRows(runtime: Map<string, RuntimeNode>, rows: string[]): number {
  let cursor = 0;
  let maxX = 0;
  let placed = false;

  for (const id of rows) {
    if (id === "__GROUP_BREAK__") {
      cursor += GROUP_GAP;
      continue;
    }
    const node = runtime.get(id);
    if (!node) continue;
    node.x = cursor;
    cursor += NODE_WIDTH + COL_GAP;
    maxX = Math.max(maxX, node.x);
    placed = true;
  }

  if (!placed) return 0;
  return maxX;
}

function layoutNodes(runtime: Map<string, RuntimeNode>): { width: number; height: number } {
  const rows = buildRows(runtime);
  const cleanRows = rows.map((row) => row.filter((id) => id !== "__GROUP_BREAK__"));
  const rowWidths = cleanRows.map((row) =>
    row.length > 0 ? (row.length - 1) * (NODE_WIDTH + COL_GAP) + NODE_WIDTH : 0
  );
  const maxRowWidth = Math.max(...rowWidths, NODE_WIDTH);

  rows.forEach((row, rowIndex) => {
    positionRows(runtime, row);
    const clean = row.filter((id) => id !== "__GROUP_BREAK__");
    const rowWidth =
      clean.length > 0 ? (clean.length - 1) * (NODE_WIDTH + COL_GAP) + NODE_WIDTH : 0;
    const shift = (maxRowWidth - rowWidth) / 2 + PADDING_X;
    const y = PADDING_Y + rowIndex * ROW_GAP;

    for (const id of clean) {
      const node = runtime.get(id);
      if (!node) continue;
      node.x += shift + NODE_WIDTH / 2;
      node.y = y + NODE_HEIGHT / 2;
      node.node.generation = rowIndex;
    }
  });

  return {
    width: maxRowWidth + PADDING_X * 2,
    height: rows.length * ROW_GAP + PADDING_Y * 2,
  };
}

function buildEdges(runtime: Map<string, RuntimeNode>): LayoutEdge[] {
  const edges: LayoutEdge[] = [];
  const spouseSeen = new Set<string>();

  for (const node of runtime.values()) {
    for (const partnerId of node.partners) {
      const partner = runtime.get(partnerId);
      if (!partner) continue;

      const key = edgeKey(node.id, partner.id);
      if (spouseSeen.has(key)) continue;
      spouseSeen.add(key);

      edges.push({
        id: `edge-spouse-${key}`,
        source: node.id,
        target: partner.id,
        type: "spouse",
        path: [
          { x: node.x, y: node.y },
          { x: partner.x, y: partner.y },
        ],
      });
    }
  }

  for (const child of runtime.values()) {
    if (!child.parents.length) continue;

    const parentNodes = child.parents
      .map((pid) => runtime.get(pid))
      .filter((p): p is RuntimeNode => Boolean(p))
      .sort((a, b) => a.x - b.x);
    if (!parentNodes.length) continue;

    const startX =
      parentNodes.length === 1
        ? parentNodes[0].x
        : parentNodes.reduce((acc, p) => acc + p.x, 0) / parentNodes.length;
    const startY = Math.max(...parentNodes.map((p) => p.y)) + NODE_HEIGHT / 2;
    const endY = child.y - NODE_HEIGHT / 2;
    const gapY = Math.max(34, (endY - startY) * 0.45);
    const midY = startY + gapY;

    edges.push({
      id: `edge-parent-${child.id}`,
      source: parentNodes[0].id,
      target: child.id,
      type: "union-child",
      path: [
        { x: startX, y: startY },
        { x: startX, y: midY },
        { x: child.x, y: midY },
        { x: child.x, y: endY },
      ],
    });
  }

  return edges;
}

export function calculateSugiyamaLayout(nodes: FamilyNode[]): LayoutGraph {
  if (!nodes.length) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  const runtime = buildRuntime(nodes);
  const { width, height } = layoutNodes(runtime);
  const edges = buildEdges(runtime);

  const layoutNodesList = nodes.map((node) => {
    const r = runtime.get(node.id)!;
    return {
      ...node,
      x: r.x,
      y: r.y,
      generation: r.node.generation,
    };
  });

  return {
    nodes: layoutNodesList,
    edges,
    width,
    height,
  };
}
