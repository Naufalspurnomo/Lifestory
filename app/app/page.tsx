"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

import FamilyTreeCanvas from "../../components/tree/FamilyTreeCanvas";
import CanvasErrorBoundary from "../../components/tree/CanvasErrorBoundary";
import NodeEditor from "../../components/tree/NodeEditor";
import BioModal from "../../components/tree/BioModal";
import WelcomeScreen from "../../components/tree/WelcomeScreen";
import InviteModal from "../../components/tree/InviteModal";
import ImportModal from "../../components/tree/ImportModal";
import ConflictResolutionModal from "../../components/tree/ConflictResolutionModal";
import SearchBar from "../../components/tree/SearchBar";
import TimelineView from "../../components/tree/TimelineView";
import SyncStatusIndicator from "../../components/tree/SyncStatusIndicator";
import { LanguageToggle } from "../../components/site/LanguageToggle";
import { useTreeState } from "../../lib/hooks/useTreeState";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { downloadTreeJson } from "../../lib/sync/ExportManager";
import { resolveDisplayMediaUrl } from "../../lib/media/public-url";
import {
  BookOpen,
  ChevronLeft,
  GitBranch,
  History,
  ImageIcon,
  Layers3,
  Users,
} from "lucide-react";

import type { FamilyNode } from "../../lib/types/tree";
import type { MediaItem } from "../../lib/types/tree";

