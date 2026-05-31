"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
  choosePrimaryTree,
  collapseLegacyDuplicateTrees,
  listTrees,
  loadTree,
  type TreeSummary,
  TreeApiError,
} from "../tree/apiClient";
import { useSyncEngine } from "../sync/useSyncEngine";
import type { Mutation } from "../sync/types";

const MAX_HISTORY = 50;
const ACTIVE_TREE_KEY_PREFIX = "lifestory_active_tree:";

// ---------- helpers ----------
const uniq = (a: string[]) => Array.from(new Set((a || []).filter(Boolean)));

function createClientId(prefix: "tree" | "node"): string {
  const randomId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomId}`;
}

function getActiveTreeId(userId: string): string | null {
  if (typeof window === "undefined" || !userId) return null;
  return localStorage.getItem(`${ACTIVE_TREE_KEY_PREFIX}${userId}`);
}

function saveActiveTreeId(userId: string, treeId: string): void {
  if (typeof window === "undefined" || !userId) return;
  localStorage.setItem(`${ACTIVE_TREE_KEY_PREFIX}${userId}`, treeId);
}

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

function stripRuntimeNodeFields(node: FamilyNode): FamilyNode {
  const { x, y, ...persisted } = node;
  void x;
  void y;
  return persisted;
}

function samePersistedNode(a: FamilyNode, b: FamilyNode): boolean {
  return JSON.stringify(stripRuntimeNodeFields(a)) === JSON.stringify(stripRuntimeNodeFields(b));
}

function buildNodeMutations(
  before: FamilyNode[],
  after: FamilyNode[]
): Mutation[] {
  const previous = new Map(before.map((node) => [node.id, node]));
  const next = new Map(after.map((node) => [node.id, node]));
  const mutations: Mutation[] = [];

  for (const node of after) {
    const existing = previous.get(node.id);
    if (!existing) {
      mutations.push({ type: "add", nodeId: node.id, payload: stripRuntimeNodeFields(node) });
    } else if (!samePersistedNode(existing, node)) {
      mutations.push({
        type: "update",
        nodeId: node.id,
        payload: stripRuntimeNodeFields(node),
      });
    }
  }

  for (const node of before) {
    if (!next.has(node.id)) {
      mutations.push({ type: "delete", nodeId: node.id, payload: null });
    }
  }

  return mutations;
}

// ----------------------------

export function useTreeState(userId: string, userName: string) {
  const [trees, setTrees] = useState<TreeData[]>([]);
  const [treeSummaries, setTreeSummaries] = useState<TreeSummary[]>([]);
  const [currentTreeId, setCurrentTreeId] = useState<string | null>(null);
  const [history, setHistory] = useState<TreeHistory>({
    past: [],
    present: [],
    future: [],
  });
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadStatus, setLoadStatus] = useState<
    "idle" | "loading" | "saving" | "offline" | "error"
  >("idle");

  const treesRef = useRef<TreeData[]>([]);
  // C6: Guard against concurrent createTreeApi calls from createTree().
  const createInFlightRef = useRef(false);
  const syncEngine = useSyncEngine(userId, {
    getTreeNodes: (treeId) =>
      treesRef.current.find((tree) => tree.id === treeId)?.nodes ?? null,
    onAuthRequired: () =>
      setSaveError(
        "Sesi berakhir. Perubahan tersimpan lokal dan akan disinkronkan setelah login ulang."
      ),
    onConflict: () =>
      setSaveError(
        "Pohon ini berubah dari perangkat lain. Selesaikan konflik sebelum sinkronisasi dilanjutkan."
      ),
    onCorruption: (errors) => setSaveError(errors.join("; ")),
    onRebased: (treeId, nodes) => {
      const rebasedNodes = recomputeAllGenerations(
        sanitizeGraph(nodes.map((node) => normalizeNode(node)))
      );
      setTrees((prev) =>
        prev.map((tree) =>
          tree.id === treeId
            ? { ...tree, nodes: rebasedNodes, updatedAt: new Date().toISOString() }
            : tree
        )
      );
      if (currentTreeId === treeId) {
        setHistory((prev) => ({ ...prev, present: rebasedNodes }));
      }
    },
  });
  const {
    status: syncStatusInfo,
    enqueueMany,
    retryFailed,
    forceSync,
    setLastSyncedVersion,
  } = syncEngine;

  useEffect(() => {
    treesRef.current = trees;
  }, [trees]);

  const hydrateServerTree = useCallback(
    async (treeId: string, shouldApply: () => boolean = () => true) => {
      const fullTree = await loadTree(treeId);
      if (!shouldApply()) return null;
      const nodes = recomputeAllGenerations(
        sanitizeGraph(fullTree.nodes.map((node) => normalizeNode(node)))
      );
      const hydrated: TreeData = { ...fullTree, nodes };

      setTrees((prev) => {
        const filtered = prev.filter((tree) => tree.id !== hydrated.id);
        return [...filtered, hydrated];
      });
      setCurrentTreeId(hydrated.id);
      setHistory({ past: [], present: hydrated.nodes, future: [] });
      saveActiveTreeId(userId, hydrated.id);
      await setLastSyncedVersion(hydrated.id, fullTree.version ?? 1);
      return hydrated;
    },
    [setLastSyncedVersion, userId]
  );

  // Load: try API first, fall back to localStorage.
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const loadedLocal = loadTrees(userId);
      const migrated = loadedLocal.map((t: any) => {
        const nodes = (t.nodes || []).map((n: any) => normalizeNode(n));
        const sanitized = sanitizeGraph(nodes);
        const withGen = recomputeAllGenerations(sanitized);
        return { ...t, nodes: withGen };
      });

      // Seed with local cache immediately so UI isn't blank while we fetch.
      if (!cancelled) {
        setCurrentTreeId(null);
        setHistory({ past: [], present: [], future: [] });
        setTrees(migrated);
        const preferredTreeId = getActiveTreeId(userId);
        const localTree =
          migrated.find((tree) => tree.id === preferredTreeId) ??
          migrated.find((tree) => tree.ownerId === userId);
        if (localTree) {
          setCurrentTreeId(localTree.id);
          setHistory({ past: [], present: localTree.nodes, future: [] });
        }
        setStorageInfo(checkStorageQuota());
      }

      // Then try to pull authoritative data from the server.
      if (!userId) return;
      setLoadStatus("loading");
      try {
        const summaries = await listTrees();
        if (cancelled) return;
        const visibleSummaries = collapseLegacyDuplicateTrees(summaries);
        setTreeSummaries(visibleSummaries);

        if (summaries.length === 0) {
          // Recover drafts created by the older local-first flow. The server
          // accepts the client ID so a repeated recovery request is idempotent.
          const localDraft = migrated.find(
            (tree) => tree.ownerId === userId && tree.version === undefined
          );
          if (localDraft) {
            try {
              const recovered = await createTreeApi(localDraft.name, {
                id: localDraft.id,
                nodes: localDraft.nodes,
              });
              if (cancelled) return;
              setTrees((prev) => [
                ...prev.filter((tree) => tree.id !== recovered.id),
                recovered,
              ]);
              setCurrentTreeId(recovered.id);
              saveActiveTreeId(userId, recovered.id);
              setHistory({ past: [], present: recovered.nodes, future: [] });
              await setLastSyncedVersion(recovered.id, recovered.version ?? 1);
              setSaveError(null);
            } catch (error) {
              setSaveError(
                error instanceof Error
                  ? `Draft lokal masih aman, tetapi belum masuk server: ${error.message}`
                  : "Draft lokal masih aman, tetapi belum masuk server."
              );
            }
          } else {
            // A versioned cache belonged to a tree that once existed on the
            // server. Do not resurrect it after an intentional server reset.
            setTrees([]);
            setCurrentTreeId(null);
            setHistory({ past: [], present: [], future: [] });
            saveTrees([], userId);
          }
          setLoadStatus("idle");
          return;
        }

        const primary = choosePrimaryTree(
          visibleSummaries,
          getActiveTreeId(userId)
        );
        if (!primary) return;
        await hydrateServerTree(primary.id, () => !cancelled);
        if (cancelled) return;
        setLoadStatus("idle");
      } catch (error) {
        if (cancelled) return;
        if (error instanceof TreeApiError && error.status === 401) {
          // Not logged in (e.g. page loaded before NextAuth session). Silently
          // stay in local-only mode.
          setLoadStatus("offline");
        } else {
          setLoadStatus("offline");
        }
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [hydrateServerTree, setLastSyncedVersion, userId]);

  // Persist the display cache synchronously. Authoritative server sync is handled
  // by the WAL-backed SyncEngine from each mutation path below.
  useEffect(() => {
    if (trees.length === 0) return;

    const result = saveTrees(trees, userId);
    if (!result.success) setSaveError(result.error || null);
    else setSaveError(null);
    setStorageInfo(checkStorageQuota());

  }, [trees, userId]);

  const currentTree = trees.find((t) => t.id === currentTreeId) || null;
  const userTree = trees.find((t) => t.ownerId === userId) || null;

  const selectTree = useCallback(
    async (treeId: string) => {
      if (!treeId || treeId === currentTreeId) return;
      setLoadStatus("loading");
      try {
        await hydrateServerTree(treeId);
        setSaveError(null);
        setLoadStatus("idle");
      } catch (error) {
        setLoadStatus("offline");
        setSaveError(
          error instanceof Error
            ? `Pohon belum bisa dimuat: ${error.message}`
            : "Pohon belum bisa dimuat."
        );
      }
    },
    [currentTreeId, hydrateServerTree]
  );

  const currentTreeNodes = currentTree?.nodes;
  const layoutGraph: LayoutGraph = useMemo(
    () =>
      currentTreeNodes
        ? calculateHierarchicalLayout(currentTreeNodes)
        : { nodes: [], edges: [], width: 0, height: 0 },
    [currentTreeNodes]
  );

  const pushHistory = useCallback((nodes: FamilyNode[]) => {
    setHistory((prev) => ({
      past: [...prev.past.slice(-MAX_HISTORY + 1), prev.present],
      present: nodes,
      future: [],
    }));
  }, []);

  const queueNodeMutations = useCallback(
    (treeId: string, before: FamilyNode[], after: FamilyNode[]) => {
      const mutations = buildNodeMutations(before, after);
      if (mutations.length === 0) return;

      void enqueueMany(treeId, mutations).catch((error) => {
        setSaveError(
          error instanceof Error
            ? error.message
            : "Perubahan belum bisa disimpan ke antrian lokal."
        );
      });
    },
    [enqueueMany]
  );

  // Create initial tree
  const createTree = useCallback(async () => {
    if (createInFlightRef.current) return null;

    const now = new Date().toISOString();
    const treeId = createClientId("tree");
    const rootNode: FamilyNode = sanitizeGraph([
      {
        id: createClientId("node"),
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

    createInFlightRef.current = true;
    setLoadStatus("saving");
    try {
      const created = await createTreeApi(newTree.name, {
        id: newTree.id,
        nodes: newTree.nodes,
      });
      setTrees((prev) => [
        ...prev.filter((tree) => tree.id !== created.id),
        created,
      ]);
      setCurrentTreeId(created.id);
      saveActiveTreeId(userId, created.id);
      setTreeSummaries((prev) => [
        {
          id: created.id,
          name: created.name,
          ownerId: created.ownerId,
          version: created.version,
          nodeCount: created.nodes.length,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
        ...prev.filter((tree) => tree.id !== created.id),
      ]);
      setHistory({ past: [], present: created.nodes, future: [] });
      await setLastSyncedVersion(created.id, created.version ?? 1);
      setLoadStatus("idle");
      setSaveError(null);
      return created;
    } catch (error) {
      setLoadStatus("offline");
      setSaveError(
        error instanceof Error
          ? `Pohon belum dibuat di server: ${error.message}`
          : "Pohon belum dibuat di server. Coba lagi saat koneksi tersedia."
      );
      return null;
    } finally {
      createInFlightRef.current = false;
    }
  }, [setLastSyncedVersion, userId, userName]);

  // Add node (fixed relationships)
  const addNode = useCallback(
    (
      nodeData: Omit<FamilyNode, "id" | "generation" | "childrenIds"> & {
        initialChildrenIds?: string[];
      }
    ): { success: boolean; error?: string; node?: FamilyNode } => {
      if (!currentTree) return { success: false, error: "No tree selected" };

      const { initialChildrenIds, ...rest } = nodeData as any;

      const newNodeId = createClientId("node");

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
      queueNodeMutations(currentTree.id, currentTree.nodes, updatedNodes);

      setTrees((prev) =>
        prev.map((t) =>
          t.id === currentTreeId
            ? { ...t, nodes: updatedNodes, updatedAt: new Date().toISOString() }
            : t
        )
      );

      return { success: true, node: finalNewNode };
    },
    [currentTree, currentTreeId, pushHistory, queueNodeMutations]
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
      queueNodeMutations(currentTree.id, currentTree.nodes, updatedNodes);

      setTrees((prev) =>
        prev.map((t) =>
          t.id === currentTreeId
            ? { ...t, nodes: updatedNodes, updatedAt: new Date().toISOString() }
            : t
        )
      );
    },
    [currentTree, currentTreeId, pushHistory, queueNodeMutations]
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
      queueNodeMutations(currentTree.id, currentTree.nodes, updatedNodes);

      setTrees((prev) =>
        prev.map((t) =>
          t.id === currentTreeId
            ? { ...t, nodes: updatedNodes, updatedAt: new Date().toISOString() }
            : t
        )
      );
    },
    [currentTree, currentTreeId, pushHistory, queueNodeMutations]
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
      queueNodeMutations(currentTree.id, currentTree.nodes, updatedNodes);

      setTrees((prev) =>
        prev.map((t) =>
          t.id === currentTreeId
            ? { ...t, nodes: updatedNodes, updatedAt: new Date().toISOString() }
            : t
        )
      );
    },
    [currentTree, currentTreeId, pushHistory, queueNodeMutations]
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

    if (currentTree) {
      queueNodeMutations(currentTree.id, history.present, previous);
    }

    setTrees((prev) =>
      prev.map((t) =>
        t.id === currentTreeId
          ? { ...t, nodes: previous, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }, [currentTree, history, currentTreeId, queueNodeMutations]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture,
    });

    if (currentTree) {
      queueNodeMutations(currentTree.id, history.present, next);
    }

    setTrees((prev) =>
      prev.map((t) =>
        t.id === currentTreeId
          ? { ...t, nodes: next, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }, [currentTree, history, currentTreeId, queueNodeMutations]);

  const importNodes = useCallback(
    (nodes: FamilyNode[]) => {
      if (!currentTree) return;

      let importedNodes = nodes.map((n) => normalizeNode(n));
      importedNodes = sanitizeGraph(importedNodes);
      importedNodes = recomputeAllGenerations(importedNodes);

      pushHistory(importedNodes);
      queueNodeMutations(currentTree.id, currentTree.nodes, importedNodes);

      setTrees((prev) =>
        prev.map((t) =>
          t.id === currentTreeId
            ? { ...t, nodes: importedNodes, updatedAt: new Date().toISOString() }
            : t
        )
      );
    },
    [currentTree, currentTreeId, pushHistory, queueNodeMutations]
  );

  const getNode = useCallback(
    (nodeId: string): FamilyNode | null => {
      return currentTree?.nodes.find((n) => n.id === nodeId) || null;
    },
    [currentTree]
  );

  const legacySyncStatus =
    loadStatus === "loading"
      ? "loading"
      : syncStatusInfo.status === "syncing"
      ? "saving"
      : syncStatusInfo.status === "offline"
      ? "offline"
      : syncStatusInfo.status === "error"
      ? "error"
      : "idle";

  return {
    trees,
    treeSummaries,
    currentTree,
    userTree,
    currentTreeId,
    selectTree,
    layoutGraph,
    history,
    storageInfo,
    saveError,
    syncStatus: legacySyncStatus,
    syncStatusInfo,
    retrySync: retryFailed,
    forceSync,
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
