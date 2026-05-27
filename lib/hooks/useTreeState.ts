"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  TreeData,
  FamilyNode,
  TreeHistory,
  StorageInfo,
  LayoutGraph,
} from "../types/tree";
import {
  detectCycle,
  calculateGeneration,
  calculateHierarchicalLayout,
} from "../tree/layoutEngine";
import { loadTrees, saveTrees, checkStorageQuota } from "../utils/storageUtils";
import {
  createTreeApi,
  listTrees,
  loadTree,
  saveTreeNodes,
  TreeApiError,
} from "../tree/apiClient";

const MAX_HISTORY = 50;

// ---------- helpers ----------
const uniq = (a: string[]) => Array.from(new Set((a || []).filter(Boolean)));

function sharesParent(a: FamilyNode, b: FamilyNode): boolean {
  const aParents = new Set(a.parentIds || []);
  if (!aParents.size) return false;
  return (b.parentIds || []).some((pid) => aParents.has(pid));
}

function normalizeNode(n: any): FamilyNode {
  const partners = uniq(Array.isArray(n.partners) ? n.partners : []);
  const childrenIds = uniq(Array.isArray(n.childrenIds) ? n.childrenIds : []);
  const parentIdsFromField = Array.isArray(n.parentIds) ? n.parentIds : [];
  const parentIdsFromLegacy = n.parentId ? [n.parentId] : [];
  const parentIds = uniq([...parentIdsFromField, ...parentIdsFromLegacy]);
  const adoptiveParentIds = uniq(
    Array.isArray(n.adoptiveParentIds) ? n.adoptiveParentIds : []
  ).filter((id) => !parentIds.includes(id));
  const content = n && typeof n.content === "object" ? n.content : {};
  const instagram =
    typeof content.instagram === "string" ? content.instagram.trim() : "";
  const tiktok =
    typeof content.tiktok === "string" ? content.tiktok.trim() : "";
  const linkedin =
    typeof content.linkedin === "string" ? content.linkedin.trim() : "";
  const normalizedContent: FamilyNode["content"] = {
    description:
      typeof content.description === "string" ? content.description : "",
    media: Array.isArray(content.media) ? content.media : [],
    ...(instagram ? { instagram } : {}),
    ...(tiktok ? { tiktok } : {}),
    ...(linkedin ? { linkedin } : {}),
  };

  return {
    ...n,
    partners,
    childrenIds,
    parentIds,
    adoptiveParentIds,
    content: normalizedContent,
    parentId: parentIds[0] ?? null, // keep legacy in sync
  };
}

