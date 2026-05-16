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
  const { data: session, status } = useSession();
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

  const userId = (user as any)?.id || user?.email || "";
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
    syncStatus,
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
    <div className="min-h-screen bg-[#f7f5f1] pb-32">
      {!showTree && !hasCreatedTree && (
        <WelcomeScreen userName={userName} onStart={handleStartTree} />
      )}

      {showTree && (
        <>
          <div className="container mx-auto max-w-6xl p-4 md:p-8">
            <header className="mb-10 text-center">
              <div className="mx-auto max-w-7xl">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ddc7a2] bg-[linear-gradient(150deg,#fff8ea_0%,#f6e5c1_100%)] shadow-[0_14px_30px_rgba(169,116,21,0.2)] text-[#b07f2f]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 -2 24 26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22v-8" />
                    <path d="M12 14c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                    <path d="M12 14c4.42 0 8 3.58 8 8h-16c0-4.42 3.58-8 8-8z" />
                  </svg>
                </div>

                <h1 className="mb-3 font-serif text-5xl font-bold text-[#3f342d] md:text-6xl">
                  {copy.pageTitle}
                </h1>
                <p className="mx-auto mb-6 max-w-3xl text-lg leading-relaxed text-[#73685f] md:text-xl">
                  {currentTree!.name} — {copy.pageDescription}
                </p>

                <div className="mx-auto max-w-md">
                  {currentTree && <SearchBar nodes={currentTree.nodes} onSelect={setSelectedId} />}
                </div>
              </div>
            </header>

            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-xl border border-[#e2d4be] bg-white p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode("tree")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      viewMode === "tree"
                        ? "bg-gradient-to-br from-[#e6ab2f] to-[#cc8a12] text-white shadow-md"
                        : "text-[#6c5a49] hover:bg-[#f8f2e7]"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    {copy.viewTree}
                  </button>
                  <button
                    onClick={() => setViewMode("timeline")}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      viewMode === "timeline"
                        ? "bg-gradient-to-br from-[#e6ab2f] to-[#cc8a12] text-white shadow-md"
                        : "text-[#6c5a49] hover:bg-[#f8f2e7]"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {copy.viewTimeline}
                  </button>
                </div>

                <div className="ml-2 hidden rounded-xl border border-[#e2d4be] bg-white p-1 shadow-sm lg:inline-flex">
                  <button className="rounded-lg border border-[#e2d4be] bg-[#f8f2e7] px-4 py-2 text-sm font-semibold text-[#3f342d] shadow-sm">
                    {copy.filterAll}
                  </button>
                  <button
                    className="cursor-not-allowed rounded-lg px-4 py-2 text-sm font-semibold text-[#a99e8f]/60 hover:bg-[#f8f2e7]"
                    title={copy.comingSoon}
                  >
                    {copy.filterCore}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                {[
                  { label: copy.invite, onClick: () => setShowInviteModal(true), icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8 12 3 7 8 M12 3v12" },
                  { label: copy.import, onClick: () => setShowImportModal(true), icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" },
                  { label: copy.export, onClick: handleExportTree, icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={btn.onClick}
                    className="flex items-center gap-2 rounded-xl border border-[#dcc28e] bg-white px-4 py-2.5 text-sm font-semibold text-[#7b5a26] transition hover:border-[#c7a050] hover:bg-[#fffaf0] hover:text-[#5a3e10]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {btn.icon.split(" M").map((d, i) => (
                        <path key={i} d={i === 0 ? d : `M${d}`} />
                      ))}
                    </svg>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <main
              className={`relative w-full overflow-hidden rounded-2xl bg-white shadow-[0_18px_40px_rgba(59,43,24,0.12)] transition-all duration-300 ${
                isFullscreen
                  ? "fixed inset-0 z-[60] h-screen rounded-none"
                  : "h-[600px] border border-[#e2d4be]"
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
                    nodes={currentTree!.nodes}
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
                    const rootNode = currentTree!.nodes.find(
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
                nodes={currentTree!.nodes}
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
              treeName={currentTree!.name}
              treeData={currentTree!}
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

          <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e4dccf] bg-[rgba(255,253,249,0.96)] backdrop-blur-xl">
            <div className="container mx-auto max-w-6xl">
              <div className="grid grid-cols-2 gap-4 py-3 sm:grid-cols-4">
                {[
                  { value: stats.generations, label: copy.statGenerations },
                  { value: stats.members, label: copy.statMembers },
                  { value: stats.lines, label: copy.statLines },
                  { value: stats.earliestRecord, label: copy.statEarliest },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="bg-gradient-to-br from-[#e6ab2f] to-[#cc8a12] bg-clip-text text-2xl font-bold text-transparent">
                      {stat.value}
                    </div>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7b6f63]">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </footer>

          {notification && (
            <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full border border-[#ddc7a2] bg-[rgba(33,22,10,0.88)] px-6 py-3 text-sm font-medium text-white shadow-xl backdrop-blur">
              {notification}
            </div>
          )}

          {(syncStatus === "saving" ||
            syncStatus === "loading" ||
            syncStatus === "offline") && (
            <div
              className={`fixed bottom-24 right-6 z-40 rounded-full px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur ${
                syncStatus === "offline"
                  ? "border border-[#e9d4a3] bg-[#fff7e3] text-[#9d6e1c]"
                  : "border border-[#ddc7a2] bg-[rgba(255,248,234,0.95)] text-[#7b5a26]"
              }`}
              role="status"
              aria-live="polite"
            >
              {syncStatus === "saving"
                ? locale === "id" ? "Menyimpan…" : "Saving…"
                : syncStatus === "loading"
                ? locale === "id" ? "Memuat…" : "Loading…"
                : locale === "id" ? "Offline — tersimpan lokal" : "Offline — saved locally"}
            </div>
          )}
        </>
      )}
    </div>
  );
}
