// Render a LayoutGraph to an SVG string using the SAME coordinates and edge
// paths produced by the Sugiyama layout used in the Canvas renderer. This is
// our visual "screenshot" for CI / docs — no browser needed.

import type { LayoutGraph } from "../../../lib/types/tree";
import { LAYOUT } from "../../../lib/types/tree";

const NODE_R = LAYOUT.NODE_SIZE / 2;

function escape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function truncate(value: string, max = 22): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

const COLORS: Record<number, string> = {
  0: "#b08e51",
  1: "#82693c",
  2: "#1f6f62",
  3: "#8b5cf6",
  4: "#ec4899",
  5: "#ef4444",
};

export function renderLayoutToSVG(
  layout: LayoutGraph,
  title: string
): string {
  const w = Math.max(800, Math.ceil(layout.width));
  const h = Math.max(600, Math.ceil(layout.height) + 60);

  const edgeSvg = layout.edges
    .map((edge) => {
      const d = edge.path
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");

      let stroke = "#b7ad98";
      let dash = "";
      let width = 1.2;
      if (edge.type === "spouse") {
        stroke = "#b08e51";
        width = 2;
      } else if (edge.type === "adoption") {
        stroke = "#8b5cf6";
        dash = 'stroke-dasharray="6 4"';
        width = 1.6;
      }

      return `<path d="${d}" stroke="${stroke}" stroke-width="${width}" fill="none" ${dash} stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .join("\n  ");

  const nodeSvg = layout.nodes
    .map((n) => {
      const color = COLORS[n.generation ?? 0] ?? "#5b5346";
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const label = escape(truncate(n.label));
      const yearText = n.year
        ? n.deathYear
          ? `${n.year}–${n.deathYear}`
          : `${n.year}`
        : "";
      return `
  <g>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${NODE_R}"
            fill="#fffaf2" stroke="${color}" stroke-width="3" />
    <text x="${x.toFixed(1)}" y="${(y + NODE_R + 16).toFixed(
        1
      )}" font-family="Inter, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="#1d1a14">${label}</text>
    ${
      yearText
        ? `<text x="${x.toFixed(1)}" y="${(y + NODE_R + 32).toFixed(
            1
          )}" font-family="Inter, sans-serif" font-size="10" text-anchor="middle" fill="#5b5346">${yearText}</text>`
        : ""
    }
  </g>`;
    })
    .join("");

  const legendY = h - 24;
  const legend = `
  <g font-family="Inter, sans-serif" font-size="11" fill="#5b5346">
    <line x1="20" y1="${legendY}" x2="50" y2="${legendY}" stroke="#b08e51" stroke-width="2" />
    <text x="55" y="${legendY + 4}">spouse</text>
    <line x1="120" y1="${legendY}" x2="150" y2="${legendY}" stroke="#b7ad98" stroke-width="1.2" />
    <text x="155" y="${legendY + 4}">parent→child</text>
    <line x1="240" y1="${legendY}" x2="270" y2="${legendY}" stroke="#8b5cf6" stroke-width="1.6" stroke-dasharray="6 4" />
    <text x="275" y="${legendY + 4}">adoption</text>
  </g>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="100%" height="100%" fill="#f9f6f1" />
  <text x="20" y="30" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#1d1a14">${escape(
    title
  )}</text>
  <text x="20" y="48" font-family="Inter, sans-serif" font-size="11" fill="#5b5346">${layout.nodes.length} people · ${
    layout.edges.length
  } edges · ${layout.unions?.length ?? 0} unions</text>
  ${edgeSvg}
  ${nodeSvg}
  ${legend}
</svg>`;
}
