"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
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
import { useTreeState } from "../../lib/hooks/useTreeState";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { downloadTreeJson } from "../../lib/sync/ExportManager";
import { Layers3, Users, GitBranch, History, ImageIcon, BookOpen } from "lucide-react";

import type { FamilyNode } from "../../lib/types/tree";

export default function AppHome() {
  const { data: session, status } = useSession();
  const { locale } = useLanguage();
  const user = session?.user;

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

  const relicsList = useMemo(() => {
    if (!currentTree) return [];
    return currentTree.nodes.filter((n) => n.imageUrl);
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

  // P3: Keyboard shortcuts — Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo),
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

  // ── Loading state: session or tree data still hydrating ──────────────────
  const isSessionLoading = status === "loading";
  const isTreeLoading = syncStatus === "loading";
  const showLoading = isSessionLoading || (isTreeLoading && !currentTree && !hasCreatedTree);

  if (showLoading) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#f7f5f1]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#f1d99b]/45 blur-3xl" />
          <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-[#e6ddc6]/65 blur-3xl" />
        </div>
        <div className="relative flex flex-col items-center gap-5 text-center">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-[#e6ab2f]/30" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#ddc7a2] bg-[linear-gradient(150deg,#fff8ea_0%,#f6e5c1_100%)] shadow-[0_14px_30px_rgba(169,116,21,0.2)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b07f2f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22v-8" /><path d="M12 14c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" /><path d="M12 14c4.42 0 8 3.58 8 8h-16c0-4.42 3.58-8 8-8z" />
              </svg>
            </div>
          </div>
          <p className="font-serif text-2xl text-[#3f342d]">
            {locale === "id" ? "Memuat pohon keluarga…" : "Loading family tree…"}
          </p>
          <p className="text-sm text-[#7b6f63]">
            {locale === "id" ? "Menyiapkan ruang arsip Anda" : "Preparing your archive space"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={showTree ? "h-screen w-screen overflow-hidden bg-[#2c1e16] flex flex-col relative text-[#3f342d]" : "min-h-screen bg-[#f7f5f1] pb-32"}>
      {/* Vignette removed for a cleaner look */}
      {!showTree && !hasCreatedTree && (
        <WelcomeScreen userName={userName} onStart={handleStartTree} />
      )}

      {showTree && (
        <>
          {/* HUD HEADER */}
          <header 
            className="fixed top-0 left-0 right-0 h-16 text-[#3f342d] border-b border-[#dccfb3] z-40 flex items-center justify-between pl-6 sm:pl-8 pr-6 shadow-[0_4px_16px_rgba(59,43,24,0.08)]"
            style={{ 
              background: "linear-gradient(180deg, #fdfbf6 0%, #faf6ed 100%)",
            }}
          >
            {/* Sisi Kiri: Logo Lifestory & Nama Dinasti */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center group transition-all"
                title="Kembali ke Beranda"
              >
                <div className="relative flex items-center justify-center p-1.5 rounded-lg hover:bg-[#ece2cc] transition-colors">
                  <svg className="h-4 w-4 mr-2 text-[#73685f] group-hover:text-[#3f342d] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <img 
                    src="/logo/lifestory-logo.webp" 
                    alt="Lifestory Logo" 
                    className="h-6 w-auto object-contain drop-shadow-[0_1px_2px_rgba(59,43,24,0.1)] transition-transform group-hover:scale-105" 
                  />
                </div>
              </Link>
              <div className="h-6 w-px bg-[#dccfb3]" />
              {treeSummaries.length > 1 ? (
                <select
                  value={currentTree!.id}
                  onChange={(event) => {
                    void selectTree(event.target.value);
                  }}
                  className="max-w-[170px] rounded-lg border border-[#dccfb3] bg-[#fdfbf6] px-2 py-1.5 font-playfair text-sm font-bold tracking-wide text-[#3f342d] outline-none sm:max-w-xs"
                  aria-label={locale === "id" ? "Pilih pohon keluarga" : "Select family tree"}
                >
                  {treeSummaries.map((tree) => (
                    <option key={tree.id} value={tree.id}>
                      {tree.name} ({tree.nodeCount})
                    </option>
                  ))}
                </select>
              ) : (
                <h1 className="font-playfair text-base md:text-lg font-bold tracking-wide text-[#3f342d] truncate max-w-[120px] sm:max-w-xs">
                  {currentTree!.name}
                </h1>
              )}
            </div>

            {/* Sisi Tengah: Search & View Mode */}
            <div className="flex items-center gap-3">
              <div className="w-36 sm:w-48 md:w-64 lg:w-72">
                <SearchBar nodes={currentTree!.nodes} onSelect={setSelectedId} />
              </div>
              <div className="hidden sm:inline-flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-[#f5efe1] border border-[#dccfb3]">
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
            <div className="flex items-center gap-3">
              <div className="hidden xl:block">
                <SyncStatusIndicator
                  status={syncStatusInfo}
                  onRetry={() => {
                    void retrySync();
                  }}
                />
              </div>
              <div className="hidden lg:flex items-center gap-2 px-2 py-1.5 rounded-full bg-[#f5efe1] border border-[#dccfb3]">
                {[
                  { label: copy.invite, onClick: () => setShowInviteModal(true), icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8 12 3 7 8 M12 3v12" },
                  { label: copy.import, onClick: () => setShowImportModal(true), icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" },
                  { label: copy.export, onClick: handleExportTree, icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" },
                ].map((btn) => (
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
              
              {/* User Profile */}
              <div className="flex items-center gap-2 border border-[#dccfb3] bg-[#fdfbf6] px-2 py-1.5 rounded-full">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#e6ab2f] to-[#82693c] border border-[#dccfb3] shadow-sm text-sm font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
                <div className="text-left hidden sm:block leading-none">
                  <p className="text-[11px] font-bold text-[#3f342d] truncate max-w-[80px]">{userName}</p>
                  <p className="text-[9px] font-semibold text-[#73685f] uppercase tracking-wider">
                    {locale === "id" ? "Pengelola" : "Admin"}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="fixed left-4 top-20 z-50 xl:hidden">
            <SyncStatusIndicator
              status={syncStatusInfo}
              onRetry={() => {
                void retrySync();
              }}
            />
          </div>

          {/* MAIN CANVAS */}
          <main className="flex-1 w-full h-full relative overflow-hidden mt-16">
            {viewMode === "tree" ? (
              <CanvasErrorBoundary
                fallbackMessage={locale === "id" ? "Terjadi kesalahan pada canvas" : "Canvas rendering error"}
              >
                <FamilyTreeCanvas
                  layout={layoutGraph}
                  selectedId={selectedId}
                  onSelectNode={setSelectedId}
                  onAddNode={handleAddNode}
                />
              </CanvasErrorBoundary>
            ) : (
              <div className="h-full overflow-y-auto bg-[#FAF7F0] p-8">
                <TimelineView
                  nodes={currentTree!.nodes}
                  onSelectNode={(node) => setSelectedId(node.id)}
                />
              </div>
            )}

            {/* FLOATING ACTION DRAWERS AT BOTTOM LEFT */}
            <div className="absolute bottom-6 left-6 z-30 flex items-center gap-2 pointer-events-auto select-none">
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
            className={`fixed top-16 right-0 bottom-0 w-80 md:w-[420px] border-l border-[#dccfb3] shadow-[-8px_0_24px_rgba(59,43,24,0.1)] z-40 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col bg-[#fdfbf6] ${
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
                ✕
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
            className={`fixed bottom-0 left-0 right-0 h-64 border-t border-[#dccfb3] shadow-[0_-4px_16px_rgba(59,43,24,0.1)] z-40 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col bg-[#fdfbf6] ${
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
                ✕
              </button>
            </div>

            {/* List of Images */}
            <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-center">
              {relicsList.length > 0 ? (
                relicsList.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => {
                      setSelectedId(node.id);
                    }}
                    className="flex-none w-44 h-36 bg-[#faf6ed] rounded-xl border border-[#dccfb3] overflow-hidden relative group cursor-pointer transition-all hover:border-[#b08e51] hover:shadow-md"
                  >
                    {node.imageUrl && (
                      <img
                        src={node.imageUrl}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={node.label}
                      />
                    )}
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/10 to-transparent p-2 text-white">
                      <span className="text-xs font-bold truncate">
                        {node.label}
                      </span>
                      <span className="text-[9px] text-[#e9e0d0] font-semibold">
                        {node.year ? `${node.year}` : (locale === "id" ? "Tahun tidak diketahui" : "Unknown Year")}
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
                    {locale === "id" ? "Unggah foto profil anggota keluarga untuk memulai galeri." : "Upload profile photos of family members to start the gallery."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Compact stats pill — top right below header */}
          <div className="fixed top-20 right-6 z-30 pointer-events-none hidden md:block">
            <div className="rounded-xl border border-[#dccfb3] bg-white/70 px-4 py-2 shadow-sm backdrop-blur-md text-[#5a4d42] text-xs flex items-center gap-3 whitespace-nowrap">
              <div className="flex items-center gap-1.5" title={copy.statMembers}>
                <Users className="h-3.5 w-3.5 text-[#82693c]" />
                <span className="font-bold">{stats.members}</span>
                <span className="text-[#9c8e7e]">{locale === "id" ? "anggota" : "members"}</span>
              </div>
              <span className="text-[#dccfb3]">·</span>
              <div className="flex items-center gap-1.5" title={copy.statGenerations}>
                <Layers3 className="h-3.5 w-3.5 text-[#82693c]" />
                <span className="font-bold">{stats.generations}</span>
                <span className="text-[#9c8e7e]">{locale === "id" ? "generasi" : "gen"}</span>
              </div>
              <span className="text-[#dccfb3]">·</span>
              <div className="flex items-center gap-1.5" title={copy.statLines}>
                <GitBranch className="h-3.5 w-3.5 text-[#82693c]" />
                <span className="font-bold">{stats.lines}</span>
                <span className="text-[#9c8e7e]">{locale === "id" ? "cabang" : "branches"}</span>
              </div>
              <span className="text-[#dccfb3]">·</span>
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
                setSelectedId(null);
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
            <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full border border-[#dccfb3] bg-[#fdfbf6]/95 px-6 py-3 text-sm font-medium text-[#3f342d] shadow-md backdrop-blur">
              {notification}
            </div>
          )}
        </>
      )}
    </div>
  );
}
