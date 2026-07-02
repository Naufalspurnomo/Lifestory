import { jsPDF } from "jspdf";
import { resolveDisplayMediaUrl } from "../media/public-url";
import { calculateHierarchicalLayout } from "../tree/layoutEngine";
import type { FamilyNode, LayoutGraph, TreeData } from "../types/tree";

export type PdfLocale = "id" | "en";

type PdfMemberGroup = {
  generation: number;
  title: string;
  members: FamilyNode[];
};

export type TreePdfModel = {
  treeName: string;
  exportedAt: Date;
  memberCount: number;
  generationCount: number;
  layout: LayoutGraph;
  groups: PdfMemberGroup[];
};

const BRAND = "#82693c";
const INK = "#3f342d";
const MUTED = "#73685f";
const CREAM = "#faf7f0";
const PAPER = "#fffdf8";
const LINE = "#cbb98f";
const NODE_W = 34;
const NODE_H = 18;
const MAX_IMAGES = 40;

function copy(locale: PdfLocale) {
  return locale === "id"
    ? {
        titleSuffix: "Pohon Keluarga",
        exported: "Diekspor",
        members: "Anggota",
        generations: "Generasi",
        directory: "Daftar Anggota Keluarga",
        generation: (n: number) => `Generasi ${n}`,
        unknownGeneration: "Generasi tidak diketahui",
        noYear: "Tahun belum dicatat",
        story: "Cerita tersimpan",
        photo: "Foto profil",
        empty: "Belum ada data keluarga untuk diekspor.",
      }
    : {
        titleSuffix: "Family Tree",
        exported: "Exported",
        members: "Members",
        generations: "Generations",
        directory: "Family Member Directory",
        generation: (n: number) => `Generation ${n}`,
        unknownGeneration: "Unknown generation",
        noYear: "Year not recorded",
        story: "Story saved",
        photo: "Profile photo",
        empty: "No family data available to export.",
      };
}

export function formatLifespan(node: FamilyNode, locale: PdfLocale): string {
  const c = copy(locale);
  if (node.year && node.deathYear) return `${node.year} - ${node.deathYear}`;
  if (node.year) return String(node.year);
  if (node.deathYear) return `- ${node.deathYear}`;
  return c.noYear;
}

export function groupNodesForPdf(
  nodes: FamilyNode[],
  locale: PdfLocale = "id"
): PdfMemberGroup[] {
  const c = copy(locale);
  const byGeneration = new Map<number, FamilyNode[]>();
  for (const node of nodes) {
    const generation = Number.isFinite(node.generation) ? node.generation : 999;
    byGeneration.set(generation, [...(byGeneration.get(generation) || []), node]);
  }

  return Array.from(byGeneration.entries())
    .sort(([a], [b]) => a - b)
    .map(([generation, members]) => ({
      generation,
      title:
        generation === 999 ? c.unknownGeneration : c.generation(generation),
      members: members
        .slice()
        .sort(
          (a, b) =>
            (a.year ?? 9999) - (b.year ?? 9999) ||
            a.label.localeCompare(b.label, locale, { sensitivity: "base" })
        ),
    }));
}

export function buildTreePdfModel(
  tree: TreeData,
  locale: PdfLocale = "id",
  exportedAt = new Date()
): TreePdfModel {
  if (!tree.nodes.length) {
    throw new Error(copy(locale).empty);
  }

  const generationCount = new Set(
    tree.nodes
      .map((node) => node.generation)
      .filter((generation) => Number.isFinite(generation))
  ).size;

  return {
    treeName: tree.name,
    exportedAt,
    memberCount: tree.nodes.length,
    generationCount,
    layout: calculateHierarchicalLayout(tree.nodes),
    groups: groupNodesForPdf(tree.nodes, locale),
  };
}

function safeFilename(value: string): string {
  const slug =
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "family-tree";
  return `${slug}-poster.pdf`;
}