type GalleryEntry = MediaItem & {
  ownerId: string;
  ownerName: string;
  ownerYear: number | null;
};

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
          notifTreeCreated: "Pohon keluarga dibuat! Anda adalah simpul pertama.",
          notifTreeCreateFailed:
            "Pohon belum dibuat di server. Periksa koneksi lalu coba lagi.",
          notifProfileUpdated: "Profil diperbarui",
          notifAutoParentCreated: "Orang tua placeholder dibuat otomatis.",
          notifAdded: (name: string) => `${name} ditambahkan ke pohon`,
          notifError: (error?: string) => `Error: ${error || "Tidak diketahui"}`,
          notifDeleted: (name: string) => `${name} dihapus dari pohon`,
          notifImported: (count: number) =>
            `${count} anggota keluarga berhasil diimpor`,
          notifExported: (count: number) =>
            `Ekspor selesai: ${count} anggota dengan relasi lengkap.`,
          notifNoDataToExport: "Belum ada data keluarga untuk diekspor.",
          notifExportFailed: "Gagal mengekspor data keluarga.",
          notifConflictResolved: "Konflik sinkronisasi berhasil diselesaikan.",
          notifConflictFailed:
            "Resolusi konflik belum tersimpan. Salinan lokal tetap aman.",
          placeholderFather: "Ayah (Tidak Diketahui)",
          placeholderMother: "Ibu (Tidak Diketahui)",
          pageTitle: "Pohon Keluarga",
          pageDescription:
            "Visualisasikan sejarah keluarga Anda, simpan cerita, dan wariskan memori untuk generasi mendatang.",
          viewTree: "Pohon",
          viewTimeline: "Linimasa",
          filterAll: "Semua",
          filterCore: "Keluarga Inti",
          comingSoon: "Segera Hadir",
          invite: "Undang",
          import: "Import",
          export: "Ekspor",
          addMemberTitle: "Tambah anggota keluarga",
          statGenerations: "Generasi",
          statMembers: "Anggota Keluarga",
          statLines: "Garis Keluarga",
          statEarliest: "Catatan Terawal",
        }
        : {
          fallbackUser: "User",
          notifTreeCreated: "Family tree created! You are the first node.",
          notifTreeCreateFailed:
            "The tree was not created on the server. Check your connection and try again.",
          notifProfileUpdated: "Profile updated",
          notifAutoParentCreated: "Placeholder parents created automatically.",
          notifAdded: (name: string) => `${name} added to tree`,
          notifError: (error?: string) => `Error: ${error || "Unknown error"}`,
          notifDeleted: (name: string) => `${name} removed from tree`,
          notifImported: (count: number) =>
            `${count} family members imported successfully`,
          notifExported: (count: number) =>
            `Export complete: ${count} members with full relationship mapping.`,
          notifNoDataToExport: "No family data available to export.",
          notifExportFailed: "Failed to export family data.",
          notifConflictResolved: "Sync conflict resolved successfully.",
          notifConflictFailed:
            "Conflict resolution has not been saved. Your local copy remains safe.",
          placeholderFather: "Father (Unknown)",
          placeholderMother: "Mother (Unknown)",
          pageTitle: "Family Trees",
          pageDescription:
            "Visualize your family history, preserve stories, and pass memory to future generations.",
          viewTree: "Tree",
          viewTimeline: "Timeline",
          filterAll: "All",
          filterCore: "Core Family",
          comingSoon: "Coming Soon",
          invite: "Invite",
          import: "Import",
          export: "Export",
          addMemberTitle: "Add family member",
          statGenerations: "Generations",
          statMembers: "Family Members",
          statLines: "Family Lines",
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
    selectTree,
    layoutGraph,
    createTree,
    addNode,
    updateNode,
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

  useEffect(() => {
    (window as any).importNodes = importNodes;
  }, [importNodes]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [addType, setAddType] = useState<
    "parent" | "partner" | "child" | "sibling"
  >("child");
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<FamilyNode | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [hasCreatedTree, setHasCreatedTree] = useState(false);
  const [viewMode, setViewMode] = useState<"tree" | "timeline">("tree");

  const [isTomeOpen, setIsTomeOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);

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
      }
    },
    [getNode, deleteNode, showNotification, copy]
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


  const handleStartTree = useCallback(async () => {
    const result = await createTree();
    if (result) {
      setHasCreatedTree(true);
      showNotification(copy.notifTreeCreated);
    } else {
      showNotification(copy.notifTreeCreateFailed);
    }
  }, [
    copy.notifTreeCreated,
    copy.notifTreeCreateFailed,
    createTree,
    showNotification,
  ]);

  useEffect(() => {
    if (userTree) {
      setHasCreatedTree(true);
    }
  }, [userTree]);

  const handleAddNode = (
    parentId: string,
    type: "parent" | "partner" | "child" | "sibling"
  ) => {
    setAddType(type);
    setAddParentId(parentId);
    setEditingNode(null);
    setSelectedId(null);
    setShowNodeEditor(true);
  };

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
    setEditingNode(node);
    setShowNodeEditor(true);
    setSelectedId(null);
  };


  const selectedNode = selectedId ? getNode(selectedId) : null;
  const showTree = Boolean(currentTree);
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

  const treeActions = [
    {
      label: copy.invite,
      onClick: () => setShowInviteModal(true),
      icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8 12 3 7 8 M12 3v12",
    },
    {
      label: copy.import,
      onClick: () => setShowImportModal(true),
      icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
    },
    {
      label: copy.export,
      onClick: handleExportTree,
      icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
    },
  ];

  const stats = {
    generations: 0,
    members: currentTree?.nodes.length || 0,
    lines: 0,
    earliestRecord: new Date().getFullYear(),
  };

  if (currentTree) {
    const generationSet = new Set(currentTree.nodes.map((n) => n.generation));
    stats.generations = generationSet.size;
    const lines = new Set(currentTree.nodes.map((n) => n.line));
    stats.lines = lines.size;
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
          <p className="text-sm text-[#7b6f63]">
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
        <WelcomeScreen userName={userName} onStart={handleStartTree} />
      )}

      {showTree && (
        <>
          {/* HUD HEADER */}
          <header 
            className="fixed top-0 left-0 right-0 z-40 flex h-[148px] flex-col justify-center gap-2 border-b border-[#dccfb3] px-3 py-2 text-[#3f342d] shadow-[0_4px_16px_rgba(59,43,24,0.08)] sm:h-[112px] sm:px-4 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-6 xl:px-8"
            style={{ 
              background: "linear-gradient(180deg, #fdfbf6 0%, #faf6ed 100%)",
            }}
          >
            {/* Sisi Kiri: konteks pohon keluarga */}
            <div className="flex w-full min-w-0 items-center justify-between gap-3 lg:w-auto lg:shrink-0">
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <Link
                  href="/"
                  className="group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dccfb3] bg-white/80 text-[#82693c] shadow-[0_10px_24px_rgba(59,43,24,0.08)] backdrop-blur-md transition hover:border-[#c5b395] hover:bg-white hover:text-[#3f342d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#82693c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf6ed]"
                  title={locale === "id" ? "Kembali ke beranda" : "Back to home"}
                  aria-label={locale === "id" ? "Kembali ke beranda" : "Back to home"}
                >
                  <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                </Link>
                <div className="min-w-0">
                  <div className="mb-0.5 hidden items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#82693c] sm:flex">
                    <span>{locale === "id" ? "Pohon keluarga" : "Family tree"}</span>
                    <span className="h-1 w-1 rounded-full bg-[#dccfb3]" />
                    <span className="font-bold tracking-[0.12em] text-[#73685f]">
                      {stats.members} {locale === "id" ? "anggota" : "members"}
                    </span>
                  </div>
                  {treeSummaries.length > 1 ? (
                    <select
                      value={currentTree!.id}
                      onChange={(event) => {
                        void selectTree(event.target.value);
                      }}
                      className="-ml-2 block min-w-0 max-w-[180px] rounded-lg border border-transparent bg-transparent px-2 py-0 font-playfair text-lg font-bold leading-tight text-[#3f342d] outline-none transition hover:border-[#dccfb3] hover:bg-white/70 focus:border-[#82693c] focus:bg-white sm:max-w-[280px] lg:max-w-[260px] xl:max-w-[320px]"
                      aria-label={locale === "id" ? "Pilih pohon keluarga" : "Select family tree"}
                    >
                      {treeSummaries.map((tree) => (
                        <option key={tree.id} value={tree.id}>
                          {tree.name} ({tree.nodeCount})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <h1 className="min-w-0 max-w-[180px] truncate font-playfair text-lg font-bold leading-tight text-[#3f342d] sm:max-w-[280px] lg:max-w-[260px] xl:max-w-[320px]">
                      {currentTree!.name}
                    </h1>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-full border border-[#dccfb3] bg-[#fdfbf6] px-2 py-1.5 lg:hidden">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dccfb3] bg-gradient-to-br from-[#82693c] to-[#82693c] text-sm font-bold text-white shadow-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <div className="hidden text-left leading-none sm:block">
                  <p className="max-w-[100px] truncate text-[11px] font-bold text-[#3f342d]">{userName}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-[#73685f]">
                    {accountRoleLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile/tablet controls */}
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:hidden">
              <div className="min-w-0 flex-1">
                <SearchBar nodes={currentTree!.nodes} onSelect={setSelectedId} />
              </div>
              <div className="flex shrink-0 items-center justify-between gap-2">
                <div className="inline-flex flex-1 items-center gap-1 rounded-full border border-[#dccfb3] bg-[#f5efe1] p-1 sm:flex-none">
                  <button
                    onClick={() => setViewMode("tree")}
                    className={`h-8 flex-1 rounded-full px-3 text-[11px] font-bold uppercase transition-all sm:flex-none ${
                      viewMode === "tree"
                        ? "bg-[#82693c] text-white shadow-sm"
                        : "text-[#73685f] hover:bg-[#ece2cc] hover:text-[#3f342d]"
                    }`}
                  >
                    {copy.viewTree}
                  </button>
                  <button
                    onClick={() => setViewMode("timeline")}
                    className={`h-8 flex-1 rounded-full px-3 text-[11px] font-bold uppercase transition-all sm:flex-none ${
                      viewMode === "timeline"
                        ? "bg-[#82693c] text-white shadow-sm"
                        : "text-[#73685f] hover:bg-[#ece2cc] hover:text-[#3f342d]"
                    }`}
                  >
                    {copy.viewTimeline}
                  </button>
                </div>
                <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#dccfb3] bg-[#f5efe1] p-1">
                  {treeActions.map((btn) => (
                    <button
                      key={btn.label}
                      onClick={btn.onClick}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#5a4d42] transition-colors hover:bg-[#ece2cc] hover:text-[#3f342d] sm:w-auto sm:px-2.5"
                      title={btn.label}
                      aria-label={btn.label}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {btn.icon.split(" M").map((d, i) => (
                          <path key={i} d={i === 0 ? d : `M${d}`} />
                        ))}
                      </svg>
                      <span className="ml-1.5 hidden text-[11px] font-bold sm:inline">{btn.label}</span>
                    </button>
                  ))}
                </div>
                <LanguageToggle
                  compact
                  className="shrink-0 border-[#dccfb3] bg-[#fdfbf6] shadow-sm"
                />
              </div>
            </div>

            {/* Sisi Tengah: Search & View Mode */}
            <div className="hidden items-center gap-3 lg:flex">
              <div className="w-64 lg:w-72">
                <SearchBar nodes={currentTree!.nodes} onSelect={setSelectedId} />
              </div>
              <div className="inline-flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-[#f5efe1] border border-[#dccfb3]">
                <button
                  onClick={() => setViewMode("tree")}
                  className={`px-4 py-1.5 text-xs font-bold uppercase transition-all rounded-full ${
                    viewMode === "tree"
                      ? "bg-[#82693c] text-white shadow-sm"
                      : "text-[#73685f] hover:text-[#3f342d] hover:bg-[#ece2cc]"
                  }`}
                >
                  {copy.viewTree}
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`px-4 py-1.5 text-xs font-bold uppercase transition-all rounded-full ${
                    viewMode === "timeline"
                      ? "bg-[#82693c] text-white shadow-sm"
                      : "text-[#73685f] hover:text-[#3f342d] hover:bg-[#ece2cc]"
                  }`}
                >
                  {copy.viewTimeline}
                </button>
              </div>
            </div>

            {/* Sisi Kanan: Operasi & Profil Lord */}
            <div className="hidden items-center gap-3 lg:flex">
              <div className="hidden xl:block">
                <SyncStatusIndicator
                  status={syncStatusInfo}
                  onRetry={() => {
                    void retrySync();
                  }}
                />
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-[#f5efe1] border border-[#dccfb3]">
                {treeActions.map((btn) => (
                  <button
                    key={btn.label}
                    onClick={btn.onClick}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#5a4d42] hover:text-[#3f342d] hover:bg-[#ece2cc] rounded-full transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {btn.icon.split(" M").map((d, i) => (
                        <path key={i} d={i === 0 ? d : `M${d}`} />
                      ))}
                    </svg>
                    {btn.label}
                  </button>
                ))}
              </div>
              <LanguageToggle
                compact
                className="border-[#dccfb3] bg-[#fdfbf6] shadow-sm"
              />
              
              {/* User Profile */}
              <div className="flex items-center gap-2 border border-[#dccfb3] bg-[#fdfbf6] px-2 py-1.5 rounded-full">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#82693c] to-[#82693c] border border-[#dccfb3] shadow-sm text-sm font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <div className="text-left hidden sm:block leading-none">
                  <p className="text-[11px] font-bold text-[#3f342d] truncate max-w-[80px]">{userName}</p>
                  <p className="text-[9px] font-semibold text-[#73685f] uppercase tracking-wider">
                    {accountRoleLabel}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="fixed right-3 top-[156px] z-50 sm:right-4 sm:top-[120px] lg:top-20 xl:hidden">
            <SyncStatusIndicator
              status={syncStatusInfo}
              onRetry={() => {
                void retrySync();
              }}
            />
          </div>

          {/* MAIN CANVAS */}
          <main className="flex-1 w-full h-full relative overflow-hidden mt-[148px] sm:mt-[112px] lg:mt-16">
            {viewMode === "tree" ? (
              <CanvasErrorBoundary
                fallbackMessage={locale === "id" ? "Terjadi kesalahan pada canvas" : "Canvas rendering error"}
              >
                <FamilyTreeCanvas
                  layout={layoutGraph}
                  graph={currentTree!.graph}
                  selectedId={selectedId}
                  onSelectNode={setSelectedId}
                  onAddNode={handleAddNode}
                />
              </CanvasErrorBoundary>
            ) : (
              <div className="h-full overflow-y-auto bg-[#FAF7F0] p-3 sm:p-5 lg:p-8">
                <TimelineView
                  nodes={currentTree!.nodes}
                  onSelectNode={(node) => setSelectedId(node.id)}
                />
              </div>
            )}

            {/* FLOATING ACTION DRAWERS AT BOTTOM LEFT */}
            <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 pointer-events-auto select-none sm:bottom-4 sm:left-4 lg:bottom-6 lg:left-6">
              <div className="flex items-center bg-white/70 backdrop-blur-md rounded-xl border border-[#dccfb3] p-1 shadow-sm">
                <button
                  onClick={() => {
                    setIsVaultOpen(!isVaultOpen);
                    setIsTomeOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    isVaultOpen ? "bg-[#82693c] text-white shadow-md" : "text-[#5a4d42] hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{locale === "id" ? "Galeri" : "Gallery"}</span>
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
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
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                    isTomeOpen ? "bg-[#82693c] text-white shadow-md" : "text-[#5a4d42] hover:bg-white hover:shadow-sm"
                  }`}
                  title={locale === "id" ? "Buka Cerita Keluarga" : "Open Family Stories"}
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">{locale === "id" ? "Cerita" : "Stories"}</span>
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    isTomeOpen ? "bg-white/20 text-white" : "bg-[#82693c]/10 text-[#82693c]"
                  }`}>
                    {storiesCount}
                  </span>
                </button>
              </div>
            </div>
          </main>

          {/* TOME OF CHRONICLES (SLIDE OUT DRAWER - RIGHT) */}
          <div
            className={`fixed top-[148px] right-0 bottom-0 w-full border-l border-[#dccfb3] shadow-[-8px_0_24px_rgba(59,43,24,0.1)] z-40 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col bg-[#fdfbf6] sm:top-[112px] sm:w-96 md:w-[420px] lg:top-16 ${
              isTomeOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header Drawer */}
            <div className="flex items-center justify-between border-b border-[#dccfb3] bg-[#faf6ed] p-4 text-[#3f342d]">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#82693c]" />
                <div>
                  <h3 className="font-playfair text-base font-bold tracking-wide">
                    {locale === "id" ? "Cerita Keluarga" : "Family Stories"}
                  </h3>
                  <p className="text-[10px] text-[#9c8e7e] font-medium italic">
                    {locale === "id" ? "Kitab Hikayat Dinasti" : "Chronicles of the Dynasty"}
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
                      setSelectedId(node.id);
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
                    <h4 className="font-playfair font-bold text-lg text-[#3f342d]">
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

          {/* ROYAL VAULT (SLIDE UP DRAWER - BOTTOM) */}
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
                  <h3 className="font-playfair text-base font-bold tracking-wide">
                    {locale === "id" ? "Galeri Keluarga" : "Family Gallery"}
                  </h3>
                  <p className="text-[10px] text-[#9c8e7e] font-medium italic">
                    {locale === "id" ? "Gudang Pusaka Dinasti" : "Heritage Vault"}
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
                      setSelectedId(item.ownerId);
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
              <span className="text-[#dccfb3]">{"\u00b7"}</span>
              <div className="flex items-center gap-1.5" title={copy.statLines}>
                <GitBranch className="h-3.5 w-3.5 text-[#82693c]" />
                <span className="font-bold">{stats.lines}</span>
                <span className="text-[#9c8e7e]">{locale === "id" ? "cabang" : "branches"}</span>
              </div>
              <span className="text-[#dccfb3]">{"\u00b7"}</span>
              <div className="flex items-center gap-1.5" title={copy.statEarliest}>
                <History className="h-3.5 w-3.5 text-[#82693c]" />
                <span className="font-bold">{stats.earliestRecord}</span>
              </div>
            </div>
          </div>

          {selectedNode && (
            <BioModal
              node={selectedNode}
              onClose={() => setSelectedId(null)}
              onEdit={() => handleEditNode(selectedNode)}
              onDelete={() => handleDeleteNode(selectedNode.id)}
              onAddRelative={(type) => {
                handleAddNode(selectedNode.id, type);
              }}
            />
          )}

          <NodeEditor
            isOpen={showNodeEditor}
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
            <div className="fixed left-1/2 top-[156px] z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 rounded-full border border-[#dccfb3] bg-[#fdfbf6]/95 px-5 py-3 text-center text-sm font-medium text-[#3f342d] shadow-md backdrop-blur sm:top-[120px] lg:top-20">
              {notification}
            </div>
          )}
        </>
      )}
    </div>
  );
}
