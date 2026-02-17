"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import type { LayoutGraph, FamilyNode } from "../../lib/types/tree";
import { useLanguage } from "../providers/LanguageProvider";

type Props = {
  layout: LayoutGraph;
  selectedId: string | null;
  onSelectNode: (id: string | null) => void;
  onAddNode: (parentId: string, type: "parent" | "partner" | "child" | "sibling") => void;
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 58;
const NODE_RADIUS = 9;
const BUTTON_SIZE = 28;

const LINE_COLOR = "#c5b79f";
const CHILD_LINE_COLOR = "#d0c3ad";
const SPOUSE_LINE_COLOR = "#e8b400";

type NodePalette = {
  fill: string;
  border: string;
  text: string;
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let current = text.trim();
  while (current.length > 1 && ctx.measureText(`${current}...`).width > maxWidth) {
    current = current.slice(0, -1);
  }
  return `${current}...`;
}

function getNodePalette(node: FamilyNode, minGeneration: number): NodePalette {
  const isSpouseOnly =
    node.line === "union" ||
    ((!node.parentIds || node.parentIds.length === 0) &&
      !node.parentId &&
      (node.partners?.length || 0) > 0 &&
      (node.childrenIds?.length || 0) === 0 &&
      node.line !== "self");

  if (isSpouseOnly) {
    return { fill: "#f5f5f5", border: "#7d7568", text: "#2e2a24" };
  }

  const level = (node.generation ?? 0) - minGeneration + 1;
  if (level <= 1) {
    return { fill: "#e5d308", border: "#8d7d25", text: "#26220f" };
  }
  if (level === 2) {
    return { fill: "#a95d38", border: "#734126", text: "#ffffff" };
  }
  if (level === 3) {
    return { fill: "#e00088", border: "#9f0f63", text: "#ffffff" };
  }
  return { fill: "#f5f5f5", border: "#8a7f69", text: "#2f2a21" };
}

const getQuickAddButtons = (node: FamilyNode) => [
  {
    type: "parent" as const,
    x: (node.x || 0),
    y: (node.y || 0) - NODE_HEIGHT / 2 - 24,
    icon: "↑",
  },
  {
    type: "partner" as const,
    x: (node.x || 0) + NODE_WIDTH / 2 + 26,
    y: (node.y || 0),
    icon: "♥",
  },
  {
    type: "child" as const,
    x: (node.x || 0),
    y: (node.y || 0) + NODE_HEIGHT / 2 + 24,
    icon: "↓",
  },
  {
    type: "sibling" as const,
    x: (node.x || 0) - NODE_WIDTH / 2 - 26,
    y: (node.y || 0),
    icon: "↔",
  },
];

export default function FamilyTreeCanvas({
  layout,
  selectedId,
  onSelectNode,
  onAddNode,
}: Props) {
  const { locale } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const copy =
    locale === "id"
      ? {
          hintPanZoom:
            "Scroll untuk geser. Pinch atau Ctrl/Cmd + scroll untuk zoom.",
          zoomIn: "Perbesar",
          zoomOut: "Perkecil",
          resetView: "Reset tampilan",
        }
      : {
          hintPanZoom: "Scroll to pan. Pinch or Ctrl/Cmd + scroll to zoom.",
          zoomIn: "Zoom in",
          zoomOut: "Zoom out",
          resetView: "Reset view",
        };

  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { nodes, edges, width } = layout;
  const minGeneration = useMemo(() => {
    if (!nodes.length) return 0;
    return Math.min(...nodes.map((node) => node.generation ?? 0));
  }, [nodes]);

  useEffect(() => {
    if (nodes.length > 0 && wrapperRef.current) {
      const { clientWidth } = wrapperRef.current;
      const initialScale = 0.8;
      const initialX = (clientWidth - width * initialScale) / 2;
      const initialY = 80;
      setTransform({ x: initialX, y: initialY, k: initialScale });
    }
  }, [width, nodes.length]);

  const screenToWorld = useCallback(
    (sx: number, sy: number) => ({
      x: (sx - transform.x) / transform.k,
      y: (sy - transform.y) / transform.k,
    }),
    [transform]
  );

  const findNodeAt = useCallback(
    (clientX: number, clientY: number) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return null;
      const rect = wrapper.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const { x, y } = screenToWorld(sx, sy);

      for (const node of nodes) {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
        const left = node.x! - NODE_WIDTH / 2;
        const right = node.x! + NODE_WIDTH / 2;
        const top = node.y! - NODE_HEIGHT / 2;
        const bottom = node.y! + NODE_HEIGHT / 2;
        if (x >= left && x <= right && y >= top && y <= bottom) {
          return node;
        }
      }
      return null;
    },
    [nodes, screenToWorld]
  );

  const findButtonAt = useCallback(
    (clientX: number, clientY: number) => {
      if (!selectedId) return null;
      const wrapper = wrapperRef.current;
      if (!wrapper) return null;
      const rect = wrapper.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const { x, y } = screenToWorld(sx, sy);

      const selectedNode = nodes.find((n) => n.id === selectedId);
      if (!selectedNode) return null;

      const buttons = getQuickAddButtons(selectedNode);
      for (const btn of buttons) {
        const dx = x - btn.x;
        const dy = y - btn.y;
        if (dx * dx + dy * dy <= (BUTTON_SIZE / 2 + 5) ** 2) {
          return { nodeId: selectedNode.id, type: btn.type };
        }
      }
      return null;
    },
    [nodes, selectedId, screenToWorld]
  );

  const drawTree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wrapperRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { clientWidth, clientHeight } = wrapperRef.current;
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

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    edges.forEach((edge) => {
      const drawPath = (offsetX = 0, offsetY = 0) => {
        if (edge.path.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(edge.path[0].x + offsetX, edge.path[0].y + offsetY);
        for (let i = 1; i < edge.path.length; i++) {
          ctx.lineTo(edge.path[i].x + offsetX, edge.path[i].y + offsetY);
        }
        ctx.stroke();
      };

      const isPrimarySpouseEdge =
        edge.type === "spouse" && edge.id.startsWith("edge-spouse-");

      if (isPrimarySpouseEdge) {
        const start = edge.path[0];
        const end = edge.path[edge.path.length - 1];
        const mostlyHorizontal =
          start && end ? Math.abs(end.x - start.x) >= Math.abs(end.y - start.y) : true;
        const offset = 2.2;
        ctx.strokeStyle = SPOUSE_LINE_COLOR;
        ctx.lineWidth = 1.8;

        if (mostlyHorizontal) {
          drawPath(0, -offset);
          drawPath(0, offset);
        } else {
          drawPath(-offset, 0);
          drawPath(offset, 0);
        }
        return;
      }

      ctx.strokeStyle = edge.type === "spouse" ? LINE_COLOR : CHILD_LINE_COLOR;
      ctx.lineWidth = edge.type === "spouse" ? 1.5 : 1.3;
      drawPath();
    });

    for (const node of nodes) {
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
      const x = node.x!;
      const y = node.y!;
      const isSelected = node.id === selectedId;
      const isHovered = node.id === hoveredId;
      const palette = getNodePalette(node, minGeneration);
      const left = x - NODE_WIDTH / 2;
      const top = y - NODE_HEIGHT / 2;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.16)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      drawRoundedRect(ctx, left, top, NODE_WIDTH, NODE_HEIGHT, NODE_RADIUS);
      ctx.fillStyle = palette.fill;
      ctx.fill();
      ctx.restore();

      drawRoundedRect(ctx, left, top, NODE_WIDTH, NODE_HEIGHT, NODE_RADIUS);
      if (isSelected || isHovered) {
        ctx.strokeStyle = "#b08e51";
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = palette.border;
        ctx.lineWidth = 2;
      }
      ctx.stroke();

      ctx.fillStyle = palette.text;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "600 20px Inter, sans-serif";
      const name = fitText(ctx, node.label, NODE_WIDTH - 20);
      ctx.fillText(name, x, y - 2);

      if (node.year) {
        const yearText = node.deathYear
          ? `${node.year} - ${node.deathYear}`
          : `${node.year}`;
        ctx.font = "400 11px Inter, sans-serif";
        ctx.fillText(yearText, x, y + 15);
      }

      if (isSelected) {
        const buttons = getQuickAddButtons(node);
        for (const btn of buttons) {
          ctx.beginPath();
          ctx.arc(btn.x, btn.y + 2, BUTTON_SIZE / 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,0,0,0.2)";
          ctx.fill();

          ctx.beginPath();
          ctx.arc(btn.x, btn.y, BUTTON_SIZE / 2, 0, Math.PI * 2);
          ctx.fillStyle = "#82693c";
          ctx.fill();
          ctx.strokeStyle = "white";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = "white";
          ctx.font = "bold 16px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(btn.icon, btn.x, btn.y);
        }
      }
    }

    ctx.restore();
  }, [nodes, edges, selectedId, hoveredId, transform, minGeneration]);

  useEffect(() => {
    drawTree();
    const handleResize = () => requestAnimationFrame(drawTree);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawTree]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const isZoomGesture = e.ctrlKey || e.metaKey;
    const deltaMultiplier =
      e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1;

    if (!isZoomGesture) {
      e.preventDefault();
      setTransform((prev) => ({
        ...prev,
        x: prev.x - e.deltaX * deltaMultiplier,
        y: prev.y - e.deltaY * deltaMultiplier,
      }));
      return;
    }

    e.preventDefault();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTransform((prev) => {
      const worldX = (mouseX - prev.x) / prev.k;
      const worldY = (mouseY - prev.y) / prev.k;
      const zoomFactor = Math.exp((-e.deltaY * deltaMultiplier) / 1000);
      const newK = Math.min(Math.max(prev.k * zoomFactor, 0.1), 5);

      return {
        x: mouseX - worldX * newK,
        y: mouseY - worldY * newK,
        k: newK,
      };
    });
  };

  const dragDistanceRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    const btnHit = findButtonAt(e.clientX, e.clientY);
    if (btnHit) {
      onAddNode(btnHit.nodeId, btnHit.type);
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      dragDistanceRef.current += Math.abs(dx) + Math.abs(dy);

      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      return;
    }

    const node = findNodeAt(e.clientX, e.clientY);
    setHoveredId(node?.id || null);
    const btnHit = findButtonAt(e.clientX, e.clientY);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = node || btnHit ? "pointer" : "grab";
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";

    if (dragDistanceRef.current < 5) {
      const node = findNodeAt(e.clientX, e.clientY);
      onSelectNode(node ? node.id : null);
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredId(null);
  };

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full select-none overflow-hidden bg-[#e8e5e0]"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="block" />

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 rounded-lg border border-warm-200 bg-white/90 p-2 shadow-md backdrop-blur">
        <button
          className="flex h-8 w-8 items-center justify-center rounded font-bold text-warmMuted hover:bg-warm-100"
          onClick={() => setTransform((t) => ({ ...t, k: Math.min(t.k * 1.2, 5) }))}
          title={copy.zoomIn}
          aria-label={copy.zoomIn}
        >
          +
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded font-bold text-warmMuted hover:bg-warm-100"
          onClick={() => setTransform((t) => ({ ...t, k: Math.max(t.k / 1.2, 0.1) }))}
          title={copy.zoomOut}
          aria-label={copy.zoomOut}
        >
          -
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded text-xs font-bold text-warmMuted hover:bg-warm-100"
          onClick={() => {
            if (wrapperRef.current) {
              const { clientWidth } = wrapperRef.current;
              const initialScale = 0.8;
              const initialX = (clientWidth - width * initialScale) / 2;
              const initialY = 80;
              setTransform({ x: initialX, y: initialY, k: initialScale });
            }
          }}
          title={copy.resetView}
          aria-label={copy.resetView}
        >
          ⟲
        </button>
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-warm-200 bg-white/90 px-3 py-2 text-xs text-warmMuted shadow-sm backdrop-blur">
        {copy.hintPanZoom}
      </div>
    </div>
  );
}
