import { jsPDF } from "jspdf";
import { resolveDisplayMediaUrl } from "../media/public-url";
import { calculateHierarchicalLayout } from "../tree/layoutEngine";
import type { FamilyNode, LayoutGraph, TreeData } from "../types/tree";

export type PdfLocale = "id" | "en";
export type TreePdfPageKind = "cover" | "overview" | "generation" | "directory";
export type TreePdfPageFormat = "a0" | "a1" | "a2" | "a3" | "a4";
export type TreePdfPageOrientation = "landscape" | "portrait";

type PdfMemberGroup = {
  generation: number;
  title: string;
  members: FamilyNode[];
};

export type TreePdfMemberCard = {
  id: string;
  name: string;
  generation: number;
  lifespan: string;
  treeLifespan: string;
  description: string;
  hasPhoto: boolean;
  hasStory: boolean;
  hasMedia: boolean;
  source: FamilyNode;
};

type TreePdfBranchGroup = {
  id: string;
  title: string;
  generation: number;
  members: TreePdfMemberCard[];
};

type TreePdfBasePage = {
  kind: TreePdfPageKind;
  format: TreePdfPageFormat;
  orientation: TreePdfPageOrientation;
};

type TreePdfCoverPage = TreePdfBasePage & { kind: "cover"; logoPath: string };
type TreePdfOverviewPage = TreePdfBasePage & {
  kind: "overview";
  logoPath: string;
  minNodeWidth: number;
  minNodeHeight: number;
  minFontSize: number;
  suppressEmptyMetadata: true;
};
type TreePdfGenerationPage = TreePdfBasePage & {
  kind: "generation";
  branchId: string;
  title: string;
  memberIds: string[];
  minCardWidth: number;
  minFontSize: number;
};
type TreePdfDirectoryPage = TreePdfBasePage & {
  kind: "directory";
  title: string;
  memberIds: string[];
};

export type TreePdfPage =
  | TreePdfCoverPage
  | TreePdfOverviewPage
  | TreePdfGenerationPage
  | TreePdfDirectoryPage;

export type TreePdfDocumentModel = {
  treeName: string;
  exportedAt: Date;
  locale: PdfLocale;
  root: FamilyNode;
  memberCount: number;
  generationCount: number;
  stats: {
    members: number;
    generations: number;
    photos: number;
    stories: number;
    media: number;
  };
  layout: LayoutGraph;
  generations: PdfMemberGroup[];
  branchGroups: TreePdfBranchGroup[];
  memberCards: TreePdfMemberCard[];
  pages: TreePdfPage[];
  logoPath: string;
};

export type TreePdfModel = TreePdfDocumentModel;

const BRAND = "#82693c";
const BRAND_DARK = "#604b2d";
const INK = "#33281f";
const MUTED = "#766a5f";
const CREAM = "#f8f2e7";
const PAPER = "#fffdf8";
const LINE = "#c7b488";
const LOGO_PATH = "/logo/lifestory-logo.png";
const MAX_IMAGES = 48;
const A4 = { width: 210, margin: 16 };
const OVERVIEW_NODE = { width: 56, height: 21, minWidth: 42, minHeight: 18, minFont: 7.8 };
const GENERATION_CARD = { width: 80, height: 44, minFont: 9.1 };
const GENERATION_PAGE_SIZE = 12;
const DIRECTORY_PAGE_SIZE = 12;
const OVERVIEW_PAGE_SIZES = {
  a2: { width: 594, height: 420 },
  a1: { width: 841, height: 594 },
  a0: { width: 1189, height: 841 },
} as const;
const OVERVIEW_MIN_SCALE = 0.34;
const LAYOUT_CARD = { width: 154, height: 142 };

