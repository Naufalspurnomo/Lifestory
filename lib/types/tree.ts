// Lifestory Family Tree Types
// Based on Blueprint Architecture v2

export type MediaItem = {
  type: "image" | "video";
  url: string;
  caption?: string;
  storageKey?: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAt?: string;
};

export type MediaPurpose = "profile" | "gallery";

export type WorkItem = {
  type: "book" | "music" | "film" | "art" | "other";
  title: string;
  year?: number;
  description?: string;
};

export type NodeContent = {
  description: string;
  media: MediaItem[];
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
};

export type RelationConfidence = "confirmed" | "estimated" | "unknown" | "disputed";

export type EvidenceSource =
  | "family_story"
  | "document"
  | "photo"
  | "user_input"
  | "import"
  | "unknown";

export type FamilyEvidence = {
  id: string;
  source: EvidenceSource;
  confidence?: RelationConfidence;
  title?: string;
  note?: string;
  url?: string;
  createdAt?: string;
};

export type FamilyUnionStatus =
  | "married"
  | "divorced"
  | "unknown"
  | "informal"
  | "single_parent"
  | "adoptive_unit";

export type ParentChildRelationType =
  | "biological"
  | "adoptive"
  | "step"
  | "foster"
  | "guardian"
  | "unknown";

export type FamilyUnion = {
  id: string;
  partnerIds: string[];
  status: FamilyUnionStatus;
  startYear?: number | null;
  endYear?: number | null;
  evidenceIds?: string[];
};

export type ParentChildLink = {
  id: string;
  parentUnitId: string;
  childId: string;
  relationType: ParentChildRelationType;
  confidence?: RelationConfidence;
  evidenceIds?: string[];
};

export type FamilyGraph = {
  schemaVersion: 1;
  persons: FamilyNode[];
  unions: FamilyUnion[];
  parentChildLinks: ParentChildLink[];
  evidence: FamilyEvidence[];
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
  sex?: "M" | "F" | "X"; // Optional gender marker for relationship labeling
  year: number | null; // Birth year
  deathYear: number | null; // Death year (null = alive)
  parentId: string | null; // Primary Parent node ID (legacy)
  parentIds?: string[]; // Biological parent IDs (supports remarriage/multi-parent)
  adoptiveParentIds?: string[]; // Adoptive/guardian parents (not used for generation calc)
  partners: string[]; // Partner IDs
  childrenIds: string[]; // Children IDs
  generation: number; // Depth level
  line?: "paternal" | "maternal" | "union" | "descendant" | "self" | "default";
  imageUrl: string | null;
  imageStorageKey?: string | null;
  imageMimeType?: string | null;
  imageSizeBytes?: number | null;
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
  version?: number;
  nodes: FamilyNode[];
  graph?: FamilyGraph;
  createdAt: string;
  updatedAt: string;
};

// Layout Types
export type Point = { x: number; y: number };

export type LayoutEdge = {
  id: string;
  source: string;
  target: string;
  type: "spouse" | "parent-union" | "union-child" | "adoption";
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
  NODE_SIZE: 100,
  NODE_SPACING_X: 160, // Horizontal gap between nodes
  NODE_SPACING_Y: 200, // Vertical gap between generations
  PARTNER_GAP: 120, // Gap between partners
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
