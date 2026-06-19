"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Crosshair,
  Eye,
  Layers3,
  Maximize2,
  Minus,
  Plus,
} from "lucide-react";
import type { FamilyGraph, FamilyNode, LayoutGraph } from "../../lib/types/tree";
import { LAYOUT } from "../../lib/types/tree";
import {
  resolveRadialPeople,
  type RadialRelation,
  type RadialViewMode,
} from "../../lib/tree/radialView";
import { resolveTreeFocusContext } from "../../lib/tree/focusView";
import { getSiblingBranchGroup } from "../../lib/tree/siblingOrder";
import { resolveDisplayMediaUrl } from "../../lib/media/public-url";
import { useLanguage } from "../providers/LanguageProvider";

type Props = {
  layout: LayoutGraph;
  graph?: FamilyGraph;
  selectedId: string | null;
  onSelectNode: (id: string | null) => void;
  onAddNode: (
    parentId: string,
    type: "parent" | "partner" | "child" | "sibling"
  ) => void;
  onReorderSiblings: (sourceNodeId: string, orderedBranchIds: string[]) => void;
};

type Transform = {
  x: number;
  y: number;
  k: number;
};

type TreeProjectionMode = "portrait" | "landscape" | "fan";
type DensityMode = "auto" | "map" | "detail";
type RenderMode = "overview" | "compact" | "detail";

type FanSegment = {
  node: FamilyNode;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  relativeGeneration: number;
  relation: RadialRelation;
};

type BranchDragState = {
  sourceNodeId: string;
  sourceBranchId: string;
  draggedNodeIds: string[];
  orderedBranchIds: string[];
  dropX: number;
  rowY: number;
  changed: boolean;
};

// Generation is encoded as a warm tonal ramp, not a rainbow: ancestors recede
// into deep walnut, "you" is the signature bronze anchor, descendants brighten
// into honey. Keeps the quiet-archive identity while staying legible.
const GEN_COLORS: Record<number, { border: string; labelId: string; labelEn: string }> = {
  [-2]: { border: "#574c40", labelId: "Buyut", labelEn: "Great-grandparent" }, // Deep walnut
  [-1]: { border: "#6b5b46", labelId: "Kakek/Nenek", labelEn: "Grandparent" }, // Umber
  [0]: { border: "#7e6a49", labelId: "Orang Tua", labelEn: "Parent" }, // Antique brown
  [1]: { border: "#82693c", labelId: "Anda", labelEn: "You" }, // Signature bronze
  [2]: { border: "#9c8052", labelId: "Anak", labelEn: "Child" }, // Warm bronze
  [3]: { border: "#b39565", labelId: "Cucu", labelEn: "Grandchild" }, // Tan
  [4]: { border: "#c8ac7e", labelId: "Cicit", labelEn: "Great-grandchild" }, // Honey
};
const GEN_FALLBACK_COLOR = "#8c7655";

const NODE_CARD_WIDTH = 154;
const NODE_CARD_HEIGHT = 142;
const NODE_CARD_RADIUS = 18;
const NODE_COMPACT_WIDTH = 120;
const NODE_COMPACT_HEIGHT = 94;
const BUTTON_SIZE = 30;
const MIN_SCALE = 0.045;
const MAX_SCALE = 4;
const FIT_PADDING = 96;
const MINIMAP_DESKTOP = { width: 188, height: 118 };
const MINIMAP_MOBILE = { width: 148, height: 94 };
const CANVAS_TOOLBAR_SAFE_TOP_DESKTOP = 86;
const CANVAS_TOOLBAR_SAFE_TOP_MOBILE = 112;
const CANVAS_TOOLBAR_SAFE_TOP_MOBILE_RADIAL = 160;
const FAN_INNER_RADIUS = 82;
const FAN_RING_WIDTH = 82;
const FAN_RING_GAP = 4;
const FAN_PADDING = 140;

