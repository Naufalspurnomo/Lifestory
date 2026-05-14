import type { LayoutGraph } from "../types/tree";
import { LAYOUT } from "../types/tree";

export type LayoutValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
};

export type LayoutValidationResult = {
  valid: boolean;
  issues: LayoutValidationIssue[];
};

function isFinitePoint(point: { x: number; y: number }) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function validateFamilyLayout(layout: LayoutGraph): LayoutValidationResult {
  const issues: LayoutValidationIssue[] = [];
  const nodeById = new Map(layout.nodes.map((node) => [node.id, node]));
  const seenNodeIds = new Set<string>();

  for (const node of layout.nodes) {
    if (seenNodeIds.has(node.id)) {
      issues.push({
        severity: "error",
        code: "duplicate-node",
        nodeId: node.id,
        message: `Duplicate node id: ${node.id}`,
      });
    }
    seenNodeIds.add(node.id);

    if (!isFinitePoint({ x: node.x ?? NaN, y: node.y ?? NaN })) {
      issues.push({
        severity: "error",
        code: "invalid-node-position",
        nodeId: node.id,
        message: `Node ${node.id} has invalid coordinates`,
      });
    }
  }

  for (let aIndex = 0; aIndex < layout.nodes.length; aIndex++) {
    const a = layout.nodes[aIndex];
    if (!Number.isFinite(a.x) || !Number.isFinite(a.y)) continue;

    for (let bIndex = aIndex + 1; bIndex < layout.nodes.length; bIndex++) {
      const b = layout.nodes[bIndex];
      if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) continue;

      const sameLayer = a.generation === b.generation;
      const tooCloseX = Math.abs(a.x! - b.x!) < LAYOUT.NODE_SIZE + 16;
      const tooCloseY = Math.abs(a.y! - b.y!) < LAYOUT.NODE_SIZE + 16;

      if (sameLayer && tooCloseX && tooCloseY) {
        issues.push({
          severity: "error",
          code: "node-overlap",
          nodeId: a.id,
          message: `Nodes ${a.id} and ${b.id} overlap on generation ${a.generation}`,
        });
      }
    }
  }

  for (const edge of layout.edges) {
    if (edge.path.length < 2) {
      issues.push({
        severity: "error",
        code: "short-edge-path",
        edgeId: edge.id,
        message: `Edge ${edge.id} has fewer than 2 path points`,
      });
    }

    for (const point of edge.path) {
      if (!isFinitePoint(point)) {
        issues.push({
          severity: "error",
          code: "invalid-edge-position",
          edgeId: edge.id,
          message: `Edge ${edge.id} has invalid path coordinates`,
        });
      }
    }

    if (edge.type === "union-child") {
      const child = nodeById.get(edge.target);
      const start = edge.path[0];
      if (child && Number.isFinite(child.y) && child.y! <= start.y) {
        issues.push({
          severity: "error",
          code: "child-not-below-parent",
          edgeId: edge.id,
          nodeId: child.id,
          message: `Child ${child.id} is not below its parent union`,
        });
      }
    }
  }

  for (const union of layout.unions || []) {
    if (!isFinitePoint({ x: union.x ?? NaN, y: union.y ?? NaN })) {
      issues.push({
        severity: "error",
        code: "invalid-union-position",
        nodeId: union.id,
        message: `Union ${union.id} has invalid coordinates`,
      });
      continue;
    }

    const children = union.childrenIds
      .map((childId) => nodeById.get(childId))
      .filter((child): child is NonNullable<typeof child> => Boolean(child));

    if (children.length > 0) {
      const childCenter = average(children.map((child) => child.x || 0));
      const drift = Math.abs((union.x || 0) - childCenter);

      if (drift > LAYOUT.NODE_SPACING_X * 3) {
        issues.push({
          severity: "warning",
          code: "union-child-drift",
          nodeId: union.id,
          message: `Union ${union.id} is far from the center of its children`,
        });
      }
    }
  }

  if (!Number.isFinite(layout.width) || !Number.isFinite(layout.height)) {
    issues.push({
      severity: "error",
      code: "invalid-bounds",
      message: "Layout bounds are invalid",
    });
  }

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
  };
}