function sanitizeGraph(nodes: FamilyNode[]): FamilyNode[] {
  // normalize first
  const map = new Map<string, FamilyNode>();
  for (const n of nodes) map.set(n.id, normalizeNode(n));

  // partner sync (bidirectional)
  for (const n of map.values()) {
    for (const pid of n.partners) {
      const p = map.get(pid);
      if (!p) continue;
      if (!p.partners.includes(n.id)) p.partners = uniq([...p.partners, n.id]);
    }
  }

  // partner cleanup: siblings should not be auto-treated as partners
  for (const n of map.values()) {
    n.partners = (n.partners || []).filter((pid) => {
      const partner = map.get(pid);
      if (!partner) return false;
      return !sharesParent(n, partner);
    });
  }

  // parent<->child sync (multi-parent)
  // A) parent.childrenIds -> child.parentIds
  for (const parent of map.values()) {
    for (const cid of parent.childrenIds) {
      const child = map.get(cid);
      if (!child) continue;
      const pids = child.parentIds || [];
      if (!pids.includes(parent.id)) {
        child.parentIds = uniq([...pids, parent.id]);
      }
    }
  }

  // B) child.parentIds -> parent.childrenIds
  for (const child of map.values()) {
    for (const pid of child.parentIds || []) {
      const parent = map.get(pid);
      if (!parent) continue;
      if (!parent.childrenIds.includes(child.id)) {
        parent.childrenIds = uniq([...parent.childrenIds, child.id]);
      }
    }
  }

  // C) infer missing co-parent when one parent has a single stable partner
  for (const child of map.values()) {
    const parentIds = uniq(child.parentIds || []);
    if (parentIds.length !== 1) continue;

    const knownParent = map.get(parentIds[0]);
    if (!knownParent) continue;

    const partnerCandidates = (knownParent.partners || []).filter((pid) =>
      map.has(pid)
    );
    if (partnerCandidates.length === 0) continue;

    const candidatesAlreadyLinkedToChild = partnerCandidates.filter((pid) =>
      map.get(pid)?.childrenIds.includes(child.id)
    );

    const inferredPartnerId =
      candidatesAlreadyLinkedToChild.length === 1
        ? candidatesAlreadyLinkedToChild[0]
        : partnerCandidates.length === 1
        ? partnerCandidates[0]
        : null;

    if (!inferredPartnerId || parentIds.includes(inferredPartnerId)) continue;

    const inferredPartner = map.get(inferredPartnerId);
    if (!inferredPartner) continue;
    if (sharesParent(knownParent, inferredPartner)) continue;

    child.parentIds = uniq([...parentIds, inferredPartnerId]);

    if (!inferredPartner.childrenIds.includes(child.id)) {
      inferredPartner.childrenIds = uniq([...inferredPartner.childrenIds, child.id]);
    }
  }

  // Final sync to keep arrays and legacy fields consistent
  for (const child of map.values()) {
    child.parentIds = uniq(child.parentIds || []);
    for (const pid of child.parentIds) {
      const parent = map.get(pid);
      if (!parent) continue;
      if (!parent.childrenIds.includes(child.id)) {
        parent.childrenIds = uniq([...parent.childrenIds, child.id]);
      }
      if (!parent.partners) parent.partners = [];
    }
    child.parentId = child.parentIds[0] ?? null;
  }

  for (const node of map.values()) {
    node.childrenIds = uniq(node.childrenIds || []);
    node.partners = uniq(node.partners || []);
  }

  // return preserving original order
  return nodes.map((n) => map.get(n.id)!).filter(Boolean);
}

function linkPartners(
  nodes: FamilyNode[],
  aId: string,
  bId: string
): FamilyNode[] {
  const map = new Map(nodes.map((n) => [n.id, normalizeNode(n)]));
  const a = map.get(aId);
  const b = map.get(bId);
  if (!a || !b) return nodes;

  a.partners = uniq([...a.partners, bId]);
  b.partners = uniq([...b.partners, aId]);

  return sanitizeGraph(Array.from(map.values()));
}

function linkParentChild(
  nodes: FamilyNode[],
  parentId: string,
  childId: string
): FamilyNode[] {
  const map = new Map(nodes.map((n) => [n.id, normalizeNode(n)]));
  const parent = map.get(parentId);
  const child = map.get(childId);
  if (!parent || !child) return nodes;

  parent.childrenIds = uniq([...parent.childrenIds, childId]);
  child.parentIds = uniq([...(child.parentIds || []), parentId]);

  // legacy
  child.parentId = child.parentIds[0] ?? null;

  return sanitizeGraph(Array.from(map.values()));
}

function recomputeAllGenerations(nodes: FamilyNode[]) {
  return nodes.map((n) => ({
    ...n,
    generation: calculateGeneration(nodes, n.id),
  }));
}

// ----------------------------

