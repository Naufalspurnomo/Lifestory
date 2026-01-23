"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { LayoutGraph, FamilyNode } from "../../lib/types/tree";

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
const NODE_TXT_HEIGHT = 56;
const PADDING_TOP = 80;
const PADDING_LEFT = 80;

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasOffsetRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const { nodes, edges, width, height } = layout;

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

  const getCanvasSize = useCallback(() => {
    const w = Math.max(800, width + PADDING_LEFT * 2);
    const h = Math.max(600, height + PADDING_TOP * 2);
    return { width: w, height: h, offsetX: PADDING_LEFT, offsetY: PADDING_TOP };
  }, [width, height]);

  const findNodeAt = useCallback(
    (clientX: number, clientY: number) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return null;

      const rect = wrapper.getBoundingClientRect();
      const canvasX = clientX - rect.left + wrapper.scrollLeft;
      const canvasY = clientY - rect.top + wrapper.scrollTop;
      const { x: offsetX, y: offsetY } = canvasOffsetRef.current;
      const adjustedX = canvasX / zoom - offsetX;
      const adjustedY = canvasY / zoom - offsetY;

      for (const node of nodes) {
        if (typeof node.x !== 'number' || typeof node.y !== 'number') continue;
        const dx = adjustedX - node.x;
        const dy = adjustedY - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= NODE_CIRCLE_SIZE / 2) return node;
      }
      return null;
    },
    [nodes, zoom]
  );

  const findButtonAt = useCallback(
    (clientX: number, clientY: number) => {
      const wrapper = wrapperRef.current;
      if (!wrapper || !selectedId) return null;

      const rect = wrapper.getBoundingClientRect();
      const canvasX = clientX - rect.left + wrapper.scrollLeft;
      const canvasY = clientY - rect.top + wrapper.scrollTop;
      const { x: offsetX, y: offsetY } = canvasOffsetRef.current;
      const adjustedX = canvasX / zoom - offsetX;
      const adjustedY = canvasY / zoom - offsetY;

      const selectedNode = nodes.find((n) => n.id === selectedId);
      if (!selectedNode) return null;

      const buttons = getQuickAddButtons(selectedNode);
      for (const btn of buttons) {
        const dx = adjustedX - btn.x;
        const dy = adjustedY - btn.y;
        if (Math.sqrt(dx * dx + dy * dy) <= BUTTON_SIZE / 2) {
          return { nodeId: selectedNode.id, type: btn.type };
        }
      }
      return null;
    },
    [nodes, selectedId, zoom]
  );

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(x, y, width, height, radius);
      return;
    }
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  };

  const wrapLabel = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number
  ) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    let wordIndex = 0;

    while (wordIndex < words.length) {
      const word = words[wordIndex];
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
        wordIndex += 1;
      } else {
        if (current) {
          lines.push(current);
          current = "";
        } else {
          lines.push(word);
          wordIndex += 1;
        }
        if (lines.length === maxLines - 1) break;
      }
    }

    if (current && lines.length < maxLines) {
      lines.push(current);
    }

    const hasMore = wordIndex < words.length;
    if (hasMore && lines.length > 0) {
      const lastIndex = Math.min(lines.length, maxLines) - 1;
      lines[lastIndex] = `${lines[lastIndex].replace(/\s+$/, "")}…`;
      return lines.slice(0, maxLines);
    }

    return lines.slice(0, maxLines);
  };

  const drawTree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height, offsetX, offsetY } = getCanvasSize();
    canvasOffsetRef.current = { x: offsetX, y: offsetY };

    const scaledWidth = width * zoom;
    const scaledHeight = height * zoom;
    canvas.style.width = `${scaledWidth}px`;
    canvas.style.height = `${scaledHeight}px`;
    canvas.width = scaledWidth * dpr;
    canvas.height = scaledHeight * dpr;

    // safer than ctx.scale
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background: warm-50
    ctx.fillStyle = "#f9f6f1";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // -------- Generation display calculation --------
    const owner = nodes.find((n) => n.line === "self") || nodes[0];
    const ownerGen = owner?.generation ?? 0;
    const BASE_GEN = 1;

    const getDisplayGen = (n: FamilyNode): number => {
      return (n.generation ?? 0) - ownerGen + BASE_GEN;
    };

    const getGenColor = (gen: number): string => {
      if (GEN_COLORS[gen]) return GEN_COLORS[gen].border;
      return gen < 0 ? "#6b21a8" : "#be123c";
    };

    // -------- Draw Edges (Explicit paths from layout) --------
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    edges.forEach(edge => {
      ctx.beginPath();
      ctx.strokeStyle = edge.type === "spouse" ? "#b08e51" : LINE_COLOR;
      ctx.lineWidth = edge.type === "spouse" ? 2 : LINE_WIDTH;

      if (edge.path.length > 0) {
        ctx.moveTo(edge.path[0].x, edge.path[0].y);
        for (let i = 1; i < edge.path.length; i++) {
          ctx.lineTo(edge.path[i].x, edge.path[i].y);
        }
      }
      ctx.stroke();
    });

    // -------- Draw nodes --------
    for (const node of nodes) {
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
      const x = node.x!;
      const y = node.y!;

      const isSelected = node.id === selectedId;
      const isHovered = node.id === hoveredId;

      const lineKey = (node.line as keyof typeof COLORS) || "default";
      const colorSet = COLORS[lineKey] || COLORS.default;

      // shadow
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.1)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.arc(x, y, NODE_CIRCLE_SIZE / 2 + 3, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.restore();

      // image or initials
      const img = imageCache.get(node.id);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, NODE_CIRCLE_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        const hRatio = NODE_CIRCLE_SIZE / img.width;
        const vRatio = NODE_CIRCLE_SIZE / img.height;
        const ratio = Math.max(hRatio, vRatio);
        const shiftX = (NODE_CIRCLE_SIZE - img.width * ratio) / 2;
        const shiftY = (NODE_CIRCLE_SIZE - img.height * ratio) / 2;

        ctx.drawImage(
          img,
          x - NODE_CIRCLE_SIZE / 2 + shiftX,
          y - NODE_CIRCLE_SIZE / 2 + shiftY,
          img.width * ratio,
          img.height * ratio
        );
        ctx.restore();
      } else {
        ctx.fillStyle = "#f2ede3";
        ctx.beginPath();
        ctx.arc(x, y, NODE_CIRCLE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#1d1a14";
        ctx.font = `bold ${NODE_CIRCLE_SIZE / 2.5}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label.charAt(0).toUpperCase(), x, y);
      }

      // border
      const gen = getDisplayGen(node);
      const genBorderColor = getGenColor(gen);

      ctx.beginPath();
      ctx.arc(x, y, NODE_CIRCLE_SIZE / 2, 0, Math.PI * 2);
      ctx.strokeStyle = isHovered || isSelected ? "#b08e51" : genBorderColor;
      ctx.lineWidth = isHovered || isSelected ? 4 : 3;
      ctx.stroke();

      // story icon
      if (node.content?.description) {
        const iconX = x + NODE_CIRCLE_SIZE / 2 - 8;
        const iconY = y - NODE_CIRCLE_SIZE / 2 + 8;

        ctx.fillStyle = colorSet.base;
        ctx.beginPath();
        ctx.arc(iconX, iconY, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("📖", iconX, iconY + 1);
      }

      // works icon
      if (node.works && node.works.length > 0) {
        const worksIconX = x - NODE_CIRCLE_SIZE / 2 + 8;
        const worksIconY = y - NODE_CIRCLE_SIZE / 2 + 8;

        ctx.fillStyle = "#b08e51";
        ctx.beginPath();
        ctx.arc(worksIconX, worksIconY, 10, 0, Math.PI * 2);
        ctx.fill();

        const firstWorkType = node.works[0].type || "other";
        const workIcon = WORK_ICONS[firstWorkType] || WORK_ICONS.other;

        ctx.fillStyle = "white";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(workIcon, worksIconX, worksIconY + 1);

        if (node.works.length > 1) {
          const badgeX = worksIconX + 8;
          const badgeY = worksIconY - 6;

          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "white";
          ctx.font = "bold 8px sans-serif";
          ctx.fillText(String(node.works.length), badgeX, badgeY);
        }
      }

      // label - warmText
      ctx.font = "600 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const textY = node.y + NODE_CIRCLE_SIZE / 2 + 8;
      const labelPaddingX = 12;
      const labelPaddingY = 6;
      const labelLineHeight = 14;
      const labelMaxWidth = 140;
      const labelLines = wrapLabel(ctx, node.label, labelMaxWidth, 2);
      const labelWidth = Math.max(
        ...labelLines.map((line) => ctx.measureText(line).width)
      );
      const labelHeight =
        labelLines.length * labelLineHeight + labelPaddingY * 2;
      const labelRectWidth = labelWidth + labelPaddingX * 2;
      const labelRectX = node.x - labelRectWidth / 2;
      const labelRectY = textY - labelPaddingY;

      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.strokeStyle = "rgba(224,212,192,0.9)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      drawRoundedRect(
        ctx,
        labelRectX,
        labelRectY,
        labelRectWidth,
        labelHeight,
        10
      );
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#1d1a14";
      labelLines.forEach((line, index) => {
        ctx.fillText(line, node.x, textY + index * labelLineHeight);
      });
      // label
      ctx.fillStyle = "#1d1a14";
      ctx.font = "600 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const textY = y + NODE_CIRCLE_SIZE / 2 + 8;
      ctx.fillText(node.label, x, textY);

      // year
      if (node.year) {
        const yearText = node.deathYear
          ? `${node.year} - ${node.deathYear}`
          : `${node.year}`;
        ctx.fillStyle = "#5b5346";
        ctx.font = "400 11px Inter, sans-serif";
        ctx.fillText(
          yearText,
          node.x,
          textY + labelLines.length * labelLineHeight + 6
        );
        ctx.fillText(yearText, x, textY + 16);
      }

      // quick add buttons
      if (isSelected && !isPanning) {
        const buttons = getQuickAddButtons(node);
        for (const btn of buttons) {
          ctx.beginPath();
          ctx.arc(btn.x, btn.y + 2, BUTTON_SIZE / 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,0,0,0.2)";
          ctx.fill();

          ctx.beginPath();
          ctx.arc(btn.x, btn.y, BUTTON_SIZE / 2, 0, Math.PI * 2);
          ctx.fillStyle = "#82693c"; // gold-700
          ctx.fill();

          ctx.strokeStyle = "#FFF";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = "#FFF";
          ctx.font = "bold 16px system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(btn.icon, btn.x, btn.y);
        }
      }
    }

    ctx.restore();
  }, [
    nodes,
    selectedId,
    hoveredId,
    isPanning,
    getCanvasSize,
    imagesLoaded,
    drawRoundedRect,
    wrapLabel,
    zoom,
  ]);
  }, [nodes, edges, width, height, selectedId, hoveredId, isPanning, getCanvasSize, imagesLoaded]);

  useEffect(() => {
    drawTree();
  }, [drawTree]);

  // Event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const hit = findButtonAt(e.clientX, e.clientY);
    if (hit) {
      onAddNode(hit.nodeId, hit.type);
      return;
    }
    setIsPanning(true);
    setHasDragged(false);
    setPanStart({ x: e.clientX, y: e.clientY });
    setScrollStart({
      x: wrapperRef.current?.scrollLeft || 0,
      y: wrapperRef.current?.scrollTop || 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) setHasDragged(true);
      if (wrapperRef.current) {
        wrapperRef.current.scrollLeft = scrollStart.x - dx;
        wrapperRef.current.scrollTop = scrollStart.y - dy;
      }
    } else {
      const node = findNodeAt(e.clientX, e.clientY);
      setHoveredId(node?.id || null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!hasDragged) {
      const node = findNodeAt(e.clientX, e.clientY);
      onSelectNode(node ? node.id : null);
    }
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    setHoveredId(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsPanning(true);
      setHasDragged(false);
      setPanStart({ x: t.clientX, y: t.clientY });
      setScrollStart({
        x: wrapperRef.current?.scrollLeft || 0,
        y: wrapperRef.current?.scrollTop || 0,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - panStart.x;
      const dy = t.clientY - panStart.y;
      setHasDragged(true);
      if (wrapperRef.current) {
        wrapperRef.current.scrollLeft = scrollStart.x - dx;
        wrapperRef.current.scrollTop = scrollStart.y - dy;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!hasDragged && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const node = findNodeAt(t.clientX, t.clientY);
      if (node) onSelectNode(node.id);
    }
    setIsPanning(false);
  };

  const clampZoom = (value: number) => Math.min(2.5, Math.max(0.6, value));

  const applyZoom = (
    nextZoom: number,
    anchor?: { clientX: number; clientY: number }
  ) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      setZoom(nextZoom);
      return;
    }
    const rect = wrapper.getBoundingClientRect();
    const anchorX = anchor ? anchor.clientX - rect.left : rect.width / 2;
    const anchorY = anchor ? anchor.clientY - rect.top : rect.height / 2;
    const prevZoom = zoomRef.current;
    const scale = nextZoom / prevZoom;
    const nextScrollLeft = (wrapper.scrollLeft + anchorX) * scale - anchorX;
    const nextScrollTop = (wrapper.scrollTop + anchorY) * scale - anchorY;
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
    requestAnimationFrame(() => {
      wrapper.scrollLeft = nextScrollLeft;
      wrapper.scrollTop = nextScrollTop;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const direction = e.deltaY > 0 ? -0.08 : 0.08;
    const nextZoom = clampZoom(zoomRef.current + direction);
    applyZoom(nextZoom, { clientX: e.clientX, clientY: e.clientY });
  };

  const handleFit = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const { width, height } = getCanvasSize();
    const fitZoom = clampZoom(
      Math.min(wrapper.clientWidth / width, wrapper.clientHeight / height)
    );
    applyZoom(fitZoom);
  };

  const { width, height } = getCanvasSize();
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full overflow-auto bg-warm-50"
      style={{ cursor: isPanning ? "grabbing" : "default" }}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1.5 shadow-lg border border-warm-200 text-sm font-semibold text-warmMuted backdrop-blur z-10">
        <button
          onClick={() => applyZoom(clampZoom(zoomRef.current + 0.1))}
          className="h-7 w-7 rounded-full bg-white border border-warm-200 text-warmText hover:border-gold-500 hover:text-gold-600 transition"
          aria-label="Perbesar kanvas"
        >
          +
        </button>
        <span className="min-w-[52px] text-center">{zoomPercent}%</span>
        <button
          onClick={() => applyZoom(clampZoom(zoomRef.current - 0.1))}
          className="h-7 w-7 rounded-full bg-white border border-warm-200 text-warmText hover:border-gold-500 hover:text-gold-600 transition"
          aria-label="Perkecil kanvas"
        >
          −
        </button>
        <button
          onClick={() => applyZoom(1)}
          className="h-7 px-2 rounded-full bg-white border border-warm-200 text-warmText hover:border-gold-500 hover:text-gold-600 transition text-xs"
          aria-label="Reset zoom"
        >
          Reset
        </button>
        <button
          onClick={handleFit}
          className="h-7 px-2 rounded-full bg-white border border-warm-200 text-warmText hover:border-gold-500 hover:text-gold-600 transition text-xs"
          aria-label="Sesuaikan tampilan"
        >
          Fit
        </button>
        <span className="hidden sm:inline text-xs text-warmMuted/80">
          Ctrl/⌘ + scroll
        </span>
      </div>
  return (
    <div
      ref={wrapperRef}
      className="w-full h-full overflow-auto relative cursor-grab active:cursor-grabbing touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
