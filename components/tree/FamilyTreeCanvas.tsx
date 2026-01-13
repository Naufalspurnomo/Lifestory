"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { LayoutNode } from "../../lib/tree/layoutEngine";

type Props = {
  nodes: LayoutNode[];
  selectedId: string | null;
  onSelectNode: (id: string | null) => void;
  onAddNode: (parentId: string, type: "parent" | "partner" | "child") => void;
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
const NODE_TXT_HEIGHT = 40;
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
const getQuickAddButtons = (node: LayoutNode) => [
  {
    type: "parent" as const,
    x: node.x,
    y: node.y - NODE_CIRCLE_SIZE / 2 - 24,
    icon: "↑",
    label: "Orang Tua",
  },
  {
    type: "partner" as const,
    x: node.x + NODE_CIRCLE_SIZE / 2 + 30,
    y: node.y,
    icon: "♥",
    label: "Pasangan",
  },
  {
    type: "child" as const,
    x: node.x,
    y: node.y + NODE_CIRCLE_SIZE / 2 + 60,
    icon: "↓",
    label: "Anak",
  },
];

const imageCache = new Map<string, HTMLImageElement>();

export default function FamilyTreeCanvas({
  nodes,
  selectedId,
  onSelectNode,
  onAddNode,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);

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
    const valid = nodes.filter(
      (n) => Number.isFinite(n.x) && Number.isFinite(n.y)
    );
    if (!valid.length) return { width: 800, height: 600 };

    let maxX = 0;
    let maxY = 0;
    for (const n of valid) {
      maxX = Math.max(maxX, n.x + NODE_CIRCLE_SIZE / 2 + NODE_TXT_HEIGHT);
      maxY = Math.max(maxY, n.y + NODE_CIRCLE_SIZE / 2 + NODE_TXT_HEIGHT + 20);
    }
    return {
      width: Math.max(800, maxX + PADDING_LEFT),
      height: Math.max(600, maxY + PADDING_TOP),
    };
  }, [nodes]);

  const findNodeAt = useCallback(
    (clientX: number, clientY: number) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return null;

      const rect = wrapper.getBoundingClientRect();
      const canvasX = clientX - rect.left + wrapper.scrollLeft;
      const canvasY = clientY - rect.top + wrapper.scrollTop;

      for (const node of nodes) {
        const dx = canvasX - node.x;
        const dy = canvasY - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= NODE_CIRCLE_SIZE / 2) return node;
      }
      return null;
    },
    [nodes]
  );

  const findButtonAt = useCallback(
    (clientX: number, clientY: number) => {
      const wrapper = wrapperRef.current;
      if (!wrapper || !selectedId) return null;

      const rect = wrapper.getBoundingClientRect();
      const canvasX = clientX - rect.left + wrapper.scrollLeft;
      const canvasY = clientY - rect.top + wrapper.scrollTop;

      const selectedNode = nodes.find((n) => n.id === selectedId);
      if (!selectedNode) return null;

      const buttons = getQuickAddButtons(selectedNode);
      for (const btn of buttons) {
        const dx = canvasX - btn.x;
        const dy = canvasY - btn.y;
        if (Math.sqrt(dx * dx + dy * dy) <= BUTTON_SIZE / 2) {
          return { nodeId: selectedNode.id, type: btn.type };
        }
      }
      return null;
    },
    [nodes, selectedId]
  );

  const drawTree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = getCanvasSize();

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // safer than ctx.scale
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Background: warm-50
    ctx.fillStyle = "#f9f6f1";
    ctx.fillRect(0, 0, width, height);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // -------- Generation display calculation --------
    const owner = nodes.find((n) => n.line === "self") || nodes[0];
    const ownerRank = owner?.__rankRaw ?? 0;
    const BASE_GEN = 1; // Owner is always Generation 1

    const getDisplayGen = (n: LayoutNode): number => {
      const r = (n.__rankRaw ?? 0) - ownerRank;
      return r + BASE_GEN;
    };

    const getGenColor = (gen: number): string => {
      if (GEN_COLORS[gen]) return GEN_COLORS[gen].border;
      return gen < 0 ? "#6b21a8" : "#be123c"; // deep purple / deep red for extreme gens
    };

    // -------- Build parentsMap from childrenIds (multi-parent) --------
    const parentsMap = new Map<string, string[]>();
    for (const p of nodes) {
      for (const cid of p.childrenIds || []) {
        if (!parentsMap.has(cid)) parentsMap.set(cid, []);
        parentsMap.get(cid)!.push(p.id);
      }
    }
    for (const [cid, pids] of parentsMap) {
      parentsMap.set(cid, Array.from(new Set(pids)));
    }

    // -------- Draw partner/marriage lines --------
    // 1) explicit partners
    const partnerPairs = new Set<string>();
    ctx.strokeStyle = "#b08e51"; // Gold
    ctx.lineWidth = 2;

    for (const node of nodes) {
      for (const pid of node.partners || []) {
        const key = [node.id, pid].sort().join("-");
        if (partnerPairs.has(key)) continue;
        partnerPairs.add(key);

        const p = nodeMap.get(pid);
        if (!p) continue;

        // same-level tolerance
        if (Math.abs(node.y - p.y) > 0.5) continue;

        const y = node.y;
        const x1 = Math.min(node.x, p.x) + NODE_CIRCLE_SIZE / 2;
        const x2 = Math.max(node.x, p.x) - NODE_CIRCLE_SIZE / 2;

        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
      }
    }

    // 2) implicit co-parents: if a child has 2 parents, draw marriage-ish line between them (optional but makes it like reference)
    for (const [cid, pids] of parentsMap) {
      if (pids.length < 2) continue;
      const a = nodeMap.get(pids[0]);
      const b = nodeMap.get(pids[1]);
      if (!a || !b) continue;
      if (Math.abs(a.y - b.y) > 0.5) continue;

      const key = [a.id, b.id].sort().join("-");
      if (partnerPairs.has(key)) continue;
      partnerPairs.add(key);

      const y = a.y;
      const x1 = Math.min(a.x, b.x) + NODE_CIRCLE_SIZE / 2;
      const x2 = Math.max(a.x, b.x) - NODE_CIRCLE_SIZE / 2;

      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }

    // reset line style for family connectors
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = LINE_WIDTH;

    // -------- Draw parent-to-children connection lines by FAMILY (parent set -> children) --------
    type Family = { parents: LayoutNode[]; children: LayoutNode[] };
    const families = new Map<string, Family>();

    for (const child of nodes) {
      const pids = parentsMap.get(child.id) || [];
      if (!pids.length) continue;

      const parents = pids
        .map((id) => nodeMap.get(id))
        .filter((p): p is LayoutNode => Boolean(p))
        .filter(
          (p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.y < child.y
        );

      if (!parents.length) continue;

      // prefer max 2 parents for classic rendering
      const used = parents.slice(0, 2);
      const key = used
        .map((p) => p.id)
        .sort()
        .join("-");

      const fam = families.get(key) || { parents: used, children: [] };
      fam.children.push(child);
      families.set(key, fam);
    }

    for (const fam of families.values()) {
      const parents = fam.parents.filter(
        (p) => Number.isFinite(p.x) && Number.isFinite(p.y)
      );
      const children = fam.children.filter(
        (c) => Number.isFinite(c.x) && Number.isFinite(c.y)
      );

      if (!parents.length || !children.length) continue;

      // trunk start = center of couple if 2 parents, else single parent x
      let startX = parents[0].x;
      const parentY = Math.min(...parents.map((p) => p.y));
      if (parents.length >= 2) startX = (parents[0].x + parents[1].x) / 2;

      const startY = parentY + NODE_CIRCLE_SIZE / 2;

      // children top and midY
      children.sort((a, b) => a.x - b.x);
      const childTopY =
        Math.min(...children.map((c) => c.y)) - NODE_CIRCLE_SIZE / 2;
      const midY = startY + (childTopY - startY) / 2;

      // 1) vertical trunk
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX, midY);
      ctx.stroke();

      // single child: L shape
      if (children.length === 1) {
        const c = children[0];
        if (Math.abs(c.x - startX) > 0.5) {
          ctx.beginPath();
          ctx.moveTo(startX, midY);
          ctx.lineTo(c.x, midY);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(c.x, midY);
        ctx.lineTo(c.x, c.y - NODE_CIRCLE_SIZE / 2);
        ctx.stroke();
        continue;
      }

      const minX = children[0].x;
      const maxX = children[children.length - 1].x;

      // if trunk not inside span, connect to span
      const clampedX = Math.min(Math.max(startX, minX), maxX);
      if (Math.abs(clampedX - startX) > 0.5) {
        ctx.beginPath();
        ctx.moveTo(startX, midY);
        ctx.lineTo(clampedX, midY);
        ctx.stroke();
      }

      // 2) horizontal bus
      ctx.beginPath();
      ctx.moveTo(minX, midY);
      ctx.lineTo(maxX, midY);
      ctx.stroke();

      // 3) drops
      for (const c of children) {
        ctx.beginPath();
        ctx.moveTo(c.x, midY);
        ctx.lineTo(c.x, c.y - NODE_CIRCLE_SIZE / 2);
        ctx.stroke();
      }
    }

    // -------- Draw nodes --------
    for (const node of nodes) {
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;

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
      ctx.arc(node.x, node.y, NODE_CIRCLE_SIZE / 2 + 3, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.restore();

      // image or initials
      const img = imageCache.get(node.id);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_CIRCLE_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        const hRatio = NODE_CIRCLE_SIZE / img.width;
        const vRatio = NODE_CIRCLE_SIZE / img.height;
        const ratio = Math.max(hRatio, vRatio);
        const shiftX = (NODE_CIRCLE_SIZE - img.width * ratio) / 2;
        const shiftY = (NODE_CIRCLE_SIZE - img.height * ratio) / 2;

        ctx.drawImage(
          img,
          node.x - NODE_CIRCLE_SIZE / 2 + shiftX,
          node.y - NODE_CIRCLE_SIZE / 2 + shiftY,
          img.width * ratio,
          img.height * ratio
        );
        ctx.restore();
      } else {
        // warm-100 for placeholder background
        ctx.fillStyle = "#f2ede3";
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_CIRCLE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // warmText for initials
        ctx.fillStyle = "#1d1a14";
        ctx.font = `bold ${NODE_CIRCLE_SIZE / 2.5}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label.charAt(0).toUpperCase(), node.x, node.y);
      }

      // border (use generation color)
      const gen = getDisplayGen(node);
      const genBorderColor = getGenColor(gen);

      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_CIRCLE_SIZE / 2, 0, Math.PI * 2);
      ctx.strokeStyle = isHovered || isSelected ? "#b08e51" : genBorderColor;
      ctx.lineWidth = isHovered || isSelected ? 4 : 3;
      ctx.stroke();

      // story icon
      if (node.content?.description) {
        const iconX = node.x + NODE_CIRCLE_SIZE / 2 - 8;
        const iconY = node.y - NODE_CIRCLE_SIZE / 2 + 8;

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

      // works icon (pojok kiri atas)
      if (node.works && node.works.length > 0) {
        const worksIconX = node.x - NODE_CIRCLE_SIZE / 2 + 8;
        const worksIconY = node.y - NODE_CIRCLE_SIZE / 2 + 8;

        // Background circle - warm golden color
        ctx.fillStyle = "#b08e51";
        ctx.beginPath();
        ctx.arc(worksIconX, worksIconY, 10, 0, Math.PI * 2);
        ctx.fill();

        // Get icon based on first work type
        const firstWorkType = node.works[0].type || "other";
        const workIcon = WORK_ICONS[firstWorkType] || WORK_ICONS.other;

        ctx.fillStyle = "white";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(workIcon, worksIconX, worksIconY + 1);

        // Badge for multiple works
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
      ctx.fillStyle = "#1d1a14";
      ctx.font = "600 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const textY = node.y + NODE_CIRCLE_SIZE / 2 + 8;
      ctx.fillText(node.label, node.x, textY);

      // year - warmMuted
      if (node.year) {
        const yearText = node.deathYear
          ? `${node.year} - ${node.deathYear}`
          : `${node.year}`;
        ctx.fillStyle = "#5b5346";
        ctx.font = "400 11px Inter, sans-serif";
        ctx.fillText(yearText, node.x, textY + 16);
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
  }, [nodes, selectedId, hoveredId, isPanning, getCanvasSize, imagesLoaded]);

  useEffect(() => {
    drawTree();
  }, [drawTree]);

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

  const { width, height } = getCanvasSize();

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full overflow-auto bg-warm-50"
      style={{ cursor: isPanning ? "grabbing" : "default" }}
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
    </div>
  );
}
