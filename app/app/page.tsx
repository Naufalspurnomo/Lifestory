"use client";
// Force HMR update

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import FamilyTreeCanvas from "../../components/tree/FamilyTreeCanvas";
import NodeEditor from "../../components/tree/NodeEditor";
import BioModal from "../../components/tree/BioModal";
import WelcomeScreen from "../../components/tree/WelcomeScreen";
import InviteModal from "../../components/tree/InviteModal";
import ImportModal from "../../components/tree/ImportModal";
import SearchBar from "../../components/tree/SearchBar";
import TimelineView from "../../components/tree/TimelineView";
import GlobalStories from "../../components/tree/GlobalStories";
import { useTreeState } from "../../lib/hooks/useTreeState";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { exportFamilyTreeToExcel } from "../../lib/utils/excelParser";

import type { FamilyNode } from "../../lib/types/tree";

export default function AppHome() {
  const { data: session } = useSession();
  const { locale } = useLanguage();
  const user = session?.user;

  const copy =
    locale === "id"
      ? {
          fallbackUser: "Pengguna",
          notifTreeCreated: "Pohon keluarga dibuat! Anda adalah simpul pertama.",
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
        };

  const userId = user?.id || user?.email || "";
  const userEmail = user?.email || "";
  const userName = user?.name || copy.fallbackUser;

  const {
    userTree,
    currentTree,
    layoutGraph,
    createTree,
    addNode,
    updateNode,
    deleteNode,
    getNode,
    importNodes,
  } = useTreeState(userId, userName, userEmail);

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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleStartTree = useCallback(() => {
    const result = createTree();
    if (result) {
      setHasCreatedTree(true);
      showNotification(copy.notifTreeCreated);
    }
  }, [copy.notifTreeCreated, createTree, showNotification]);

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

  const handleDeleteNode = (nodeId: string) => {
    const node = getNode(nodeId);
    if (node) {
      deleteNode(nodeId);
      showNotification(copy.notifDeleted(node.label));
      setSelectedId(null);
    }
  };

  const selectedNode = selectedId ? getNode(selectedId) : null;
  const showTree = userTree && currentTree;
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
      exportFamilyTreeToExcel(currentTree, locale);
      showNotification(copy.notifExported(currentTree.nodes.length));
    } catch (error) {
      console.error("Failed to export tree:", error);
      showNotification(copy.notifExportFailed);
    }
  }, [
    copy.notifExportFailed,
    copy.notifExported,
    copy.notifNoDataToExport,
    currentTree,
    locale,
    showNotification,
  ]);

  const stats = {
    generations: 0,
    members: currentTree?.nodes.length || 0,
    lines: 0,
    earliestRecord: new Date().getFullYear(),
  };

  if (currentTree) {
    stats.generations = Math.max(...currentTree.nodes.map((n) => n.generation), 0);
    const lines = new Set(currentTree.nodes.map((n) => n.line));
    stats.lines = lines.size;
    const years = currentTree.nodes
      .map((n) => n.year)
      .filter((y) => y !== null) as number[];
    if (years.length > 0) stats.earliestRecord = Math.min(...years);
  }

  return (
    <div className="min-h-screen bg-warm-50 pb-32">
      {!showTree && !hasCreatedTree && (
        <WelcomeScreen userName={userName} onStart={handleStartTree} />
      )}

      {showTree && (
        <>
          <div className="container mx-auto max-w-6xl p-4 md:p-8">
            <header className="mb-12 text-center">
              <div className="mx-auto max-w-7xl">
                <div className="mx-auto mb-4 h-16 w-16 text-gold-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="100%"
                    viewBox="0 -2 24 26"
                    fill="none"
                    stroke="#b08e51"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22v-8" />
                    <path d="M12 14c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                    <path d="M12 14c4.42 0 8 3.58 8 8h-16c0-4.42 3.58-8 8-8z" />
                  </svg>
                </div>

                <h1 className="mb-6 font-playfair text-5xl font-bold text-warmText md:text-6xl">
                  {copy.pageTitle}
                </h1>
                <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-warmMuted md:text-xl">
                  {currentTree.name} - {copy.pageDescription}
                </p>

                <div className="mx-auto max-w-md">
                  <SearchBar nodes={currentTree.nodes} onSelect={setSelectedId} />
                </div>
              </div>
            </header>

            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-xl border border-warm-200 bg-white p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode("tree")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      viewMode === "tree"
                        ? "bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-md"
                        : "text-warmMuted hover:bg-warm-100"
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    {copy.viewTree}
                  </button>
                  <button
                    onClick={() => setViewMode("timeline")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      viewMode === "timeline"
                        ? "bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-md"
                        : "text-warmMuted hover:bg-warm-100"
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {copy.viewTimeline}
                  </button>
                </div>

                <div className="ml-2 hidden rounded-xl border border-warm-200 bg-white p-1 shadow-sm lg:inline-flex">
                  <button className="rounded-lg border border-warm-200 bg-warm-100 px-4 py-2 text-sm font-semibold text-warmText shadow-sm">
                    {copy.filterAll}
                  </button>
                  <button
                    className="cursor-not-allowed rounded-lg px-4 py-2 text-sm font-semibold text-warmMuted/50 hover:bg-warm-100"
                    title={copy.comingSoon}
                  >
                    {copy.filterCore}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 rounded-xl border-2 border-gold-200 bg-white px-4 py-2.5 text-sm font-semibold text-gold-700 transition-colors hover:bg-gold-50"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {copy.invite}
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 rounded-xl border-2 border-gold-200 bg-white px-4 py-2.5 text-sm font-semibold text-gold-700 transition-colors hover:bg-gold-50"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {copy.import}
                </button>
                <button
                  onClick={handleExportTree}
                  className="flex items-center gap-2 rounded-xl border-2 border-gold-200 bg-white px-4 py-2.5 text-sm font-semibold text-gold-700 transition-colors hover:bg-gold-50"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {copy.export}
                </button>
              </div>
            </div>

            <main
              className={`relative w-full overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 ${
                isFullscreen
                  ? "fixed inset-0 z-[60] h-screen rounded-none"
                  : "h-[600px] border border-warm-200"
              }`}
            >
              {viewMode === "tree" ? (
                <FamilyTreeCanvas
                  layout={layoutGraph}
                  selectedId={selectedId}
                  onSelectNode={setSelectedId}
                  onAddNode={handleAddNode}
                />
              ) : (
                <div className="h-full overflow-y-auto bg-warm-50">
                  <TimelineView
                    nodes={currentTree.nodes}
                    onSelectNode={(node) => setSelectedId(node.id)}
                  />
                </div>
              )}

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="absolute right-4 top-4 z-10 rounded-full border border-warm-200 bg-white/80 p-2.5 text-warmMuted shadow-sm backdrop-blur transition-all hover:scale-110 hover:border-gold-500 hover:bg-white hover:text-gold-600"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isFullscreen ? (
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  ) : (
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  )}
                </svg>
              </button>

              {viewMode === "tree" && (
                <button
                  onClick={() => {
                    const rootNode = currentTree.nodes.find(
                      (n) => !n.parentIds?.length && !n.parentId
                    );
                    if (rootNode) {
                      handleAddNode(rootNode.id, "child");
                    }
                  }}
                  className="absolute bottom-6 left-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-gold-700 text-2xl text-white shadow-lg transition hover:bg-gold-800 lg:hidden"
                  title={copy.addMemberTitle}
                >
                  +
                </button>
              )}
            </main>

            <section className="mt-12">
              <GlobalStories
                nodes={currentTree.nodes}
                onSelectNode={(node) => setSelectedId(node.id)}
              />
            </section>
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
              treeName={currentTree.name}
              treeData={currentTree}
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

          <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-warm-200 bg-white/95 backdrop-blur-xl">
            <div className="container mx-auto max-w-6xl">
              <div className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-4">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-gold-500 to-gold-700 bg-clip-text text-2xl font-bold text-transparent">
                    {stats.generations}
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-warmMuted">
                    {copy.statGenerations}
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-br from-gold-500 to-gold-700 bg-clip-text text-2xl font-bold text-transparent">
                    {stats.members}
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-warmMuted">
                    {copy.statMembers}
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-br from-gold-500 to-gold-700 bg-clip-text text-2xl font-bold text-transparent">
                    {stats.lines}
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-warmMuted">
                    {copy.statLines}
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-br from-gold-500 to-gold-700 bg-clip-text text-2xl font-bold text-transparent">
                    {stats.earliestRecord}
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-warmMuted">
                    {copy.statEarliest}
                  </p>
                </div>
              </div>
            </div>
          </footer>

          {notification && (
            <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-warmText/90 px-6 py-3 text-sm font-medium text-white shadow-xl backdrop-blur animate-[fadeIn_0.3s]">
              {notification}
            </div>
          )}
        </>
      )}
    </div>
  );
}
