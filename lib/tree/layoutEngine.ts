// Layout Engine for Family Tree (Genealogy-friendly)
// Approach:
// 1) Normalize + sanitize bidirectional links (partners, parentIds, childrenIds)
// 2) Assign ranks (Y) using relaxed constraints (parents = rank-1, children = rank+1, partners = same rank)
// 3) X positioning using spouse-groups + iterative barycenter sweeps (top-down & bottom-up)
// This avoids "in-law parents centered on the couple" problem.

import type { FamilyNode } from "../types/tree";
import { LAYOUT as L } from "../types/tree";

export type LayoutNode = FamilyNode & {
  x: number;
  y: number;
  __rankRaw?: number; // Rank relative to owner (for generation display)
};

// Layout constants (keep your existing feel)
const NODE_SIZE = 80;
const PARTNER_GAP = 120; // spacing between spouse circles (center-to-center step includes NODE_SIZE)
const SIBLING_GAP = 120; // spacing between groups within same rank
const GENERATION_GAP = 180; // y distance
const CANVAS_START_X = 1000;
const CANVAS_START_Y = 100;

const uniq = (arr: string[]) =>
  Array.from(new Set((arr || []).filter(Boolean)));

function normalizeNode(n: any): FamilyNode {
  const partners = uniq(Array.isArray(n.partners) ? n.partners : []);
  const childrenIds = uniq(Array.isArray(n.childrenIds) ? n.childrenIds : []);
  const parentIdsFromField = Array.isArray(n.parentIds) ? n.parentIds : [];
  const parentIdsFromLegacy = n.parentId ? [n.parentId] : [];
  const parentIds = uniq([...parentIdsFromField, ...parentIdsFromLegacy]);

  return {
    ...n,
    partners,
    childrenIds,
    parentIds,
    parentId: parentIds[0] ?? null, // keep legacy synced
  };
}

function sanitizeGraph(nodes: FamilyNode[]): FamilyNode[] {
  const map = new Map<string, FamilyNode>();
  for (const n of nodes) map.set(n.id, normalizeNode(n));

  // Partner sync (bidirectional)
  for (const a of map.values()) {
    for (const bid of a.partners) {
      const b = map.get(bid);
      if (!b) continue;
      if (!b.partners.includes(a.id)) b.partners = uniq([...b.partners, a.id]);
    }
  }

  // Parent<->Child sync (multi-parent)
  // A) parent.childrenIds -> child.parentIds
  for (const parent of map.values()) {
    for (const cid of parent.childrenIds) {
      const child = map.get(cid);
      if (!child) continue;
      const pids = child.parentIds || [];
      if (!pids.includes(parent.id)) {
        child.parentIds = uniq([...pids, parent.id]);
      }
      child.parentId = (child.parentIds || [])[0] ?? null;
    }
  }

  // B) child.parentIds -> parent.childrenIds
  for (const child of map.values()) {
    for (const pid of child.parentIds || []) {
      const parent = map.get(pid);
      if (!parent) continue;
      if (!parent.childrenIds.includes(child.id)) {
        parent.childrenIds = uniq([...parent.childrenIds, child.id]);
      }
    }
    child.parentId = (child.parentIds || [])[0] ?? null;
  }

  // preserve original order
  return nodes.map((n) => map.get(n.id)!).filter(Boolean);
}

