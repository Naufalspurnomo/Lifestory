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

export type FamilyNode = {
  id: string; // Unique Timestamp ID
  label: string; // Display name
  year: number | null; // Birth year
  deathYear: number | null; // Death year (null = alive)
  parentId: string | null; // Parent node ID
  partners: string[]; // Partner IDs (supports remarriage)
  childrenIds: string[]; // Children IDs
  parentIds?: string[]; // Parent IDs (supports remarriage)
  generation: number; // Depth level (for Y position)
  line?: "paternal" | "maternal" | "union" | "descendant" | "self" | "default";
  imageUrl: string | null; // Base64 WebP (< 50kb)
  content: NodeContent;
  works?: WorkItem[]; // Member's works/creations
  // Computed at runtime
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

// Undo/Redo State
export type TreeHistory = {
  past: FamilyNode[][];
  present: FamilyNode[];
  future: FamilyNode[][];
};

// Layout constants
export const LAYOUT = {
  NODE_SIZE: 80,
  NODE_SPACING_X: 120,
  NODE_SPACING_Y: 150,
  PARTNER_GAP: 100,
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
