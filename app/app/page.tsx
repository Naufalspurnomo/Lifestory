"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";

import FamilyTreeCanvas from "../../components/tree/FamilyTreeCanvas";
import type { FirstTreeRelationship } from "../../components/tree/FirstTreeWelcome";
import CanvasErrorBoundary from "../../components/tree/CanvasErrorBoundary";
import SearchBar from "../../components/tree/SearchBar";
import FamilyMemberList from "../../components/tree/FamilyMemberList";
import SyncStatusIndicator from "../../components/tree/SyncStatusIndicator";
import { useTreeState } from "../../lib/hooks/useTreeState";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { downloadTreeJson } from "../../lib/sync/ExportManager";
import { resolveDisplayMediaUrl } from "../../lib/media/public-url";
import { getSiblingOrderUpdates } from "../../lib/tree/siblingOrder";
import {
  BookOpen,
  ChevronLeft,
  Download,
  FileText,
  GitBranch,
  History,
  ImageIcon,
  Layers3,
  PanelRightOpen,
  Upload,
  UserPlus,
  ShieldCheck,
  Users,
} from "lucide-react";

import type { FamilyNode } from "../../lib/types/tree";
import type { MediaItem } from "../../lib/types/tree";

const FirstTreeWelcome = dynamic(() => import("../../components/tree/FirstTreeWelcome"));
const NodeEditor = dynamic(() => import("../../components/tree/NodeEditor"));
const BioModal = dynamic(() => import("../../components/tree/BioModal"));
const FamilyDiscoveryGate = dynamic(() => import("../../components/tree/FamilyDiscoveryGate"));
const FamilyAccessInbox = dynamic(() => import("../../components/tree/FamilyAccessInbox"));
const InviteModal = dynamic(() => import("../../components/tree/InviteModal"));
const ImportModal = dynamic(() => import("../../components/tree/ImportModal"));
const ConflictResolutionModal = dynamic(() => import("../../components/tree/ConflictResolutionModal"));
const TimelineView = dynamic(() => import("../../components/tree/TimelineView"));

type GalleryEntry = MediaItem & {
  ownerId: string;
  ownerName: string;
  ownerYear: number | null;
};

type ActionMenuKey = "manage" | "download";

