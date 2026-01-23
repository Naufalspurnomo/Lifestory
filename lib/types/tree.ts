// Lifestory Family Tree Types
// Based on Blueprint Architecture v2

export type MediaItem = {
  type: "image" | "video";
  url: string;
  caption?: string;
};

export type WorkItem = {
  type: "book" | "music" | "film" | "art" | "other";
  title: string;
  year?: number;
  description?: string;
};

export type NodeContent = {
  description: string;
  media: MediaItem[];
};

// Core Entity: Person (Internal Graph)
export type Person = {
  id: string;
  label: string;
  sex?: "M" | "F" | "X";
  birthDate?: string;
  deathDate?: string;
  imageUrl?: string;
  isPlaceholder?: boolean;
};

// Core Entity: Union (Internal Graph)
export type Union = {
  id: string;
  partnerIds: string[]; // typically 2
  childrenIds: string[];
  type?: "marriage" | "partnership" | "relationship";
  isPlaceholder?: boolean;
  // Computed for layout
  layer?: number;
  x?: number;
  y?: number;
};

// This is the persistent storage format
export type FamilyNode = {
  id: string; // Unique Timestamp ID
  label: string; // Display name
  year: number | null; // Birth year
  deathYear: number | null; // Death year (null = alive)
  parentId: string | null; // Primary Parent node ID (legacy)
  parentIds?: string[]; // All Parent IDs (supports remarriage/adoption)
  partners: string[]; // Partner IDs
  childrenIds: string[]; // Children IDs
  generation: number; // Depth level
  line?: "paternal" | "maternal" | "union" | "descendant" | "self" | "default";
  imageUrl: string | null; // Base64 WebP (< 50kb)
  content: NodeContent;
  works?: WorkItem[]; // Member's works/creations

  // Computed at runtime by layout engine
  x?: number;
  y?: number;
};

export type TreeData = {
  id: string;
  name: string;
  ownerId: string;
  nodes: FamilyNode[];
  createdAt: string;
  updatedAt: string;
};

// Layout Types
export type Point = { x: number; y: number };

export type LayoutEdge = {
  id: string;
  source: string;
  target: string;
  type: "spouse" | "parent-union" | "union-child";
  path: Point[]; // Orthogonal path points
};

export type LayoutGraph = {
  nodes: FamilyNode[];
  // parallel array of union nodes for debugging or rendering unions specifically if needed
  unions?: Union[];
  edges: LayoutEdge[];
  width: number;
  height: number;
};

// Undo/Redo State
export type TreeHistory = {
  past: FamilyNode[][];
  present: FamilyNode[];
  future: FamilyNode[][];
};

// Layout constants
export const LAYOUT = {
  NODE_SIZE: 80,
  NODE_SPACING_X: 120, // Horizontal gap between nodes
  NODE_SPACING_Y: 150, // Vertical gap between generations
  PARTNER_GAP: 100, // Gap between partners
  CANVAS_PADDING: 100,
} as const;

// Selection state for touch-friendly UI
export type SelectionState = {
  selectedId: string | null;
  hoveredId: string | null;
  showQuickAdd: boolean;
};

// Storage quota info
export type StorageInfo = {
  used: number;
  total: number;
  percentage: number;
  warning: boolean; // true if > 80%
};
