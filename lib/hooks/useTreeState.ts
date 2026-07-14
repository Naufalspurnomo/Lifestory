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
import { rebuildFamilyNodeCaches } from "../tree/familyGraph";
import { loadTrees, saveTrees, checkStorageQuota } from "../utils/storageUtils";
import {
  createTreeApi,
  choosePrimaryTree,
  collapseLegacyDuplicateTrees,
  dismissFirstTreeWelcomeApi,
  listTrees,
  loadTree,
  pullTreeChanges,
  type TreeSummary,
  TreeApiError,
} from "../tree/apiClient";
import { RemoteTreePoller } from "../sync/RemoteTreePoller";
import { useSyncEngine } from "../sync/useSyncEngine";
import type { Mutation } from "../sync/types";

const MAX_HISTORY = 50;
const ACTIVE_TREE_KEY_PREFIX = "lifestory_active_tree:";
const LOCAL_DRAFT_KEY_PREFIX = "lifestory_local_draft:";

export type TreeInventoryState =
  | "loading"
  | "empty"
  | "available"
  | "unavailable";

const FREE_ENTITLEMENT: TreeSummary["entitlement"] = {
  tier: "FREE",
  maxPeople: 500,
  maxVerifiedMembers: 50,
  storageQuotaBytes: 262_144_000,
  contributionLinksPerMonth: 20,
  snapshotLimit: 30,
  studioVideoAllowed: false,
};

function capabilitiesForRole(role: TreeSummary["myRole"]): TreeSummary["capabilities"] {
  return {
    canEdit: role === "owner" || role === "editor",
    canInvite: role === "owner",
    canManageMembers: role === "owner",
    canDelete: role === "owner",
    canRestore: role === "owner" || role === "editor",
    canExport: true,
    canContribute: true,
  };
}

function summaryFromTree(
  tree: TreeData,
  previous: TreeSummary | undefined,
  fallbackRole: TreeSummary["myRole"]
): TreeSummary {
  const role = previous?.myRole ?? fallbackRole;
  return {
    id: tree.id,
    name: tree.name,
    ownerId: tree.ownerId,
    version: tree.version,
    nodeCount: tree.nodes.length,
    createdAt: tree.createdAt,
    updatedAt: tree.updatedAt,
    myRole: role,
    entitlement: previous?.entitlement ?? FREE_ENTITLEMENT,
    capabilities: previous?.capabilities ?? capabilitiesForRole(role),
  };
}

export type InitialMemberInput = {
  label: string;
  year: number | null;
};

export type CreatedTreeResult = {
  tree: TreeData;
  firstTreeWelcomeTreeId: string | null;
};

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

function localDraftKey(userId: string, treeId: string): string {
  return `${LOCAL_DRAFT_KEY_PREFIX}${userId}:${treeId}`;
}

function markLocalDraft(userId: string, treeId: string): string | null {
  if (typeof window === "undefined" || !userId) return null;
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    localStorage.setItem(localDraftKey(userId, treeId), token);
    return token;
  } catch {
    return null;
  }
}

function hasLocalDraft(userId: string, treeId: string): boolean {
  if (typeof window === "undefined" || !userId) return false;
  try {
    return localStorage.getItem(localDraftKey(userId, treeId)) !== null;
  } catch {
    return false;
  }
}