// --- DSU for spouse grouping per rank ---
class DSU {
  parent = new Map<string, string>();
  find(x: string): string {
    const p = this.parent.get(x) ?? x;
    if (p === x) return x;
    const r = this.find(p);
    this.parent.set(x, r);
    return r;
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

type Group = {
  id: string; // dsu root
  rank: number;
  memberIds: string[]; // spouse group members
  width: number; // group width in px
  xCenter: number; // group center x
  orderKey: number; // stable ordering
};

type GroupTarget = { g: Group; target: number };

export function calculateHierarchicalLayout(nodes: FamilyNode[]): LayoutNode[] {
  if (!nodes.length) return [];

  // 0) normalize + sanitize
  const normalized = nodes.map((n) => normalizeNode({ ...n }));
  const repaired = sanitizeGraph(normalized);

  const nodeMap = new Map<string, FamilyNode>();
  for (const n of repaired) nodeMap.set(n.id, n);

  // parentsMap + childrenMap
  const parentsMap = new Map<string, string[]>();
  const childrenMap = new Map<string, string[]>();

  for (const n of repaired) {
    parentsMap.set(n.id, uniq(n.parentIds || []));
    childrenMap.set(n.id, uniq(n.childrenIds || []));
  }

  // 1) choose focus - prioritize owner (line === "self"), fallback to first node
  const focus =
    Array.from(nodeMap.values()).find((n) => n.line === "self") ||
    nodeMap.get(nodes[0]?.id) ||
    repaired[0];
  if (!focus) return [];

  // 2) rank assignment (relax constraints)
  const ranks = new Map<string, number>();
  const q: string[] = [];

  const relax = (id: string, proposed: number) => {
    if (!nodeMap.has(id)) return;
    const prev = ranks.get(id);
    if (prev === undefined || prev !== proposed) {
      ranks.set(id, proposed);
      q.push(id);
    }
  };

  relax(focus.id, 0);

  // Guard against inconsistent data (prevents infinite loops)
  const MAX_RELAX = repaired.length * 50 + 500;
  let relaxCount = 0;

  while (q.length && relaxCount < MAX_RELAX) {
    const id = q.shift()!;
    const r = ranks.get(id)!;
    const n = nodeMap.get(id)!;

    // partners same rank
    for (const pid of n.partners || []) relax(pid, r);

    // parents rank - 1
    for (const pid of parentsMap.get(id) || []) relax(pid, r - 1);

    // children rank + 1
    for (const cid of childrenMap.get(id) || []) relax(cid, r + 1);

    relaxCount++;
  }

  // disconnected
  for (const n of repaired) if (!ranks.has(n.id)) ranks.set(n.id, 0);

  // normalize so min rank is 0
  const minRank = Math.min(...Array.from(ranks.values()));
  const normRank = new Map<string, number>();
  for (const [id, r] of ranks.entries()) normRank.set(id, r - minRank);

  const maxRank = Math.max(...Array.from(normRank.values()));

  // 3) build spouse groups per rank (only partner edges where both are same rank)
  const dsu = new DSU();
  for (const n of repaired) dsu.parent.set(n.id, n.id);

  for (const n of repaired) {
    const r = normRank.get(n.id) ?? 0;
    for (const pid of n.partners || []) {
      const pr = normRank.get(pid);
      if (pr === undefined) continue;
      if (pr === r) dsu.union(n.id, pid);
    }
  }

  // group members
  const groupsByRank = new Map<number, Group[]>();
  const memberToGroup = new Map<string, Group>();

  // stable ordering: follow original array index
  const indexOf = new Map<string, number>();
  repaired.forEach((n, i) => indexOf.set(n.id, i));

  // collect by (rank, root)
  const temp = new Map<
    string,
    { rank: number; members: string[]; orderKey: number }
  >();

  for (const n of repaired) {
    const r = normRank.get(n.id) ?? 0;
    const root = dsu.find(n.id);
    const key = `${r}::${root}`;
    const entry = temp.get(key) || {
      rank: r,
      members: [],
      orderKey: indexOf.get(n.id) ?? 999999,
    };
    entry.members.push(n.id);
    entry.orderKey = Math.min(entry.orderKey, indexOf.get(n.id) ?? 999999);
    temp.set(key, entry);
  }

  for (const entry of temp.values()) {
    const memberIds = entry.members
      .slice()
      .sort((a, b) => indexOf.get(a)! - indexOf.get(b)!);

    const count = memberIds.length;
    const width = count * NODE_SIZE + (count - 1) * PARTNER_GAP;

    const g: Group = {
      id: `${entry.rank}::${dsu.find(memberIds[0])}`,
      rank: entry.rank,
      memberIds,
      width,
      xCenter: CANVAS_START_X, // init later
      orderKey: entry.orderKey,
    };

    if (!groupsByRank.has(entry.rank)) groupsByRank.set(entry.rank, []);
    groupsByRank.get(entry.rank)!.push(g);
    for (const mid of memberIds) memberToGroup.set(mid, g);
  }

  // sort each rank groups stable
  for (const [r, list] of groupsByRank.entries()) {
    list.sort((a, b) => a.orderKey - b.orderKey);
    groupsByRank.set(r, list);
  }

  // 4) helper: compute nodeX based on current group centers
  const memberOffset = (g: Group, memberId: string) => {
    const i = g.memberIds.indexOf(memberId);
    const left = g.xCenter - g.width / 2;
    return left + NODE_SIZE / 2 + i * (NODE_SIZE + PARTNER_GAP);
  };

  const computeNodeX = () => {
    const x = new Map<string, number>();
    for (const gList of groupsByRank.values()) {
      for (const g of gList) {
        for (const mid of g.memberIds) x.set(mid, memberOffset(g, mid));
      }
    }
    return x;
  };

  const positionGroups = (scored: GroupTarget[]) => {
    scored.sort((a, b) => a.target - b.target || a.g.orderKey - b.g.orderKey);
    let cursorRight = -Infinity;
    for (const item of scored) {
      const g = item.g;
      let left = item.target - g.width / 2;
      if (left < cursorRight + SIBLING_GAP) left = cursorRight + SIBLING_GAP;
      g.xCenter = left + g.width / 2;
      cursorRight = left + g.width;
    }
  };

  const getParentTargets = (g: Group, nodeX: Map<string, number>) => {
    const parentXs: number[] = [];
    for (const mid of g.memberIds) {
      for (const pid of parentsMap.get(mid) || []) {
        if ((normRank.get(pid) ?? -1) === g.rank - 1) {
          const px = nodeX.get(pid);
          if (px !== undefined) parentXs.push(px);
        }
      }
    }
    if (!parentXs.length) return g.xCenter;
    return parentXs.reduce((a, b) => a + b, 0) / parentXs.length;
  };

  const shiftRankToFocus = (rank: number) => {
    if ((normRank.get(focus.id) ?? 0) !== rank) return;
    const list = groupsByRank.get(rank) || [];
    const focusGroup = memberToGroup.get(focus.id);
    if (!focusGroup) return;
    const delta = CANVAS_START_X - focusGroup.xCenter;
    if (!Number.isFinite(delta)) return;
    for (const g of list) g.xCenter += delta;
  };

  // 5) init positions per rank (simple spread around focus)
  for (let r = 0; r <= maxRank; r++) {
    const list = groupsByRank.get(r) || [];
    let cx = CANVAS_START_X;
    for (let i = 0; i < list.length; i++) {
      if (r === (normRank.get(focus.id) ?? 0)) {
        // try to keep focus group near center
        const fg = memberToGroup.get(focus.id);
        if (fg && fg.id === list[i].id) {
          list[i].xCenter = CANVAS_START_X;
          continue;
        }
      }
      list[i].xCenter = cx + list[i].width / 2;
      cx += list[i].width + SIBLING_GAP;
    }
    shiftRankToFocus(r);
  }

  // 5b) initial parent-based alignment (top-down)
  let nodeX = computeNodeX();
  for (let r = 1; r <= maxRank; r++) {
    const list = groupsByRank.get(r) || [];
    const scored = list.map((g) => ({
      g,
      target: getParentTargets(g, nodeX),
    }));
    positionGroups(scored);
    nodeX = computeNodeX();
  }

  // 6) iterative barycenter sweeps
  const ITER = 6;
  for (let it = 0; it < ITER; it++) {
    // recompute nodeX each iteration
    nodeX = computeNodeX();

    // TOP-DOWN: align groups to children
    for (let r = 0; r < maxRank; r++) {
      const list = groupsByRank.get(r) || [];
      const scored: GroupTarget[] = list.map((g) => {
        const childXs: number[] = [];
        for (const mid of g.memberIds) {
          for (const cid of childrenMap.get(mid) || []) {
            if ((normRank.get(cid) ?? -1) === r + 1) {
              const cx = nodeX.get(cid);
              if (cx !== undefined) childXs.push(cx);
            }
          }
        }
        const target =
          childXs.length > 0
            ? childXs.reduce((a, b) => a + b, 0) / childXs.length
            : g.xCenter;

        return { g, target };
      });

      positionGroups(scored);

      // update nodeX after rank placement
      nodeX = computeNodeX();
    }

    // BOTTOM-UP: align groups to parents
    nodeX = computeNodeX();
    for (let r = maxRank; r > 0; r--) {
      const list = groupsByRank.get(r) || [];
      const scored: GroupTarget[] = list.map((g) => ({
        g,
        target: getParentTargets(g, nodeX),
      }));

      positionGroups(scored);
    }
  }

  // 7) finalize node positions
  const finalNodeX = computeNodeX();
  const nodeY = new Map<string, number>();
  for (const n of repaired) {
    const r = normRank.get(n.id) ?? 0;
    nodeY.set(n.id, CANVAS_START_Y + r * GENERATION_GAP);
  }

  // 8) shift X to padding
  let minX = Infinity;
  for (const [_id, x] of finalNodeX.entries()) {
    minX = Math.min(minX, x);
  }
  const shiftX = (minX === Infinity ? CANVAS_START_X : minX) - L.CANVAS_PADDING;

  // 9) output in original order
  const out: LayoutNode[] = [];
  for (const n of nodes
    .map((x) => nodeMap.get(x.id))
    .filter(Boolean) as FamilyNode[]) {
    out.push({
      ...n,
      x: (finalNodeX.get(n.id) ?? L.CANVAS_PADDING) - shiftX,
      y: nodeY.get(n.id) ?? 0,
      parentId: n.parentIds?.[0] ?? null, // legacy sync
      __rankRaw: ranks.get(n.id) ?? 0, // rank relative to focus (owner)
    } as LayoutNode);
  }
  return out;
}

// ---- Compatibility exports (used by useTreeState.ts) ----
export function detectCycle(
  _nodes: FamilyNode[],
  _newNode?: Partial<FamilyNode>
) {
  // TODO: implement real cycle detection
  return false;
}

export function calculateGeneration(nodes: FamilyNode[], nodeId: string) {
  const map = new Map(nodes.map((n) => [n.id, n]));
  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  const getParents = (n: any): string[] => {
    const pids = Array.isArray(n.parentIds) ? n.parentIds : [];
    if (pids.length) return pids.filter(Boolean);
    return n.parentId ? [n.parentId] : [];
  };

  const gen = (id: string): number => {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);

    const n = map.get(id);
    if (!n) {
      visiting.delete(id);
      memo.set(id, 0);
      return 0;
    }

    const parents = getParents(n);
    const g = parents.length ? Math.max(...parents.map(gen)) + 1 : 0;

    visiting.delete(id);
    memo.set(id, g);
    return g;
  };

  return gen(nodeId);
}