function formatDate(date: Date, locale: PdfLocale): string {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function initials(label: string): string {
  return (label.trim()[0] || "?").toUpperCase();
}

function fitTransform(model: TreePdfModel, pageW: number, pageH: number) {
  const marginX = 14;
  const top = 38;
  const bottom = 13;
  const areaW = pageW - marginX * 2;
  const areaH = pageH - top - bottom;
  const scale = Math.min(areaW / model.layout.width, areaH / model.layout.height);
  const drawW = model.layout.width * scale;
  const drawH = model.layout.height * scale;

  return {
    scale,
    x: marginX + (areaW - drawW) / 2,
    y: top + (areaH - drawH) / 2,
  };
}

function worldToPage(
  point: { x: number; y: number },
  transform: { x: number; y: number; scale: number }
) {
  return {
    x: transform.x + point.x * transform.scale,
    y: transform.y + point.y * transform.scale,
  };
}

async function imageToDataUrl(url: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  return new Promise((resolve) => {
    const img = new Image();
    const timeout = window.setTimeout(() => resolve(null), 2500);
    img.crossOrigin = "anonymous";
    img.onload = () => {
      window.clearTimeout(timeout);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      window.clearTimeout(timeout);
      resolve(null);
    };
    img.src = url;
  });
}

async function loadProfileImages(nodes: FamilyNode[]) {
  const entries = nodes
    .filter((node) => node.imageUrl)
    .slice(0, MAX_IMAGES)
    .map(async (node) => {
      const url = resolveDisplayMediaUrl(node.imageUrl!);
      return [node.id, await imageToDataUrl(url)] as const;
    });
  const loaded = await Promise.all(entries);
  return new Map(loaded.filter((entry): entry is readonly [string, string] => Boolean(entry[1])));
}

function drawHeader(doc: jsPDF, model: TreePdfModel, locale: PdfLocale) {
  const c = copy(locale);
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(CREAM);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F");
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.35);
  doc.rect(7, 7, pageW - 14, doc.internal.pageSize.getHeight() - 14);

  doc.setFont("times", "normal");
  doc.setFontSize(24);
  doc.setTextColor(INK);
  doc.text(model.treeName, 14, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(BRAND);
  doc.text(c.titleSuffix.toUpperCase(), 14, 27);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(MUTED);
  doc.setFontSize(8);
  doc.text(`${c.exported}: ${formatDate(model.exportedAt, locale)}`, pageW - 14, 18, {
    align: "right",
  });
  doc.text(
    `${model.memberCount} ${c.members}  |  ${model.generationCount} ${c.generations}`,
    pageW - 14,
    24,
    { align: "right" }
  );
}

function drawPoster(
  doc: jsPDF,
  model: TreePdfModel,
  locale: PdfLocale,
  images: Map<string, string>
) {
  const transform = fitTransform(
    model,
    doc.internal.pageSize.getWidth(),
    doc.internal.pageSize.getHeight()
  );

  drawHeader(doc, model, locale);

  doc.setDrawColor("#bda87c");
  doc.setLineWidth(Math.max(0.15, 0.65 * transform.scale));
  for (const edge of model.layout.edges) {
    if (edge.path.length < 2) continue;
    const start = worldToPage(edge.path[0], transform);
    for (let index = 1; index < edge.path.length; index++) {
      const end = worldToPage(edge.path[index], transform);
      doc.line(start.x, start.y, end.x, end.y);
      start.x = end.x;
      start.y = end.y;
    }
  }

  for (const node of model.layout.nodes) {
    const point = worldToPage({ x: node.x || 0, y: node.y || 0 }, transform);
    const w = Math.max(16, NODE_W * Math.min(1, transform.scale * 1.8));
    const h = Math.max(9, NODE_H * Math.min(1, transform.scale * 1.8));
    const x = point.x - w / 2;
    const y = point.y - h / 2;

    doc.setFillColor(PAPER);
    doc.setDrawColor(node.line === "self" ? BRAND : "#d7c8a8");
    doc.roundedRect(x, y, w, h, 2.2, 2.2, "FD");

    const avatar = Math.min(h - 4, 8);
    const avatarX = x + 3 + avatar / 2;
    const avatarY = y + h / 2;
    const image = images.get(node.id);
    if (image) {
      doc.addImage(image, "JPEG", avatarX - avatar / 2, avatarY - avatar / 2, avatar, avatar);
    } else {
      doc.setFillColor("#eee2cc");
      doc.circle(avatarX, avatarY, avatar / 2, "F");
      doc.setTextColor(BRAND);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.text(initials(node.label), avatarX, avatarY + 1.8, { align: "center" });
    }

    const textX = x + avatar + 5;
    const maxTextW = w - avatar - 7;
    doc.setTextColor(INK);
    doc.setFont("times", "bold");
    doc.setFontSize(6);
    doc.text(doc.splitTextToSize(node.label, maxTextW).slice(0, 2), textX, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.5);
    doc.setTextColor(MUTED);
    doc.text(formatLifespan(node, locale), textX, y + h - 3);
  }
}

function drawDirectory(doc: jsPDF, model: TreePdfModel, locale: PdfLocale) {
  const c = copy(locale);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = 16;
  const right = pageW - 16;
  let y = 18;

  const addPage = () => {
    doc.addPage("a4", "portrait");
    doc.setFillColor(PAPER);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setTextColor(BRAND);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(model.treeName.toUpperCase(), left, 12);
    y = 24;
  };

  addPage();
  doc.setFont("times", "normal");
  doc.setTextColor(INK);
  doc.setFontSize(20);
  doc.text(c.directory, left, y);
  y += 12;

  for (const group of model.groups) {
    if (y > pageH - 26) addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(BRAND);
    doc.text(group.title.toUpperCase(), left, y);
    y += 6;

    for (const node of group.members) {
      if (y > pageH - 20) addPage();
      doc.setDrawColor("#eadfc8");
      doc.line(left, y + 3, right, y + 3);
      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.setTextColor(INK);
      doc.text(node.label, left, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(MUTED);
      doc.text(formatLifespan(node, locale), right, y, { align: "right" });

      const badges = [
        node.imageUrl ? c.photo : "",
        node.content?.description ? c.story : "",
      ].filter(Boolean);
      if (badges.length) {
        doc.setFontSize(7);
        doc.setTextColor(BRAND);
        doc.text(badges.join("  |  "), left, y + 5);
      }
      y += badges.length ? 13 : 9;
    }
    y += 4;
  }
}

export async function downloadTreePdf(
  tree: TreeData,
  locale: PdfLocale = "id"
): Promise<void> {
  const model = buildTreePdfModel(tree, locale);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const images = await loadProfileImages(model.layout.nodes);

  drawPoster(doc, model, locale, images);
  drawDirectory(doc, model, locale);
  doc.save(safeFilename(tree.name));
}