export default function AppHome() {
  const { data: session, status } = useSession();
  const { locale } = useLanguage();
  const user = session?.user;
  const isAdmin = user?.role === "admin";

  const copy = useMemo(
    () =>
      locale === "id"
        ? {
          fallbackUser: "Pengguna",
          notifProfileUpdated: "Profil diperbarui",
          notifSiblingOrderUpdated: "Urutan saudara berhasil dirapikan.",
          notifAutoParentCreated: "Orang tua placeholder dibuat otomatis.",
          notifAdded: (name: string) => `${name} ditambahkan ke pohon`,
          notifError: (error?: string) => `Error: ${error || "Tidak diketahui"}`,
          notifDeleted: (name: string) => `${name} dihapus dari pohon`,
          notifImported: (count: number) =>
            `${count} anggota keluarga berhasil diimpor`,
          notifExported: (count: number) =>
            `Ekspor selesai: ${count} anggota dengan relasi lengkap.`,
          notifPdfExported: (count: number) =>
            `PDF siap diunduh: ${count} anggota keluarga.`,
          notifNoDataToExport: "Belum ada data keluarga untuk diekspor.",
          notifExportFailed: "Gagal mengekspor data keluarga.",
          notifPdfExportFailed: "Gagal membuat PDF pohon keluarga.",
          notifConflictResolved: "Konflik sinkronisasi berhasil diselesaikan.",
          notifConflictFailed:
            "Resolusi konflik belum tersimpan. Salinan lokal tetap aman.",
          placeholderFather: "Ayah (Tidak Diketahui)",
          placeholderMother: "Ibu (Tidak Diketahui)",
          pageTitle: "Pohon Keluarga",
          pageDescription:
            "Visualisasikan sejarah keluarga Anda, simpan cerita, dan wariskan memori untuk generasi mendatang.",
          viewTree: "Pohon",
          viewTimeline: "Cerita",
          mode: "Mode",
          manage: "Kelola",
          archive: "Unduh",
          filterAll: "Semua",
          filterCore: "Keluarga Inti",
          comingSoon: "Segera Hadir",
          invite: "Undang",
          requests: "Request",
          import: "Import",
          export: "Ekspor",
          exportPdf: "PDF",
          openDetail: "Detail",
          addMemberTitle: "Tambah anggota keluarga",
          statGenerations: "Generasi",
          statMembers: "Anggota Keluarga",
          statEarliest: "Catatan Terawal",
        }
        : {
          fallbackUser: "User",
          notifProfileUpdated: "Profile updated",
          notifSiblingOrderUpdated: "Sibling order updated.",
          notifAutoParentCreated: "Placeholder parents created automatically.",
          notifAdded: (name: string) => `${name} added to tree`,
          notifError: (error?: string) => `Error: ${error || "Unknown error"}`,
          notifDeleted: (name: string) => `${name} removed from tree`,
          notifImported: (count: number) =>
            `${count} family members imported successfully`,
          notifExported: (count: number) =>
            `Export complete: ${count} members with full relationship mapping.`,
          notifPdfExported: (count: number) =>
            `PDF ready to download: ${count} family members.`,
          notifNoDataToExport: "No family data available to export.",
          notifExportFailed: "Failed to export family data.",
          notifPdfExportFailed: "Failed to create family tree PDF.",
          notifConflictResolved: "Sync conflict resolved successfully.",
          notifConflictFailed:
            "Conflict resolution has not been saved. Your local copy remains safe.",
          placeholderFather: "Father (Unknown)",
          placeholderMother: "Mother (Unknown)",
          pageTitle: "Family Trees",
          pageDescription:
            "Visualize your family history, preserve stories, and pass memory to future generations.",
          viewTree: "Tree",
          viewTimeline: "Stories",
          mode: "Mode",
          manage: "Manage",
          archive: "Download",
          filterAll: "All",
          filterCore: "Core Family",
          comingSoon: "Coming Soon",
          invite: "Invite",
          requests: "Requests",
          import: "Import",
          export: "Export",
          exportPdf: "PDF",
          openDetail: "Detail",
          addMemberTitle: "Add family member",
          statGenerations: "Generations",
          statMembers: "Family Members",
          statEarliest: "Earliest Record",
        },
    [locale]
  );

  const userId = user?.id || user?.email || "";
  const userName = user?.name || copy.fallbackUser;
  const accountRoleLabel = isAdmin
    ? "Admin"
    : locale === "id"
      ? "Pengelola"
      : "Manager";

  const {
    userTree,
    treeSummaries,
    currentTree,
    firstTreeWelcomeTreeId,
    selectTree,
    layoutGraph,
    createTree,
    dismissFirstTreeWelcome,
    addNode,
    updateNode,
    updateNodes,
    deleteNode,
    getNode,
    importNodes,
    syncStatus,
    syncStatusInfo,
    retrySync,
    syncConflict,
    resolveSyncConflict,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTreeState(userId, userName);

  const currentTreeSummary = treeSummaries.find((tree) => tree.id === currentTree?.id);
  const treeCapabilities = currentTreeSummary?.capabilities ?? {
    canEdit: true,
    canInvite: true,
    canManageMembers: true,
    canDelete: true,
    canRestore: true,
    canExport: true,
    canContribute: true,
  };
  const treeReadOnly = !treeCapabilities.canEdit;

  useEffect(() => {
    (window as any).importNodes = importNodes;
  }, [importNodes]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailNodeId, setDetailNodeId] = useState<string | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAccessInbox, setShowAccessInbox] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [addType, setAddType] = useState<
    "parent" | "partner" | "child" | "sibling"
  >("child");
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<FamilyNode | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [hasCreatedTree, setHasCreatedTree] = useState(false);
  const [firstTreeWelcomeError, setFirstTreeWelcomeError] = useState<string | null>(null);
  const [isFirstTreeWelcomeSubmitting, setIsFirstTreeWelcomeSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"tree" | "timeline">("tree");
  const [openActionMenu, setOpenActionMenu] = useState<ActionMenuKey | null>(null);

  const [isTomeOpen, setIsTomeOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const mobileActionMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopActionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("panel") !== "requests") return;
    setShowAccessInbox(true);

    url.searchParams.delete("panel");
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`
    );
  }, []);

  const storiesList = useMemo(() => {
    if (!currentTree) return [];
    return currentTree.nodes
      .filter((n) => n.content?.description && n.content.description.length > 20)
      .sort((a, b) => (b.year && a.year ? b.year - a.year : 0));
  }, [currentTree]);

  const relicsList = useMemo<GalleryEntry[]>(() => {
    if (!currentTree) return [];
    return currentTree.nodes.flatMap((node) =>
      (node.content?.media || []).map((item) => ({
        ...item,
        url: resolveDisplayMediaUrl(item.url),
        ownerId: node.id,
        ownerName: node.label,
        ownerYear: node.year,
      }))
    );
  }, [currentTree]);

  const storiesCount = storiesList.length;
  const relicsCount = relicsList.length;

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const node = getNode(nodeId);
      if (node) {
        deleteNode(nodeId);
        showNotification(copy.notifDeleted(node.label));
        setSelectedId(null);
        setDetailNodeId(null);
      }
    },
    [getNode, deleteNode, showNotification, copy]
  );

  const handleOpenNodeDetail = useCallback((nodeId: string) => {
    setSelectedId(nodeId);
    setDetailNodeId(nodeId);
  }, []);

  const handleSearchSelect = useCallback((nodeId: string) => {
    setSelectedId(nodeId);
    setDetailNodeId(null);
  }, []);

  const handleCanvasSelect = useCallback(
    (nodeId: string | null, meta?: { pointerType?: string }) => {
      setSelectedId(nodeId);

      if (!nodeId) {
        setDetailNodeId(null);
        return;
      }

      if (meta?.pointerType === "touch") {
        setDetailNodeId(null);
        return;
      }

      setDetailNodeId(nodeId);
    },
    []
  );

  // P3: Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo),
  // Escape (deselect), Delete (delete selected node)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      } else if (
        (e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        if (canRedo) redo();
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setDetailNodeId(null);
        setShowNodeEditor(false);
      } else if (e.key === "Delete" && selectedId) {
        const node = getNode(selectedId);
        if (node && node.line !== "self") {
          handleDeleteNode(selectedId);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, undo, redo, selectedId, getNode, handleDeleteNode]);


  const handleStartTree = useCallback(async (initialMember: { label: string; year: number | null }) => {
    const result = await createTree(initialMember);
    if (result) {
      setHasCreatedTree(true);
      setSelectedId(result.tree.nodes[0]?.id ?? null);
      setFirstTreeWelcomeError(null);
      return true;
    }
    return false;
  }, [createTree]);

  useEffect(() => {
    if (userTree) {
      setHasCreatedTree(true);
    }
  }, [userTree]);

  const handleAddNode = useCallback((
    parentId: string,
    type: "parent" | "partner" | "child" | "sibling"
  ) => {
    if (treeReadOnly) {
      showNotification(locale === "id" ? "Akses Anda hanya untuk melihat." : "Your access is view-only.");
      return;
    }
    setAddType(type);
    setAddParentId(parentId);
    setEditingNode(null);
    setSelectedId(null);
    setDetailNodeId(null);
    setShowNodeEditor(true);
  }, [locale, showNotification, treeReadOnly]);

  const handleDismissFirstTreeWelcome = useCallback(async () => {
    if (!currentTree) return false;
    setIsFirstTreeWelcomeSubmitting(true);
    setFirstTreeWelcomeError(null);
    try {
      await dismissFirstTreeWelcome(currentTree.id);
      return true;
    } catch {
      setFirstTreeWelcomeError(
        locale === "id"
          ? "Welcome belum bisa ditutup. Periksa koneksi lalu coba lagi."
          : "The welcome could not be dismissed. Check your connection and try again."
      );
      return false;
    } finally {
      setIsFirstTreeWelcomeSubmitting(false);
    }
  }, [currentTree, dismissFirstTreeWelcome, locale]);

  const handleWelcomeRelationship = useCallback(
    async (relationship: FirstTreeRelationship) => {
      const rootNode = currentTree?.nodes[0];
      if (!rootNode) return;
      const dismissed = await handleDismissFirstTreeWelcome();
      if (dismissed) handleAddNode(rootNode.id, relationship);
    },
    [currentTree, handleAddNode, handleDismissFirstTreeWelcome]
  );

  const handleReorderSiblings = useCallback(
    (sourceNodeId: string, orderedBranchIds: string[]) => {
      if (!currentTree || treeReadOnly) return;
      const updates = getSiblingOrderUpdates(
        currentTree.nodes,
        sourceNodeId,
        orderedBranchIds
      );
      if (updates.length === 0) return;
      updateNodes(updates);
      showNotification(copy.notifSiblingOrderUpdated);
    },
    [copy.notifSiblingOrderUpdated, currentTree, showNotification, treeReadOnly, updateNodes]
  );

  const handleSaveNode = (
    nodeData: Omit<FamilyNode, "id" | "generation" | "childrenIds">
  ) => {
    if (editingNode) {
      updateNode(editingNode.id, nodeData);
      showNotification(copy.notifProfileUpdated);
    } else {
      let finalNodeData = { ...nodeData };
      let updatedParentIds = nodeData.parentIds || [];

      if (addType === "sibling" && addParentId) {
        const sibling = getNode(addParentId);
        if (sibling) {
          const existingParentIds =
            sibling.parentIds || (sibling.parentId ? [sibling.parentId] : []);

          if (existingParentIds.length > 0) {
            updatedParentIds = existingParentIds;
            finalNodeData.parentIds = updatedParentIds;
            finalNodeData.parentId = updatedParentIds[0];
          } else {
            const fatherRes = addNode({
              label: copy.placeholderFather,
              sex: "M",
              isPlaceholder: true,
            } as any);
            const motherRes = addNode({
              label: copy.placeholderMother,
              sex: "F",
              isPlaceholder: true,
            } as any);

            if (
              fatherRes.success &&
              motherRes.success &&
              fatherRes.node &&
              motherRes.node
            ) {
              updateNode(sibling.id, {
                parentIds: [fatherRes.node.id, motherRes.node.id],
                parentId: fatherRes.node.id,
              });

              updatedParentIds = [fatherRes.node.id, motherRes.node.id];
              finalNodeData.parentIds = updatedParentIds;
              finalNodeData.parentId = updatedParentIds[0];

              showNotification(copy.notifAutoParentCreated);
            }
          }
        }
      }

      const initialChildrenIds =
        addType === "parent" && addParentId ? [addParentId] : [];

      const partnersToLink =
        addType === "partner" && addParentId ? [addParentId] : nodeData.partners || [];

      let parentIdToUse = nodeData.parentId || null;
      if (addType === "partner") parentIdToUse = null;
      if (addType === "sibling") parentIdToUse = finalNodeData.parentId || null;
      if (addType === "child") parentIdToUse = nodeData.parentId || null;

      const result = addNode({
        ...finalNodeData,
        parentId: parentIdToUse,
        partners: partnersToLink,
        initialChildrenIds,
      });

      if (result.success && result.node) {
        showNotification(copy.notifAdded(nodeData.label));
      } else {
        showNotification(copy.notifError(result.error));
      }
    }
    setShowNodeEditor(false);
    setEditingNode(null);
    setAddParentId(null);
  };

  const handleEditNode = (node: FamilyNode) => {
    if (treeReadOnly) return;
    setEditingNode(node);
    setShowNodeEditor(true);
    setSelectedId(node.id);
    setDetailNodeId(null);
  };


  const focusedNode = selectedId ? getNode(selectedId) : null;
  const detailNode = detailNodeId ? getNode(detailNodeId) : null;
  const showTree = Boolean(currentTree);
  const isFirstTreeWelcomeOpen = Boolean(
    viewMode === "tree" &&
      currentTree &&
      currentTree.ownerId === userId &&
      currentTree.nodes.length === 1 &&
      firstTreeWelcomeTreeId === currentTree.id
  );
  const firstTreeWelcomeRoot = isFirstTreeWelcomeOpen
    ? currentTree?.nodes[0] ?? null
    : null;
  const coParentOptions = useMemo(() => {
    if (!currentTree || !addParentId || addType !== "child" || editingNode) {
      return [];
    }

    const baseParent = getNode(addParentId);
    if (!baseParent) return [];

    return (baseParent.partners || [])
      .map((partnerId) => currentTree.nodes.find((node) => node.id === partnerId))
      .filter((partner): partner is FamilyNode => Boolean(partner))
      .map((partner) => ({ id: partner.id, label: partner.label }))
      .sort((a, b) => a.label.localeCompare(b.label, "id", { sensitivity: "base" }));
  }, [addParentId, addType, currentTree, editingNode, getNode]);

  const handleExportTree = useCallback(() => {
    if (!currentTree || currentTree.nodes.length === 0) {
      showNotification(copy.notifNoDataToExport);
      return;
    }

    try {
      downloadTreeJson(currentTree);
      showNotification(copy.notifExported(currentTree.nodes.length));
    } catch (error) {
      console.error("Failed to export tree:", error);
      showNotification(copy.notifExportFailed);
    }
  }, [copy, currentTree, showNotification]);

  const handleExportPdf = useCallback(async () => {
    if (!currentTree || currentTree.nodes.length === 0) {
      showNotification(copy.notifNoDataToExport);
      return;
    }

    try {
      const { downloadTreePdf } = await import("../../lib/export/treePdf");
      await downloadTreePdf(currentTree, locale);
      showNotification(copy.notifPdfExported(currentTree.nodes.length));
    } catch (error) {
      console.error("Failed to export tree PDF:", error);
      showNotification(copy.notifPdfExportFailed);
    }
  }, [copy, currentTree, locale, showNotification]);

  useEffect(() => {
    if (!openActionMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      const actionMenuContainers = [mobileActionMenuRef.current, desktopActionMenuRef.current];
      if (actionMenuContainers.some((container) => container?.contains(target))) {
        return;
      }

      setOpenActionMenu(null);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [openActionMenu]);

  const toggleActionMenu = useCallback((menu: ActionMenuKey) => {
    setOpenActionMenu((current) => (current === menu ? null : menu));
  }, []);

  const treeActions = [
    ...(treeCapabilities.canManageMembers ? [{
      label: copy.requests,
      onClick: () => setShowAccessInbox(true),
      Icon: ShieldCheck,
    }] : []),
    ...(treeCapabilities.canInvite ? [{
      label: copy.invite,
      onClick: () => setShowInviteModal(true),
      Icon: UserPlus,
    }] : []),
    ...(treeCapabilities.canEdit ? [{
      label: copy.import,
      onClick: () => setShowImportModal(true),
      Icon: Upload,
    }] : []),
    {
      label: copy.export,
      onClick: handleExportTree,
      Icon: Download,
    },
    {
      label: copy.exportPdf,
      onClick: handleExportPdf,
      Icon: FileText,
    },
  ];

  const actionGroups = [
    {
      key: "manage" as const,
      label: copy.manage,
      Icon: UserPlus,
      actions: treeActions.slice(0, 3),
    },
    {
      key: "download" as const,
      label: copy.archive,
      Icon: Download,
      actions: treeActions.slice(3),
    },
  ];

  const renderActionGroup = (
    group: (typeof actionGroups)[number],
    groupIndex: number,
    layout: "mobile" | "desktop"
  ) => {
    const GroupIcon = group.Icon;
    const isOpen = openActionMenu === group.key;
    const summaryClassName =
      layout === "mobile"
        ? "inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center gap-1.5 rounded-full border border-cream-400 bg-cream-200 px-0 text-[11px] font-bold text-ink-600 transition hover:bg-cream-50 hover:text-ink-800 hover:shadow-sm sm:w-auto sm:px-3 [&::-webkit-details-marker]:hidden"
        : "flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-cream-400 bg-cream-200 px-3 py-1.5 text-xs font-bold text-ink-600 transition-colors hover:bg-cream-50 hover:text-ink-800 hover:shadow-sm";
    const menuClassName =
      layout === "mobile"
        ? `absolute top-11 z-50 min-w-40 rounded-xl border border-cream-300 bg-cream-50 p-1.5 shadow-xl shadow-ink-900/10 ${
            groupIndex === actionGroups.length - 1 ? "right-0" : "left-0"
          }`
        : "absolute right-0 top-10 z-50 min-w-40 rounded-xl border border-cream-300 bg-cream-50 p-1.5 shadow-xl shadow-ink-900/10";

    return (
      <div key={group.key} className="group relative inline-flex shrink-0">
        <button
          type="button"
          className={summaryClassName}
          title={group.label}
          aria-label={group.label}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => toggleActionMenu(group.key)}
        >
          <GroupIcon className="h-[15px] w-[15px]" />
          <span className="hidden sm:inline">{group.label}</span>
        </button>
        {isOpen ? (
          <div className={menuClassName}>
            {group.actions.map((btn) => {
              const Icon = btn.Icon;
              return (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => {
                    setOpenActionMenu(null);
                    btn.onClick();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-ink-700 transition hover:bg-cream-200"
                >
                  <Icon className="h-[15px] w-[15px] text-brand-700" />
                  {btn.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  const stats = {
    generations: 0,
    members: currentTree?.nodes.length || 0,
    earliestRecord: new Date().getFullYear(),
  };

  if (currentTree) {
    const generationSet = new Set(currentTree.nodes.map((n) => n.generation));
    stats.generations = generationSet.size;
    const years = currentTree.nodes
      .map((n) => n.year)
      .filter((y) => y !== null) as number[];
    if (years.length > 0) stats.earliestRecord = Math.min(...years);
  }

  // Loading state: session or tree data still hydrating.
  const isSessionLoading = status === "loading";
  const isTreeLoading = syncStatus === "loading";
  const showLoading = isSessionLoading || (isTreeLoading && !currentTree && !hasCreatedTree);

  if (showLoading) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#faf6ed]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#dfceb0]/45 blur-3xl" />
          <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-[#ece2cc]/65 blur-3xl" />
        </div>
        <div className="relative flex max-w-[min(88vw,28rem)] flex-col items-center gap-5 text-center">
          <div className="relative flex h-24 w-64 items-center justify-center sm:h-28 sm:w-80">
            <div className="absolute left-1/2 top-1/2 h-20 w-44 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[#dfceb0]/40 blur-2xl sm:w-56" />
            <Image
              src="/logo/lifestory-logo.png"
              alt="Lifestory"
              width={3243}
              height={975}
              priority
              className="relative h-auto w-full object-contain drop-shadow-[0_12px_22px_rgba(130,105,60,0.14)]"
            />
          </div>
          <p className="font-serif text-2xl text-[#3f342d]">
            {locale === "id" ? "Memuat pohon keluarga..." : "Loading family tree..."}
          </p>
          <p className="text-sm text-ink-500">
            {locale === "id" ? "Menyiapkan ruang arsip Anda" : "Preparing your archive space"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={showTree ? "h-[100dvh] w-screen overflow-hidden bg-[#2c1e16] flex flex-col relative text-[#3f342d]" : "min-h-screen bg-[#faf6ed] pb-32"}>
      {/* Vignette removed for a cleaner look */}
      {!showTree && !hasCreatedTree && (
        <FamilyDiscoveryGate userName={userName} onStart={handleStartTree} />
      )}

      {showTree && (
        <>
          {/* HUD HEADER */}
          <header
            className="fixed top-0 left-0 right-0 z-40 flex h-[144px] flex-col justify-center gap-1.5 border-b border-cream-300 bg-cream-50/90 px-3 py-2 text-ink-800 shadow-[0_1px_0_rgba(255,255,255,0.65),0_10px_30px_-18px_rgba(59,43,24,0.4)] backdrop-blur-xl sm:h-[108px] sm:px-4 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-6 xl:px-8"
          >
            {/* Left: family tree context */}
            <div className="flex w-full min-w-0 items-center justify-between gap-3 lg:w-auto lg:shrink-0">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <Link
                  href="/"
                  className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cream-400 bg-cream-50 text-brand-700 transition hover:border-brand-300 hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100"
                  title={locale === "id" ? "Kembali ke beranda" : "Back to home"}
                  aria-label={locale === "id" ? "Kembali ke beranda" : "Back to home"}
                >
                  <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                </Link>
                <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-cream-50 shadow-[0_6px_16px_-6px_rgba(130,105,60,0.6)] ring-1 ring-inset ring-cream-50/15 sm:inline-flex">
                  <GitBranch className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <div className="mb-0.5 hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700 sm:flex">
                    <span>{locale === "id" ? "Pohon keluarga" : "Family tree"}</span>
                    <span className="h-1 w-1 rounded-full bg-brand-300" />
                    <span className="font-semibold tracking-[0.12em] text-ink-500">
                      {stats.members} {locale === "id" ? "anggota" : "members"}
                    </span>
                  </div>
                  {treeSummaries.length > 1 ? (
                    <select
                      value={currentTree!.id}
                      onChange={(event) => {
                        void selectTree(event.target.value);
                      }}
                      className="-ml-2 block min-w-0 max-w-[180px] cursor-pointer rounded-lg border border-transparent bg-transparent px-2 py-0 font-serif text-lg font-bold leading-tight text-ink-800 outline-none transition hover:border-cream-400 hover:bg-cream-50 focus:border-brand-700 focus:bg-cream-50 sm:max-w-[280px] lg:max-w-[240px] xl:max-w-[320px]"
                      aria-label={locale === "id" ? "Pilih pohon keluarga" : "Select family tree"}
                    >
                      {treeSummaries.map((tree) => (
                        <option key={tree.id} value={tree.id}>
                          {tree.name} ({tree.nodeCount})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <h1 className="min-w-0 max-w-[180px] truncate font-serif text-lg font-bold leading-tight text-ink-800 sm:max-w-[280px] lg:max-w-[240px] xl:max-w-[320px]">
                      {currentTree!.name}
                    </h1>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-1.5 py-1.5 lg:hidden">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-cream-50 ring-1 ring-inset ring-cream-50/20">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <div className="hidden pr-1 text-left leading-none sm:block">
                  <p className="max-w-[100px] truncate text-[11px] font-bold text-ink-800">{userName}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-500">
                    {accountRoleLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile/tablet controls */}
            <div className="flex w-full min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center lg:hidden">
              <div className="min-w-0 flex-1">
                <SearchBar nodes={currentTree!.nodes} onSelect={handleSearchSelect} />
              </div>
              <div className="flex w-full flex-nowrap items-center gap-1.5 pb-0.5 sm:w-auto">
                <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cream-400 bg-cream-200 p-1">
                  <span className="hidden pl-2 pr-1 text-[9px] font-black uppercase tracking-[0.14em] text-ink-500 sm:inline">
                    {copy.mode}
                  </span>
                  <button
                    onClick={() => setViewMode("tree")}
                    className={`h-8 flex-1 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wide transition-all min-[380px]:px-3 min-[380px]:text-[11px] sm:flex-none ${
                      viewMode === "tree"
                        ? "bg-brand-700 text-white shadow-[0_2px_8px_-1px_rgba(130,105,60,0.45)]"
                        : "text-ink-500 hover:bg-cream-300/70 hover:text-ink-800"
                    }`}
                  >
                    {copy.viewTree}
                  </button>
                  <button
                    onClick={() => setViewMode("timeline")}
                    className={`h-8 flex-1 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wide transition-all min-[380px]:px-3 min-[380px]:text-[11px] sm:flex-none ${
                      viewMode === "timeline"
                        ? "bg-brand-700 text-white shadow-[0_2px_8px_-1px_rgba(130,105,60,0.45)]"
                        : "text-ink-500 hover:bg-cream-300/70 hover:text-ink-800"
                    }`}
                  >
                    {copy.viewTimeline}
                  </button>
                </div>
                <div ref={mobileActionMenuRef} className="flex items-center gap-1.5">
                  {actionGroups.map((group, groupIndex) =>
                    renderActionGroup(group, groupIndex, "mobile")
                  )}
                </div>
              </div>
            </div>

            {/* Center (desktop): Search & view mode */}
            <div className="hidden items-center gap-3 lg:flex">
              <div className="w-64 lg:w-72">
                <SearchBar nodes={currentTree!.nodes} onSelect={handleSearchSelect} />
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-cream-400 bg-cream-200 p-1">
                <span className="pl-3 pr-1 text-[9px] font-black uppercase tracking-[0.14em] text-ink-500">
                  {copy.mode}
                </span>
                <button
                  onClick={() => setViewMode("tree")}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                    viewMode === "tree"
                      ? "bg-brand-700 text-white shadow-[0_2px_8px_-1px_rgba(130,105,60,0.45)]"
                      : "text-ink-500 hover:bg-cream-300/70 hover:text-ink-800"
                  }`}
                >
                  {copy.viewTree}
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                    viewMode === "timeline"
                      ? "bg-brand-700 text-white shadow-[0_2px_8px_-1px_rgba(130,105,60,0.45)]"
                      : "text-ink-500 hover:bg-cream-300/70 hover:text-ink-800"
                  }`}
                >
                  {copy.viewTimeline}
                </button>
              </div>
            </div>

            {/* Right (desktop): operations & profile */}
            <div className="hidden items-center gap-3 lg:flex">
              <div className="hidden xl:block">
                <SyncStatusIndicator
                  status={syncStatusInfo}
                  onRetry={() => {
                    void retrySync();
                  }}
                />
              </div>
              <div ref={desktopActionMenuRef} className="flex items-center gap-2">
                {actionGroups.map((group, groupIndex) =>
                  renderActionGroup(group, groupIndex, "desktop")
                )}
              </div>
              {/* User profile */}
              <div className="flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-1.5 py-1.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-cream-50 ring-1 ring-inset ring-cream-50/20">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <div className="hidden pr-1 text-left leading-none sm:block">
                  <p className="max-w-[80px] truncate text-[11px] font-bold text-ink-800">{userName}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-500">
                    {accountRoleLabel}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="fixed right-3 top-[152px] z-50 sm:right-4 sm:top-[116px] lg:top-20 xl:hidden">
            <SyncStatusIndicator
              status={syncStatusInfo}
              onRetry={() => {
                void retrySync();
              }}
            />
          </div>

          {/* MAIN CANVAS */}
          <main className="flex-1 w-full h-full relative overflow-hidden mt-[144px] sm:mt-[108px] lg:mt-16">
            {viewMode === "tree" ? (
              <CanvasErrorBoundary
                fallbackMessage={locale === "id" ? "Terjadi kesalahan pada canvas" : "Canvas rendering error"}
              >
                <>
                  <FamilyTreeCanvas
                    layout={layoutGraph}
                    graph={currentTree!.graph}
                    selectedId={selectedId}
                    onSelectNode={handleCanvasSelect}
                    onAddNode={handleAddNode}
                    onReorderSiblings={handleReorderSiblings}
                    suppressBottomControls={isFirstTreeWelcomeOpen}
                    readOnly={treeReadOnly}
                    viewportInsets={{
                      top: 8,
                      bottom: isTomeOpen || isVaultOpen ? 92 : 72,
                      right: detailNode && (typeof window === "undefined" || window.innerWidth >= 768) ? 472 : 0,
                    }}
                  />
                  <FamilyMemberList
                    nodes={currentTree!.nodes}
                    selectedId={selectedId}
                    locale={locale}
                    onSelect={handleSearchSelect}
                  />
                </>
              </CanvasErrorBoundary>
            ) : (
              <div className="h-full overflow-y-auto bg-[#FAF7F0] p-3 sm:p-5 lg:p-8">
                <TimelineView
                  nodes={currentTree!.nodes}
                  onSelectNode={(node) => handleOpenNodeDetail(node.id)}
                />
              </div>
            )}

            <AnimatePresence>
              {viewMode === "tree" && firstTreeWelcomeRoot && (
                <FirstTreeWelcome
                  key={firstTreeWelcomeRoot.id}
                  rootName={firstTreeWelcomeRoot.label}
                  isSubmitting={isFirstTreeWelcomeSubmitting}
                  error={firstTreeWelcomeError}
                  onDismiss={() => {
                    void handleDismissFirstTreeWelcome();
                  }}
                  onChooseRelationship={(relationship) => {
                    void handleWelcomeRelationship(relationship);
                  }}
                />
              )}
            </AnimatePresence>

            {viewMode === "tree" && focusedNode && !detailNode && !showNodeEditor && !isFirstTreeWelcomeOpen && (
              <button
                type="button"
                onClick={() => handleOpenNodeDetail(focusedNode.id)}
                className="absolute bottom-16 left-3 z-30 inline-flex max-w-[calc(100vw-12.5rem)] items-center gap-2 rounded-full border border-brand-700/30 bg-[#fffaf0]/95 px-3 py-2 text-left text-xs font-bold text-ink-800 shadow-[0_12px_28px_-20px_rgba(45,33,22,0.7),0_1px_0_rgba(255,255,255,0.82)_inset] backdrop-blur-md transition hover:border-brand-700 hover:bg-white sm:bottom-20 sm:left-4 sm:max-w-xs lg:hidden"
                aria-label={`${copy.openDetail}: ${focusedNode.label}`}
              >
                <PanelRightOpen className="h-4 w-4 shrink-0 text-brand-700" />
                <span className="min-w-0 truncate">{focusedNode.label}</span>
                <span className="shrink-0 rounded-full bg-brand-700 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  {copy.openDetail}
                </span>
              </button>
            )}

            {/* FLOATING ACTION DRAWERS AT BOTTOM LEFT */}
            <div className={`absolute bottom-3 left-3 z-30 items-center gap-2 pointer-events-auto select-none sm:bottom-4 sm:left-4 lg:bottom-6 lg:left-6 ${isFirstTreeWelcomeOpen ? "hidden sm:flex" : "flex"}`}>
              <div className="flex items-center bg-white/70 backdrop-blur-md rounded-xl border border-[#dccfb3] p-1 shadow-sm">
                <button
                  onClick={() => {
                    setIsVaultOpen(!isVaultOpen);
                    setIsTomeOpen(false);
                  }}
                  className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold transition-all sm:gap-2 sm:px-4 ${
                    isVaultOpen ? "bg-[#82693c] text-white shadow-md" : "text-[#5a4d42] hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{locale === "id" ? "Galeri" : "Gallery"}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black sm:ml-1 ${
                    isVaultOpen ? "bg-white/20 text-white" : "bg-[#82693c]/10 text-[#82693c]"
                  }`}>
                    {relicsCount}
                  </span>
                </button>
                <div className="w-px h-4 bg-[#dccfb3]/50 mx-1" />
                <button
                  onClick={() => {
                    setIsTomeOpen(!isTomeOpen);
                    setIsVaultOpen(false);
                  }}
                  className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold transition-all sm:gap-2 sm:px-4 ${
                    isTomeOpen ? "bg-[#82693c] text-white shadow-md" : "text-[#5a4d42] hover:bg-white hover:shadow-sm"
                  }`}
                  title={locale === "id" ? "Buka Cerita Keluarga" : "Open Family Stories"}
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">{locale === "id" ? "Cerita" : "Stories"}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black sm:ml-1 ${
                    isTomeOpen ? "bg-white/20 text-white" : "bg-[#82693c]/10 text-[#82693c]"
                  }`}>
                    {storiesCount}
                  </span>
                </button>
              </div>
            </div>
          </main>

          {/* Family stories drawer */}
          <div
            className={`fixed top-[144px] right-0 bottom-0 w-full border-l border-cream-400 shadow-[-8px_0_24px_rgba(59,43,24,0.1)] z-40 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col bg-cream-50 sm:top-[108px] sm:w-96 md:w-[420px] lg:top-16 ${
              isTomeOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header Drawer */}
            <div className="flex items-center justify-between border-b border-[#dccfb3] bg-[#faf6ed] p-4 text-[#3f342d]">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#82693c]" />
                <div>
                  <h3 className="font-serif text-base font-bold tracking-wide">
                    {locale === "id" ? "Cerita Keluarga" : "Family Stories"}
                  </h3>
                  <p className="text-[10px] text-[#9c8e7e] font-medium italic">
                    {locale === "id" ? "Catatan yang terhubung ke anggota keluarga" : "Notes connected to family members"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTomeOpen(false)}
                className="rounded-full hover:bg-[#ece2cc] p-2 text-[#73685f] font-sans font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            {/* List of Stories */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {storiesList.length > 0 ? (
                storiesList.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => {
                      setIsTomeOpen(false);
                      handleOpenNodeDetail(node.id);
                    }}
                    className="cursor-pointer overflow-hidden rounded-xl border border-[#dccfb3] bg-white p-4 transition-all hover:border-[#b08e51] hover:shadow-[0_4px_16px_rgba(59,43,24,0.08)] hover:-translate-y-1"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#82693c] bg-[#f5efe1] px-2 py-0.5 rounded">
                        {node.year}
                      </span>
                      <span className="text-[10px] text-[#9c8e7e] font-medium">
                        Gen {node.generation}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-lg text-[#3f342d]">
                      {node.label}
                    </h4>
                    <p className="line-clamp-3 text-sm leading-relaxed text-[#73685f] mt-2">
                      {node.content.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 px-4">
                  <p className="text-sm font-bold text-[#5a4d42]">
                    {locale === "id" ? "Belum ada cerita tertulis." : "No stories written yet."}
                  </p>
                  <p className="text-xs text-[#9c8e7e] mt-1 leading-relaxed">
                    {locale === "id" ? "Tambahkan biografi pada profil anggota keluarga untuk mencatatkan kisah mereka di sini." : "Add a biography to a family member's profile to record their stories here."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Family gallery drawer */}
          <div
            className={`fixed bottom-0 left-0 right-0 h-[38dvh] min-h-56 max-h-80 border-t border-[#dccfb3] shadow-[0_-4px_16px_rgba(59,43,24,0.1)] z-40 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col bg-[#fdfbf6] sm:h-64 ${
              isVaultOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
            {/* Header Drawer */}
            <div className="flex items-center justify-between border-b border-[#dccfb3] bg-[#faf6ed] p-4 text-[#3f342d]">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-[#82693c]" />
                <div>
                  <h3 className="font-serif text-base font-bold tracking-wide">
                    {locale === "id" ? "Galeri Keluarga" : "Family Gallery"}
                  </h3>
                  <p className="text-[10px] text-[#9c8e7e] font-medium italic">
                    {locale === "id" ? "Foto dan arsip visual keluarga" : "Family photos and visual archive"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVaultOpen(false)}
                className="rounded-full hover:bg-[#ece2cc] p-2 text-[#73685f] font-sans font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            {/* List of Images */}
            <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-center">
              {relicsList.length > 0 ? (
                relicsList.map((item, index) => (
                  <div
                    key={`${item.ownerId}-${index}`}
                    onClick={() => {
                      setIsVaultOpen(false);
                      handleOpenNodeDetail(item.ownerId);
                    }}
                    className="flex-none w-44 h-36 bg-[#faf6ed] rounded-xl border border-[#dccfb3] overflow-hidden relative group cursor-pointer transition-all hover:border-[#b08e51] hover:shadow-md"
                  >
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={item.caption || item.ownerName}
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        muted
                      />
                    )}
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-2 text-white">
                      <span className="text-xs font-bold truncate">
                        {item.caption || item.ownerName}
                      </span>
                      <span className="text-[9px] text-[#e9e0d0] font-semibold">
                        {item.ownerName}
                        {item.ownerYear ? ` - ${item.ownerYear}` : ""}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-10">
                  <p className="text-sm font-semibold text-[#5a4d42]">
                    {locale === "id" ? "Galeri masih kosong." : "Gallery is empty."}
                  </p>
                  <p className="text-xs text-[#9c8e7e] mt-1">
                    {locale === "id" ? "Tambahkan foto atau arsip dari tab Galeri di profil anggota keluarga." : "Add photos or archive media from a family member's Gallery tab."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Compact stats pill: top right below header */}
          <div className="fixed top-20 right-6 z-30 pointer-events-none hidden lg:block">
            <div className="rounded-xl border border-[#dccfb3] bg-white/70 px-4 py-2 shadow-sm backdrop-blur-md text-[#5a4d42] text-xs flex items-center gap-3 whitespace-nowrap">
              <div className="flex items-center gap-1.5" title={copy.statMembers}>
                <Users className="h-3.5 w-3.5 text-[#82693c]" />
                <span className="font-bold">{stats.members}</span>
                <span className="text-[#9c8e7e]">{locale === "id" ? "anggota" : "members"}</span>
              </div>
              <span className="text-[#dccfb3]">{"\u00b7"}</span>
              <div className="flex items-center gap-1.5" title={copy.statGenerations}>
                <Layers3 className="h-3.5 w-3.5 text-[#82693c]" />
                <span className="font-bold">{stats.generations}</span>
                <span className="text-[#9c8e7e]">{locale === "id" ? "generasi" : "gen"}</span>
              </div>
              <div className="flex items-center gap-1.5" title={copy.statEarliest}>
                <History className="h-3.5 w-3.5 text-[#82693c]" />
                <span className="font-bold">{stats.earliestRecord}</span>
              </div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {detailNode && (
              <BioModal
                key={detailNode.id}
                node={detailNode}
                onClose={() => setDetailNodeId(null)}
                onEdit={() => handleEditNode(detailNode)}
                onDelete={() => handleDeleteNode(detailNode.id)}
                onAddRelative={(type) => {
                  handleAddNode(detailNode.id, type);
                }}
                readOnly={treeReadOnly}
              />
            )}
          </AnimatePresence>

          <NodeEditor
            isOpen={showNodeEditor && !treeReadOnly}
            onClose={() => {
              setShowNodeEditor(false);
              setEditingNode(null);
            }}
            onSave={handleSaveNode}
            treeId={currentTree?.id}
            editingNode={editingNode}
            addType={addType}
            parentId={addParentId}
            coParentOptions={coParentOptions}
          />

          <FamilyAccessInbox
            isOpen={showAccessInbox}
            onClose={() => setShowAccessInbox(false)}
            onReviewed={showNotification}
          />

          {currentTree && (
            <InviteModal
              isOpen={showInviteModal}
              onClose={() => setShowInviteModal(false)}
              treeId={currentTree!.id}
              treeName={currentTree!.name}
            />
          )}

          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={(nodes) => {
              importNodes(nodes);
              showNotification(copy.notifImported(nodes.length));
            }}
          />

          {syncConflict && (
            <ConflictResolutionModal
              conflicts={syncConflict.conflicts}
              onResolve={(resolutions) => {
                void resolveSyncConflict(resolutions)
                  .then(() => showNotification(copy.notifConflictResolved))
                  .catch(() => showNotification(copy.notifConflictFailed));
              }}
            />
          )}

          {notification && (
            <div className="fixed left-1/2 top-[172px] z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 rounded-full border border-cream-400 bg-cream-50/95 px-5 py-3 text-center text-sm font-medium text-ink-800 shadow-md backdrop-blur sm:top-[120px] lg:top-20">
              {notification}
            </div>
          )}
        </>
      )}
    </div>
  );
}
