import { jsPDF } from "jspdf";
import { resolveDisplayMediaUrl } from "../media/public-url";
import { calculateHierarchicalLayout } from "../tree/layoutEngine";
import type { FamilyNode, LayoutGraph, TreeData } from "../types/tree";

export type PdfLocale = "id" | "en";
export type TreePdfPageKind = "cover" | "overview" | "generation" | "directory";
export type TreePdfPageFormat = "a3" | "a4";
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
        overview: "Ringkasan Pohon Keluarga",
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
        overview: "Family Tree Overview",
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
  locale: PdfLocale
): TreePdfPage[] {
  const pages: TreePdfPage[] = [
    { kind: "cover", format: "a4", orientation: "portrait", logoPath: LOGO_PATH },
    {
      kind: "overview",
      format: "a3",
      orientation: "landscape",
      logoPath: LOGO_PATH,
      minNodeWidth: OVERVIEW_NODE.minWidth,
      minNodeHeight: OVERVIEW_NODE.minHeight,
      minFontSize: OVERVIEW_NODE.minFont,
      suppressEmptyMetadata: true,
    },
  ];

  for (const branch of branchGroups) {
    for (const members of chunk(branch.members, GENERATION_PAGE_SIZE)) {
      pages.push({
        kind: "generation",
        format: "a3",
        orientation: "landscape",
        branchId: branch.id,
        title: branch.title,
        memberIds: members.map((member) => member.id),
        minCardWidth: GENERATION_CARD.width,
        minFontSize: GENERATION_CARD.minFont,
      });
    }
  }

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

  const generations = groupNodesForPdf(tree.nodes, locale);
  const memberCards = buildMemberCards(tree.nodes, locale);
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
    root: findRoot(tree.nodes),
    memberCount: stats.members,
    generationCount: stats.generations,
    stats,
    layout: calculateHierarchicalLayout(tree.nodes),
    generations,
    branchGroups,
    memberCards,
    pages: planPages(branchGroups, memberCards, locale),
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

function buildOverviewSlots(model: TreePdfDocumentModel, pageW: number, pageH: number) {
  const top = 58;
  const bottom = pageH - 42;
  const left = 28;
  const right = pageW - 28;
  const rows = model.generations;
  const rowGap = rows.length > 1 ? (bottom - top) / (rows.length - 1) : 0;
  const slots = new Map<string, OverviewSlot>();

  rows.forEach((group, rowIndex) => {
    const members = group.members;
    const gap = 8;
    const cardW = Math.max(
      OVERVIEW_NODE.minWidth,
      Math.min(OVERVIEW_NODE.width, (right - left - gap * Math.max(0, members.length - 1)) / Math.max(1, members.length))
    );
    const usedW = members.length * cardW + Math.max(0, members.length - 1) * gap;
    const startX = left + Math.max(0, (right - left - usedW) / 2);
    const y = top + rowIndex * rowGap;

    members.forEach((node, index) => {
      slots.set(node.id, {
        node,
        x: startX + index * (cardW + gap) + cardW / 2,
        y,
        width: cardW,
        height: OVERVIEW_NODE.height,
      });
    });
  });

  return slots;
}

function drawOverviewConnectors(doc: jsPDF, slots: Map<string, OverviewSlot>) {
  doc.setDrawColor("#b8a171");
  doc.setLineWidth(0.34);
  doc.setLineCap("round");
  const partnerLaneByRow = new Map<number, number>();

  for (const slot of slots.values()) {
    const parentIds = slot.node.parentIds?.length ? slot.node.parentIds : slot.node.parentId ? [slot.node.parentId] : [];
    const parents = parentIds
      .map((parentId) => slots.get(parentId))
      .filter((parent): parent is OverviewSlot => Boolean(parent));
    if (parents.length === 0) continue;

    if (parents.length === 1) {
      const parent = parents[0];
      const midY = parent.y + (slot.y - parent.y) * 0.52;
      doc.line(parent.x, parent.y + parent.height / 2, parent.x, midY);
      doc.line(parent.x, midY, slot.x, midY);
      doc.line(slot.x, midY, slot.x, slot.y - slot.height / 2);
      continue;
    }

    const junctionY = Math.min(...parents.map((parent) => parent.y)) +
      (slot.y - Math.min(...parents.map((parent) => parent.y))) * 0.58;
    const left = Math.min(...parents.map((parent) => parent.x));
    const right = Math.max(...parents.map((parent) => parent.x));
    parents.forEach((parent) => {
      doc.line(parent.x, parent.y + parent.height / 2, parent.x, junctionY);
    });
    doc.line(left, junctionY, right, junctionY);
    doc.line(slot.x, junctionY, slot.x, slot.y - slot.height / 2);
  }

  const seenPartners = new Set<string>();
  for (const slot of slots.values()) {
    for (const partnerId of slot.node.partners || []) {
      const partner = slots.get(partnerId);
      if (!partner || partner.y !== slot.y) continue;
      const key = [slot.node.id, partner.node.id].sort().join("::");
      if (seenPartners.has(key)) continue;
      seenPartners.add(key);
      const leftSlot = slot.x <= partner.x ? slot : partner;
      const rightSlot = slot.x <= partner.x ? partner : slot;
      const left = leftSlot.x;
      const right = rightSlot.x;
      doc.setDrawColor("#9c8052");
      doc.setLineWidth(0.5);
      const blockers = Array.from(slots.values()).some(
        (candidate) =>
          candidate.y === slot.y &&
          candidate.node.id !== leftSlot.node.id &&
          candidate.node.id !== rightSlot.node.id &&
          candidate.x > left &&
          candidate.x < right
      );
      if (!blockers) {
        doc.line(left + leftSlot.width / 2, slot.y, right - rightSlot.width / 2, slot.y);
        continue;
      }

      const row = Math.round(slot.y);
      const lane = partnerLaneByRow.get(row) || 0;
      partnerLaneByRow.set(row, lane + 1);
      const laneY = slot.y + Math.max(slot.height, partner.height) / 2 + 5 + lane * 5;
      doc.line(
        left + leftSlot.width / 2,
        leftSlot.y + leftSlot.height / 2,
        left + leftSlot.width / 2,
        laneY
      );
      doc.line(left + leftSlot.width / 2, laneY, right - rightSlot.width / 2, laneY);
      doc.line(
        right - rightSlot.width / 2,
        laneY,
        right - rightSlot.width / 2,
        rightSlot.y + rightSlot.height / 2
      );
    }
  }
}

function drawOverviewRowLabels(
  doc: jsPDF,
  model: TreePdfDocumentModel,
  slots: Map<string, OverviewSlot>,
  locale: PdfLocale
) {
  const c = copy(locale);
  model.generations.forEach((group) => {
    const first = group.members[0];
    const slot = first ? slots.get(first.id) : undefined;
    if (!slot) return;
    doc.setDrawColor("#eadfc8");
    doc.setLineWidth(0.2);
    doc.line(27, slot.y + OVERVIEW_NODE.height / 2 + 8, doc.internal.pageSize.getWidth() - 27, slot.y + OVERVIEW_NODE.height / 2 + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(MUTED);
    doc.text(group.generation === 999 ? c.unknownGeneration : group.title, 18, slot.y + 2, {
      angle: 90,
      align: "center",
    });
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
  doc.roundedRect(x, y, slot.width, slot.height, 2.5, 2.5, "FD");
  if (isRoot) {
    doc.setFillColor(BRAND);
    doc.rect(x, y, 2.4, slot.height, "F");
  }

  doc.setTextColor(INK);
  doc.setFont("times", "bold");
  doc.setFontSize(OVERVIEW_NODE.minFont);
  doc.text(doc.splitTextToSize(slot.node.label, slot.width - 8).slice(0, 2), x + 5, y + 7);

  const lifespan = formatTreeLifespan(slot.node);
  if (lifespan) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.4);
    doc.setTextColor(MUTED);
    doc.text(lifespan, x + 5, y + slot.height - 3.2);
  }

  if (statusCount > 0) {
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
  const slots = buildOverviewSlots(
    model,
    doc.internal.pageSize.getWidth(),
    doc.internal.pageSize.getHeight()
  );
  drawOverviewRowLabels(doc, model, slots, locale);
  drawOverviewConnectors(doc, slots);
  for (const slot of slots.values()) {
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
  const startY = 62;

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

export async function downloadTreePdf(
  tree: TreeData,
  locale: PdfLocale = "id"
): Promise<void> {
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
  doc.save(safeFilename(tree.name));
}
