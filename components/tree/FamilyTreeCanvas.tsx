"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { LayoutGraph, FamilyNode } from "../../lib/types/tree";
import { useLanguage } from "../providers/LanguageProvider";

type Props = {
  layout: LayoutGraph;
  selectedId: string | null;
  onSelectNode: (id: string | null) => void;
  onAddNode: (parentId: string, type: "parent" | "partner" | "child" | "sibling") => void;
};

// Luxury Warm Color Palette
const COLORS = {
  paternal: { border: "#60a5fa", base: "#3b82f6" },
  maternal: { border: "#f472b6", base: "#ec4899" },
  union: { border: "#a78bfa", base: "#8b5cf6" },
  descendant: { border: "#4ade80", base: "#22c55e" },
  self: { border: "#b08e51", base: "#82693c" }, // Gold from logo
  default: { border: "#5b5346", base: "#1d1a14" }, // warmMuted / warmText
};

// Generation-based colors (relative to owner = Gen 1)
const GEN_COLORS: Record<number, { border: string; label: string }> = {
  [-2]: { border: "#a855f7", label: "Buyut" }, // Purple
  [-1]: { border: "#1f6f62", label: "Kakek/Nenek" }, // Accent Teal
  [0]: { border: "#22c55e", label: "Orang Tua" }, // Green
  [1]: { border: "#b08e51", label: "Anda" }, // Gold (Owner)
  [2]: { border: "#82693c", label: "Anak" }, // Gold-700
  [3]: { border: "#ef4444", label: "Cucu" }, // Red
  [4]: { border: "#ec4899", label: "Cicit" }, // Pink
};

const NODE_CIRCLE_SIZE = 70;
const LABEL_MAX_WIDTH = 130;
const LABEL_MAX_LINES = 2;
const LABEL_LINE_HEIGHT = 15;

const LINE_COLOR = "#e6dbc7"; // warmBorder
const LINE_WIDTH = 1.5;

const BUTTON_SIZE = 28;

// Icons for member works/creations
const WORK_ICONS: Record<string, string> = {
  book: "📚",
  music: "🎵",
  film: "🎬",
  art: "🎨",
  other: "⭐",
};

const getQuickAddButtons = (node: FamilyNode) => [
  {
    type: "parent" as const,
    x: (node.x || 0),
    y: (node.y || 0) - NODE_CIRCLE_SIZE / 2 - 24,
    icon: "↑",
    label: "Orang Tua",
  },
  {
    type: "partner" as const,
    x: (node.x || 0) + NODE_CIRCLE_SIZE / 2 + 30,
    y: (node.y || 0),
    icon: "♥",
    label: "Pasangan",
  },
  {
    type: "child" as const,
    x: (node.x || 0),
    y: (node.y || 0) + NODE_CIRCLE_SIZE / 2 + 60,
    icon: "↓",
    label: "Anak",
  },
  {
    type: "sibling" as const,
    x: (node.x || 0) - NODE_CIRCLE_SIZE / 2 - 30,
    y: (node.y || 0),
    icon: "↔",
    label: "Saudara",
  },
];