// LRU image cache. Evicts oldest entries when exceeding MAX_IMAGE_CACHE_SIZE.
const MAX_IMAGE_CACHE_SIZE = 200;
const imageCache = new Map<string, HTMLImageElement>();
function imageCacheSet(key: string, img: HTMLImageElement) {
  // Delete then re-insert to maintain insertion-order (Map iterates in insertion order)
  if (imageCache.has(key)) imageCache.delete(key);
  imageCache.set(key, img);
  // Evict oldest entries if over limit
  if (imageCache.size > MAX_IMAGE_CACHE_SIZE) {
    const oldest = imageCache.keys().next().value;
    if (oldest !== undefined) imageCache.delete(oldest);
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function truncateLabel(ctx: CanvasRenderingContext2D, label: string, maxWidth: number) {
  if (ctx.measureText(label).width <= maxWidth) return label;
  let next = label.trim();
  while (next.length > 3 && ctx.measureText(`${next}...`).width > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next.trim()}...`;
}

function wrapLabel(
  ctx: CanvasRenderingContext2D,
  label: string,
  maxWidth: number,
  maxLines = 2
) {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;

    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);

  const consumed = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (consumed < words.length && lines.length > 0) {
    lines[lines.length - 1] = truncateLabel(
      ctx,
      `${lines[lines.length - 1]} ${words.slice(consumed).join(" ")}`,
      maxWidth
    );
  }

  return lines.slice(0, maxLines);
}

function getNodeCardMetrics(
  renderMode: RenderMode,
  scale: number,
  active = false
) {
  if (renderMode === "overview") {
    const safeScale = Math.max(scale, MIN_SCALE);
    return {
      width: (active ? 12 : 8) / safeScale,
      height: (active ? 8 : 5) / safeScale,
      radius: 2 / safeScale,
    };
  }

  if (renderMode === "compact") {
    const safeScale = Math.max(scale, 0.48);
    return {
      width: Math.max(NODE_COMPACT_WIDTH, 76 / safeScale),
      height: Math.max(NODE_COMPACT_HEIGHT, 54 / safeScale),
      radius: Math.max(7, 8 / safeScale),
    };
  }

  return {
    width: NODE_CARD_WIDTH,
    height: NODE_CARD_HEIGHT,
    radius: NODE_CARD_RADIUS,
  };
}

function traceRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function traceEdgePath(ctx: CanvasRenderingContext2D, path: { x: number; y: number }[]) {
  if (path.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let index = 1; index < path.length; index++) {
    ctx.lineTo(path[index].x, path[index].y);
  }
}

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function polarToPoint(
  centerX: number,
  centerY: number,
  radius: number,
  degrees: number
) {
  const radians = degreesToRadians(degrees);
  return {
    x: centerX + Math.cos(radians) * radius,
    y: centerY + Math.sin(radians) * radius,
  };
}

function traceFanSegment(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  ctx.beginPath();
  ctx.arc(
    centerX,
    centerY,
    outerRadius,
    degreesToRadians(startAngle),
    degreesToRadians(endAngle)
  );
  ctx.arc(
    centerX,
    centerY,
    innerRadius,
    degreesToRadians(endAngle),
    degreesToRadians(startAngle),
    true
  );
  ctx.closePath();
}

function drawConnectorJoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string
) {
  const safeScale = Math.max(scale, 0.45);
  const radius = 3.2 / safeScale;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius + 1.5 / safeScale, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,248,232,0.82)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const scale = Math.max(width / img.width, height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  ctx.drawImage(
    img,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );
}

function traceNodeShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  traceRoundedRect(ctx, x - w / 2, y - h / 2, w, h, r);
}

function drawCrown(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const w = r * 1.9;
  const h = r * 1.2;
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = cy - h / 2;
  const bottom = cy + h / 2;
  const dip = cy - h * 0.06;

  ctx.save();
  ctx.shadowColor = "rgba(44,30,22,0.3)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1.2;
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  ctx.lineTo(left, top + h * 0.28);
  ctx.lineTo(cx - w * 0.24, dip);
  ctx.lineTo(cx, top);
  ctx.lineTo(cx + w * 0.24, dip);
  ctx.lineTo(right, top + h * 0.28);
  ctx.lineTo(right, bottom);
  ctx.closePath();
  const grad = ctx.createLinearGradient(left, top, right, bottom);
  grad.addColorStop(0, "#9c8052");
  grad.addColorStop(1, "#6f5630");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = "rgba(255,250,240,0.85)";
  ctx.stroke();
  ctx.restore();
}

function getQuickAddButtons(
  node: FamilyNode,
  metrics = getNodeCardMetrics("detail", 1)
) {
  return [
    {
      type: "parent" as const,
      x: node.x || 0,
      y: (node.y || 0) - metrics.height / 2 - 24,
    },
    {
      type: "partner" as const,
      x: (node.x || 0) + metrics.width / 2 + 30,
      y: node.y || 0,
    },
    {
      type: "child" as const,
      x: node.x || 0,
      y: (node.y || 0) + metrics.height / 2 + 30,
    },
    {
      type: "sibling" as const,
      x: (node.x || 0) - metrics.width / 2 - 30,
      y: node.y || 0,
    },
  ];
}

function getRenderMode(scale: number, densityMode: DensityMode): RenderMode {
  if (densityMode === "map") return "overview";
  if (densityMode === "detail") return "detail";
  if (scale < 0.48) return "overview";
  if (scale < 0.82) return "compact";
  return "detail";
}

function projectLandscapeLayout(layout: LayoutGraph): LayoutGraph {
  const project = (point: { x: number; y: number }) => ({
    x: point.y,
    y: point.x,
  });

  return {
    ...layout,
    nodes: layout.nodes.map((node) => ({
      ...node,
      x: Number.isFinite(node.y) ? node.y : node.x,
      y: Number.isFinite(node.x) ? node.x : node.y,
    })),
    unions: layout.unions?.map((union) => ({
      ...union,
      x: Number.isFinite(union.y) ? union.y : union.x,
      y: Number.isFinite(union.x) ? union.x : union.y,
    })),
    edges: layout.edges.map((edge) => ({
      ...edge,
      path: edge.path.map(project),
    })),
    width: layout.height,
    height: layout.width,
  };
}

function distributeAngle(index: number, count: number, start: number, end: number) {
  if (count <= 1) return (start + end) / 2;
  return start + ((end - start) * index) / (count - 1);
}

function getFanArc(relativeGeneration: number, relation: RadialRelation) {
  if (relation === "partner" || relation === "collateral") {
    return { start: 160, end: 200 };
  }
  if (relativeGeneration < 0) {
    return { start: 200, end: 340 };
  }
  if (relativeGeneration > 0) {
    return { start: 20, end: 160 };
  }
  return { start: 20, end: 160 };
}

function getFanRing(relativeGeneration: number) {
  return Math.max(1, Math.abs(relativeGeneration));
}

function getFanSegmentFill(
  relativeGeneration: number,
  index: number,
  relation: RadialRelation
) {
  const ancestor = ["#e3dac8", "#d6c8ac", "#c7b690", "#b8a479"];
  const descendant = ["#f4e7c9", "#edd9af", "#e4c995", "#d9b87f"];
  const peer = ["#ece0c6", "#e1d1ad"];
  const palette =
    relation === "partner" || relation === "collateral"
      ? peer
      :
    relativeGeneration < 0
      ? ancestor
      : relativeGeneration > 0
      ? descendant
      : peer;
  return palette[index % palette.length];
}

function buildFanSegments(nodes: FamilyNode[], owner: FamilyNode): FanSegment[] {
  const ownerGeneration = owner.generation ?? 0;
  const byRelativeGeneration = new Map<number, FamilyNode[]>();

  for (const node of nodes) {
    if (node.id === owner.id) continue;
    const relativeGeneration = (node.generation ?? ownerGeneration) - ownerGeneration;
    byRelativeGeneration.set(relativeGeneration, [
      ...(byRelativeGeneration.get(relativeGeneration) || []),
      node,
    ]);
  }

  const segments: FanSegment[] = [];
  for (const [relativeGeneration, group] of byRelativeGeneration.entries()) {
    const sorted = [...group].sort((a, b) => {
      const byX = (a.x || 0) - (b.x || 0);
      if (Math.abs(byX) > 0.001) return byX;
      return a.label.localeCompare(b.label, "id", { sensitivity: "base" });
    });
    const relation = (sorted[0]?.line || "default") as RadialRelation;
    const arc = getFanArc(relativeGeneration, relation);
    const span = arc.end - arc.start;
    const gap = sorted.length > 1 ? Math.min(1.4, span / sorted.length / 5) : 0;
    const step = span / Math.max(1, sorted.length);
    const ring = getFanRing(relativeGeneration);
    const innerRadius =
      FAN_INNER_RADIUS + (ring - 1) * (FAN_RING_WIDTH + FAN_RING_GAP);
    const outerRadius = innerRadius + FAN_RING_WIDTH;

    sorted.forEach((node, index) => {
      segments.push({
        node,
        innerRadius,
        outerRadius,
        startAngle: arc.start + index * step + gap,
        endAngle: arc.start + (index + 1) * step - gap,
        relativeGeneration,
        relation,
      });
    });
  }

  return segments;
}

function projectFanLayout(
  layout: LayoutGraph,
  graph: FamilyGraph | undefined,
  focusId: string,
  mode: RadialViewMode
): LayoutGraph {
  if (layout.nodes.length === 0) return layout;

  const radialPeople = resolveRadialPeople(layout.nodes, focusId, mode, graph);
  const radialIds = new Set(radialPeople.map((entry) => entry.node.id));
  const sourceById = new Map(layout.nodes.map((node) => [node.id, node]));
  const radialNodes = radialPeople.map((entry) => ({
    ...(sourceById.get(entry.node.id) || entry.node),
    generation:
      entry.relation === "ancestor" || entry.relation === "unknown"
        ? -entry.depth
        : entry.relation === "descendant"
        ? entry.depth
        : 0,
    line: entry.relation as FamilyNode["line"],
  }));
  const owner = radialNodes.find((node) => node.id === focusId) || radialNodes[0];
  const ownerGeneration = 0;
  const relativeGenerations = radialNodes.map(
    (node) => (node.generation ?? ownerGeneration) - ownerGeneration
  );
  const maxRing = Math.max(
    1,
    ...relativeGenerations.map(getFanRing)
  );
  const maxRadius =
    FAN_INNER_RADIUS + maxRing * (FAN_RING_WIDTH + FAN_RING_GAP);
  const center = {
    x: FAN_PADDING + maxRadius,
    y: FAN_PADDING + maxRadius,
  };
  const positioned = new Map<string, { x: number; y: number }>();

  const byGeneration = new Map<number, typeof layout.nodes>();
  for (const node of radialNodes) {
    const relative = (node.generation ?? ownerGeneration) - ownerGeneration;
    byGeneration.set(relative, [...(byGeneration.get(relative) || []), node]);
  }

  const fanNodes = radialNodes.map((node) => {
    const relative = (node.generation ?? ownerGeneration) - ownerGeneration;

    if (node.id === owner.id) {
      positioned.set(node.id, center);
      return { ...node, x: center.x, y: center.y, generation: relative };
    }

    const group = [...(byGeneration.get(relative) || [])].sort(
      (a, b) => (a.x || 0) - (b.x || 0)
    );
    const siblings = group.filter((item) => item.id !== owner.id);
    const index = Math.max(0, siblings.findIndex((item) => item.id === node.id));
    const count = Math.max(1, siblings.length);
    const ring = getFanRing(relative);
    const radius =
      FAN_INNER_RADIUS +
      (ring - 0.5) * (FAN_RING_WIDTH + FAN_RING_GAP);
    const arc = getFanArc(relative, (node.line || "default") as RadialRelation);
    const angle = distributeAngle(index, count, arc.start + 6, arc.end - 6);
    const position = polarToPoint(center.x, center.y, radius, angle);
    positioned.set(node.id, position);
    return { ...node, x: position.x, y: position.y, generation: relative };
  });

  const fanUnions = layout.unions?.filter((union) =>
    union.partnerIds.some((id) => radialIds.has(id))
  ).map((union) => {
    const partnerPoints = union.partnerIds
      .map((id) => positioned.get(id))
      .filter((point): point is { x: number; y: number } => Boolean(point));
    const childPoints = union.childrenIds
      .map((id) => positioned.get(id))
      .filter((point): point is { x: number; y: number } => Boolean(point));
    const anchorPoints = partnerPoints.length > 0 ? partnerPoints : childPoints;
    const x =
      anchorPoints.length > 0
        ? anchorPoints.reduce((sum, point) => sum + point.x, 0) /
          anchorPoints.length
        : center.x;
    const y =
      anchorPoints.length > 0
        ? anchorPoints.reduce((sum, point) => sum + point.y, 0) /
          anchorPoints.length
        : center.y;
    positioned.set(union.id, { x, y });
    return { ...union, x, y };
  });

  const allPoints = [
    ...fanNodes.map((node) => ({ x: node.x || 0, y: node.y || 0 })),
    ...(fanUnions || []).map((union) => ({ x: union.x || 0, y: union.y || 0 })),
  ];
  const width =
    Math.ceil(Math.max(...allPoints.map((point) => point.x)) + FAN_PADDING) || 0;
  const height =
    Math.ceil(Math.max(...allPoints.map((point) => point.y)) + FAN_PADDING) || 0;

  return {
    nodes: fanNodes,
    unions: fanUnions,
    edges: [],
    width,
    height,
  };
}

function projectLayout(
  layout: LayoutGraph,
  mode: TreeProjectionMode,
  graph: FamilyGraph | undefined,
  focusId: string,
  radialMode: RadialViewMode
): LayoutGraph {
  if (mode === "landscape") return projectLandscapeLayout(layout);
  if (mode === "fan") return projectFanLayout(layout, graph, focusId, radialMode);
  return layout;
}

function drawFanChart(
  ctx: CanvasRenderingContext2D,
  nodes: FamilyNode[],
  owner: FamilyNode | undefined,
  selectedId: string | null,
  hoveredId: string | null,
  locale: string,
  scale: number,
  radialMode: RadialViewMode
) {
  if (!owner || !Number.isFinite(owner.x) || !Number.isFinite(owner.y)) return;

  const centerX = owner.x || 0;
  const centerY = owner.y || 0;
  const segments = buildFanSegments(nodes, owner);
  const safeScale = Math.max(scale, 0.35);

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (const segment of segments) {
    const isActive =
      segment.node.id === selectedId || segment.node.id === hoveredId;
    const fill = getFanSegmentFill(
      segment.relativeGeneration,
      Math.abs(segment.relativeGeneration),
      segment.relation
    );

    ctx.save();
    traceFanSegment(
      ctx,
      centerX,
      centerY,
      segment.innerRadius,
      segment.outerRadius,
      segment.startAngle,
      segment.endAngle
    );
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = isActive ? "#82693c" : "rgba(116,88,48,0.36)";
    ctx.lineWidth = (isActive ? 2.4 : 1.15) / safeScale;
    ctx.stroke();
    ctx.restore();

    const angle = (segment.startAngle + segment.endAngle) / 2;
    const radius = (segment.innerRadius + segment.outerRadius) / 2;
    const labelPoint = polarToPoint(centerX, centerY, radius, angle);
    const arcWidth =
      degreesToRadians(segment.endAngle - segment.startAngle) * radius;
    const maxTextWidth = Math.max(38, Math.min(120, arcWidth * 0.74));
    const showLabel = arcWidth > 42 && segment.outerRadius - segment.innerRadius > 42;

    if (showLabel) {
      ctx.save();
      ctx.translate(labelPoint.x, labelPoint.y);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isActive ? "#2f241c" : "#3f342d";
      ctx.font = `${isActive ? 800 : 700} 11px "Playfair Display", serif`;
      const labelLines = wrapLabel(ctx, segment.node.label, maxTextWidth, 2);
      labelLines.forEach((line, index) => {
        ctx.fillText(
          line,
          0,
          (index - (labelLines.length - 1) / 2) * 12
        );
      });

      if (segment.node.year && labelLines.length < 2) {
        ctx.font = "700 9px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#3f342d";
        ctx.fillText(String(segment.node.year), 0, 16);
      }
      ctx.restore();
    }
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, FAN_INNER_RADIUS - 14, 0, Math.PI * 2);
  ctx.fillStyle = "#fffaf0";
  ctx.shadowColor = "rgba(44,30,22,0.24)";
  ctx.shadowBlur = 14 / safeScale;
  ctx.shadowOffsetY = 4 / safeScale;
  ctx.fill();
  ctx.restore();

  if (radialMode === "descendants" && nodes.length === 1) {
    ctx.save();
    ctx.font = "700 11px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(45,33,22,0.92)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      locale === "id" ? "Belum ada keturunan" : "No descendants yet",
      centerX,
      centerY + FAN_INNER_RADIUS + 28
    );
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, FAN_INNER_RADIUS - 14, 0, Math.PI * 2);
  ctx.strokeStyle = selectedId === owner.id ? "#82693c" : "rgba(116,88,48,0.46)";
  ctx.lineWidth = (selectedId === owner.id ? 2.4 : 1.4) / safeScale;
  ctx.stroke();
  ctx.clip();
  ctx.fillStyle = "#3f342d";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '800 13px "Playfair Display", serif';
  const ownerLines = wrapLabel(ctx, owner.label, FAN_INNER_RADIUS * 1.15, 2);
  ownerLines.forEach((line, index) => {
    ctx.fillText(line, centerX, centerY - 6 + index * 14);
  });
  if (owner.year) {
    ctx.font = "600 9px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#725f45";
    ctx.fillText(
      owner.deathYear ? `${owner.year} - ${owner.deathYear}` : String(owner.year),
      centerX,
      centerY + 25
    );
  }
  ctx.restore();

  ctx.save();
  ctx.font = "800 10px Inter, system-ui, sans-serif";
  ctx.fillStyle = "rgba(45,33,22,0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (radialMode !== "descendants") {
    const ancestorPoint = polarToPoint(centerX, centerY, FAN_INNER_RADIUS + 36, 270);
    ctx.fillText(
      locale === "id" ? "LELUHUR" : "ANCESTORS",
      ancestorPoint.x,
      ancestorPoint.y
    );
  }
  if (radialMode !== "ancestors") {
    const descendantPoint = polarToPoint(centerX, centerY, FAN_INNER_RADIUS + 36, 90);
    ctx.fillText(
      locale === "id" ? "KETURUNAN" : "DESCENDANTS",
      descendantPoint.x,
      descendantPoint.y
    );
  }
  ctx.restore();

  ctx.restore();
}

export default function FamilyTreeCanvas({
  layout,
  graph,
  selectedId,
  onSelectNode,
  onAddNode,
  onReorderSiblings,
}: Props) {
  const { locale } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
  const pendingBranchDragRef = useRef<{
    pointerId: number;
    sourceNodeId: string;
    startX: number;
    startY: number;
  } | null>(null);
  const pinchRef = useRef<{
    distance: number;
    center: { x: number; y: number };
    transform: Transform;
  } | null>(null);
  const initializedRef = useRef(false);
  // C4: Guard to prevent infinite focus -> re-render -> focus loop.
  const focusedForRef = useRef<string | null>(null);
  // Track last pointer type for adaptive click threshold
  const lastPointerTypeRef = useRef<string>("mouse");

  const copy = useMemo(
    () =>
      locale === "id"
        ? {
            fit: "Lihat semua",
            center: "Pusatkan",
            layout: "Layout",
            display: "Tampilan",
            zoomIn: "Perbesar",
            zoomOut: "Perkecil",
            view: "Arah pohon",
            portrait: "Potret",
            landscape: "Lanskap",
            fan: "Radial",
            radial: "Radial View",
            ancestors: "Leluhur",
            descendants: "Keturunan",
            family: "Keluarga Besar",
            density: "Mode tampilan",
            auto: "Auto",
            map: "Map",
            detail: "Detail",
            selected: "Dipilih",
            people: "orang",
            generations: "generasi",
            overview: "Overview",
            compact: "Ringkas",
            detailed: "Detail",
            hint:
              "Drag area kosong untuk geser. Tekan lalu geser kartu saudara untuk mengatur urutan.",
            reorderHint: "Geser ke posisi baru, lalu lepaskan.",
          }
        : {
            fit: "Fit all",
            center: "Center",
            layout: "Layout",
            display: "View",
            zoomIn: "Zoom in",
            zoomOut: "Zoom out",
            view: "Tree view",
            portrait: "Portrait",
            landscape: "Landscape",
            fan: "Radial",
            radial: "Radial View",
            ancestors: "Ancestors",
            descendants: "Descendants",
            family: "Extended Family",
            density: "View mode",
            auto: "Auto",
            map: "Map",
            detail: "Detail",
            selected: "Selected",
            people: "people",
            generations: "generations",
            overview: "Overview",
            compact: "Compact",
            detailed: "Detail",
            hint:
              "Drag empty space to pan. Press and drag a sibling card to reorder.",
            reorderHint: "Move to a new position, then release.",
          },
    [locale]
  );

  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });
  const [treeProjectionMode, setTreeProjectionMode] =
    useState<TreeProjectionMode>("portrait");
  const [radialMode, setRadialMode] = useState<RadialViewMode>("ancestors");
  const [densityMode, setDensityMode] = useState<DensityMode>("auto");
  const [highlightedGeneration, setHighlightedGeneration] = useState<number | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [branchDrag, setBranchDrag] = useState<BranchDragState | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const radialFocusId =
    layout.nodes.some((node) => node.id === selectedId)
      ? selectedId!
      : layout.nodes.find((node) => node.line === "self")?.id || layout.nodes[0]?.id || "";
  const projectedLayout = useMemo(
    () => projectLayout(layout, treeProjectionMode, graph, radialFocusId, radialMode),
    [graph, layout, radialFocusId, radialMode, treeProjectionMode]
  );
  const { nodes, edges, width, height } = projectedLayout;

  const owner = useMemo(
    () => nodes.find((node) => node.line === "self") || nodes[0],
    [nodes]
  );
  const ownerGen = owner?.generation ?? 0;
  const interactionFocusId =
    treeProjectionMode === "fan" ? null : hoveredId || selectedId;
  const focusContext = useMemo(
    () =>
      interactionFocusId
        ? resolveTreeFocusContext(layout.nodes, interactionFocusId, graph)
        : null,
    [graph, interactionFocusId, layout.nodes]
  );
  const generationFocusContext = useMemo(() => {
    if (highlightedGeneration === null || treeProjectionMode !== "portrait") {
      return null;
    }
    const nodeIds = new Set(
      nodes
        .filter((node) => node.generation === highlightedGeneration)
        .map((node) => node.id)
    );
    const unionIds = new Set(
      (projectedLayout.unions || [])
        .filter((union) =>
          [...union.partnerIds, ...union.childrenIds].some((id) => nodeIds.has(id))
        )
        .map((union) => union.id)
    );
    return {
      nodeIds,
      unionIds,
      entityIds: new Set([...nodeIds, ...unionIds]),
    };
  }, [
    highlightedGeneration,
    nodes,
    projectedLayout.unions,
    treeProjectionMode,
  ]);
  const visualFocusContext = focusContext || generationFocusContext;
  const renderMode = getRenderMode(transform.k, densityMode);
  const minimapSize =
    wrapperSize.width < 480 ? MINIMAP_MOBILE : MINIMAP_DESKTOP;
  const toolbarSafeTop =
    wrapperSize.width < 640
      ? treeProjectionMode === "fan"
        ? CANVAS_TOOLBAR_SAFE_TOP_MOBILE_RADIAL
        : CANVAS_TOOLBAR_SAFE_TOP_MOBILE
      : CANVAS_TOOLBAR_SAFE_TOP_DESKTOP;
  const showGenerationMarkers = treeProjectionMode === "portrait";

  const generationMarkers = useMemo(() => {
    if (!showGenerationMarkers) return [];
    const byGeneration = new Map<number, { y: number; count: number }>();
    for (const node of nodes) {
      if (!Number.isFinite(node.y) || typeof node.generation !== "number") {
        continue;
      }
      const current = byGeneration.get(node.generation);
      if (!current) {
        byGeneration.set(node.generation, { y: node.y!, count: 1 });
      } else {
        current.y = Math.min(current.y, node.y!);
        current.count += 1;
      }
    }
    return Array.from(byGeneration.entries())
      .map(([generation, value]) => ({ generation, ...value }))
      .sort((a, b) => a.generation - b.generation);
  }, [nodes, showGenerationMarkers]);

  const calculateFitTransform = useCallback(
    (maxScale = 1.05): Transform => {
      if (!wrapperSize.width || !wrapperSize.height || !width || !height) {
        return { x: 0, y: 0, k: 1 };
      }

      const scaleX = (wrapperSize.width - FIT_PADDING) / width;
      const usableHeight = Math.max(
        1,
        wrapperSize.height - toolbarSafeTop
      );
      const scaleY = (usableHeight - FIT_PADDING) / height;
      const scale = clamp(Math.min(scaleX, scaleY), MIN_SCALE, maxScale);

      return {
        x: (wrapperSize.width - width * scale) / 2,
        y: toolbarSafeTop + (usableHeight - height * scale) / 2,
        k: scale,
      };
    },
    [height, toolbarSafeTop, width, wrapperSize.height, wrapperSize.width]
  );

  const focusNode = useCallback(
    (nodeId: string, minScale = 0.82) => {
      const node = nodes.find((item) => item.id === nodeId);
      if (!node || !wrapperSize.width || !wrapperSize.height) return;

      const nextScale = clamp(Math.max(transform.k, minScale), MIN_SCALE, MAX_SCALE);
      const usableHeight = Math.max(1, wrapperSize.height - toolbarSafeTop);
      setTransform({
        x: wrapperSize.width / 2 - (node.x || 0) * nextScale,
        y:
          toolbarSafeTop +
          usableHeight / 2 -
          (node.y || 0) * nextScale,
        k: nextScale,
      });
    },
    [
      nodes,
      toolbarSafeTop,
      transform.k,
      wrapperSize.height,
      wrapperSize.width,
    ]
  );

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const update = () => {
      setWrapperSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    initializedRef.current = false;
  }, [height, nodes.length, treeProjectionMode, width]);

  useEffect(() => {
    if (initializedRef.current || nodes.length === 0 || !wrapperSize.width) {
      return;
    }
    setTransform(calculateFitTransform());
    initializedRef.current = true;
  }, [calculateFitTransform, nodes.length, wrapperSize.width]);

  useEffect(() => {
    let loadedCount = 0;
    const toLoad = Array.from(
      new Set(
        nodes
          .map((node) =>
            node.imageUrl ? resolveDisplayMediaUrl(node.imageUrl) : null
          )
          .filter((url): url is string => Boolean(url))
      )
    ).filter((url) => !imageCache.has(url));

    if (toLoad.length === 0) return;

    toLoad.forEach((imageUrl) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageCacheSet(imageUrl, img);
        loadedCount++;
        if (loadedCount === toLoad.length) setImagesLoaded((value) => value + 1);
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === toLoad.length) setImagesLoaded((value) => value + 1);
      };
      img.src = imageUrl;
    });
  }, [nodes]);

  const screenToWorld = useCallback(
    (sx: number, sy: number) => ({
      x: (sx - transform.x) / transform.k,
      y: (sy - transform.y) / transform.k,
    }),
    [transform]
  );

  const getRelativePoint = useCallback((clientX: number, clientY: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return null;
    const rect = wrapper.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const findNodeAt = useCallback(
    (clientX: number, clientY: number) => {
      const point = getRelativePoint(clientX, clientY);
      if (!point) return null;
      const world = screenToWorld(point.x, point.y);
      const baseHit = getNodeCardMetrics(renderMode, transform.k);
      const hitWidth = Math.max(baseHit.width, 36 / transform.k);
      const hitHeight = Math.max(baseHit.height, 28 / transform.k);

      for (let index = nodes.length - 1; index >= 0; index--) {
        const node = nodes[index];
        if (typeof node.x !== "number" || typeof node.y !== "number") continue;
        if (
          Math.abs(world.x - node.x) <= hitWidth / 2 &&
          Math.abs(world.y - node.y) <= hitHeight / 2
        ) {
          return node;
        }
      }

      return null;
    },
    [getRelativePoint, nodes, renderMode, screenToWorld, transform.k]
  );

  const buildBranchDragState = useCallback(
    (
      sourceNodeId: string,
      clientX: number,
      clientY: number
    ): BranchDragState | null => {
      if (treeProjectionMode !== "portrait") return null;
      const group = getSiblingBranchGroup(nodes, sourceNodeId);
      const point = getRelativePoint(clientX, clientY);
      if (!group || !point) return null;

      const byId = new Map(nodes.map((node) => [node.id, node]));
      const branches = group.branches
        .map((branch) => {
          const positioned = branch.nodeIds
            .map((id) => byId.get(id))
            .filter(
              (node): node is FamilyNode =>
                node !== undefined &&
                Number.isFinite(node.x) &&
                Number.isFinite(node.y)
            );
          if (positioned.length === 0) return null;
          return {
            ...branch,
            centerX:
              positioned.reduce((sum, node) => sum + node.x!, 0) /
              positioned.length,
            centerY:
              positioned.reduce((sum, node) => sum + node.y!, 0) /
              positioned.length,
          };
        })
        .filter((branch): branch is NonNullable<typeof branch> => Boolean(branch))
        .sort((a, b) => a.centerX - b.centerX);

      const sourceBranch = branches.find(
        (branch) => branch.id === group.sourceBranchId
      );
      if (!sourceBranch || branches.length < 2) return null;

      const world = screenToWorld(point.x, point.y);
      const remaining = branches.filter((branch) => branch.id !== sourceBranch.id);
      let insertAt = remaining.findIndex((branch) => world.x < branch.centerX);
      if (insertAt === -1) insertAt = remaining.length;

      const orderedBranchIds = remaining.map((branch) => branch.id);
      orderedBranchIds.splice(insertAt, 0, sourceBranch.id);
      const currentBranchIds = branches.map((branch) => branch.id);

      const left = remaining[insertAt - 1];
      const right = remaining[insertAt];
      const dropX =
        left && right
          ? (left.centerX + right.centerX) / 2
          : left
          ? left.centerX + LAYOUT.NODE_SPACING_X * 0.55
          : right
          ? right.centerX - LAYOUT.NODE_SPACING_X * 0.55
          : sourceBranch.centerX;

      return {
        sourceNodeId,
        sourceBranchId: sourceBranch.id,
        draggedNodeIds: sourceBranch.nodeIds,
        orderedBranchIds,
        dropX,
        rowY: sourceBranch.centerY,
        changed: orderedBranchIds.some(
          (branchId, index) => branchId !== currentBranchIds[index]
        ),
      };
    },
    [getRelativePoint, nodes, screenToWorld, treeProjectionMode]
  );

  const findButtonAt = useCallback(
    (clientX: number, clientY: number) => {
      if (!selectedId || renderMode === "overview" || treeProjectionMode === "fan") {
        return null;
      }
      const point = getRelativePoint(clientX, clientY);
      if (!point) return null;
      const world = screenToWorld(point.x, point.y);
      const selectedNode = nodes.find((node) => node.id === selectedId);
      if (!selectedNode) return null;

      // Guard: reject clicks that land inside the node card itself.
      // This prevents touch taps on a selected node from accidentally
      // triggering an overlapping quick-add button (especially at low zoom
      // where the button hit radius inflates via 8/transform.k).
      const cardMetrics = getNodeCardMetrics(renderMode, transform.k, true);
      const nx = selectedNode.x || 0;
      const ny = selectedNode.y || 0;
      if (
        Math.abs(world.x - nx) <= cardMetrics.width / 2 &&
        Math.abs(world.y - ny) <= cardMetrics.height / 2
      ) {
        return null;
      }

      for (const button of getQuickAddButtons(selectedNode, cardMetrics)) {
        const dx = world.x - button.x;
        const dy = world.y - button.y;
        const radius = BUTTON_SIZE / 2 + 8 / transform.k;
        if (dx * dx + dy * dy <= radius * radius) {
          return { nodeId: selectedNode.id, type: button.type };
        }
      }
      return null;
    },
    [
      getRelativePoint,
      nodes,
      renderMode,
      screenToWorld,
      selectedId,
      transform.k,
      treeProjectionMode,
    ]
  );

  // C4: Auto-focus selected node if it's off-screen, but guard against
  // infinite loops where focusNode triggers transform change which re-triggers
  // this effect.
  useEffect(() => {
    if (!selectedId || !wrapperSize.width || !wrapperSize.height) {
      focusedForRef.current = null;
      return;
    }
    // Already focused for this selection. Skip.
    if (focusedForRef.current === selectedId) return;

    const node = nodes.find((item) => item.id === selectedId);
    if (!node) return;

    const screenX = (node.x || 0) * transform.k + transform.x;
    const screenY = (node.y || 0) * transform.k + transform.y;
    const outside =
      screenX < 72 ||
      screenX > wrapperSize.width - 72 ||
      screenY < toolbarSafeTop + 24 ||
      screenY > wrapperSize.height - 72;

    if (outside || transform.k < 0.2) {
      focusedForRef.current = selectedId;
      focusNode(selectedId);
    }
  }, [
    focusNode,
    nodes,
    selectedId,
    transform.k,
    transform.x,
    transform.y,
    toolbarSafeTop,
    wrapperSize.height,
    wrapperSize.width,
  ]);

  // Reset focus guard when selection changes
  useEffect(() => {
    focusedForRef.current = null;
  }, [selectedId]);

  const visibleWorld = useMemo(() => {
    if (!wrapperSize.width || !wrapperSize.height) {
      return { left: 0, top: 0, right: width, bottom: height };
    }
    const margin = 220 / transform.k;
    return {
      left: -transform.x / transform.k - margin,
      top: -transform.y / transform.k - margin,
      right: (wrapperSize.width - transform.x) / transform.k + margin,
      bottom: (wrapperSize.height - transform.y) / transform.k + margin,
    };
  }, [
    height,
    transform.k,
    transform.x,
    transform.y,
    width,
    wrapperSize.height,
    wrapperSize.width,
  ]);

  const drawTree = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { clientWidth, clientHeight } = wrapper;
    const dpr = window.devicePixelRatio || 1;

    if (
      canvas.width !== clientWidth * dpr ||
      canvas.height !== clientHeight * dpr
    ) {
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, clientWidth, clientHeight);
    
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    if (treeProjectionMode === "fan") {
      drawFanChart(
        ctx,
        nodes,
        owner,
        selectedId,
        hoveredId,
        locale,
        transform.k,
        radialMode
      );
      ctx.restore();
      return;
    }

    // S7: Use NODE_SPACING_Y for generation band height instead of hardcoded 75.
    const bandHalf = LAYOUT.NODE_SPACING_Y / 2;
    for (const marker of generationMarkers) {
      const y = marker.y;
      const bandTop = y - bandHalf;
      const bandBottom = y + bandHalf;
      if (bandBottom < visibleWorld.top || bandTop > visibleWorld.bottom) {
        continue;
      }
      ctx.fillStyle =
        marker.generation % 2 === 0
          ? "rgba(130, 105, 60, 0.035)"
          : "rgba(130, 105, 60, 0.06)"; // quiet alternating bronze bands
      ctx.fillRect(visibleWorld.left, bandTop, visibleWorld.right - visibleWorld.left, bandHalf * 2);
    }

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const edge of edges) {
      if (edge.path.length === 0) continue;
      const visible = edge.path.some(
        (point) =>
          point.x >= visibleWorld.left &&
          point.x <= visibleWorld.right &&
          point.y >= visibleWorld.top &&
          point.y <= visibleWorld.bottom
      );
      if (!visible) continue;

      ctx.save();
      const isSpouse = edge.type === "spouse";
      const isAdoption = edge.type === "adoption";
      const isParentConnector =
        edge.type === "union-child" || edge.type === "parent-union";
      const isFocusEdge =
        !visualFocusContext ||
        (visualFocusContext.entityIds.has(edge.source) &&
          visualFocusContext.entityIds.has(edge.target));
      const isHighlightedEdge = Boolean(visualFocusContext && isFocusEdge);
      const edgeAlpha = visualFocusContext ? (isFocusEdge ? 1 : 0.13) : 1;
      ctx.globalAlpha = edgeAlpha;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash(isAdoption ? [8 / transform.k, 8 / transform.k] : []);
      traceEdgePath(ctx, edge.path);
      ctx.strokeStyle =
        isHighlightedEdge
          ? "rgba(255,252,242,0.94)"
          : renderMode === "detail"
          ? "rgba(255,248,232,0.72)"
          : "rgba(255,248,232,0.48)";
      ctx.lineWidth =
        (renderMode === "detail"
          ? isSpouse
            ? isHighlightedEdge ? 7 : 5.4
            : isParentConnector
            ? isHighlightedEdge ? 6.6 : 5.0
            : isHighlightedEdge ? 5.8 : 4.2
          : isSpouse
          ? isHighlightedEdge ? 5.2 : 3.7
          : isHighlightedEdge ? 4.7 : 3.2) /
        Math.max(transform.k, renderMode === "detail" ? 0.25 : 0.18);
      ctx.stroke();
      
      if (renderMode === "detail") {
        // Clean single-line connection with warm brown tones.
        ctx.save();
        ctx.strokeStyle = isSpouse
          ? isHighlightedEdge ? "rgba(104,73,28,1)" : "rgba(118,88,39,0.9)"
          : isAdoption
          ? isHighlightedEdge ? "rgba(45,105,68,1)" : "rgba(63,116,78,0.78)"
          : isHighlightedEdge ? "rgba(91,62,25,1)" : "rgba(94,72,39,0.88)";
        ctx.lineWidth =
          (isSpouse
            ? isHighlightedEdge ? 3.6 : 2.8
            : isParentConnector
            ? isHighlightedEdge ? 3.4 : 2.6
            : isHighlightedEdge ? 3.1 : 2.2) /
          Math.max(transform.k, 0.25);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.setLineDash(isAdoption ? [8 / transform.k, 8 / transform.k] : []);
        ctx.beginPath();
        ctx.moveTo(edge.path[0].x, edge.path[0].y);
        for (let index = 1; index < edge.path.length; index++) {
          ctx.lineTo(edge.path[index].x, edge.path[index].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        traceEdgePath(ctx, edge.path);
        ctx.strokeStyle = isAdoption
          ? "rgba(242,255,244,0.62)"
          : "rgba(255,248,232,0.7)";
        ctx.lineWidth = 0.8 / Math.max(transform.k, 0.25);
        ctx.globalAlpha = edgeAlpha * (isParentConnector ? 0.9 : 0.75);
        ctx.stroke();
        ctx.globalAlpha = edgeAlpha;

        if (isParentConnector && edge.path.length >= 3) {
          const joint = edge.path[1];
          drawConnectorJoint(ctx, joint.x, joint.y, transform.k, isSpouse
            ? "rgba(118,88,39,0.9)"
            : "rgba(94,72,39,0.88)");
        }
        ctx.restore();
      } else {
        // Compact/Overview Mode: Single line for performance
        ctx.beginPath();
        ctx.strokeStyle = isSpouse
          ? isHighlightedEdge ? "rgba(104,73,28,1)" : "rgba(118,88,39,0.72)"
          : isAdoption
          ? isHighlightedEdge ? "rgba(45,105,68,1)" : "rgba(63,116,78,0.55)"
          : isHighlightedEdge ? "rgba(91,62,25,1)" : "rgba(94,72,39,0.68)";
        ctx.lineWidth =
          (isSpouse
            ? isHighlightedEdge ? 2.8 : 1.9
            : isHighlightedEdge ? 2.5 : 1.65) /
          Math.max(transform.k, 0.18);
        ctx.setLineDash(isAdoption ? [8 / transform.k, 8 / transform.k] : []);
        ctx.moveTo(edge.path[0].x, edge.path[0].y);
        for (let index = 1; index < edge.path.length; index++) {
          ctx.lineTo(edge.path[index].x, edge.path[index].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    const baseGen = 1;
    for (const node of nodes) {
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
      const x = node.x!;
      const y = node.y!;
      if (
        x < visibleWorld.left ||
        x > visibleWorld.right ||
        y < visibleWorld.top ||
        y > visibleWorld.bottom
      ) {
        continue;
      }

      const isRelevantNode =
        !visualFocusContext || visualFocusContext.nodeIds.has(node.id);
      ctx.save();
      ctx.globalAlpha = visualFocusContext ? (isRelevantNode ? 1 : 0.2) : 1;
      const isSelected = node.id === selectedId;
      const isHovered = node.id === hoveredId;
      const isBranchDragged = branchDrag?.draggedNodeIds.includes(node.id) || false;
      const displayGen = (node.generation ?? 0) - ownerGen + baseGen;
      const genColor = GEN_COLORS[displayGen]?.border || GEN_FALLBACK_COLOR;
      const active = isSelected || isHovered || isBranchDragged;
      const accentColor = node.line === "self" ? "#82693c" : genColor;
      const metrics = getNodeCardMetrics(renderMode, transform.k, active);
      const cardW = renderMode === "overview" ? ((active ? 11 : 7.2) / transform.k) : metrics.width;
      const cardH = renderMode === "overview" ? ((active ? 11 : 7.2) / transform.k) : metrics.height;
      const cardR = renderMode === "overview" ? ((active ? 5.5 : 3.6) / transform.k) : metrics.radius;

      if (renderMode !== "overview") {
        ctx.save();
        traceNodeShape(ctx, x, y + 6, cardW - 10, cardH - 6, cardR);
        ctx.fillStyle = active ? "rgba(44,30,22,0.26)" : "rgba(44,30,22,0.18)";
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.shadowColor = active ? "rgba(44,30,22,0.32)" : "rgba(44,30,22,0.18)";
        ctx.shadowBlur = (active ? 20 : 11) / transform.k;
        ctx.shadowOffsetY = (active ? 8 : 4.5) / transform.k;
        traceNodeShape(ctx, x, y, cardW, cardH, cardR);
        const cardGrad = ctx.createLinearGradient(
          x,
          y - cardH / 2,
          x,
          y + cardH / 2
        );
        cardGrad.addColorStop(0, "#fffefb");
        cardGrad.addColorStop(0.74, "#fbf5ea");
        cardGrad.addColorStop(1, "#f1e6d2");
        ctx.fillStyle = cardGrad;
        ctx.fill();
        ctx.restore();

        ctx.save();
        traceNodeShape(ctx, x, y, cardW - 7, cardH - 7, Math.max(4, cardR - 4));
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 1 / Math.max(transform.k, 0.45);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        const barW = Math.min(42, cardW - 54);
        const barH = renderMode === "compact" ? 3.5 : 4.5;
        const barGrad = ctx.createLinearGradient(x - barW / 2, 0, x + barW / 2, 0);
        barGrad.addColorStop(0, "rgba(255,255,255,0)");
        barGrad.addColorStop(0.5, accentColor);
        barGrad.addColorStop(1, "rgba(255,255,255,0)");
        traceRoundedRect(ctx, x - barW / 2, y - cardH / 2 + 1, barW, barH, barH / 2);
        ctx.fillStyle = barGrad;
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        traceNodeShape(ctx, x, y, cardW, cardH, cardR);
        ctx.fillStyle = genColor;
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      traceNodeShape(ctx, x, y, cardW, cardH, cardR);
      ctx.strokeStyle = active ? accentColor : "rgba(120,92,54,0.42)";
      ctx.lineWidth = (active ? 2.2 : 1) / Math.max(transform.k, 0.35);
      if (renderMode === "overview") {
        ctx.strokeStyle = active ? "#82693c" : genColor;
      }
      ctx.stroke();
      ctx.restore();

      if (renderMode !== "overview") {
        if (active) {
          ctx.save();
          traceNodeShape(ctx, x, y, cardW + 6, cardH + 6, cardR + 3);
          ctx.strokeStyle = "rgba(130,105,60,0.34)";
          ctx.lineWidth = 2 / Math.max(transform.k, 0.45);
          ctx.stroke();
          traceNodeShape(ctx, x, y, cardW + 11, cardH + 11, cardR + 6);
          ctx.strokeStyle = "rgba(130,105,60,0.14)";
          ctx.lineWidth = 1.5 / Math.max(transform.k, 0.45);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (renderMode !== "overview") {
        const avatarSize =
          renderMode === "compact"
            ? Math.max(34, 26 / Math.max(transform.k, 0.48))
            : 46;
        const avatarRadius = avatarSize / 2;
        const avatarX = x;
        const avatarY = y - cardH / 2 + (renderMode === "compact" ? 12 : 16);
        const avatarCenterY = avatarY + avatarRadius;

        ctx.save();
        ctx.shadowColor = "rgba(59,43,24,0.3)";
        ctx.shadowBlur = 6 / transform.k;
        ctx.shadowOffsetY = 3 / transform.k;
        ctx.beginPath();
        ctx.arc(avatarX, avatarCenterY, avatarRadius + 3, 0, Math.PI * 2);
        ctx.fillStyle = "#dfcca6";
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.clip();

        const imageUrl = node.imageUrl
          ? resolveDisplayMediaUrl(node.imageUrl)
          : null;
        const img = imageUrl ? imageCache.get(imageUrl) : null;
        if (img && img.complete && img.naturalWidth > 0) {
          drawImageCover(
            ctx,
            img,
            avatarX - avatarRadius,
            avatarY,
            avatarSize,
            avatarSize
          );
        } else {
          const sealGrad = ctx.createLinearGradient(
            avatarX - avatarRadius,
            avatarY,
            avatarX + avatarRadius,
            avatarY + avatarSize
          );
          sealGrad.addColorStop(0, "#f3eedc");
          sealGrad.addColorStop(1, "#d1bfa3");
          ctx.fillStyle = sealGrad;
          ctx.fill();

          ctx.fillStyle = node.line === "self" ? "#6a4b33" : "#4f4036";
          ctx.font = `800 ${renderMode === "compact" ? 20 : 26}px "Playfair Display", serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.label.charAt(0).toUpperCase(), avatarX, avatarCenterY + 2);
        }
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarCenterY, avatarRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = active ? accentColor : "#a38d6d";
        ctx.lineWidth = (active ? 2 : 1.5) / Math.max(transform.k, 0.45);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(avatarX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 1 / Math.max(transform.k, 0.45);
        ctx.stroke();
        ctx.restore();

        const labelY =
          avatarCenterY + avatarRadius + (renderMode === "detail" ? 11 : 8);
        const maxTextW = cardW - 24;

        ctx.save();
        ctx.textAlign = "center";

        if (renderMode === "detail") {
          ctx.font = '700 13px "Playfair Display", serif';
          ctx.fillStyle = "#3a2a18";
          ctx.textBaseline = "top";
          const labelLines = wrapLabel(ctx, node.label, maxTextW, 2);
          labelLines.forEach((line, index) => {
            ctx.fillText(line, x, labelY + index * 14);
          });

          const meta = [
            node.year &&
              (node.deathYear ? `${node.year} - ${node.deathYear}` : `${node.year}`),
            node.content?.description ? (locale === "id" ? "Cerita" : "Story") : "",
          ]
            .filter(Boolean)
            .join("  ·  ");
          if (meta) {
            ctx.font = "700 9px Inter, system-ui, sans-serif";
            const metaText = truncateLabel(ctx, meta, maxTextW - 18);
            const metaWidth = Math.min(
              maxTextW,
              Math.max(44, ctx.measureText(metaText).width + 18)
            );
            const metaY = y + cardH / 2 - 22;
            traceRoundedRect(ctx, x - metaWidth / 2, metaY - 9, metaWidth, 18, 9);
            ctx.fillStyle = "rgba(130,105,60,0.1)";
            ctx.fill();
            ctx.strokeStyle = "rgba(130,105,60,0.22)";
            ctx.lineWidth = 0.8 / Math.max(transform.k, 0.45);
            ctx.stroke();
            ctx.fillStyle = "#715c3d";
            ctx.textBaseline = "middle";
            ctx.fillText(metaText, x, metaY + 0.5);
          }
        } else {
          const compactFontSize = Math.max(
            13,
            9 / Math.max(transform.k, 0.48)
          );
          ctx.font = `700 ${compactFontSize}px "Playfair Display", serif`;
          ctx.fillStyle = "#3a2a18";
          ctx.textBaseline = "top";
          const labelLines = wrapLabel(ctx, node.label, maxTextW, 2);
          labelLines.forEach((line, index) => {
            ctx.fillText(line, x, labelY + index * (compactFontSize + 1));
          });
        }
        ctx.restore();

        if (renderMode === "detail" && node.line === "self") {
          drawCrown(ctx, x + cardW / 2 - 20, y - cardH / 2 + 20, 10);
        }
      }

      if (isSelected && renderMode !== "overview") {
        for (const button of getQuickAddButtons(node, metrics)) {
          const bx = button.x;
          const by = button.y;
          const br = BUTTON_SIZE / 2;

          ctx.save();
          ctx.shadowColor = "rgba(44,30,22,0.3)";
          ctx.shadowBlur = 5;
          ctx.shadowOffsetY = 2.5;
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          const bGrad = ctx.createLinearGradient(bx, by - br, bx, by + br);
          bGrad.addColorStop(0, "#94774a");
          bGrad.addColorStop(1, "#6e5530");
          ctx.fillStyle = bGrad;
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255,250,240,0.92)";
          ctx.lineWidth = 1.6;
          ctx.stroke();

          ctx.strokeStyle = "#fffaf0";
          ctx.lineCap = "round";
          ctx.lineWidth = 2.6;
          const g = br * 0.42;
          ctx.beginPath();
          ctx.moveTo(bx - g, by);
          ctx.lineTo(bx + g, by);
          ctx.moveTo(bx, by - g);
          ctx.lineTo(bx, by + g);
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();
    }

    if (branchDrag?.changed && treeProjectionMode === "portrait") {
      const markerHalfHeight = NODE_CARD_HEIGHT * 0.72;
      ctx.save();
      ctx.strokeStyle = "#82693c";
      ctx.fillStyle = "#82693c";
      ctx.lineWidth = 3 / Math.max(transform.k, 0.45);
      ctx.setLineDash([8 / transform.k, 7 / transform.k]);
      ctx.beginPath();
      ctx.moveTo(branchDrag.dropX, branchDrag.rowY - markerHalfHeight);
      ctx.lineTo(branchDrag.dropX, branchDrag.rowY + markerHalfHeight);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(
        branchDrag.dropX,
        branchDrag.rowY,
        5 / Math.max(transform.k, 0.45),
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }, [
    branchDrag,
    edges,
    generationMarkers,
    hoveredId,
    locale,
    nodes,
    owner,
    ownerGen,
    radialMode,
    renderMode,
    selectedId,
    transform,
    treeProjectionMode,
    visualFocusContext,
    visibleWorld,
  ]);

  useEffect(() => {
    drawTree();
    const handleResize = () => requestAnimationFrame(drawTree);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawTree, imagesLoaded, wrapperSize]);

  const zoomAt = useCallback(
    (screenX: number, screenY: number, nextScale: number) => {
      setTransform((previous) => {
        const worldX = (screenX - previous.x) / previous.k;
        const worldY = (screenY - previous.y) / previous.k;
        const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
        return {
          x: screenX - worldX * scale,
          y: screenY - worldY * scale,
          k: scale,
        };
      });
    },
    []
  );

  const selectDensityMode = useCallback(
    (mode: DensityMode) => {
      setDensityMode(mode);
      if (mode !== "detail" || transform.k >= 0.82) return;
      const targetId = selectedId || owner?.id;
      if (targetId) {
        focusNode(targetId, 0.88);
        return;
      }
      zoomAt(wrapperSize.width / 2, wrapperSize.height / 2, 0.88);
    },
    [
      focusNode,
      owner?.id,
      selectedId,
      transform.k,
      wrapperSize.height,
      wrapperSize.width,
      zoomAt,
    ]
  );

  // C3: Register wheel handler as non-passive so preventDefault() actually
  // works (React's synthetic onWheel is registered as passive in modern
  // browsers and silently ignores preventDefault).
  const handleWheelRef = useRef<((e: WheelEvent) => void) | null>(null);
  handleWheelRef.current = (event: WheelEvent) => {
    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;
    const isZoomGesture = event.ctrlKey || event.metaKey;
    const deltaMultiplier =
      event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? wrapperSize.height : 1;

    event.preventDefault();
    if (!isZoomGesture) {
      const panX =
        event.shiftKey && Math.abs(event.deltaX) < Math.abs(event.deltaY)
          ? event.deltaY
          : event.deltaX;
      const panY = event.shiftKey ? 0 : event.deltaY;
      setTransform((previous) => ({
        ...previous,
        x: previous.x - panX * deltaMultiplier,
        y: previous.y - panY * deltaMultiplier,
      }));
      return;
    }

    const zoomFactor = Math.exp((-event.deltaY * deltaMultiplier) / 1000);
    zoomAt(point.x, point.y, transform.k * zoomFactor);
  };

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const handler = (e: WheelEvent) => handleWheelRef.current?.(e);
    wrapper.addEventListener("wheel", handler, { passive: false });
    return () => wrapper.removeEventListener("wheel", handler);
  }, []);

  // C5: Redraw canvas when device pixel ratio changes (e.g. window moves
  // between monitors with different DPR, or browser zoom level changes).
  useEffect(() => {
    const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const handleDprChange = () => requestAnimationFrame(drawTree);
    mql.addEventListener("change", handleDprChange);
    return () => mql.removeEventListener("change", handleDprChange);
  }, [drawTree]);

  const setupPinch = useCallback(() => {
    const points = Array.from(pointersRef.current.values());
    if (points.length < 2) return;
    const [a, b] = points;
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    pinchRef.current = {
      distance,
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      transform,
    };
  }, [transform]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    lastPointerTypeRef.current = event.pointerType;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size >= 2) {
      pendingBranchDragRef.current = null;
      setBranchDrag(null);
      setupPinch();
      return;
    }

    const node = findNodeAt(event.clientX, event.clientY);
    if (
      node &&
      treeProjectionMode === "portrait" &&
      getSiblingBranchGroup(nodes, node.id)
    ) {
      pendingBranchDragRef.current = {
        pointerId: event.pointerId,
        sourceNodeId: node.id,
        startX: event.clientX,
        startY: event.clientY,
      };
      dragStartRef.current = { x: event.clientX, y: event.clientY };
      dragDistanceRef.current = 0;
      if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      return;
    }

    setIsDragging(true);
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    dragDistanceRef.current = 0;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const points = Array.from(pointersRef.current.values());
      const [a, b] = points;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const start = pinchRef.current;
      const worldX = (start.center.x - start.transform.x) / start.transform.k;
      const worldY = (start.center.y - start.transform.y) / start.transform.k;
      const scale = clamp(
        start.transform.k * (distance / Math.max(start.distance, 1)),
        MIN_SCALE,
        MAX_SCALE
      );
      setTransform({
        x: center.x - worldX * scale,
        y: center.y - worldY * scale,
        k: scale,
      });
      return;
    }

    const pendingBranch = pendingBranchDragRef.current;
    if (pendingBranch?.pointerId === event.pointerId) {
      const dx = event.clientX - pendingBranch.startX;
      const dy = event.clientY - pendingBranch.startY;
      const distance = Math.hypot(dx, dy);
      dragDistanceRef.current = Math.max(dragDistanceRef.current, distance);
      const threshold = event.pointerType === "touch" ? 12 : 6;
      const horizontalIntent = Math.abs(dx) >= Math.abs(dy) * 1.15;

      if (!branchDrag && distance >= threshold && !horizontalIntent) {
        pendingBranchDragRef.current = null;
        setIsDragging(true);
        setTransform((previous) => ({
          ...previous,
          x: previous.x + dx,
          y: previous.y + dy,
        }));
        dragStartRef.current = { x: event.clientX, y: event.clientY };
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        return;
      }

      if (branchDrag || (distance >= threshold && horizontalIntent)) {
        const nextBranchDrag = buildBranchDragState(
          pendingBranch.sourceNodeId,
          event.clientX,
          event.clientY
        );
        if (nextBranchDrag) {
          setBranchDrag(nextBranchDrag);
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        }
      }
      return;
    }

    if (isDragging) {
      const dx = event.clientX - dragStartRef.current.x;
      const dy = event.clientY - dragStartRef.current.y;
      dragDistanceRef.current += Math.abs(dx) + Math.abs(dy);
      setTransform((previous) => ({
        ...previous,
        x: previous.x + dx,
        y: previous.y + dy,
      }));
      dragStartRef.current = { x: event.clientX, y: event.clientY };
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      return;
    }

    if (event.pointerType === "mouse") {
      const node = findNodeAt(event.clientX, event.clientY);
      const buttonHit = findButtonAt(event.clientX, event.clientY);
      setHoveredId(node?.id || null);
      if (canvasRef.current) {
        const reorderable =
          node &&
          treeProjectionMode === "portrait" &&
          getSiblingBranchGroup(nodes, node.id);
        canvasRef.current.style.cursor = reorderable
          ? "grab"
          : node || buttonHit
          ? "pointer"
          : "grab";
      }
    }
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const wasDragging = isDragging;
    const pendingBranch = pendingBranchDragRef.current;
    const completedBranchDrag = branchDrag;
    pointersRef.current.delete(event.pointerId);
    pinchRef.current = null;
    if (pointersRef.current.size >= 2) {
      setupPinch();
      return;
    }

    setIsDragging(false);
    setBranchDrag(null);
    pendingBranchDragRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";

    if (completedBranchDrag) {
      if (completedBranchDrag.changed) {
        onReorderSiblings(
          completedBranchDrag.sourceNodeId,
          completedBranchDrag.orderedBranchIds
        );
      }
      onSelectNode(completedBranchDrag.sourceNodeId);
      return;
    }

    // S4: Adaptive threshold: 12px for touch, 6px for mouse.
    const clickThreshold = lastPointerTypeRef.current === "touch" ? 12 : 6;
    if (
      (wasDragging || pendingBranch?.pointerId === event.pointerId) &&
      dragDistanceRef.current < clickThreshold
    ) {
      // Check quick-add button hit first (moved from pointerDown to
      // pointerUp so buttons only trigger on clean taps, not drag starts.
      // This prevents accidental button triggers on mobile touch).
      const buttonHit = findButtonAt(event.clientX, event.clientY);
      if (buttonHit) {
        onAddNode(buttonHit.nodeId, buttonHit.type);
        return;
      }

      const node = findNodeAt(event.clientX, event.clientY);
      onSelectNode(node ? node.id : null);
    }
  };

  const minimap = useMemo(() => {
    if (!width || !height || nodes.length === 0) return null;
    const scale = Math.min(
      (minimapSize.width - 18) / width,
      (minimapSize.height - 18) / height
    );
    const mapWidth = width * scale;
    const mapHeight = height * scale;
    const offsetX = (minimapSize.width - mapWidth) / 2;
    const offsetY = (minimapSize.height - mapHeight) / 2;
    const viewport = {
      x: offsetX + (-transform.x / transform.k) * scale,
      y: offsetY + (-transform.y / transform.k) * scale,
      width: (wrapperSize.width / transform.k) * scale,
      height: (wrapperSize.height / transform.k) * scale,
    };
    return { scale, offsetX, offsetY, viewport };
  }, [
    height,
    minimapSize.height,
    minimapSize.width,
    nodes.length,
    transform.k,
    transform.x,
    transform.y,
    width,
    wrapperSize.height,
    wrapperSize.width,
  ]);

  const jumpMinimap = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!minimap || !wrapperSize.width || !wrapperSize.height) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const worldX = (x - minimap.offsetX) / minimap.scale;
    const worldY = (y - minimap.offsetY) / minimap.scale;
    setTransform((previous) => ({
      ...previous,
      x: wrapperSize.width / 2 - worldX * previous.k,
      y: wrapperSize.height / 2 - worldY * previous.k,
    }));
  };

  const modeLabel =
    treeProjectionMode === "fan"
      ? `${copy.radial} · ${copy[radialMode]}`
      : renderMode === "detail"
      ? copy.detailed
      : renderMode === "compact"
      ? copy.compact
      : copy.overview;

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full select-none overflow-hidden bg-[#2c1e16]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(250,246,237,0.54), rgba(250,246,237,0.46)), url('/image/background-canvas.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        boxShadow: "inset 0 0 140px rgba(55,38,22,0.5)",
        overscrollBehavior: "none",
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={() => {
        // S1: Reset all interaction state on pointer leave
        setIsDragging(false);
        setBranchDrag(null);
        setHoveredId(null);
        pointersRef.current.clear();
        pinchRef.current = null;
        pendingBranchDragRef.current = null;
        dragDistanceRef.current = 0;
      }}
    >
      <canvas ref={canvasRef} className="block" />

      {branchDrag?.changed && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 max-w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-full border border-cream-500 bg-ink-50/90 px-3 py-2 text-center text-[11px] font-bold text-ink-700 shadow-sm backdrop-blur-md sm:bottom-8 sm:text-xs">
          {copy.reorderHint}
        </div>
      )}

      <div
        className="absolute left-3 right-3 top-3 flex max-w-full flex-wrap items-center gap-2 sm:left-4 sm:right-4 sm:top-4 lg:left-6 lg:right-6 lg:top-6"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex overflow-hidden rounded-xl border border-cream-400 p-1 shadow-sm bg-white/70 backdrop-blur-md">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold text-ink-700 hover:bg-white hover:shadow-sm transition"
            onClick={() => setTransform(calculateFitTransform())}
            title={copy.fit}
            type="button"
          >
            <Maximize2 className="h-4 w-4 text-brand-700" />
            <span className="hidden sm:inline">{copy.fit}</span>
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 border-l border-cream-400/70 px-3 text-xs font-bold text-ink-700 transition hover:bg-white hover:shadow-sm"
            onClick={() => {
              const targetId = selectedId || owner?.id;
              if (targetId) focusNode(targetId, 0.88);
            }}
            title={copy.center}
            type="button"
          >
            <Crosshair className="h-4 w-4 text-brand-700" />
            <span className="hidden sm:inline">{copy.center}</span>
          </button>
        </div>

        {treeProjectionMode === "fan" && (
          <div className="flex overflow-hidden rounded-xl border border-cream-400 p-1 shadow-sm bg-white/70 backdrop-blur-md">
            {(["ancestors", "descendants", "family"] as const).map((mode) => (
              <button
                key={mode}
                className={`inline-flex h-9 items-center rounded-lg px-3 text-xs font-bold transition ${
                  radialMode === mode
                    ? "bg-brand-700 text-white shadow-md"
                    : "text-ink-700 hover:bg-white hover:shadow-sm"
                }`}
                onClick={() => setRadialMode(mode)}
                type="button"
              >
                {copy[mode]}
              </button>
            ))}
          </div>
        )}

        <div className="flex overflow-hidden rounded-xl border border-cream-400 p-1 shadow-sm bg-white/70 backdrop-blur-md">
          <span className="hidden items-center px-2 text-[9px] font-black uppercase tracking-[0.14em] text-ink-600 xl:inline-flex">
            {copy.layout}
          </span>
          {(["portrait", "landscape", "fan"] as const).map((mode) => (
            <button
              key={mode}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                treeProjectionMode === mode
                  ? "bg-brand-700 text-white shadow-md"
                  : "text-ink-700 hover:bg-white hover:shadow-sm"
              }`}
              onClick={() => setTreeProjectionMode(mode)}
              title={copy.view}
              type="button"
            >
              {mode === "portrait" ? (
                <Layers3 className="h-3.5 w-3.5" />
              ) : mode === "landscape" ? (
                <Crosshair className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              <span className={mode === "fan" ? "" : "hidden sm:inline"}>
                {mode === "portrait"
                  ? copy.portrait
                  : mode === "landscape"
                  ? copy.landscape
                  : copy.fan}
              </span>
            </button>
          ))}
        </div>

        <div className="flex overflow-hidden rounded-xl border border-cream-400 p-1 shadow-sm bg-white/70 backdrop-blur-md">
          <span className="hidden items-center px-2 text-[9px] font-black uppercase tracking-[0.14em] text-ink-600 xl:inline-flex">
            {copy.display}
          </span>
          {(["auto", "map", "detail"] as const).map((mode) => (
            <button
              key={mode}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                densityMode === mode
                  ? "bg-brand-700 text-white shadow-md"
                  : "text-ink-700 hover:bg-white hover:shadow-sm"
              }`}
              onClick={() => selectDensityMode(mode)}
              title={copy.density}
              type="button"
            >
              {mode === "auto" ? (
                <Eye className="h-3.5 w-3.5" />
              ) : mode === "map" ? (
                <Crosshair className="h-3.5 w-3.5" />
              ) : (
                <Layers3 className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {mode === "auto" ? copy.auto : mode === "map" ? copy.map : copy.detail}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-6 hidden w-56 md:block">
        {generationMarkers.map((marker) => {
          const top = marker.y * transform.k + transform.y;
          if (top < 84 || top > wrapperSize.height - 42) return null;
          const displayGen = marker.generation - ownerGen + 1;
          const label =
            GEN_COLORS[displayGen]?.[locale === "id" ? "labelId" : "labelEn"] ||
            `${locale === "id" ? "Generasi" : "Generation"} ${displayGen}`;
          const isHighlighted = highlightedGeneration === marker.generation;
          return (
            <button
              key={marker.generation}
              className={`pointer-events-auto absolute rounded-lg border px-3 py-1.5 text-left text-[10px] font-bold shadow-sm backdrop-blur-md transition ${
                isHighlighted
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-cream-400 bg-white/70 text-ink-700 hover:bg-white"
              }`}
              style={{ top: clamp(top - 12, 84, wrapperSize.height - 42) }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() =>
                setHighlightedGeneration((current) =>
                  current === marker.generation ? null : marker.generation
                )
              }
              type="button"
            >
              {label}{" \u00b7 "}{marker.count}
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col items-end gap-3 select-none sm:bottom-4 sm:right-4 lg:bottom-6 lg:right-6" onPointerDown={(event) => event.stopPropagation()}>
        <div className="flex flex-col overflow-hidden rounded-xl border border-cream-400 p-1 shadow-sm bg-white/70 backdrop-blur-md">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 hover:bg-white hover:shadow-sm transition"
            onClick={() => zoomAt(wrapperSize.width / 2, wrapperSize.height / 2, transform.k * 1.22)}
            title={copy.zoomIn}
            aria-label={copy.zoomIn}
            type="button"
          >
            <Plus className="h-4 w-4 text-brand-700" />
          </button>
          <div className="h-px w-full bg-cream-400/50 my-0.5" />
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 hover:bg-white hover:shadow-sm transition"
            onClick={() => zoomAt(wrapperSize.width / 2, wrapperSize.height / 2, transform.k / 1.22)}
            title={copy.zoomOut}
            aria-label={copy.zoomOut}
            type="button"
          >
            <Minus className="h-4 w-4 text-brand-700" />
          </button>
        </div>

        {minimap && (
          <div
            className="rounded-xl border border-cream-400 p-2.5 shadow-sm bg-white/70 backdrop-blur-md relative cursor-pointer hover:bg-white/90 transition-colors"
            style={{ width: minimapSize.width, height: minimapSize.height }}
            onClick={jumpMinimap}
            role="button"
            tabIndex={0}
            title={copy.hint}
            aria-label={copy.hint}
          >
            <div className="absolute left-2.5 top-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-brand-700">
              {modeLabel}
            </div>
            {nodes.map((node) => {
              if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return null;
              const isSelected = node.id === selectedId;
              const displayGen = (node.generation ?? 0) - ownerGen + 1;
              const genColor = GEN_COLORS[displayGen]?.border || GEN_FALLBACK_COLOR;
              return (
                <span
                  key={node.id}
                  className="absolute rounded-[2px] shadow-sm"
                  style={{
                    left: minimap.offsetX + (node.x || 0) * minimap.scale,
                    top: minimap.offsetY + (node.y || 0) * minimap.scale,
                    width: isSelected ? 6 : 4,
                    height: isSelected ? 6 : 4,
                    backgroundColor: isSelected ? "#1d1610" : genColor,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              );
            })}
            <div
              className="absolute rounded border border-brand-700 bg-brand-700/10"
              style={{
                left: clamp(minimap.viewport.x, 0, minimapSize.width),
                top: clamp(minimap.viewport.y, 0, minimapSize.height),
                width: Math.min(minimap.viewport.width, minimapSize.width),
                height: Math.min(minimap.viewport.height, minimapSize.height),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
