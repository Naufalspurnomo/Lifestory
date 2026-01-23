// Production-Grade Layout Engine
// Forwarding to Sugiyama Pipeline implementation

import type { FamilyNode, LayoutGraph } from "../types/tree";
import { calculateSugiyamaLayout } from "./sugiyamaLayout";

// Re-export LayoutNode for compatibility (it is effectively FamilyNode now since FamilyNode has x,y)
export type LayoutNode = FamilyNode;

export function calculateHierarchicalLayout(nodes: FamilyNode[]): LayoutGraph {
  return calculateSugiyamaLayout(nodes);
}

// ---- Legacy/Helper exports (used by useTreeState.ts) ----

export function detectCycle(
  nodes: FamilyNode[],
  newNode?: Partial<FamilyNode>
) {
  // Simple DFS cycle detection
  // Create adj list
  const adj = new Map<string, string[]>();
  nodes.forEach(n => {
    adj.set(n.id, []);
  });

  if (newNode && newNode.id) {
    adj.set(newNode.id, []);
  }

  const all = [...nodes];
  if (newNode && newNode.id) {
    // Check if newNode is already in nodes (update) or new
    if (!all.find(n => n.id === newNode.id)) {
      all.push(newNode as FamilyNode);
    }
  }

  // Build edges: Child -> Parent (cycle = child is ancestor of parent)
  // Or usually Parent -> Child. 
  // Cycle: Path A -> B -> ... -> A

  all.forEach(n => {
    (n.childrenIds || []).forEach(cid => {
      if (!adj.has(n.id)) adj.set(n.id, []);
      adj.get(n.id)!.push(cid);
    });
  });

  // DFS
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(u: string): boolean {
    if (recStack.has(u)) return true;
    if (visited.has(u)) return false;

    visited.add(u);
    recStack.add(u);

    const children = adj.get(u) || [];
    for (const v of children) {
      if (hasCycle(v)) return true;
    }

    recStack.delete(u);
    return false;
  }

  for (const n of all) {
    if (hasCycle(n.id)) return true;
  }

  return false;
}

export function calculateGeneration(nodes: FamilyNode[], nodeId: string) {
  // This is handled by the layout engine usually, but for standalone calculation:
  // BFS/DFS from roots? 
  // If specific node asked:
  const map = new Map(nodes.map(n => [n.id, n]));
  const memo = new Map<string, number>();

  const getGen = (id: string): number => {
    if (memo.has(id)) return memo.get(id)!;
    const node = map.get(id);
    if (!node) return 0;

    const pids = node.parentIds || [];
    if (pids.length === 0) return 0;

    let maxP = 0;
    pids.forEach(pid => {
      maxP = Math.max(maxP, getGen(pid));
    });

    const res = maxP + 1;
    memo.set(id, res);
    return res;
  }

  return getGen(nodeId);
}
