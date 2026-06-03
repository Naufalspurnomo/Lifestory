import type {
  AutoMergeResult,
  ConflictInfo,
  ConflictResolution,
  FamilyNode,
  ManualMergeResult,
  WALEntry,
} from "./types";
import { applyNodeMutation, deleteNodeFromGraph } from "./applyMutations";

const CONFLICT_FIELDS: Array<keyof FamilyNode> = [
  "label",
  "sex",
  "year",
  "deathYear",
  "parentId",
  "parentIds",
  "adoptiveParentIds",
  "partners",
  "childrenIds",
  "generation",
  "line",
  "imageUrl",
  "content",
  "works",
];
const SET_MERGE_FIELDS = new Set<keyof FamilyNode>([
  "parentIds",
  "adoptiveParentIds",
  "partners",
  "childrenIds",
]);

function stableValue(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function mergeStringSet(
  baseValue: unknown,
  localValue: unknown,
  serverValue: unknown
): string[] | null {
  if (
    !Array.isArray(baseValue) ||
    !Array.isArray(localValue) ||
    !Array.isArray(serverValue)
  ) {
    return null;
  }

  const base = new Set(baseValue as string[]);
  const local = new Set(localValue as string[]);
  const server = new Set(serverValue as string[]);
  const removed = new Set(
    [...base].filter((value) => !local.has(value) || !server.has(value))
  );
  const merged = (serverValue as string[]).filter(
    (value) => !removed.has(value)
  );

  for (const value of localValue as string[]) {
    if (!removed.has(value) && !merged.includes(value)) merged.push(value);
  }
  return merged;
}

function mergeConcurrentNode(
  entry: WALEntry,
  serverNode: FamilyNode
): { node: FamilyNode; conflicts: ConflictInfo[] } {
  const localNode = entry.payload;
  const baseNode = entry.previousPayload;
  if (!localNode || !baseNode) {
    return {
      node: serverNode,
      conflicts: localNode
        ? diffNodeFields(localNode, serverNode, entry.timestamp)
        : [],
    };
  }

  const node = { ...serverNode };
  const conflicts: ConflictInfo[] = [];
  for (const field of CONFLICT_FIELDS) {
    const baseValue = baseNode[field];
    const localValue = localNode[field];
    const serverValue = serverNode[field];
    const localChanged = stableValue(localValue) !== stableValue(baseValue);
    const serverChanged = stableValue(serverValue) !== stableValue(baseValue);
    if (!localChanged) continue;

    if (!serverChanged || stableValue(localValue) === stableValue(serverValue)) {
      (node as unknown as Record<string, unknown>)[field] = localValue;
      continue;
    }

    if (SET_MERGE_FIELDS.has(field)) {
      const merged = mergeStringSet(baseValue, localValue, serverValue);
      if (merged) {
        (node as unknown as Record<string, unknown>)[field] = merged;
        continue;
      }
    }

    conflicts.push({
      nodeId: entry.nodeId,
      field,
      localValue,
      serverValue,
      localTimestamp: entry.timestamp,
      serverTimestamp: Date.now(),
    });
  }
  return { node, conflicts };
}

export function diffNodeFields(
  localNode: FamilyNode,
  serverNode: FamilyNode,
  localTimestamp = Date.now(),
  serverTimestamp = Date.now()
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  for (const field of CONFLICT_FIELDS) {
    const localValue = localNode[field];
    const serverValue = serverNode[field];
    if (stableValue(localValue) !== stableValue(serverValue)) {
      conflicts.push({
        nodeId: localNode.id,
        field,
        localValue,
        serverValue,
        localTimestamp,
        serverTimestamp,
      });
    }
  }
  return conflicts;
}

export class ConflictResolver {
  detect(
    localMutations: WALEntry[],
    serverState: FamilyNode[],
    serverVersion: number,
    serverChangedNodeIds?: string[]
  ): AutoMergeResult | ManualMergeResult {
    const byId = new Map(serverState.map((node) => [node.id, node]));
    const changedServerIds = new Set(serverChangedNodeIds ?? byId.keys());
    const conflicts: ConflictInfo[] = [];

    for (const entry of [...localMutations].sort((a, b) => a.seqNo - b.seqNo)) {
      if (!changedServerIds.has(entry.nodeId)) {
        applyNodeMutation(byId, entry);
        continue;
      }

      const serverNode = byId.get(entry.nodeId);
      if (entry.type === "delete") {
        if (!serverNode) continue;
        if (
          entry.previousPayload &&
          stableValue(entry.previousPayload) === stableValue(serverNode)
        ) {
          deleteNodeFromGraph(byId, entry.nodeId);
        } else {
          conflicts.push({
            nodeId: entry.nodeId,
            field: "__node__",
            localValue: null,
            serverValue: serverNode,
            localTimestamp: entry.timestamp,
            serverTimestamp: Date.now(),
          });
        }
        continue;
      }

      if (!entry.payload) continue;
      if (!serverNode) {
        conflicts.push({
          nodeId: entry.nodeId,
          field: "__node__",
          localValue: entry.payload,
          serverValue: null,
          localTimestamp: entry.timestamp,
          serverTimestamp: Date.now(),
        });
        continue;
      }

      const merged = mergeConcurrentNode(entry, serverNode);
      byId.set(entry.nodeId, merged.node);
      conflicts.push(...merged.conflicts);
    }

    const mergedNodes = Array.from(byId.values());
    return conflicts.length === 0
      ? { type: "auto-merged", mergedNodes, newVersion: serverVersion }
      : {
          type: "manual-required",
          conflicts,
          nonConflictingMerge: mergedNodes,
        };
  }

  resolve(
    conflicts: ConflictInfo[],
    resolutions: ConflictResolution[],
    baseNodes: FamilyNode[] = []
  ): FamilyNode[] {
    const byId = new Map(baseNodes.map((node) => [node.id, { ...node }]));
    const resolutionKey = (nodeId: string, field: string) => `${nodeId}:${field}`;
    const choices = new Map(
      resolutions.map((resolution) => [
        resolutionKey(resolution.nodeId, resolution.field),
        resolution,
      ])
    );

    for (const conflict of conflicts) {
      const choice = choices.get(resolutionKey(conflict.nodeId, conflict.field));
      if (!choice) continue;
      if (conflict.field === "__node__") {
        if (choice.chosenValue === null) {
          deleteNodeFromGraph(byId, conflict.nodeId);
        } else {
          byId.set(conflict.nodeId, choice.chosenValue as FamilyNode);
        }
        continue;
      }
      const current = byId.get(conflict.nodeId) ?? ({ id: conflict.nodeId } as FamilyNode);
      byId.set(conflict.nodeId, {
        ...current,
        [conflict.field]: choice.chosenValue,
      } as FamilyNode);
    }

    return Array.from(byId.values());
  }

  canAutoMerge(
    localMutations: WALEntry[],
    serverState: FamilyNode[],
    serverChangedNodeIds?: string[]
  ): boolean {
    return (
      this.detect(localMutations, serverState, 1, serverChangedNodeIds).type ===
      "auto-merged"
    );
  }
}