function clearLocalDraft(
  userId: string,
  treeId: string,
  expectedToken?: string | null
): void {
  if (typeof window === "undefined" || !userId) return;
  const key = localDraftKey(userId, treeId);
  try {
    if (expectedToken && localStorage.getItem(key) !== expectedToken) {
      return;
    }
    localStorage.removeItem(key);
  } catch {
    /* Keep the draft marker when browser storage is unavailable. */
  }
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

export function sanitizeGraph(nodes: FamilyNode[]): FamilyNode[] {
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

  // Final sync to keep arrays and legacy fields consistent.
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

  const rebuilt = rebuildFamilyNodeCaches(Array.from(map.values()));
  const rebuiltById = new Map(rebuilt.map((node) => [node.id, node]));

  // return preserving original order
  return nodes.map((n) => rebuiltById.get(n.id)!).filter(Boolean);
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
      mutations.push({
        type: "add",
        nodeId: node.id,
        payload: stripRuntimeNodeFields(node),
        previousPayload: null,
      });
    } else if (!samePersistedNode(existing, node)) {
      mutations.push({
        type: "update",
        nodeId: node.id,
        payload: stripRuntimeNodeFields(node),
        previousPayload: stripRuntimeNodeFields(existing),
      });
    }
  }

  for (const node of before) {
    if (!next.has(node.id)) {
      mutations.push({
        type: "delete",
        nodeId: node.id,
        payload: null,
        previousPayload: stripRuntimeNodeFields(node),
      });
    }
  }

  return mutations;
}

// ----------------------------

