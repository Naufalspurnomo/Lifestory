// Objective layout quality metrics. Numbers we can track per fixture to
// catch regressions.

import type { LayoutGraph } from "../../../lib/types/tree";
import { LAYOUT } from "../../../lib/types/tree";

const NODE_SIZE = LAYOUT.NODE_SIZE;
const MIN_SPACING = NODE_SIZE + 16;

export type QualityGrade = "A" | "B" | "C" | "D" | "F";

export type LayoutMetrics = {
  nodeCount: number;
  edgeCount: number;
  unionCount: number;
  generations: number;
  width: number;
  height: number;
  aspectRatio: number; // width / height, 1.0-2.5 is comfortable on screen
  overlapPairs: number;
  sameLayerMinSpacing: number;
  longestEdgeLength: number;
  averageEdgeLength: number;
  edgeLengthP95: number;
  edgeOutlierRatio: number; // longestEdge / averageEdge; >3 means skewed
  maxUnionChildSkew: number; // max |unionX - childCenterX| across all unions
  density: number; // nodes per 10000 px²
  qualityGrade: QualityGrade;
  qualityScore: number; // 0-100
  qualityReasons: string[];
};

function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function pathLength(path: { x: number; y: number }[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += distance(path[i - 1].x, path[i - 1].y, path[i].x, path[i].y);
  }
  return total;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((p / 100) * sorted.length))
  );
  return sorted[idx];
}

export function computeMetrics(layout: LayoutGraph): LayoutMetrics {
  const gens = new Set(layout.nodes.map((n) => n.generation ?? 0));
  let overlapPairs = 0;
  let sameLayerMinSpacing = Infinity;

  for (let i = 0; i < layout.nodes.length; i++) {
    const a = layout.nodes[i];
    if (!Number.isFinite(a.x) || !Number.isFinite(a.y)) continue;
    for (let j = i + 1; j < layout.nodes.length; j++) {
      const b = layout.nodes[j];
      if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) continue;
      const sameLayer = a.generation === b.generation;
      const dx = Math.abs(a.x! - b.x!);
      const dy = Math.abs(a.y! - b.y!);
      if (sameLayer && dx < MIN_SPACING && dy < MIN_SPACING) {
        overlapPairs++;
      }
      if (sameLayer) {
        sameLayerMinSpacing = Math.min(sameLayerMinSpacing, dx);
      }
    }
  }

  if (sameLayerMinSpacing === Infinity) sameLayerMinSpacing = 0;

  const edgeLengths = layout.edges.map((e) => pathLength(e.path));
  const longestEdgeLength = edgeLengths.length
    ? Math.max(...edgeLengths)
    : 0;
  const averageEdgeLength = edgeLengths.length
    ? edgeLengths.reduce((a, b) => a + b, 0) / edgeLengths.length
    : 0;
  const edgeLengthP95 = percentile(edgeLengths, 95);
  const edgeOutlierRatio =
    averageEdgeLength > 0 ? longestEdgeLength / averageEdgeLength : 0;

  // How far each union sits from the center of its own children.
  let maxUnionChildSkew = 0;
  if (layout.unions) {
    const nodeById = new Map(layout.nodes.map((n) => [n.id, n]));
    for (const union of layout.unions) {
      const childXs = union.childrenIds
        .map((id) => nodeById.get(id)?.x)
        .filter((x): x is number => Number.isFinite(x));
      if (childXs.length === 0) continue;
      const childCenter =
        childXs.reduce((a, b) => a + b, 0) / childXs.length;
      const skew = Math.abs((union.x ?? 0) - childCenter);
      if (skew > maxUnionChildSkew) maxUnionChildSkew = skew;
    }
  }

  const width = Math.max(1, layout.width);
  const height = Math.max(1, layout.height);
  const aspectRatio = width / height;
  const area = width * height;
  const density = (layout.nodes.length * 10000) / area;

  // ---------- Quality scoring ----------
  // Start from 100, deduct for each problem. Thresholds calibrated to real
  // genealogies: royal families and dynasties are naturally wide, so we
  // accept a lateral bias up to 5:1 before calling the layout messy.
  let score = 100;
  const reasons: string[] = [];

  if (overlapPairs > 0) {
    score -= 30;
    reasons.push(`${overlapPairs} pair node overlap`);
  }

  if (aspectRatio > 7) {
    score -= 20;
    reasons.push(
      `Canvas extremely wide (aspect ${aspectRatio.toFixed(
        1
      )}:1, ideal < 5:1)`
    );
  } else if (aspectRatio > 5) {
    score -= 10;
    reasons.push(
      `Canvas wider than ideal (aspect ${aspectRatio.toFixed(1)}:1)`
    );
  } else if (aspectRatio < 0.3) {
    score -= 10;
    reasons.push(
      `Canvas too narrow / elongated (aspect ${aspectRatio.toFixed(
        1
      )}:1)`
    );
  }

  if (edgeOutlierRatio > 6) {
    score -= 20;
    reasons.push(
      `Some edges are very long (${longestEdgeLength}px vs avg ${Math.round(
        averageEdgeLength
      )}px — outlier ${edgeOutlierRatio.toFixed(1)}×)`
    );
  } else if (edgeOutlierRatio > 4) {
    score -= 10;
    reasons.push(
      `Edge outlier ratio ${edgeOutlierRatio.toFixed(1)}× (ideal < 4×)`
    );
  }

  if (maxUnionChildSkew > LAYOUT.NODE_SPACING_X * 3) {
    score -= 15;
    reasons.push(
      `Union drifted from its children's centre by ${Math.round(
        maxUnionChildSkew
      )}px (ideal < ${LAYOUT.NODE_SPACING_X * 2}px)`
    );
  }

  if (edgeLengthP95 > LAYOUT.NODE_SPACING_Y * 6) {
    score -= 5;
    reasons.push(
      `P95 edge length ${Math.round(edgeLengthP95)}px (ideal < ${
        LAYOUT.NODE_SPACING_Y * 6
      }px)`
    );
  }

  score = Math.max(0, Math.min(100, score));
  const qualityGrade: QualityGrade =
    score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "F";

  return {
    nodeCount: layout.nodes.length,
    edgeCount: layout.edges.length,
    unionCount: layout.unions?.length ?? 0,
    generations: gens.size,
    width: layout.width,
    height: layout.height,
    aspectRatio: Number(aspectRatio.toFixed(2)),
    overlapPairs,
    sameLayerMinSpacing: Math.round(sameLayerMinSpacing),
    longestEdgeLength: Math.round(longestEdgeLength),
    averageEdgeLength: Math.round(averageEdgeLength),
    edgeLengthP95: Math.round(edgeLengthP95),
    edgeOutlierRatio: Number(edgeOutlierRatio.toFixed(2)),
    maxUnionChildSkew: Math.round(maxUnionChildSkew),
    density: Number(density.toFixed(3)),
    qualityGrade,
    qualityScore: Math.round(score),
    qualityReasons: reasons,
  };
}
