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
import type { FamilyNode, LayoutGraph } from "../../lib/types/tree";
import { LAYOUT } from "../../lib/types/tree";
import { resolveDisplayMediaUrl } from "../../lib/media/public-url";
import { useLanguage } from "../providers/LanguageProvider";

type Props = {
  layout: LayoutGraph;
  selectedId: string | null;
  onSelectNode: (id: string | null) => void;
  onAddNode: (
    parentId: string,
    type: "parent" | "partner" | "child" | "sibling"
  ) => void;
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
};

const GEN_COLORS: Record<number, { border: string; labelId: string; labelEn: string }> = {
  [-2]: { border: "#805ad5", labelId: "Buyut", labelEn: "Great-grandparent" }, // Amethyst
  [-1]: { border: "#2f855a", labelId: "Kakek/Nenek", labelEn: "Grandparent" }, // Emerald
  [0]: { border: "#3182ce", labelId: "Orang Tua", labelEn: "Parent" }, // Sapphire
  [1]: { border: "#82693c", labelId: "Anda", labelEn: "You" }, // Gold Crown
  [2]: { border: "#b08e51", labelId: "Anak", labelEn: "Child" }, // Bronze
  [3]: { border: "#e53e3e", labelId: "Cucu", labelEn: "Grandchild" }, // Ruby
  [4]: { border: "#d53f8c", labelId: "Cicit", labelEn: "Great-grandchild" }, // Rose Quartz
};

const NODE_CARD_WIDTH = 150;
const NODE_CARD_HEIGHT = 112;
const NODE_CARD_RADIUS = 12;
const NODE_COMPACT_WIDTH = 116;
const NODE_COMPACT_HEIGHT = 82;
const BUTTON_SIZE = 30;
const MIN_SCALE = 0.045;
const MAX_SCALE = 4;
const FIT_PADDING = 96;
const MINIMAP_DESKTOP = { width: 188, height: 118 };
const MINIMAP_MOBILE = { width: 148, height: 94 };
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
    return {
      width: NODE_COMPACT_WIDTH,
      height: NODE_COMPACT_HEIGHT,
      radius: 7,
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

function drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  traceRoundedRect(ctx, x - 12, y - r - 5, 24, 8, 4);
  ctx.fillStyle = "#82693c";
  ctx.fill();
  ctx.restore();
}

function getQuickAddButtons(node: FamilyNode) {
  return [
    {
      type: "parent" as const,
      x: node.x || 0,
      y: (node.y || 0) - NODE_CARD_HEIGHT / 2 - 24,
      icon: "^",
    },
    {
      type: "partner" as const,
      x: (node.x || 0) + NODE_CARD_WIDTH / 2 + 30,
      y: node.y || 0,
      icon: "+",
    },
    {
      type: "child" as const,
      x: node.x || 0,
      y: (node.y || 0) + NODE_CARD_HEIGHT / 2 + 36,
      icon: "v",
    },
    {
      type: "sibling" as const,
      x: (node.x || 0) - NODE_CARD_WIDTH / 2 - 30,
      y: node.y || 0,
      icon: "=",
    },
  ];
}

function getRenderMode(scale: number, densityMode: DensityMode): RenderMode {
  if (densityMode === "map") return "overview";
  if (densityMode === "detail") return "detail";
  if (scale < 0.22) return "overview";
  if (scale < 0.62) return "compact";
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

function getFanArc(relativeGeneration: number) {
  if (relativeGeneration < 0) {
    return { start: 200, end: 340 };
  }
  if (relativeGeneration > 0) {
    return { start: 20, end: 160 };
  }
  return { start: 20, end: 160 };
}

function getFanRing(relativeGeneration: number) {
  if (relativeGeneration > 0) return relativeGeneration + 1;
  return Math.max(1, Math.abs(relativeGeneration));
}

function getFanSegmentFill(relativeGeneration: number, index: number) {
  const ancestor = ["#d9efe5", "#dce9f8", "#eadff5", "#f4e3c9"];
  const descendant = ["#f4e7cc", "#ecd8b8", "#e6cfaa", "#dcc49e"];
  const peer = ["#f0e2c8", "#e8d8b7"];
  const palette =
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
    const arc = getFanArc(relativeGeneration);
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
      });
    });
  }

  return segments;
}