export function useTreeState(userId: string, userName: string) {
  const [trees, setTrees] = useState<TreeData[]>([]);
  const [currentTreeId, setCurrentTreeId] = useState<string | null>(null);
  const [history, setHistory] = useState<TreeHistory>({
    past: [],
    present: [],
    future: [],
  });
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "loading" | "saving" | "offline" | "error"
  >("idle");

  // Pending-save coalescer: multiple rapid edits are batched into a single PUT.
  const pendingSaveRef = useRef<{
    treeId: string;
    nodes: FamilyNode[];
  } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load: try API first, fall back to localStorage.
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const loadedLocal = loadTrees();
      const migrated = loadedLocal.map((t: any) => {
        const nodes = (t.nodes || []).map((n: any) => normalizeNode(n));
        const sanitized = sanitizeGraph(nodes);
        const withGen = recomputeAllGenerations(sanitized);
        return { ...t, nodes: withGen };
      });

      // Seed with local cache immediately so UI isn't blank while we fetch.
      if (!cancelled) {
        setTrees(migrated);
        const localTree = migrated.find((t) => t.ownerId === userId);
        if (localTree) {
          setCurrentTreeId(localTree.id);
          setHistory({ past: [], present: localTree.nodes, future: [] });
        }
        setStorageInfo(checkStorageQuota());
      }

      // Then try to pull authoritative data from the server.
      if (!userId) return;
      setSyncStatus("loading");
      try {
        const summaries = await listTrees();
        if (cancelled) return;

        if (summaries.length === 0) {
          // No server-side tree yet. Keep local-only state; a create call will
          // provision one later.
          setSyncStatus("idle");
          return;
        }

        const primary = summaries[0];
        const fullTree = await loadTree(primary.id);
        if (cancelled) return;

        // Normalize server data through the same sanitizer used for local.
        const nodes = recomputeAllGenerations(
          sanitizeGraph(fullTree.nodes.map((n) => normalizeNode(n)))
        );
        const hydrated: TreeData = { ...fullTree, nodes };

        setTrees((prev) => {
          const filtered = prev.filter((t) => t.id !== hydrated.id);
          return [...filtered, hydrated];
        });
        setCurrentTreeId(hydrated.id);
        setHistory({ past: [], present: hydrated.nodes, future: [] });
        setSyncStatus("idle");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof TreeApiError && error.status === 401) {
          // Not logged in (e.g. page loaded before NextAuth session). Silently
          // stay in local-only mode.
          setSyncStatus("offline");
        } else {
          setSyncStatus("offline");
        }
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Persist: write to localStorage synchronously, and debounce a server sync.
  useEffect(() => {
    if (trees.length === 0) return;

    const result = saveTrees(trees);
    if (!result.success) setSaveError(result.error || null);
    else setSaveError(null);
    setStorageInfo(checkStorageQuota());

    if (!currentTreeId) return;
    const current = trees.find((t) => t.id === currentTreeId);
    if (!current) return;

    // Only sync user's own trees to server (membership-based sync can come later).
    if (current.ownerId && current.ownerId !== userId) return;

    pendingSaveRef.current = {
      treeId: current.id,
      nodes: current.nodes,
    };

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const pending = pendingSaveRef.current;
      if (!pending) return;
      setSyncStatus("saving");
      try {
        await saveTreeNodes(pending.treeId, pending.nodes);
        setSyncStatus("idle");
      } catch (error) {
        if (error instanceof TreeApiError && error.status === 404) {
          // Tree exists locally but not on the server — create it there.
          try {
            const created = await createTreeApi(current.name);
            await saveTreeNodes(created.id, pending.nodes);
            setTrees((prev) =>
              prev.map((t) =>
                t.id === current.id
                  ? { ...t, id: created.id, ownerId: created.ownerId }
                  : t
              )
            );
            setCurrentTreeId(created.id);
            setSyncStatus("idle");
          } catch {
            setSyncStatus("offline");
          }
          return;
        }
        setSyncStatus("offline");
      }
    }, 600);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [trees, currentTreeId, userId]);

  const currentTree = trees.find((t) => t.id === currentTreeId) || null;
  const userTree = trees.find((t) => t.ownerId === userId) || null;

  const layoutGraph: LayoutGraph = currentTree
    ? calculateHierarchicalLayout(currentTree.nodes)
    : { nodes: [], edges: [], width: 0, height: 0 };

  const pushHistory = useCallback((nodes: FamilyNode[]) => {
    setHistory((prev) => ({
      past: [...prev.past.slice(-MAX_HISTORY + 1), prev.present],
      present: nodes,
      future: [],
    }));
  }, []);

  // Create initial tree
  const createTree = useCallback(() => {
    const now = new Date().toISOString();
    const treeId = `tree-${Date.now()}`;
    const rootNode: FamilyNode = sanitizeGraph([
      {
        id: `node-${Date.now()}`,
        label: userName,
        year: null,
        deathYear: null,
        parentIds: [],
        parentId: null,
        partners: [],
        childrenIds: [],
        generation: 0,
        line: "self",
        imageUrl: null,
        content: { description: "", media: [] },
      } as any,
    ])[0];

    const newTree: TreeData = {
      id: treeId,
      name: `Keluarga ${userName.split(" ")[0]}`,
      ownerId: userId,
      nodes: [rootNode],
      createdAt: now,
      updatedAt: now,
    };

    setTrees((prev) => [...prev, newTree]);
    setCurrentTreeId(treeId);
    setHistory({ past: [], present: [rootNode], future: [] });

    // Fire-and-forget: try to create on the server immediately. Failure is
    // non-fatal — the debounced save will retry when the first edit lands.
    createTreeApi(newTree.name)
      .then((created) => {
        setTrees((prev) =>
          prev.map((t) =>
            t.id === treeId
              ? { ...t, id: created.id, ownerId: created.ownerId }
              : t
          )
        );
        setCurrentTreeId(created.id);
        // Push the seed root node to the server.
        return saveTreeNodes(created.id, [rootNode]);
      })
      .catch(() => {
        setSyncStatus("offline");
      });

    return newTree;
  }, [userId, userName]);

  // Add node (fixed relationships)
  const addNode = useCallback(
    (
      nodeData: Omit<FamilyNode, "id" | "generation" | "childrenIds"> & {
        initialChildrenIds?: string[];
      }
    ): { success: boolean; error?: string; node?: FamilyNode } => {
      if (!currentTree) return { success: false, error: "No tree selected" };

      const { initialChildrenIds, ...rest } = nodeData as any;

      const newNodeId = `node-${Date.now()}`;

      // build new node normalized
      const newNode: FamilyNode = normalizeNode({
        ...rest,
        id: newNodeId,
        generation: 0,
        childrenIds: initialChildrenIds || [],
        parentIds: rest.parentIds || (rest.parentId ? [rest.parentId] : []),
      });

      // basic cycle detection
      if (detectCycle(currentTree.nodes, newNode)) {
        return {
          success: false,
          error:
            "Tidak bisa menambahkan: hubungan ini menyebabkan silsilah melingkar",
        };
      }

      let updatedNodes: FamilyNode[] = sanitizeGraph([
        ...currentTree.nodes.map((n) => normalizeNode(n)),
        newNode,
      ]);

      const isAddParent =
        Array.isArray(initialChildrenIds) && initialChildrenIds.length > 0;
      const isAddChild = !!newNode.parentId;
      const isAddPartner =
        Array.isArray(newNode.partners) && newNode.partners.length > 0;

      if (isAddParent) {
        for (const childId of initialChildrenIds!) {
          updatedNodes = linkParentChild(updatedNodes, newNodeId, childId);
          const child = updatedNodes.find((n) => n.id === childId);
          const otherParentId = child?.parentIds?.find(
            (pid) => pid !== newNodeId
          );
          if (otherParentId) {
            updatedNodes = linkPartners(updatedNodes, newNodeId, otherParentId);
          }
        }
      }

      if (isAddChild) {
        const parentId = newNode.parentId!;
        updatedNodes = linkParentChild(updatedNodes, parentId, newNodeId);
      }

      if (isAddPartner) {
        for (const partnerId of newNode.partners) {
          updatedNodes = linkPartners(updatedNodes, newNodeId, partnerId);
        }
      }

      updatedNodes = sanitizeGraph(updatedNodes);
      updatedNodes = recomputeAllGenerations(updatedNodes);

      const finalNewNode = updatedNodes.find((n) => n.id === newNodeId)!;

      pushHistory(updatedNodes);

      setTrees((prev) =>
        prev.map((t) =>
          t.id === currentTreeId
            ? { ...t, nodes: updatedNodes, updatedAt: new Date().toISOString() }
            : t
        )
      );

      return { success: true, node: finalNewNode };
    },
    [currentTree, currentTreeId, pushHistory]
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<FamilyNode>) => {
      if (!currentTree) return;

      let updatedNodes = sanitizeGraph(
        currentTree.nodes.map((n) =>
          n.id === nodeId
            ? normalizeNode({ ...n, ...updates })
            : normalizeNode(n)
        )
      );

      updatedNodes = recomputeAllGenerations(updatedNodes);

      pushHistory(updatedNodes);

      setTrees((prev) =>
        prev.map((t) =>
          t.id === currentTreeId
            ? { ...t, nodes: updatedNodes, updatedAt: new Date().toISOString() }
            : t
        )
      );
    },
    [currentTree, currentTreeId, pushHistory]
  );

  const updateNodes = useCallback(
    (updates: { nodeId: string; data: Partial<FamilyNode> }[]) => {
      if (!currentTree) return;

      let updated = currentTree.nodes.map((n) => normalizeNode(n));

      for (const { nodeId, data } of updates) {
        updated = updated.map((n) =>
          n.id === nodeId ? normalizeNode({ ...n, ...data }) : n
        );
      }

      let updatedNodes = sanitizeGraph(updated);
      updatedNodes = recomputeAllGenerations(updatedNodes);

      pushHistory(updatedNodes);

      setTrees((prev) =>
        prev.map((t) =>
          t.id === currentTreeId
            ? { ...t, nodes: updatedNodes, updatedAt: new Date().toISOString() }
            : t
        )
      );
    },
    [currentTree, currentTreeId, pushHistory]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (!currentTree) return;

      const nodeToDelete = currentTree.nodes.find((n) => n.id === nodeId);
      if (!nodeToDelete) return;

      let updatedNodes = currentTree.nodes
        .map((n) => normalizeNode(n))
        .filter((n) => n.id !== nodeId);

      const parentIds = uniq([
        ...(nodeToDelete.parentIds || []),
        ...(nodeToDelete.parentId ? [nodeToDelete.parentId] : []),
      ]);

      for (const pid of parentIds) {
        updatedNodes = updatedNodes.map((n) =>
          n.id === pid
            ? {
              ...n,
              childrenIds: (n.childrenIds || []).filter(
                (id) => id !== nodeId
              ),
            }
            : n
        );
      }

      for (const partnerId of nodeToDelete.partners || []) {
        updatedNodes = updatedNodes.map((n) =>
          n.id === partnerId
            ? {
              ...n,
              partners: (n.partners || []).filter((id) => id !== nodeId),
            }
            : n
        );
      }

      for (const childId of nodeToDelete.childrenIds || []) {
        updatedNodes = updatedNodes.map((n) => {
          if (n.id !== childId) return n;
          const nextParentIds = (n.parentIds || []).filter(
            (pid) => pid !== nodeId
          );
          return {
            ...n,
            parentIds: nextParentIds,
            parentId: nextParentIds[0] ?? null,
          };
        });
      }

      updatedNodes = sanitizeGraph(updatedNodes);
      updatedNodes = recomputeAllGenerations(updatedNodes);

      pushHistory(updatedNodes);

      setTrees((prev) =>
        prev.map((t) =>
          t.id === currentTreeId
            ? { ...t, nodes: updatedNodes, updatedAt: new Date().toISOString() }
            : t
        )
      );
    },
    [currentTree, currentTreeId, pushHistory]
  );

  const undo = useCallback(() => {
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future],
    });

    setTrees((prev) =>
      prev.map((t) =>
        t.id === currentTreeId
          ? { ...t, nodes: previous, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }, [history, currentTreeId]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture,
    });

    setTrees((prev) =>
      prev.map((t) =>
        t.id === currentTreeId
          ? { ...t, nodes: next, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }, [history, currentTreeId]);

  const importNodes = useCallback(
    (nodes: FamilyNode[]) => {
      if (!currentTree) return;

      let importedNodes = nodes.map((n) => normalizeNode(n));
      importedNodes = sanitizeGraph(importedNodes);
      importedNodes = recomputeAllGenerations(importedNodes);

      pushHistory(importedNodes);

      setTrees((prev) =>
        prev.map((t) =>
          t.id === currentTreeId
            ? { ...t, nodes: importedNodes, updatedAt: new Date().toISOString() }
            : t
        )
      );
    },
    [currentTree, currentTreeId, pushHistory]
  );

  const getNode = useCallback(
    (nodeId: string): FamilyNode | null => {
      return currentTree?.nodes.find((n) => n.id === nodeId) || null;
    },
    [currentTree]
  );

  return {
    trees,
    currentTree,
    userTree,
    currentTreeId,
    setCurrentTreeId,
    layoutGraph,
    history,
    storageInfo,
    saveError,
    syncStatus,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    createTree,
    addNode,
    updateNode,
    updateNodes,
    deleteNode,
    getNode,
    importNodes,
    undo,
    redo,
  };
}