function copy(locale: PdfLocale) {
  return locale === "id"
    ? {
        titleSuffix: "Pohon Keluarga",
        exported: "Diekspor",
        members: "Anggota",
        generations: "Generasi",
        photos: "Foto",
        stories: "Cerita",
        media: "Media",
        overview: "Peta Hubungan Keluarga",
        directory: "Daftar Anggota Keluarga",
        generation: (n: number) => `Generasi ${n}`,
        unknownGeneration: "Generasi tidak diketahui",
        noYear: "Tahun belum dicatat",
        story: "Cerita tersimpan",
        photo: "Foto profil",
        gallery: "Media keluarga",
        archiveNote: "Peta hubungan, nama, dan cerita yang disimpan bersama.",
        archiveCenter: "Pusat arsip keluarga",
        noDescription: "Belum ada ringkasan cerita.",
        empty: "Belum ada data keluarga untuk diekspor.",
      }
    : {
        titleSuffix: "Family Tree",
        exported: "Exported",
        members: "Members",
        generations: "Generations",
        photos: "Photos",
        stories: "Stories",
        media: "Media",
        overview: "Family Relationship Map",
        directory: "Family Member Directory",
        generation: (n: number) => `Generation ${n}`,
        unknownGeneration: "Unknown generation",
        noYear: "Year not recorded",
        story: "Story saved",
        photo: "Profile photo",
        gallery: "Family media",
        archiveNote: "A considered record of the people, relationships, and stories kept together.",
        archiveCenter: "Family archive centre",
        noDescription: "No story summary yet.",
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

function formatTreeLifespan(node: FamilyNode): string {
  if (node.year && node.deathYear) return `${node.year} - ${node.deathYear}`;
  if (node.year) return String(node.year);
  if (node.deathYear) return `- ${node.deathYear}`;
  return "";
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
      title: generation === 999 ? c.unknownGeneration : c.generation(generation),
      members: members
        .slice()
        .sort(
          (a, b) =>
            (a.year ?? 9999) - (b.year ?? 9999) ||
            a.label.localeCompare(b.label, locale, { sensitivity: "base" })
        ),
    }));
}

function excerpt(value: string | undefined, fallback: string, maxLength = 160): string {
  const text = value?.trim();
  if (!text) return fallback;
  return text.length > maxLength ? `${text.slice(0, maxLength - 3).trim()}...` : text;
}

function findRoot(nodes: FamilyNode[]): FamilyNode {
  return (
    nodes.find((node) => node.line === "self") ||
    nodes
      .slice()
      .sort((a, b) => a.generation - b.generation || a.label.localeCompare(b.label))[0]
  );
}