export function useTreeState(userId: string, userName: string) {
  const [trees, setTrees] = useState<TreeData[]>([]);
  const [treeSummaries, setTreeSummaries] = useState<TreeSummary[]>([]);
  const [currentTreeId, setCurrentTreeId] = useState<string | null>(null);
  const [firstTreeWelcomeTreeId, setFirstTreeWelcomeTreeId] = useState<
    string | null
  >(null);
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
  const [treeInventoryState, setTreeInventoryState] =
    useState<TreeInventoryState>("loading");
  const [treeScopeUserId, setTreeScopeUserId] = useState<string | null>(null);

  const treesRef = useRef<TreeData[]>([]);
  const localRevisionRef = useRef(new Map<string, number>());
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
      const nextTrees = treesRef.current.map((tree) =>
          tree.id === treeId
            ? { ...tree, nodes: rebasedNodes, updatedAt: new Date().toISOString() }
            : tree
      );
      treesRef.current = nextTrees;
      setTrees(nextTrees);
      const result = saveTrees(nextTrees, userId);
      if (!result.success) {
        setSaveError(result.error || "Salinan lokal belum bisa diperbarui.");
      }
      setStorageInfo(checkStorageQuota());
      if (currentTreeId === treeId) {
        // Undo entries from an older shared version could erase a
        // collaborator's work after conflict rebasing.
        setHistory({ past: [], present: rebasedNodes, future: [] });
      }
    },
  });
  const {
    status: syncStatusInfo,
    conflict: syncConflict,
    enqueueMany,
    retryFailed,
    forceSync,
    setLastSyncedVersion,
    getLastSyncedVersion,
    hasUnresolvedChanges,
    resolveConflict,
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
      const localTree = treesRef.current.find((tree) => tree.id === treeId);
      const unresolved = await hasUnresolvedChanges(treeId);
      const localDraft = hasLocalDraft(userId, treeId);

      if (localTree && (unresolved || localDraft)) {
        if (localDraft) {
          const recoveryMutations = buildNodeMutations(nodes, localTree.nodes);
          try {
            if (!unresolved) {
              await setLastSyncedVersion(treeId, fullTree.version ?? 1);
            }
            if (recoveryMutations.length > 0) {
              await enqueueMany(treeId, recoveryMutations);
            }
            clearLocalDraft(userId, treeId);
          } catch (error) {
            setSaveError(
              error instanceof Error
                ? `Salinan lokal tetap aman, tetapi recovery sync belum masuk antrian: ${error.message}`
                : "Salinan lokal tetap aman, tetapi recovery sync belum masuk antrian."
            );
          }
        }

        setCurrentTreeId(localTree.id);
        setHistory({ past: [], present: localTree.nodes, future: [] });
        saveActiveTreeId(userId, localTree.id);
        return localTree;
      }

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
    [enqueueMany, hasUnresolvedChanges, setLastSyncedVersion, userId]
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
        treesRef.current = migrated;
        setTreeScopeUserId(userId || null);
        setTreeInventoryState("loading");
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
        const listed = await listTrees();
        const summaries = listed.trees;
        if (cancelled) return;
        const visibleSummaries = collapseLegacyDuplicateTrees(summaries);
        setTreeSummaries(visibleSummaries);
        setFirstTreeWelcomeTreeId(
          listed.onboarding.firstTreeWelcomeTreeId
        );

        if (summaries.length === 0) {
          // Recover drafts created by the older local-first flow. The server
          // accepts the client ID so a repeated recovery request is idempotent.
          const localDraft = migrated.find(
            (tree) => tree.ownerId === userId && tree.version === undefined
          );
          if (localDraft) {
            try {
              const recoveredResult = await createTreeApi(localDraft.name, {
                id: localDraft.id,
                nodes: localDraft.nodes,
              });
              const recovered = recoveredResult.tree;
              if (cancelled) return;
              setFirstTreeWelcomeTreeId(
                recoveredResult.onboarding.firstTreeWelcomeTreeId
              );
              setTrees((prev) => [
                ...prev.filter((tree) => tree.id !== recovered.id),
                recovered,
              ]);
              setCurrentTreeId(recovered.id);
              saveActiveTreeId(userId, recovered.id);
              setHistory({ past: [], present: recovered.nodes, future: [] });
              await setLastSyncedVersion(recovered.id, recovered.version ?? 1);
              setSaveError(null);
              setTreeInventoryState("available");
            } catch (error) {
              setTreeInventoryState("unavailable");
              setSaveError(
                error instanceof Error
                  ? `Draft lokal masih aman, tetapi belum masuk server: ${error.message}`
                  : "Draft lokal masih aman, tetapi belum masuk server."
              );
            }
          } else {
            setTreeInventoryState("empty");
            // A zero-tree server response can also mean a misconfigured or
            // freshly reset database. Keep versioned browser caches visible
            // until an operator verifies that deletion was intentional.
            if (migrated.length > 0) {
              setSaveError(
                "Server belum menampilkan arsip keluarga. Salinan lokal tetap dipertahankan sampai kondisi server diverifikasi."
              );
            }
          }
          setLoadStatus("idle");
          return;
        }

        setTreeInventoryState("available");

        const primary = choosePrimaryTree(
          visibleSummaries,
          getActiveTreeId(userId)
        );
        if (!primary) {
          setTreeInventoryState("unavailable");
          setLoadStatus("offline");
          return;
        }
        await hydrateServerTree(primary.id, () => !cancelled);
        if (cancelled) return;
        setLoadStatus("idle");
      } catch (error) {
        if (cancelled) return;
        setTreeInventoryState("unavailable");
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

  const hasCurrentUserTreeScope = Boolean(userId) && treeScopeUserId === userId;
  const currentTree = hasCurrentUserTreeScope
    ? trees.find((t) => t.id === currentTreeId) || null
    : null;
  const userTree = hasCurrentUserTreeScope
    ? trees.find((t) => t.ownerId === userId) || null
    : null;

  const applyRemoteTree = useCallback(
    async (remoteTree: TreeData) => {
      const nodes = recomputeAllGenerations(
        sanitizeGraph(remoteTree.nodes.map((node) => normalizeNode(node)))
      );
      const hydrated = { ...remoteTree, nodes };
      let found = false;
      const nextTrees = treesRef.current.map((tree) => {
        if (tree.id !== hydrated.id) return tree;
        found = true;
        return hydrated;
      });
      if (!found) nextTrees.push(hydrated);

      treesRef.current = nextTrees;
      setTrees(nextTrees);
      setTreeSummaries((prev) => [
        summaryFromTree(
          hydrated,
          prev.find((tree) => tree.id === hydrated.id),
          hydrated.ownerId === userId ? "owner" : "viewer"
        ),
        ...prev.filter((tree) => tree.id !== hydrated.id),
      ]);
      if (currentTreeId === hydrated.id) {
        // Undo history from an older remote version could erase a
        // collaborator's work, so start a fresh local history baseline.
        setHistory({ past: [], present: hydrated.nodes, future: [] });
      }

      const result = saveTrees(nextTrees, userId);
      if (!result.success) {
        setSaveError(
          result.error ||
            "Perubahan keluarga terbaru sudah tampil, tetapi cache browser belum bisa diperbarui."
        );
      }
      setStorageInfo(checkStorageQuota());
      await setLastSyncedVersion(hydrated.id, hydrated.version ?? 1);
    },
    [currentTreeId, setLastSyncedVersion, userId]
  );

  useEffect(() => {
    if (!userId || !currentTreeId) return;

    const poller = new RemoteTreePoller({
      getActiveTreeId: () => currentTreeId,
      getLastSyncedVersion,
      getLocalRevision: (treeId) =>
        localRevisionRef.current.get(treeId) ?? 0,
      hasUnresolvedChanges: async (treeId) =>
        hasLocalDraft(userId, treeId) ||
        (await hasUnresolvedChanges(treeId)),
      fetchRemoteChanges: pullTreeChanges,
      applyRemoteTree,
      isVisible: () => document.visibilityState !== "hidden",
      onError: (error) => {
        if (error instanceof TreeApiError && error.status === 401) {
          setSaveError(
            "Sesi berakhir. Login ulang untuk melanjutkan sinkronisasi keluarga."
          );
        } else if (
          error instanceof TreeApiError &&
          (error.status === 403 || error.status === 404)
        ) {
          setSaveError(
            "Akses ke pohon keluarga ini sudah berubah. Muat ulang halaman untuk memperbarui akses."
          );
        }
      },
    });
    const refresh = () => void poller.refreshNow();
    const refreshWhenVisible = () => {
      if (document.visibilityState !== "hidden") refresh();
    };

    poller.start();
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      poller.stop();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [
    applyRemoteTree,
    currentTreeId,
    getLastSyncedVersion,
    hasUnresolvedChanges,
    userId,
  ]);

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

  const commitTreeNodesLocally = useCallback(
    (treeId: string, nodes: FamilyNode[]): boolean => {
      let found = false;
      const nextTrees = treesRef.current.map((tree) => {
        if (tree.id !== treeId) return tree;
        found = true;
        return {
          ...tree,
          nodes,
          updatedAt: new Date().toISOString(),
        };
      });
      if (!found) return false;

      const result = saveTrees(nextTrees, userId);
      if (!result.success) {
        setSaveError(result.error || "Salinan lokal belum bisa diperbarui.");
        return false;
      }

      localRevisionRef.current.set(
        treeId,
        (localRevisionRef.current.get(treeId) ?? 0) + 1
      );
      treesRef.current = nextTrees;
      setTrees(nextTrees);
      setStorageInfo(checkStorageQuota());
      return true;
    },
    [userId]
  );

  const queueNodeMutations = useCallback(
    (treeId: string, before: FamilyNode[], after: FamilyNode[]) => {
      const mutations = buildNodeMutations(before, after);
      if (mutations.length === 0) return;

      const draftToken = markLocalDraft(userId, treeId);
      void enqueueMany(treeId, mutations)
        .then(() => {
          if (draftToken) clearLocalDraft(userId, treeId, draftToken);
        })
        .catch((error) => {
          setSaveError(
            error instanceof Error
              ? `Salinan lokal tetap aman, tetapi antrian sync belum diperbarui: ${error.message}`
              : "Salinan lokal tetap aman, tetapi antrian sync belum diperbarui."
          );
        });
    },
    [enqueueMany, userId]
  );

  const getCurrentTreeSnapshot = useCallback(
    () => treesRef.current.find((tree) => tree.id === currentTreeId) ?? null,
    [currentTreeId]
  );

  // Create initial tree
  const createTree = useCallback(async (initialMember: InitialMemberInput) => {
    if (createInFlightRef.current) return null;

    const now = new Date().toISOString();
    const treeId = createClientId("tree");
    const memberName = initialMember.label.trim() || userName;
    const rootNode: FamilyNode = sanitizeGraph([
      {
        id: createClientId("node"),
        label: memberName,
        year: initialMember.year,
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
      name: `Keluarga ${memberName.split(" ")[0]}`,
      ownerId: userId,
      nodes: [rootNode],
      createdAt: now,
      updatedAt: now,
    };

    createInFlightRef.current = true;
    setLoadStatus("saving");
    try {
      const createdResult = await createTreeApi(newTree.name, {
        id: newTree.id,
        nodes: newTree.nodes,
      });
      const created = createdResult.tree;
      setTrees((prev) => [
        ...prev.filter((tree) => tree.id !== created.id),
        created,
      ]);
      setCurrentTreeId(created.id);
      saveActiveTreeId(userId, created.id);
      setTreeSummaries((prev) => [
        summaryFromTree(created, undefined, "owner"),
        ...prev.filter((tree) => tree.id !== created.id),
      ]);
      setHistory({ past: [], present: created.nodes, future: [] });
      await setLastSyncedVersion(created.id, created.version ?? 1);
      setFirstTreeWelcomeTreeId(
        createdResult.onboarding.firstTreeWelcomeTreeId
      );
      setLoadStatus("idle");
      setSaveError(null);
      return {
        tree: created,
        firstTreeWelcomeTreeId:
          createdResult.onboarding.firstTreeWelcomeTreeId,
      } satisfies CreatedTreeResult;
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

  const dismissFirstTreeWelcome = useCallback(async (treeId: string) => {
    await dismissFirstTreeWelcomeApi(treeId);
    setFirstTreeWelcomeTreeId((current) =>
      current === treeId ? null : current
    );
  }, []);

  // Add node (fixed relationships)
  const addNode = useCallback(
    (
      nodeData: Omit<FamilyNode, "id" | "generation" | "childrenIds"> & {
        initialChildrenIds?: string[];
      }
    ): { success: boolean; error?: string; node?: FamilyNode } => {
      const activeTree = getCurrentTreeSnapshot();
      if (!activeTree) return { success: false, error: "No tree selected" };

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
      if (detectCycle(activeTree.nodes, newNode)) {
        return {
          success: false,
          error:
            "Tidak bisa menambahkan: hubungan ini menyebabkan silsilah melingkar",
        };
      }

      let updatedNodes: FamilyNode[] = sanitizeGraph([
        ...activeTree.nodes.map((n) => normalizeNode(n)),
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

      if (!commitTreeNodesLocally(activeTree.id, updatedNodes)) {
        return {
          success: false,
          error: "Penyimpanan lokal penuh atau tidak tersedia.",
        };
      }
      pushHistory(updatedNodes);
      queueNodeMutations(activeTree.id, activeTree.nodes, updatedNodes);

      return { success: true, node: finalNewNode };
    },
    [
      commitTreeNodesLocally,
      getCurrentTreeSnapshot,
      pushHistory,
      queueNodeMutations,
    ]
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<FamilyNode>) => {
      const activeTree = getCurrentTreeSnapshot();
      if (!activeTree) return;

      let updatedNodes = sanitizeGraph(
        activeTree.nodes.map((n) =>
          n.id === nodeId
            ? normalizeNode({ ...n, ...updates })
            : normalizeNode(n)
        )
      );

      updatedNodes = recomputeAllGenerations(updatedNodes);

      if (!commitTreeNodesLocally(activeTree.id, updatedNodes)) return;
      pushHistory(updatedNodes);
      queueNodeMutations(activeTree.id, activeTree.nodes, updatedNodes);
    },
    [
      commitTreeNodesLocally,
      getCurrentTreeSnapshot,
      pushHistory,
      queueNodeMutations,
    ]
  );

  const updateNodes = useCallback(
    (updates: { nodeId: string; data: Partial<FamilyNode> }[]) => {
      const activeTree = getCurrentTreeSnapshot();
      if (!activeTree) return;

      let updated = activeTree.nodes.map((n) => normalizeNode(n));

      for (const { nodeId, data } of updates) {
        updated = updated.map((n) =>
          n.id === nodeId ? normalizeNode({ ...n, ...data }) : n
        );
      }

      let updatedNodes = sanitizeGraph(updated);
      updatedNodes = recomputeAllGenerations(updatedNodes);

      if (!commitTreeNodesLocally(activeTree.id, updatedNodes)) return;
      pushHistory(updatedNodes);
      queueNodeMutations(activeTree.id, activeTree.nodes, updatedNodes);
    },
    [
      commitTreeNodesLocally,
      getCurrentTreeSnapshot,
      pushHistory,
      queueNodeMutations,
    ]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      const activeTree = getCurrentTreeSnapshot();
      if (!activeTree) return;

      const nodeToDelete = activeTree.nodes.find((n) => n.id === nodeId);
      if (!nodeToDelete) return;
      if (activeTree.nodes.length <= 1) {
        setSaveError("Pohon keluarga harus memiliki minimal satu anggota.");
        return;
      }

      let updatedNodes = activeTree.nodes
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

      if (!commitTreeNodesLocally(activeTree.id, updatedNodes)) return;
      pushHistory(updatedNodes);
      queueNodeMutations(activeTree.id, activeTree.nodes, updatedNodes);
    },
    [
      commitTreeNodesLocally,
      getCurrentTreeSnapshot,
      pushHistory,
      queueNodeMutations,
    ]
  );

  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    const activeTree = getCurrentTreeSnapshot();
    if (!activeTree) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    if (!commitTreeNodesLocally(activeTree.id, previous)) return;
    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future],
    });
    queueNodeMutations(activeTree.id, activeTree.nodes, previous);
  }, [
    commitTreeNodesLocally,
    getCurrentTreeSnapshot,
    history,
    queueNodeMutations,
  ]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    const activeTree = getCurrentTreeSnapshot();
    if (!activeTree) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    if (!commitTreeNodesLocally(activeTree.id, next)) return;
    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture,
    });
    queueNodeMutations(activeTree.id, activeTree.nodes, next);
  }, [
    commitTreeNodesLocally,
    getCurrentTreeSnapshot,
    history,
    queueNodeMutations,
  ]);

  const importNodes = useCallback(
    (nodes: FamilyNode[]) => {
      const activeTree = getCurrentTreeSnapshot();
      if (!activeTree) return;

      let importedNodes = nodes.map((n) => normalizeNode(n));
      importedNodes = sanitizeGraph(importedNodes);
      importedNodes = recomputeAllGenerations(importedNodes);

      if (!commitTreeNodesLocally(activeTree.id, importedNodes)) return;
      pushHistory(importedNodes);
      queueNodeMutations(activeTree.id, activeTree.nodes, importedNodes);
    },
    [
      commitTreeNodesLocally,
      getCurrentTreeSnapshot,
      pushHistory,
      queueNodeMutations,
    ]
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
    treeInventoryState:
      hasCurrentUserTreeScope ? treeInventoryState : "loading",
    currentTreeId,
    firstTreeWelcomeTreeId,
    selectTree,
    layoutGraph,
    history,
    storageInfo,
    saveError,
    syncStatus: legacySyncStatus,
    syncStatusInfo,
    syncConflict,
    resolveSyncConflict: resolveConflict,
    retrySync: retryFailed,
    forceSync,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    createTree,
    dismissFirstTreeWelcome,
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