const imageCache = new Map<string, HTMLImageElement>();

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

  // View state: Transform (pan x/y, scale)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  const { nodes, edges, width, height } = layout;

  // Initial centering
  useEffect(() => {
    if (nodes.length > 0 && wrapperRef.current) {
      const { clientWidth } = wrapperRef.current;
      // Center the tree initially
      const initialScale = 0.8;
      const initialX = (clientWidth - width * initialScale) / 2;
      const initialY = 100; // Top padding
      setTransform({ x: initialX, y: initialY, k: initialScale });
    }
  }, [width, height, nodes.length]);

  // Image preloading logic...
  useEffect(() => {
    let loadedCount = 0;
    const toLoad = nodes.filter((n) => n.imageUrl && !imageCache.has(n.id));
    if (toLoad.length === 0) return;

    toLoad.forEach((node) => {
      if (!node.imageUrl) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageCache.set(node.id, img);
        loadedCount++;
        if (loadedCount === toLoad.length) setImagesLoaded((p) => p + 1);
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === toLoad.length) setImagesLoaded((p) => p + 1);
      };
      img.src = node.imageUrl;
    });
  }, [nodes]);

  // --- HIT TESTING (Screen -> World) ---
  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      return {
        x: (sx - transform.x) / transform.k,
        y: (sy - transform.y) / transform.k,
      };
    },
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

      // Check distance to nodes
      for (const node of nodes) {
        if (typeof node.x !== "number" || typeof node.y !== "number") continue;
        const dx = x - node.x;
        const dy = y - node.y;
        // Hit area slightly larger for easier selection
        if (dx * dx + dy * dy <= (NODE_CIRCLE_SIZE / 2) ** 2) {
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

  // --- DRAWING ---
  const drawTree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !wrapperRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { clientWidth, clientHeight } = wrapperRef.current;
    const dpr = window.devicePixelRatio || 1;

    // Resize canvas to full wrapper size
    if (
      canvas.width !== clientWidth * dpr ||
      canvas.height !== clientHeight * dpr
    ) {
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
    }

    // Reset transform & clear
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, clientWidth, clientHeight);

    // Apply Zoom/Pan Transform
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    // 1. Draw Edges
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

        ctx.strokeStyle = "#eab308";
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

      ctx.strokeStyle = edge.type === "spouse" ? "#b08e51" : LINE_COLOR;
      ctx.lineWidth = edge.type === "spouse" ? 2 : LINE_WIDTH;
      drawPath();
    });

    // Determine Owner Node for Generation Color Calculation
    const owner = nodes.find((n) => n.line === "self") || nodes[0];
    const ownerGen = owner?.generation ?? 0;
    const BASE_GEN = 1;

    const truncateToWidth = (text: string, maxWidth: number) => {
      const trimmed = text.trim();
      if (!trimmed) return "";
      if (ctx.measureText(trimmed).width <= maxWidth) return trimmed;

      let result = trimmed;
      while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
        result = result.slice(0, -1);
      }
      return `${result}…`;
    };

    const wrapLabel = (text: string) => {
      const words = text.trim().split(/\s+/).filter(Boolean);
      if (!words.length) return [""];

      const lines: string[] = [];
      let current = words[0];

      for (let i = 1; i < words.length; i++) {
        const candidate = `${current} ${words[i]}`;
        if (ctx.measureText(candidate).width <= LABEL_MAX_WIDTH) {
          current = candidate;
          continue;
        }

        lines.push(truncateToWidth(current, LABEL_MAX_WIDTH));
        current = words[i];

        if (lines.length === LABEL_MAX_LINES - 1) {
          const remaining = [current, ...words.slice(i + 1)].join(" ");
          lines.push(truncateToWidth(remaining, LABEL_MAX_WIDTH));
          return lines;
        }
      }

      lines.push(truncateToWidth(current, LABEL_MAX_WIDTH));
      return lines.slice(0, LABEL_MAX_LINES);
    };

    // 2. Draw Nodes
    for (const node of nodes) {
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
      const x = node.x!;
      const y = node.y!;
      const isSelected = node.id === selectedId;
      const isHovered = node.id === hoveredId;

      // Color info
      const lineKey = (node.line as keyof typeof COLORS) || "default";
      const colorSet = COLORS[lineKey] || COLORS.default;
      const displayGen = (node.generation ?? 0) - ownerGen + BASE_GEN;
      const genColor = GEN_COLORS[displayGen]?.border || "#be123c";

      // --- Node Shadow ---
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      ctx.beginPath();
      ctx.arc(x, y, NODE_CIRCLE_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.restore();

      // --- Node Image / Initials ---
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, NODE_CIRCLE_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();

      const img = imageCache.get(node.id);
      if (img && img.complete && img.naturalWidth > 0) {
        // Cover-fit image
        const scale = Math.max(
          NODE_CIRCLE_SIZE / img.width,
          NODE_CIRCLE_SIZE / img.height
        );
        const cw = img.width * scale;
        const ch = img.height * scale;
        ctx.drawImage(img, x - cw / 2, y - ch / 2, cw, ch);
      } else {
        // Fallback Initials
        ctx.fillStyle = "#f9f6f1"; // bg-warm-50
        ctx.fillRect(
          x - NODE_CIRCLE_SIZE / 2,
          y - NODE_CIRCLE_SIZE / 2,
          NODE_CIRCLE_SIZE,
          NODE_CIRCLE_SIZE
        );
        ctx.fillStyle = "#5b5346"; // text-warmMuted
        ctx.font = `bold ${NODE_CIRCLE_SIZE * 0.4}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label.charAt(0).toUpperCase(), x, y);
      }
      ctx.restore();

      // --- Node Border ---
      ctx.beginPath();
      ctx.arc(x, y, NODE_CIRCLE_SIZE / 2, 0, Math.PI * 2);
      // Highlights: Selected/Hovered gets Gold, else Generation Color
      if (isSelected || isHovered) {
        ctx.strokeStyle = "#b08e51";
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = genColor;
        ctx.lineWidth = 3;
      }
      ctx.stroke();

      // --- Badges (Story / Works) ---
      // Story Icon (Top Right)
      if (node.content?.description) {
        const iconX = x + NODE_CIRCLE_SIZE / 2 * 0.7; // 45 deg approx
        const iconY = y - NODE_CIRCLE_SIZE / 2 * 0.7;
        ctx.beginPath();
        ctx.arc(iconX, iconY, 12, 0, Math.PI * 2);
        ctx.fillStyle = colorSet.base;
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("📖", iconX, iconY + 1);
      }
      // Works Icon (Bottom Left) - moved slightly to avoid text overlap
      if (node.works && node.works.length > 0) {
        const iconX = x - NODE_CIRCLE_SIZE / 2 * 0.7;
        const iconY = y - NODE_CIRCLE_SIZE / 2 * 0.7;
        ctx.beginPath();
        ctx.arc(iconX, iconY, 12, 0, Math.PI * 2);
        ctx.fillStyle = "#b08e51"; // Gold
        ctx.fill();

        const firstWorkType = node.works[0].type || "other";
        const workIcon = WORK_ICONS[firstWorkType] || WORK_ICONS.other;
        ctx.fillStyle = "white";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(workIcon, iconX, iconY + 1);
      }


      // --- Text Labels (Under Node) ---
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Name
      ctx.fillStyle = "#1d1a14";
      ctx.font = "600 13px Inter, sans-serif";
      const textY = y + NODE_CIRCLE_SIZE / 2 + 10;
      const labelLines = wrapLabel(node.label);
      // Truncate overly long names? Or multiline?
      // simple shadow for text readability against lines
      ctx.save();
      ctx.shadowColor = "rgba(255,255,255,0.8)";
      ctx.shadowBlur = 4;
      labelLines.forEach((line, index) => {
        ctx.fillText(line, x, textY + index * LABEL_LINE_HEIGHT);
      });
      ctx.restore();

      // Year
      if (node.year) {
        const yearText = node.deathYear
          ? `${node.year} - ${node.deathYear}`
          : `${node.year}`;
        ctx.fillStyle = "#5b5346";
        ctx.font = "400 11px Inter, sans-serif";
        const yearY = textY + labelLines.length * LABEL_LINE_HEIGHT + 2;
        ctx.fillText(yearText, x, yearY);
      }

      // --- Quick Add Buttons (Only if selected) ---
      if (isSelected) {
        const buttons = getQuickAddButtons(node);
        // Draw connecting lines to buttons? Optional.

        for (const btn of buttons) {
          // Button cleanup
          ctx.beginPath();
          ctx.arc(btn.x, btn.y + 2, BUTTON_SIZE / 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,0,0,0.2)";
          ctx.fill();

          ctx.beginPath();
          ctx.arc(btn.x, btn.y, BUTTON_SIZE / 2, 0, Math.PI * 2);
          ctx.fillStyle = "#82693c"; // Gold-700
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
  }, [nodes, edges, width, height, selectedId, hoveredId, transform, imagesLoaded]);

  // Redraw on change
  useEffect(() => {
    drawTree();
    // Also re-draw on window resize
    const handleResize = () => requestAnimationFrame(drawTree);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawTree]);


  // --- INTERACTION HANDLERS ---

  const handleWheel = (e: React.WheelEvent) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const isZoomGesture = e.ctrlKey || e.metaKey;
    const deltaMultiplier = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rect.height : 1;

    // Trackpad/mouse wheel should pan by default; zoom only with pinch or Ctrl/Cmd+wheel.
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


  // Revised Mouse Handler for separation of Click vs Drag
  const dragDistanceRef = useRef(0);

  const handleMouseDownRevised = (e: React.MouseEvent) => {
    const btnHit = findButtonAt(e.clientX, e.clientY);
    if (btnHit) {
      onAddNode(btnHit.nodeId, btnHit.type);
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    dragDistanceRef.current = 0;
  };

  const handleMouseMoveRevised = (e: React.MouseEvent) => {
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

      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    } else {
      // Hover
      const node = findNodeAt(e.clientX, e.clientY);
      setHoveredId(node?.id || null);

      // Buttons
      const btnHit = findButtonAt(e.clientX, e.clientY);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = (node || btnHit) ? 'pointer' : 'grab';
      }
    }
  };

  const handleMouseUpRevised = (e: React.MouseEvent) => {
    setIsDragging(false);
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';

    // If drag was small, treat as click
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
      className="w-full h-full relative overflow-hidden bg-[#f9f6f1] select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDownRevised}
      onMouseMove={handleMouseMoveRevised}
      onMouseUp={handleMouseUpRevised}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="block" />

      {/* Zoom Controls Overlay (Optional but good UX) */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 p-2 bg-white/90 backdrop-blur rounded-lg shadow-md border border-warm-200">
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-warm-100 text-warmMuted font-bold"
          onClick={() => setTransform(t => ({ ...t, k: Math.min(t.k * 1.2, 5) }))}
          title={copy.zoomIn}
          aria-label={copy.zoomIn}
        >
          +
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-warm-100 text-warmMuted font-bold"
          onClick={() => setTransform(t => ({ ...t, k: Math.max(t.k / 1.2, 0.1) }))}
          title={copy.zoomOut}
          aria-label={copy.zoomOut}
        >
          -
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-warm-100 text-warmMuted font-bold text-xs"
          onClick={() => {
            // Reset to center
            if (wrapperRef.current) {
              const { clientWidth } = wrapperRef.current;
              const initialScale = 0.8;
              const initialX = (clientWidth - width * initialScale) / 2;
              const initialY = 100;
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