function buildMemberCards(nodes: FamilyNode[], locale: PdfLocale): TreePdfMemberCard[] {
  const c = copy(locale);
  return nodes.map((node) => ({
    id: node.id,
    name: node.label,
    generation: Number.isFinite(node.generation) ? node.generation : 999,
    lifespan: formatLifespan(node, locale),
    treeLifespan: formatTreeLifespan(node),
    description: excerpt(node.content?.description, c.noDescription),
    hasPhoto: Boolean(node.imageUrl),
    hasStory: Boolean(node.content?.description?.trim()),
    hasMedia: Boolean(node.content?.media?.length),
    source: node,
  }));
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function planPages(
  branchGroups: TreePdfBranchGroup[],
  memberCards: TreePdfMemberCard[],
  locale: PdfLocale,
  layout: LayoutGraph
): TreePdfPage[] {
  const pages: TreePdfPage[] = [
    { kind: "cover", format: "a4", orientation: "portrait", logoPath: LOGO_PATH },
    {
      kind: "overview",
      format: selectOverviewPageFormat(layout),
      orientation: "landscape",
      logoPath: LOGO_PATH,
      minNodeWidth: OVERVIEW_NODE.minWidth,
      minNodeHeight: OVERVIEW_NODE.minHeight,
      minFontSize: OVERVIEW_NODE.minFont,
      suppressEmptyMetadata: true,
    },
  ];

  let pendingMembers: TreePdfMemberCard[] = [];
  let pendingBranches: TreePdfBranchGroup[] = [];
  const flushGenerationSpread = () => {
    if (!pendingMembers.length) return;
    const first = pendingBranches[0];
    const last = pendingBranches[pendingBranches.length - 1];
    if (!first || !last) return;
    pages.push({
      kind: "generation",
      format: "a3",
      orientation: "landscape",
      branchId: `${first.id}-to-${last.id}`,
      title: first.id === last.id ? first.title : `${first.title} - ${last.title}`,
      memberIds: pendingMembers.map((member) => member.id),
      minCardWidth: GENERATION_CARD.width,
      minFontSize: GENERATION_CARD.minFont,
    });
    pendingMembers = [];
    pendingBranches = [];
  };

  for (const branch of branchGroups) {
    for (const members of chunk(branch.members, GENERATION_PAGE_SIZE)) {
      if (pendingMembers.length && pendingMembers.length + members.length > GENERATION_PAGE_SIZE) {
        flushGenerationSpread();
      }
      pendingMembers.push(...members);
      pendingBranches.push(branch);
      if (pendingMembers.length === GENERATION_PAGE_SIZE) flushGenerationSpread();
    }
  }
  flushGenerationSpread();

  for (const members of chunk(memberCards, DIRECTORY_PAGE_SIZE)) {
    pages.push({
      kind: "directory",
      format: "a4",
      orientation: "portrait",
      title: copy(locale).directory,
      memberIds: members.map((member) => member.id),
    });
  }

  return pages;
}

export function buildTreePdfDocumentModel(
  tree: TreeData,
  locale: PdfLocale = "id",
  exportedAt = new Date()
): TreePdfDocumentModel {
  if (!tree.nodes.length) {
    throw new Error(copy(locale).empty);
  }

  const layout = calculateHierarchicalLayout(tree.nodes);
  const layoutNodeById = new Map(layout.nodes.map((node) => [node.id, node]));
  const positionedNodes = tree.nodes.map((node) => ({
    ...node,
    generation: layoutNodeById.get(node.id)?.generation ?? node.generation,
  }));
  const generations = groupNodesForPdf(positionedNodes, locale);
  const memberCards = buildMemberCards(positionedNodes, locale);
  const byId = new Map(memberCards.map((member) => [member.id, member]));
  const branchGroups = generations.map((group) => ({
    id: `generation-${group.generation}`,
    title: group.title,
    generation: group.generation,
    members: group.members.map((member) => byId.get(member.id)!).filter(Boolean),
  }));
  const stats = {
    members: memberCards.length,
    generations: generations.filter((group) => group.generation !== 999).length,
    photos: memberCards.filter((member) => member.hasPhoto).length,
    stories: memberCards.filter((member) => member.hasStory).length,
    media: memberCards.filter((member) => member.hasMedia).length,
  };

  return {
    treeName: tree.name,
    exportedAt,
    locale,
    root: findRoot(positionedNodes),
    memberCount: stats.members,
    generationCount: stats.generations,
    stats,
    layout,
    generations,
    branchGroups,
    memberCards,
    pages: planPages(branchGroups, memberCards, locale, layout),
    logoPath: LOGO_PATH,
  };
}

export function buildTreePdfModel(
  tree: TreeData,
  locale: PdfLocale = "id",
  exportedAt = new Date()
): TreePdfModel {
  return buildTreePdfDocumentModel(tree, locale, exportedAt);
}

function safeFilename(value: string): string {
  const slug =
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "family-tree";
  return `${slug}-lifestory-document.pdf`;
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
        resolve(canvas.toDataURL("image/jpeg", 0.84));
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

async function loadPdfAsset(path: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
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
  return new Map(
    loaded.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))
  );
}

function fillPage(doc: jsPDF, color = CREAM) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(color);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.32);
  doc.rect(8, 8, pageW - 16, pageH - 16);
  doc.setDrawColor("#eee1c9");
  doc.setLineWidth(0.12);
  doc.rect(12, 12, pageW - 24, pageH - 24);
}

