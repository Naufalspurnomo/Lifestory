import type { FamilyGraph, FamilyNode, TreeData } from "../types/tree";

export type { FamilyNode, TreeData };

export type MutationType = "add" | "update" | "delete";

export type Mutation = {
  type: MutationType;
  nodeId: string;
  payload: FamilyNode | null;
  previousPayload?: FamilyNode | null;
  timestamp?: number;
};

export type SyncBatch = {
  batchId: string;
  treeId: string;
  clientVersion: number;
  mutations: Array<{
    seqNo: number;
    type: MutationType;
    nodeId: string;
    payload: FamilyNode | null;
    previousPayload?: FamilyNode | null;
  }>;
};

export type SyncResponse = {
  success: boolean;
  newVersion: number;
  acknowledgedSeqNos: number[];
};

export type ConflictResponse = {
  error: "version-conflict";
  currentVersion: number;
  serverState: FamilyNode[];
  conflictingNodeIds: string[];
};

export type WALStatus =
  | "pending"
  | "sending"
  | "failed"
  | "permanently-failed";

export type WALEntry = {
  id: string;
  seqNo: number;
  treeId: string;
  timestamp: number;
  type: MutationType;
  nodeId: string;
  payload: FamilyNode | null;
  previousPayload?: FamilyNode | null;
  status: WALStatus;
  retryCount: number;
  lastAttempt: number | null;
  errorMessage: string | null;
};

export type SyncStatus = "saved" | "syncing" | "pending" | "offline" | "error";

export type SyncStatusInfo = {
  status: SyncStatus;
  pendingCount: number;
  pendingDisplay: string;
  errorMessage?: string;
  warningMessage?: string;
  lastSyncedAt?: number;
};

export type SyncEngineConfig = {
  debounceMs: number;
  maxRetries: number;
  visibleErrorRetryThreshold: number;
  baseRetryDelayMs: number;
  offlineRetryDelayMs: number;
  maxRetryDelayMs: number;
  jitterMs: number;
  healthCheckIntervalMs: number;
  requestTimeoutMs: number;
  healthCheckUrl: string;
};

export type ConflictInfo = {
  nodeId: string;
  field: string;
  localValue: unknown;
  serverValue: unknown;
  localTimestamp: number;
  serverTimestamp: number;
};

export type ConflictResolution = {
  nodeId: string;
  field: string;
  chosenValue: unknown;
  source: "local" | "server";
};

export type AutoMergeResult = {
  type: "auto-merged";
  mergedNodes: FamilyNode[];
  newVersion: number;
};

export type ManualMergeResult = {
  type: "manual-required";
  conflicts: ConflictInfo[];
  nonConflictingMerge: FamilyNode[];
};

export type ValidationError = {
  type:
    | "orphan-parent-ref"
    | "orphan-child-ref"
    | "orphan-adoptive-parent-ref"
    | "unidirectional-partner"
    | "unidirectional-parent-child"
    | "circular-ancestor"
    | "duplicate-id"
    | "self-reference"
    | "sibling-partner"
    | "ancestor-partner";
  nodeId: string;
  details: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

export type ExportData = {
  version: 1;
  exportedAt: string;
  tree: {
    id: string;
    name: string;
    nodes: FamilyNode[];
    graph?: FamilyGraph;
    metadata?: Record<string, unknown>;
    mediaReferences?: string[];
  };
};

export type ImportValidation = {
  valid: boolean;
  errors: string[];
  nodeCount?: number;
  duplicateIds?: string[];
};

export type TreeDataWithVersion = TreeData & {
  version?: number;
};
