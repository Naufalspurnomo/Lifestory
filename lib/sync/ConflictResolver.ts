import type {
  AutoMergeResult,
  ConflictInfo,
  ConflictResolution,
  FamilyNode,
  ManualMergeResult,
  WALEntry,
} from "./types";

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

function stableValue(value: unknown): string {
  return JSON.stringify(value ?? null);
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
    const serverById = new Map(serverState.map((node) => [node.id, node]));
    const localNodeIds = new Set(localMutations.map((entry) => entry.nodeId));
    const changedServerIds = new Set(serverChangedNodeIds ?? serverById.keys());

    if ([...localNodeIds].every((nodeId) => !changedServerIds.has(nodeId))) {
      return {
        type: "auto-merged",
        mergedNodes: this.mergeDisjoint(localMutations, serverState),
        newVersion: serverVersion,
      };
    }

    const conflicts: ConflictInfo[] = [];
    const nonConflictingMerge = this.mergeDisjoint(
      localMutations.filter((entry) => !changedServerIds.has(entry.nodeId)),
      serverState
    );

    for (const entry of localMutations) {
      if (!entry.payload) continue;
      const serverNode = serverById.get(entry.nodeId);
      if (!serverNode) continue;
      conflicts.push(
        ...diffNodeFields(
          entry.payload,
          serverNode,
          entry.timestamp,
          Date.now()
        )
      );
    }

    if (conflicts.length === 0) {
      return {
        type: "auto-merged",
        mergedNodes: this.mergeDisjoint(localMutations, serverState),
        newVersion: serverVersion,
      };
    }

    return { type: "manual-required", conflicts, nonConflictingMerge };
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
    const localNodeIds = new Set(localMutations.map((entry) => entry.nodeId));
    const changedServerIds = new Set(
      serverChangedNodeIds ?? serverState.map((node) => node.id)
    );
    return [...localNodeIds].every((nodeId) => !changedServerIds.has(nodeId));
  }

  private mergeDisjoint(
    localMutations: WALEntry[],
    serverState: FamilyNode[]
  ): FamilyNode[] {
    const byId = new Map(serverState.map((node) => [node.id, node]));
    for (const mutation of localMutations) {
      if (mutation.type === "delete") {
        byId.delete(mutation.nodeId);
      } else if (mutation.payload) {
        byId.set(mutation.nodeId, mutation.payload);
      }
    }
    return Array.from(byId.values());
  }
}
