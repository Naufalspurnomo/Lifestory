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

function segmentHitsNode(
  start: { x: number; y: number },
  end: { x: number; y: number },
  node: { x?: number; y?: number }
) {
  if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return false;
  const left = node.x! - LAYOUT.CARD_WIDTH / 2;
  const right = node.x! + LAYOUT.CARD_WIDTH / 2;
  const top = node.y! - LAYOUT.CARD_HEIGHT / 2;
  const bottom = node.y! + LAYOUT.CARD_HEIGHT / 2;

  if (start.x === end.x) {
    return (
      start.x > left &&
      start.x < right &&
      Math.max(Math.min(start.y, end.y), top) <
        Math.min(Math.max(start.y, end.y), bottom)
    );
  }

  if (start.y === end.y) {
    return (
      start.y > top &&
      start.y < bottom &&
      Math.max(Math.min(start.x, end.x), left) <
        Math.min(Math.max(start.x, end.x), right)
    );
  }

  return false;
}

function connectorFamilyId(edge: LayoutGraph["edges"][number]) {
  if (edge.type === "parent-union") return edge.target;
  if (edge.type === "union-child") return edge.source;
  return null;
}

function horizontalSegments(edge: LayoutGraph["edges"][number]) {
  return edge.path.slice(1).flatMap((end, index) => {
    const start = edge.path[index];
    if (start.y !== end.y || start.x === end.x) return [];
    return [
      {
        y: start.y,
        left: Math.min(start.x, end.x),
        right: Math.max(start.x, end.x),
      },
    ];
  });
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

    const relatedNodeIds = new Set<string>([edge.source, edge.target]);
    const relatedUnion = (layout.unions || []).find(
      (union) => union.id === edge.source || union.id === edge.target
    );
    for (const partnerId of relatedUnion?.partnerIds || []) {
      relatedNodeIds.add(partnerId);
    }

    for (let index = 1; index < edge.path.length; index += 1) {
      const start = edge.path[index - 1];
      const end = edge.path[index];
      for (const node of layout.nodes) {
        if (relatedNodeIds.has(node.id)) continue;
        if (!segmentHitsNode(start, end, node)) continue;
        issues.push({
          severity: "error",
          code: "edge-node-overlap",
          edgeId: edge.id,
          nodeId: node.id,
          message: `Edge ${edge.id} passes through node ${node.id}`,
        });
        break;
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

  const parentConnectors = layout.edges
    .map((edge) => ({
      edge,
      familyId: connectorFamilyId(edge),
      segments: horizontalSegments(edge),
    }))
    .filter(
      (entry): entry is typeof entry & { familyId: string } =>
        entry.familyId !== null && entry.segments.length > 0
    );
  const reportedOverlaps = new Set<string>();

  for (let leftIndex = 0; leftIndex < parentConnectors.length; leftIndex++) {
    const left = parentConnectors[leftIndex];
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < parentConnectors.length;
      rightIndex++
    ) {
      const right = parentConnectors[rightIndex];
      if (left.familyId === right.familyId) continue;

      for (const leftSegment of left.segments) {
        for (const rightSegment of right.segments) {
          if (leftSegment.y !== rightSegment.y) continue;
          const overlap =
            Math.min(leftSegment.right, rightSegment.right) -
            Math.max(leftSegment.left, rightSegment.left);
          if (overlap <= 1) continue;

          const familyPair = [left.familyId, right.familyId].sort().join("::");
          const key = `${familyPair}::${leftSegment.y}`;
          if (reportedOverlaps.has(key)) continue;
          reportedOverlaps.add(key);
          issues.push({
            severity: "error",
            code: "edge-edge-overlap",
            edgeId: left.edge.id,
            message: `Parent connectors from different family units overlap by ${Math.round(overlap)}px`,
          });
        }
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
