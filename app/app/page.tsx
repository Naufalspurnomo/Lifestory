"use client";
// Force HMR update

import { useState, useCallback, useEffect } from "react";
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

import type { FamilyNode } from "../../lib/types/tree";

export default function AppHome() {
  const { data: session } = useSession();
  const user = session?.user;

  // Use email as userId, fallback to empty string
  const userId = user?.email || "";
  const userName = user?.name || "User";

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
  } = useTreeState(userId, userName);

  // DEBUG: Expose import for console testing
  useEffect(() => {
    (window as any).importNodes = importNodes;
  }, [importNodes]);

  // UI State
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

  // Show notification
  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Handle start tree
  const handleStartTree = useCallback(() => {
    const result = createTree();
    if (result) {
      setHasCreatedTree(true);
      showNotification("Pohon keluarga dibuat! Anda adalah simpul pertama.");
    }
  }, [createTree, showNotification]);

  // Check if tree was loaded
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
      showNotification("Profil diperbarui");
    } else {
      // Logic for different add types & validation
      let finalNodeData = { ...nodeData };
      let updatedParentIds = nodeData.parentIds || [];

      // SIBLING LOGIC: 
      // If adding sibling, we need to check if reference node (addParentId) has parents.
      // If yes, use them. If no, CREATE implicit parents first.
      if (addType === "sibling" && addParentId) {
        const sibling = getNode(addParentId);
        if (sibling) {
          const existingParentIds = sibling.parentIds || (sibling.parentId ? [sibling.parentId] : []);

          if (existingParentIds.length > 0) {
            // Inherit parents
            updatedParentIds = existingParentIds;
            finalNodeData.parentIds = updatedParentIds;
            finalNodeData.parentId = updatedParentIds[0];
          } else {
            // Create placeholders
            const fatherRes = addNode({ label: "Ayah (Unknown)", sex: "M", isPlaceholder: true } as any);
            const motherRes = addNode({ label: "Ibu (Unknown)", sex: "F", isPlaceholder: true } as any);

            if (fatherRes.success && motherRes.success && fatherRes.node && motherRes.node) {
              // Link them as partners (if needed, or implicit)
              // Link sibling to them
              updateNode(sibling.id, { parentIds: [fatherRes.node.id, motherRes.node.id], parentId: fatherRes.node.id });

              updatedParentIds = [fatherRes.node.id, motherRes.node.id];
              finalNodeData.parentIds = updatedParentIds;
              finalNodeData.parentId = updatedParentIds[0];

              showNotification("Orang tua placeholder dibuat otomatis.");
            }
          }
        }
      }

      // Link types based on addType
      const initialChildrenIds =
        addType === "parent" && addParentId ? [addParentId] : [];

      // If adding as partner, link the new node to the existing node as partner
      const partnersToLink =
        addType === "partner" && addParentId
          ? [addParentId]
          : nodeData.partners || [];

      // When adding partner/sibling, explicitly clear parentId to avoid treating as child (unless set above)
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
        showNotification(`${nodeData.label} ditambahkan ke pohon`);
      } else {
        showNotification(`Error: ${result.error}`);
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
      showNotification(`${node.label} dihapus dari pohon`);
      setSelectedId(null);
    }
  };

  // Get selected node
  const selectedNode = selectedId ? getNode(selectedId) : null;

  // Show tree if we have one OR if user just created one
  const showTree = userTree && currentTree;

  // Stats calculation
  const stats = {
    generations: 0,
    members: currentTree?.nodes.length || 0,
    lines: 0,
    earliestRecord: new Date().getFullYear(),
  };

  if (currentTree) {
    stats.generations = Math.max(
      ...currentTree.nodes.map((n) => n.generation),
      0
    );
    const lines = new Set(currentTree.nodes.map((n) => n.line));
    stats.lines = lines.size;
    const years = currentTree.nodes
      .map((n) => n.year)
      .filter((y) => y !== null) as number[];
    if (years.length > 0) stats.earliestRecord = Math.min(...years);
  }

  return (
    <div className="min-h-screen pb-32 bg-warm-50">
      {/* Welcome screen for new users */}
      {!showTree && !hasCreatedTree && (
        <WelcomeScreen userName={userName} onStart={handleStartTree} />
      )}

      {/* Main app with tree */}
      {showTree && (
        <>
          <div className="container mx-auto max-w-6xl p-4 md:p-8">
            {/* Header */}
            <header className="text-center mb-12">
              <div className="max-w-7xl mx-auto">
                <div className="h-16 w-16 text-gold-600 mx-auto mb-4">
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

                <h1 className="text-5xl md:text-6xl font-bold text-warmText mb-6 font-playfair">
                  Family Trees
                </h1>
                <p className="text-lg md:text-xl text-warmMuted max-w-3xl mx-auto leading-relaxed mb-8">
                  {currentTree.name} — Visualisasikan sejarah keluarga Anda,
                  simpan cerita, dan wariskan memori untuk generasi mendatang.
                </p>

                <div className="max-w-md mx-auto">
                  <SearchBar
                    nodes={currentTree.nodes}
                    onSelect={setSelectedId}
                  />
                </div>
              </div>
            </header>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center flex-wrap gap-3">
                <div className="inline-flex rounded-xl bg-white p-1 shadow-sm border border-warm-200">
                  <button
                    onClick={() => setViewMode("tree")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${viewMode === "tree"
                      ? "bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-md"
                      : "text-warmMuted hover:bg-warm-100"
                      }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      ></path>
                    </svg>
                    Tree View
                  </button>
                  <button
                    onClick={() => setViewMode("timeline")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${viewMode === "timeline"
                      ? "bg-gradient-to-br from-gold-500 to-gold-700 text-white shadow-md"
                      : "text-warmMuted hover:bg-warm-100"
                      }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                    Timeline
                  </button>
                </div>

                {/* Quick Filters (UI Only) */}
                <div className="inline-flex rounded-xl bg-white p-1 shadow-sm border border-warm-200 ml-2 hidden lg:inline-flex">
                  <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-warm-100 text-warmText shadow-sm border border-warm-200">
                    Semua
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-warmMuted/50 hover:bg-warm-100 cursor-not-allowed"
                    title="Coming Soon"
                  >
                    Keluarga Inti
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2.5 bg-white border-2 border-gold-200 text-gold-700 rounded-xl font-semibold text-sm hover:bg-gold-50 transition-colors flex items-center gap-2"
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
                  Undang
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2.5 bg-white border-2 border-gold-200 text-gold-700 rounded-xl font-semibold text-sm hover:bg-gold-50 transition-colors flex items-center gap-2"
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
                  Import
                </button>
                <button className="px-4 py-2.5 bg-white border-2 border-gold-200 text-gold-700 rounded-xl font-semibold text-sm hover:bg-gold-50 transition-colors flex items-center gap-2">
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
                  Export
                </button>
              </div>
            </div>

            {/* Canvas Wrapper */}
            <main
              className={`w-full rounded-2xl shadow-xl bg-white overflow-hidden relative transition-all duration-300 ${isFullscreen
                ? "fixed inset-0 z-40 rounded-none h-screen"
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
                className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur border border-warm-200 rounded-full shadow-sm hover:scale-110 hover:bg-white hover:border-gold-500 hover:text-gold-600 transition-all text-warmMuted z-10"
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
                <>
                  {/* Quick Add Button (Bottom Left inside canvas) */}
                  <button
                    onClick={() => {
                      const rootNode = currentTree.nodes.find(
                        (n) => !n.parentIds?.length && !n.parentId
                      );
                      if (rootNode) {
                        handleAddNode(rootNode.id, "child");
                      }
                    }}
                    className="absolute bottom-6 left-6 flex h-12 w-12 items-center justify-center rounded-full bg-gold-700 text-2xl text-white shadow-lg hover:bg-gold-800 transition lg:hidden z-20"
                    title="Tambah anggota keluarga (Root)"
                  >
                    +
                  </button>
                </>
              )}
            </main>

            {/* Global Features Section */}
            <section className="mt-12">
              <GlobalStories
                nodes={currentTree.nodes}
                onSelectNode={(node) => setSelectedId(node.id)}
              />
            </section>
          </div>

          {/* Fixed/Modal Elements moved outside container for proper positioning */}

          {/* Bio Modal */}
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

          {/* Node Editor Modal */}
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
          />

          {/* Invite Modal */}
          {currentTree && (
            <InviteModal
              isOpen={showInviteModal}
              onClose={() => setShowInviteModal(false)}
              treeId={currentTree.id}
              treeName={currentTree.name}
            />
          )}

          {/* Import Modal */}
          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={(nodes) => {
              importNodes(nodes);
              showNotification(`${nodes.length} anggota keluarga berhasil diimport`);
            }}
          />

          {/* Footer Stats */}
          <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-warm-200 z-40">
            <div className="container mx-auto max-w-6xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-gold-500 to-gold-700">
                    {stats.generations}
                  </div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-warmMuted mt-1">
                    Generations
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-gold-500 to-gold-700">
                    {stats.members}
                  </div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-warmMuted mt-1">
                    Family Members
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-gold-500 to-gold-700">
                    {stats.lines}
                  </div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-warmMuted mt-1">
                    Family Lines
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-gold-500 to-gold-700">
                    {stats.earliestRecord}
                  </div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-warmMuted mt-1">
                    Earliest Record
                  </p>
                </div>
              </div>
            </div>
          </footer>

          {/* Notifications */}
          {notification && (
            <div className="fixed top-6 left-1/2 -translate-x-1/2 rounded-full bg-warmText/90 backdrop-blur px-6 py-3 text-sm font-medium text-white shadow-xl z-50 animate-[fadeIn_0.3s]">
              {notification}
            </div>
          )}
        </>
      )}
    </div>
  );
}