function drawLogo(doc: jsPDF, logoDataUrl: string | null, x: number, y: number, w: number) {
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", x, y, w, w * 0.302);
  } else {
    doc.setFont("times", "bolditalic");
    doc.setFontSize(w / 2.8);
    doc.setTextColor(BRAND);
    doc.text("Lifestory", x, y + w * 0.25);
  }
}

function drawFooter(doc: jsPDF, model: TreePdfDocumentModel, pageIndex: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(MUTED);
  doc.text(model.treeName, 16, pageH - 10);
  doc.text(`${pageIndex + 1} / ${model.pages.length}`, pageW - 16, pageH - 10, {
    align: "right",
  });
}

function drawCoverPage(
  doc: jsPDF,
  model: TreePdfDocumentModel,
  locale: PdfLocale,
  logoDataUrl: string | null
) {
  const c = copy(locale);
  const pageW = doc.internal.pageSize.getWidth();
  fillPage(doc, CREAM);
  drawLogo(doc, logoDataUrl, 24, 24, 54);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(BRAND_DARK);
  doc.text(c.titleSuffix.toUpperCase(), 24, 65);

  doc.setFont("times", "normal");
  doc.setFontSize(32);
  doc.setTextColor(INK);
  const titleLines = doc.splitTextToSize(model.treeName, pageW - 58).slice(0, 3);
  doc.text(titleLines, 31, 93);

  doc.setDrawColor(BRAND);
  doc.setLineWidth(1.1);
  doc.line(24, 74, 24, 123);

  doc.setDrawColor(BRAND);
  doc.setLineWidth(0.4);
  doc.line(31, 132, pageW - 24, 132);

  doc.setFillColor(PAPER);
  doc.setDrawColor("#e1d3b8");
  doc.setLineWidth(0.3);
  doc.roundedRect(24, 148, pageW - 48, 49, 4, 4, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(BRAND_DARK);
  doc.text(c.archiveCenter.toUpperCase(), 34, 161);
  doc.setFont("times", "bold");
  doc.setFontSize(18);
  doc.setTextColor(INK);
  doc.text(doc.splitTextToSize(model.root.label, pageW - 96).slice(0, 2), 34, 176);
  const rootLifespan = formatTreeLifespan(model.root);
  if (rootLifespan) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED);
    doc.text(rootLifespan, pageW - 34, 161, { align: "right" });
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(MUTED);
  doc.text(doc.splitTextToSize(c.archiveNote, pageW - 68).slice(0, 2), 34, 188);

  const statY = 226;
  const stats = [
    [String(model.stats.members), c.members],
    [String(model.stats.generations), c.generations],
    [String(model.stats.photos), c.photos],
    [String(model.stats.stories), c.stories],
  ];
  stats.forEach(([value, label], index) => {
    const x = 24 + index * ((pageW - 48) / stats.length);
    if (index > 0) {
      doc.setDrawColor("#e1d3b8");
      doc.setLineWidth(0.25);
      doc.line(x - 14, statY - 20, x - 14, statY + 11);
    }
    doc.setFont("times", "bold");
    doc.setFontSize(21);
    doc.setTextColor(BRAND);
    doc.text(value, x, statY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(MUTED);
    doc.text(label.toUpperCase(), x, statY + 8);
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text(`${c.exported}: ${formatDate(model.exportedAt, locale)}`, 24, 267);
}

function drawPageHeader(
  doc: jsPDF,
  model: TreePdfDocumentModel,
  title: string,
  logoDataUrl: string | null
) {
  const pageW = doc.internal.pageSize.getWidth();
  fillPage(doc);
  drawLogo(doc, logoDataUrl, 18, 14, 40);
  doc.setFont("times", "normal");
  doc.setFontSize(21);
  doc.setTextColor(INK);
  doc.text(title, pageW / 2, 25, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(BRAND_DARK);
  doc.text(model.treeName.toUpperCase(), pageW - 18, 21, { align: "right" });
  doc.setDrawColor(BRAND);
  doc.setLineWidth(0.35);
  doc.line(18, 38, pageW - 18, 38);
}


type OverviewSlot = {
  node: FamilyNode;
  x: number;
  y: number;
  width: number;
  height: number;
};

type OverviewBounds = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

type OverviewMap = {
  slots: Map<string, OverviewSlot>;
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
  project: (x: number, y: number) => { x: number; y: number };
};

function buildOverviewBounds(layout: LayoutGraph): OverviewBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of layout.nodes) {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    minX = Math.min(minX, x - LAYOUT_CARD.width / 2);
    minY = Math.min(minY, y - LAYOUT_CARD.height / 2);
    maxX = Math.max(maxX, x + LAYOUT_CARD.width / 2);
    maxY = Math.max(maxY, y + LAYOUT_CARD.height / 2);
  }
  for (const edge of layout.edges) {
    for (const point of edge.path) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return { minX: 0, minY: 0, width: 1, height: 1 };
  }
  return { minX, minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

function overviewViewport(pageW: number, pageH: number) {
  const side = Math.max(30, Math.min(48, pageW * 0.04));
  const top = Math.max(58, Math.min(90, pageH * 0.12));
  const bottom = Math.max(34, Math.min(52, pageH * 0.07));
  return { left: side, top, width: pageW - side * 2, height: pageH - top - bottom };
}

function overviewScale(bounds: OverviewBounds, pageW: number, pageH: number) {
  const viewport = overviewViewport(pageW, pageH);
  return Math.min(viewport.width / bounds.width, viewport.height / bounds.height);
}

function selectOverviewPageFormat(layout: LayoutGraph): TreePdfPageFormat {
  const bounds = buildOverviewBounds(layout);
  const formats = Object.entries(OVERVIEW_PAGE_SIZES) as Array<
    [keyof typeof OVERVIEW_PAGE_SIZES, (typeof OVERVIEW_PAGE_SIZES)[keyof typeof OVERVIEW_PAGE_SIZES]]
  >;
  return (
    formats.find(([, size]) => overviewScale(bounds, size.width, size.height) >= OVERVIEW_MIN_SCALE)?.[0] ??
    "a0"
  );
}

function buildOverviewMap(model: TreePdfDocumentModel, pageW: number, pageH: number): OverviewMap {
  const bounds = buildOverviewBounds(model.layout);
  const viewport = overviewViewport(pageW, pageH);
  const scale = Math.min(1.15, overviewScale(bounds, pageW, pageH));
  const mapWidth = bounds.width * scale;
  const mapHeight = bounds.height * scale;
  const left = viewport.left + Math.max(0, (viewport.width - mapWidth) / 2);
  const top = viewport.top + Math.max(0, (viewport.height - mapHeight) / 2);
  const positionById = new Map(model.layout.nodes.map((node) => [node.id, node]));
  const sourceById = new Map(
    model.generations.flatMap((group) => group.members).map((node) => [node.id, node])
  );
  const slots = new Map<string, OverviewSlot>();
  const cardWidth = Math.max(24, Math.min(78, LAYOUT_CARD.width * scale * 0.82));
  const cardHeight = Math.max(15, Math.min(34, cardWidth * 0.54));
  const project = (x: number, y: number) => ({
    x: left + (x - bounds.minX) * scale,
    y: top + (y - bounds.minY) * scale,
  });

  model.layout.nodes.forEach((node, index) => {
    const source = sourceById.get(node.id) ?? node;
    const positioned = positionById.get(node.id);
    const point = project(
      positioned?.x ?? bounds.minX + index * LAYOUT_CARD.width,
      positioned?.y ?? bounds.minY + index * LAYOUT_CARD.height
    );
    slots.set(node.id, { node: source, x: point.x, y: point.y, width: cardWidth, height: cardHeight });
  });

  return { slots, left, top, width: mapWidth, height: mapHeight, scale, project };
}

function drawOverviewConnectors(doc: jsPDF, model: TreePdfDocumentModel, map: OverviewMap) {
  doc.setLineCap("round");
  for (const edge of model.layout.edges) {
    const isPartner = edge.type === "spouse";
    const isAdoption = edge.type === "adoption";
    doc.setDrawColor(isPartner ? "#9c8052" : "#b8a171");
    doc.setLineWidth(isPartner ? 0.5 : 0.3);
    doc.setLineDashPattern(isAdoption ? [1.2, 1] : [], 0);
    for (let index = 1; index < edge.path.length; index += 1) {
      const start = map.project(edge.path[index - 1].x, edge.path[index - 1].y);
      const end = map.project(edge.path[index].x, edge.path[index].y);
      doc.line(start.x, start.y, end.x, end.y);
    }
  }
  doc.setLineDashPattern([], 0);
}

function drawOverviewRowLabels(
  doc: jsPDF,
  model: TreePdfDocumentModel,
  map: OverviewMap,
  locale: PdfLocale
) {
  const c = copy(locale);
  model.generations.forEach((group) => {
    const slots = group.members
      .map((member) => map.slots.get(member.id))
      .filter((slot): slot is OverviewSlot => Boolean(slot));
    if (!slots.length) return;
    const y = slots.reduce((total, slot) => total + slot.y, 0) / slots.length;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(MUTED);
    doc.text(group.generation === 999 ? c.unknownGeneration : group.title, map.left - 8, y + 2, { align: "right" });
  });
}

function drawOverviewNode(doc: jsPDF, slot: OverviewSlot) {
  const x = slot.x - slot.width / 2;
  const y = slot.y - slot.height / 2;
  const isRoot = slot.node.line === "self";
  const statusCount = [slot.node.imageUrl, slot.node.content?.description, slot.node.content?.media?.length].filter(Boolean).length;

  doc.setFillColor(PAPER);
  doc.setDrawColor(isRoot ? BRAND : "#d0bd94");
  doc.setLineWidth(isRoot ? 0.46 : 0.24);
  doc.roundedRect(x, y, slot.width, slot.height, 1.8, 1.8, "FD");
  if (isRoot) {
    doc.setFillColor(BRAND);
    doc.rect(x, y, Math.min(2.4, slot.width * 0.07), slot.height, "F");
  }

  const showLifespan = slot.height >= 23;
  const maxNameLines = showLifespan ? 2 : 1;
  const nameLines = doc.splitTextToSize(slot.node.label, Math.max(8, slot.width - 7));
  if (nameLines.length > maxNameLines) {
    nameLines.splice(maxNameLines);
    nameLines[maxNameLines - 1] = `${String(nameLines[maxNameLines - 1]).replace(/\.{3}$/, "")}...`;
  }
  doc.setTextColor(INK);
  doc.setFont("times", "bold");
  const nameSize = Math.max(5.7, Math.min(9.4, slot.width * 0.145));
  doc.setFontSize(nameSize);
  const nameY = showLifespan ? y + nameSize + 2.7 : y + slot.height / 2 + nameSize * 0.34;
  doc.text(nameLines, x + 4.5, nameY);

  const lifespan = formatTreeLifespan(slot.node);
  if (lifespan && showLifespan) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(Math.max(5, Math.min(6.2, slot.width * 0.1)));
    doc.setTextColor(MUTED);
    doc.text(lifespan, x + 5, y + slot.height - 3.2);
  }

  if (statusCount > 0 && slot.height >= 28) {
    doc.setFillColor(BRAND);
    for (let index = 0; index < statusCount; index += 1) {
      doc.circle(x + slot.width - 5 - index * 3.2, y + 4.5, 0.8, "F");
    }
  }
}

function drawOverviewPage(
  doc: jsPDF,
  model: TreePdfDocumentModel,
  locale: PdfLocale,
  logoDataUrl: string | null
) {
  drawPageHeader(doc, model, copy(locale).overview, logoDataUrl);
  const map = buildOverviewMap(
    model,
    doc.internal.pageSize.getWidth(),
    doc.internal.pageSize.getHeight()
  );
  drawOverviewRowLabels(doc, model, map, locale);
  drawOverviewConnectors(doc, model, map);
  for (const slot of map.slots.values()) {
    drawOverviewNode(doc, slot);
  }
}

function drawGenerationCard(
  doc: jsPDF,
  member: TreePdfMemberCard,
  x: number,
  y: number,
  images: Map<string, string>,
  locale: PdfLocale
) {
  const c = copy(locale);
  const image = images.get(member.id);
  doc.setFillColor(PAPER);
  doc.setDrawColor(member.source.line === "self" ? BRAND : "#d3c199");
  doc.setLineWidth(member.source.line === "self" ? 0.55 : 0.28);
  doc.roundedRect(x, y, GENERATION_CARD.width, GENERATION_CARD.height, 4, 4, "FD");

  doc.setFillColor("#f5efe1");
  doc.roundedRect(x + 5, y + 6, 27, 32, 3, 3, "F");

  if (image) {
    doc.addImage(image, "JPEG", x + 5.5, y + 6.5, 26, 31);
  } else {
    doc.setFillColor("#efe4cf");
    doc.roundedRect(x + 5, y + 6, 27, 32, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(BRAND);
    doc.text(initials(member.name), x + 18.5, y + 24, { align: "center" });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(BRAND_DARK);
  doc.text(`GEN ${member.generation === 999 ? "?" : member.generation}`, x + 38, y + 9);

  doc.setFont("times", "bold");
  doc.setFontSize(GENERATION_CARD.minFont + 0.6);
  doc.setTextColor(INK);
  doc.text(doc.splitTextToSize(member.name, 37).slice(0, 2), x + 38, y + 18);

  if (member.treeLifespan) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(MUTED);
    doc.text(member.treeLifespan, x + 38, y + 29);
  }

  const indicators = [
    member.hasPhoto ? c.photo : "",
    member.hasStory ? c.story : "",
    member.hasMedia ? c.gallery : "",
  ].filter(Boolean);
  if (indicators.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.4);
    doc.setTextColor(BRAND_DARK);
    doc.text(indicators.slice(0, 2).join("  ·  "), x + 38, y + 38);
  }
}

function drawGenerationPage(
  doc: jsPDF,
  model: TreePdfDocumentModel,
  page: TreePdfGenerationPage,
  locale: PdfLocale,
  images: Map<string, string>,
  logoDataUrl: string | null
) {
  drawPageHeader(doc, model, page.title, logoDataUrl);
  const members = page.memberIds
    .map((id) => model.memberCards.find((member) => member.id === id))
    .filter((member): member is TreePdfMemberCard => Boolean(member));
  const columns = 3;
  const gapX = 16;
  const gapY = 14;
  const gridW = columns * GENERATION_CARD.width + (columns - 1) * gapX;
  const startX = (doc.internal.pageSize.getWidth() - gridW) / 2;
  const rows = Math.ceil(members.length / columns);
  const contentHeight = rows * GENERATION_CARD.height + Math.max(0, rows - 1) * gapY;
  const startY = Math.max(62, (doc.internal.pageSize.getHeight() - contentHeight) / 2 + 16);

  members.forEach((member, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    drawGenerationCard(
      doc,
      member,
      startX + col * (GENERATION_CARD.width + gapX),
      startY + row * (GENERATION_CARD.height + gapY),
      images,
      locale
    );
  });
}

function drawDirectoryPageBackground(doc: jsPDF, model: TreePdfDocumentModel, logoDataUrl: string | null) {
  const pageW = doc.internal.pageSize.getWidth();
  fillPage(doc, PAPER);
  drawLogo(doc, logoDataUrl, 16, 11, 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(BRAND_DARK);
  doc.text(model.treeName.toUpperCase(), pageW - 16, 17, { align: "right" });
  doc.setDrawColor("#eadfc8");
  doc.line(16, 24, pageW - 16, 24);
}

function drawDirectoryPage(
  doc: jsPDF,
  model: TreePdfDocumentModel,
  page: TreePdfDirectoryPage,
  locale: PdfLocale,
  logoDataUrl: string | null
) {
  const c = copy(locale);
  drawDirectoryPageBackground(doc, model, logoDataUrl);
  let y = 38;
  const left = A4.margin + 2;
  const right = A4.width - A4.margin - 2;

  doc.setFont("times", "normal");
  doc.setTextColor(INK);
  doc.setFontSize(19);
  doc.text(c.directory, left, y);
  y += 14;

  const members = page.memberIds
    .map((id) => model.memberCards.find((member) => member.id === id))
    .filter((member): member is TreePdfMemberCard => Boolean(member));

  for (const member of members) {
    const rowH = 16;
    doc.setFillColor("#fbf5ea");
    doc.setDrawColor("#eadfc8");
    doc.roundedRect(left, y - 5, right - left, rowH, 2, 2, "FD");
    doc.setFillColor(member.source.line === "self" ? BRAND : "#c8ac7e");
    doc.roundedRect(left, y - 5, 2.2, rowH, 1, 1, "F");
    doc.setFont("times", "bold");
    doc.setFontSize(10.8);
    doc.setTextColor(INK);
    doc.text(member.name, left + 6, y + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(MUTED);
    doc.text(member.lifespan, right - 4, y + 1, { align: "right" });
    doc.text(doc.splitTextToSize(member.description, right - left - 54).slice(0, 1), left + 6, y + 7);

    const badges = [member.hasPhoto ? c.photo : "", member.hasStory ? c.story : "", member.hasMedia ? c.gallery : ""].filter(Boolean);
    if (badges.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(BRAND_DARK);
      doc.text(badges.slice(0, 2).join("  ·  "), right - 4, y + 7, { align: "right" });
    }
    y += rowH + 4;
  }
}

function ensurePage(doc: jsPDF, page: TreePdfPage, isFirst: boolean) {
  if (isFirst) return;
  doc.addPage(page.format, page.orientation);
}

function renderPage(
  doc: jsPDF,
  model: TreePdfDocumentModel,
  page: TreePdfPage,
  pageIndex: number,
  images: Map<string, string>,
  logoDataUrl: string | null
) {
  ensurePage(doc, page, pageIndex === 0);
  if (page.kind === "cover") {
    drawCoverPage(doc, model, model.locale, logoDataUrl);
  } else if (page.kind === "overview") {
    drawOverviewPage(doc, model, model.locale, logoDataUrl);
  } else if (page.kind === "generation") {
    drawGenerationPage(doc, model, page, model.locale, images, logoDataUrl);
  } else {
    drawDirectoryPage(doc, model, page, model.locale, logoDataUrl);
  }
  drawFooter(doc, model, pageIndex);
}

export async function createTreePdfDocument(
  tree: TreeData,
  locale: PdfLocale = "id"
): Promise<jsPDF> {
  const model = buildTreePdfDocumentModel(tree, locale);
  const firstPage = model.pages[0];
  const doc = new jsPDF({
    orientation: firstPage.orientation,
    unit: "mm",
    format: firstPage.format,
  });
  const [images, logoDataUrl] = await Promise.all([
    loadProfileImages(model.layout.nodes),
    loadPdfAsset(model.logoPath),
  ]);

  model.pages.forEach((page, index) => renderPage(doc, model, page, index, images, logoDataUrl));
  return doc;
}

export async function downloadTreePdf(
  tree: TreeData,
  locale: PdfLocale = "id"
): Promise<void> {
  const doc = await createTreePdfDocument(tree, locale);
  doc.save(safeFilename(tree.name));
}