function projectFanLayout(layout: LayoutGraph): LayoutGraph {
  if (layout.nodes.length === 0) return layout;

  const owner =
    layout.nodes.find((node) => node.line === "self") || layout.nodes[0];
  const ownerGeneration = owner.generation ?? 0;
  const relativeGenerations = layout.nodes.map(
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
  for (const node of layout.nodes) {
    const relative = (node.generation ?? ownerGeneration) - ownerGeneration;
    byGeneration.set(relative, [...(byGeneration.get(relative) || []), node]);
  }

  const fanNodes = layout.nodes.map((node) => {
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
    const arc = getFanArc(relative);
    const angle = distributeAngle(index, count, arc.start + 6, arc.end - 6);
    const position = polarToPoint(center.x, center.y, radius, angle);
    positioned.set(node.id, position);
    return { ...node, x: position.x, y: position.y, generation: relative };
  });

  const fanUnions = layout.unions?.map((union) => {
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

function projectLayout(layout: LayoutGraph, mode: TreeProjectionMode): LayoutGraph {
  if (mode === "landscape") return projectLandscapeLayout(layout);
  if (mode === "fan") return projectFanLayout(layout);
  return layout;
}

function drawFanChart(
  ctx: CanvasRenderingContext2D,
  nodes: FamilyNode[],
  owner: FamilyNode | undefined,
  selectedId: string | null,
  hoveredId: string | null,
  locale: string,
  scale: number
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
      Math.abs(segment.node.label.length + segment.node.id.length)
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
        ctx.font = "600 9px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#725f45";
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
  ctx.fillStyle = "rgba(92,67,20,0.72)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const ancestorPoint = polarToPoint(centerX, centerY, FAN_INNER_RADIUS + 36, 270);
  const descendantPoint = polarToPoint(centerX, centerY, FAN_INNER_RADIUS + 36, 90);
  ctx.fillText(
    locale === "id" ? "LELUHUR" : "ANCESTORS",
    ancestorPoint.x,
    ancestorPoint.y
  );
  ctx.fillText(
    locale === "id" ? "KETURUNAN" : "DESCENDANTS",
    descendantPoint.x,
    descendantPoint.y
  );
  ctx.restore();

  ctx.restore();
}

export default function FamilyTreeCanvas({
  layout,
  selectedId,
  onSelectNode,
  onAddNode,
}: Props) {
  const { locale } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragDistanceRef = useRef(0);
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
            zoomIn: "Perbesar",
            zoomOut: "Perkecil",
            view: "Arah pohon",
            portrait: "Potret",
            landscape: "Lanskap",
            fan: "Fan",
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
              "Drag untuk geser. Pinch atau Ctrl/Cmd + scroll untuk zoom. Klik minimap untuk lompat area.",
          }
        : {
            fit: "Fit all",
            zoomIn: "Zoom in",
            zoomOut: "Zoom out",
            view: "Tree view",
            portrait: "Portrait",
            landscape: "Landscape",
            fan: "Fan",
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
              "Drag to pan. Pinch or Ctrl/Cmd + scroll to zoom. Click the minimap to jump.",
          },
    [locale]
  );

  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });
  const [treeProjectionMode, setTreeProjectionMode] =
    useState<TreeProjectionMode>("portrait");
  const [densityMode, setDensityMode] = useState<DensityMode>("auto");
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const projectedLayout = useMemo(
    () => projectLayout(layout, treeProjectionMode),
    [layout, treeProjectionMode]
  );
  const { nodes, edges, width, height } = projectedLayout;

  const owner = useMemo(
    () => nodes.find((node) => node.line === "self") || nodes[0],
    [nodes]
  );
  const ownerGen = owner?.generation ?? 0;
  const renderMode = getRenderMode(transform.k, densityMode);
  const minimapSize =
    wrapperSize.width < 480 ? MINIMAP_MOBILE : MINIMAP_DESKTOP;
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
      const scaleY = (wrapperSize.height - FIT_PADDING) / height;
      const scale = clamp(Math.min(scaleX, scaleY), MIN_SCALE, maxScale);

      return {
        x: (wrapperSize.width - width * scale) / 2,
        y: (wrapperSize.height - height * scale) / 2,
        k: scale,
      };
    },
    [height, width, wrapperSize.height, wrapperSize.width]
  );

  const focusNode = useCallback(
    (nodeId: string, minScale = 0.82) => {
      const node = nodes.find((item) => item.id === nodeId);
      if (!node || !wrapperSize.width || !wrapperSize.height) return;

      const nextScale = clamp(Math.max(transform.k, minScale), MIN_SCALE, MAX_SCALE);
      setTransform({
        x: wrapperSize.width / 2 - (node.x || 0) * nextScale,
        y: wrapperSize.height / 2 - (node.y || 0) * nextScale,
        k: nextScale,
      });
    },
    [nodes, transform.k, wrapperSize.height, wrapperSize.width]
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

      for (const button of getQuickAddButtons(selectedNode)) {
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
      screenY < 72 ||
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
        transform.k
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
          ? "rgba(130, 105, 60, 0.04)"
          : "rgba(212, 175, 55, 0.06)"; // subtle gold shimmer band
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

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash(isAdoption ? [8 / transform.k, 8 / transform.k] : []);
      traceEdgePath(ctx, edge.path);
      ctx.strokeStyle =
        renderMode === "detail"
          ? "rgba(255,248,232,0.72)"
          : "rgba(255,248,232,0.48)";
      ctx.lineWidth =
        (renderMode === "detail"
          ? isSpouse
            ? 5.4
            : isParentConnector
            ? 5.0
            : 4.2
          : isSpouse
          ? 3.7
          : 3.2) / Math.max(transform.k, renderMode === "detail" ? 0.25 : 0.18);
      ctx.stroke();
      
      if (renderMode === "detail") {
        // Clean single-line connection with warm brown tones.
        ctx.save();
        ctx.strokeStyle = isSpouse
          ? "rgba(118,88,39,0.9)"
          : isAdoption
          ? "rgba(63,116,78,0.78)"
          : "rgba(94,72,39,0.88)";
        ctx.lineWidth = (isSpouse ? 2.8 : isParentConnector ? 2.6 : 2.2) / Math.max(transform.k, 0.25);
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
        ctx.globalAlpha = isParentConnector ? 0.9 : 0.75;
        ctx.stroke();
        ctx.globalAlpha = 1;

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
        ctx.strokeStyle = isSpouse ? "rgba(118,88,39,0.72)" : isAdoption ? "rgba(63,116,78,0.55)" : "rgba(94,72,39,0.68)";
        ctx.lineWidth = (isSpouse ? 1.9 : 1.65) / Math.max(transform.k, 0.18);
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

      const isSelected = node.id === selectedId;
      const isHovered = node.id === hoveredId;
      const displayGen = (node.generation ?? 0) - ownerGen + baseGen;
      const genColor = GEN_COLORS[displayGen]?.border || "#be123c";
      const active = isSelected || isHovered;
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
        ctx.shadowColor = active ? "rgba(44,30,22,0.34)" : "rgba(44,30,22,0.2)";
        ctx.shadowBlur = (active ? 18 : 10) / transform.k;
        ctx.shadowOffsetY = (active ? 7 : 4) / transform.k;
        traceNodeShape(ctx, x, y, cardW, cardH, cardR);
        const cardGrad = ctx.createLinearGradient(
          x - cardW / 2,
          y - cardH / 2,
          x + cardW / 2,
          y + cardH / 2
        );
        cardGrad.addColorStop(0, "#fffdf8");
        cardGrad.addColorStop(0.68, "#fbf3df");
        cardGrad.addColorStop(1, "#ead8b8");
        ctx.fillStyle = cardGrad;
        ctx.fill();
        ctx.restore();

        ctx.save();
        traceNodeShape(ctx, x, y, cardW, cardH, cardR);
        ctx.strokeStyle = active ? accentColor : "rgba(112,86,50,0.5)";
        ctx.lineWidth = (active ? 2 : 1.15) / Math.max(transform.k, 0.45);
        ctx.stroke();

        traceNodeShape(ctx, x, y, cardW - 8, cardH - 8, Math.max(4, cardR - 4));
        ctx.strokeStyle = "rgba(255,255,255,0.58)";
        ctx.lineWidth = 1 / Math.max(transform.k, 0.45);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        const barW = Math.min(44, cardW - 54);
        const barH = renderMode === "compact" ? 4 : 5;
        traceRoundedRect(ctx, x - barW / 2, y - cardH / 2, barW, barH, 5);
        ctx.fillStyle = accentColor;
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
      ctx.strokeStyle = active ? accentColor : "rgba(113,88,51,0.5)";
      ctx.lineWidth = (active ? 2.4 : 1.1) / Math.max(transform.k, 0.35);
      if (renderMode === "overview") {
        ctx.strokeStyle = active ? "#82693c" : genColor;
      }
      ctx.stroke();
      ctx.restore();

      if (renderMode !== "overview") {
        if (active) {
          ctx.save();
          traceNodeShape(ctx, x, y, cardW + 6, cardH + 6, cardR + 3);
          ctx.strokeStyle = "rgba(130,105,60,0.4)";
          ctx.lineWidth = 3 / Math.max(transform.k, 0.45);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (renderMode !== "overview") {
        const avatarSize = renderMode === "compact" ? 38 : 48;
        const avatarRadius = avatarSize / 2;
        const avatarX = x;
        const avatarY = y - cardH / 2 + (renderMode === "compact" ? 13 : 17);
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

        const labelY = avatarCenterY + avatarRadius + (renderMode === "detail" ? 14 : 10);
        const maxTextW = cardW - 24;

        ctx.save();
        ctx.textAlign = "center";

        if (renderMode === "detail") {
          ctx.font = '700 14px "Playfair Display", serif';
          ctx.fillStyle = "#3a2a18";
          ctx.textBaseline = "top";
          const labelLines = wrapLabel(ctx, node.label, maxTextW, 2);
          labelLines.forEach((line, index) => {
            ctx.fillText(line, x, labelY + index * 15);
          });

          ctx.font = '600 10px Inter, system-ui, sans-serif';
          ctx.fillStyle = "#7a6749";
          const desc = [
            node.year && (node.deathYear ? `${node.year} - ${node.deathYear}` : `${node.year}`),
            node.content?.description ? (locale === "id" ? "cerita" : "story") : ""
          ].filter(Boolean).join("  ");
          if (desc) {
             ctx.fillText(
               truncateLabel(ctx, desc, maxTextW),
               x,
               labelY + labelLines.length * 15 + 3
             );
          }
        } else {
          ctx.font = '700 13px "Playfair Display", serif';
          ctx.fillStyle = "#3a2a18";
          ctx.textBaseline = "top";
          const labelLines = wrapLabel(ctx, node.label, maxTextW, 2);
          labelLines.forEach((line, index) => {
            ctx.fillText(line, x, labelY + index * 14);
          });
        }
        ctx.restore();

        if (renderMode === "detail" && node.line === "self") {
          drawCrown(ctx, x + cardW / 2 - 20, y - cardH / 2 + 20, 10);
        }
      }

      if (isSelected && renderMode !== "overview") {
        for (const button of getQuickAddButtons(node)) {
          traceRoundedRect(
            ctx,
            button.x - BUTTON_SIZE / 2,
            button.y - BUTTON_SIZE / 2 + 2,
            BUTTON_SIZE,
            BUTTON_SIZE,
            7
          );
          ctx.fillStyle = "rgba(0,0,0,0.16)";
          ctx.fill();

          traceRoundedRect(
            ctx,
            button.x - BUTTON_SIZE / 2,
            button.y - BUTTON_SIZE / 2,
            BUTTON_SIZE,
            BUTTON_SIZE,
            7
          );
          ctx.fillStyle = "#82693c";
          ctx.fill();
          ctx.strokeStyle = "white";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = "white";
          ctx.font = "800 15px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(button.icon, button.x, button.y);
        }
      }
    }

    ctx.restore();
  }, [
    edges,
    generationMarkers,
    hoveredId,
    locale,
    nodes,
    owner,
    ownerGen,
    renderMode,
    selectedId,
    transform,
    treeProjectionMode,
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

    const buttonHit = findButtonAt(event.clientX, event.clientY);
    if (buttonHit) {
      onAddNode(buttonHit.nodeId, buttonHit.type);
      return;
    }

    if (pointersRef.current.size >= 2) {
      setupPinch();
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
        canvasRef.current.style.cursor = node || buttonHit ? "pointer" : "grab";
      }
    }
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const wasDragging = isDragging;
    pointersRef.current.delete(event.pointerId);
    pinchRef.current = null;
    if (pointersRef.current.size >= 2) {
      setupPinch();
      return;
    }

    setIsDragging(false);
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";

    // S4: Adaptive threshold: 12px for touch, 6px for mouse.
    const clickThreshold = lastPointerTypeRef.current === "touch" ? 12 : 6;
    if (wasDragging && dragDistanceRef.current < clickThreshold) {
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
      ? copy.fan
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
          "linear-gradient(rgba(250,246,237,0.26), rgba(250,246,237,0.18)), url('/image/background-canvas.webp')",
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
        setHoveredId(null);
        pointersRef.current.clear();
        pinchRef.current = null;
        dragDistanceRef.current = 0;
      }}
    >
      <canvas ref={canvasRef} className="block" />

      <div
        className="absolute left-3 top-3 flex flex-wrap items-center gap-2 sm:left-4 sm:top-4 lg:left-6 lg:top-6"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex overflow-hidden rounded-xl border border-[#dccfb3] p-1 shadow-sm bg-white/70 backdrop-blur-md">
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold text-[#5c4314] hover:bg-white hover:shadow-sm transition"
            onClick={() => setTransform(calculateFitTransform())}
            title={copy.fit}
            type="button"
          >
            <Maximize2 className="h-4 w-4 text-[#82693c]" />
            <span className="hidden sm:inline">{copy.fit}</span>
          </button>
        </div>

        <div className="flex overflow-hidden rounded-xl border border-[#dccfb3] p-1 shadow-sm bg-white/70 backdrop-blur-md">
          {(["portrait", "landscape", "fan"] as const).map((mode) => (
            <button
              key={mode}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                treeProjectionMode === mode
                  ? "bg-[#82693c] text-white shadow-md"
                  : "text-[#5c4314] hover:bg-white hover:shadow-sm"
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

        <div className="hidden overflow-hidden rounded-xl border border-[#dccfb3] p-1 shadow-sm bg-white/70 backdrop-blur-md md:flex">
          {(["auto", "map", "detail"] as const).map((mode) => (
            <button
              key={mode}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                densityMode === mode
                  ? "bg-[#82693c] text-white shadow-md"
                  : "text-[#5c4314] hover:bg-white hover:shadow-sm"
              }`}
              onClick={() => setDensityMode(mode)}
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
              {mode === "auto" ? copy.auto : mode === "map" ? copy.map : copy.detail}
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
          return (
            <div
              key={marker.generation}
              className="absolute rounded-lg border border-[#dccfb3] bg-white/70 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold text-[#5c4314] shadow-sm"
              style={{ top: clamp(top - 12, 84, wrapperSize.height - 42) }}
            >
              {label}{" \u00b7 "}{marker.count}
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col items-end gap-3 select-none sm:bottom-4 sm:right-4 lg:bottom-6 lg:right-6" onPointerDown={(event) => event.stopPropagation()}>
        <div className="flex flex-col overflow-hidden rounded-xl border border-[#dccfb3] p-1 shadow-sm bg-white/70 backdrop-blur-md">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5c4314] hover:bg-white hover:shadow-sm transition"
            onClick={() => zoomAt(wrapperSize.width / 2, wrapperSize.height / 2, transform.k * 1.22)}
            title={copy.zoomIn}
            type="button"
          >
            <Plus className="h-4 w-4 text-[#82693c]" />
          </button>
          <div className="h-px w-full bg-[#dccfb3]/50 my-0.5" />
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5c4314] hover:bg-white hover:shadow-sm transition"
            onClick={() => zoomAt(wrapperSize.width / 2, wrapperSize.height / 2, transform.k / 1.22)}
            title={copy.zoomOut}
            type="button"
          >
            <Minus className="h-4 w-4 text-[#82693c]" />
          </button>
        </div>

        {minimap && (
          <div
            className="rounded-xl border border-[#dccfb3] p-2.5 shadow-sm bg-white/70 backdrop-blur-md relative cursor-pointer hover:bg-white/90 transition-colors"
            style={{ width: minimapSize.width, height: minimapSize.height }}
            onClick={jumpMinimap}
            role="button"
            tabIndex={0}
            title={copy.hint}
          >
            <div className="absolute left-2.5 top-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#82693c]">
              {modeLabel}
            </div>
            {nodes.map((node) => {
              if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return null;
              const isSelected = node.id === selectedId;
              const displayGen = (node.generation ?? 0) - ownerGen + 1;
              const genColor = GEN_COLORS[displayGen]?.border || "#8c7655";
              return (
                <span
                  key={node.id}
                  className="absolute rounded-[2px] shadow-sm"
                  style={{
                    left: minimap.offsetX + (node.x || 0) * minimap.scale,
                    top: minimap.offsetY + (node.y || 0) * minimap.scale,
                    width: isSelected ? 6 : 4,
                    height: isSelected ? 6 : 4,
                    backgroundColor: isSelected ? "#c2410c" : genColor,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              );
            })}
            <div
              className="absolute rounded border border-[#82693c] bg-[#82693c]/10"
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
