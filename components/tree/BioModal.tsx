import { useState } from "react";
import { FamilyNode, WorkItem } from "../../lib/types/tree";
import GalleryManager from "./GalleryManager";
import { Book, Music, Film, Palette, Star } from "lucide-react";

interface BioModalProps {
  node: FamilyNode;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddRelative: (type: "parent" | "partner" | "child") => void;
}

export default function BioModal({
  node,
  onClose,
  onEdit,
  onDelete,
  onAddRelative,
}: BioModalProps) {
  const [activeTab, setActiveTab] = useState<"story" | "gallery">("story");
  const isDeceased = node.deathYear !== null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container - Centered */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-warm-100 text-warmMuted hover:text-warmText hover:bg-warm-200 transition-colors z-10"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="p-8">
            {/* Header */}
            <h2 className="text-3xl font-bold text-warmText mb-2 pr-12 font-playfair">
              {node.label}
            </h2>
            <div className="flex items-center gap-2 text-warmMuted mb-6 text-sm font-medium">
              <span>
                {node.year} {node.deathYear ? `- ${node.deathYear}` : ""}
              </span>
              {isDeceased && <span>• 🕯️ Mengenang</span>}
              <span>• Generasi {node.generation}</span>
            </div>

            {/* Featured Media (Placeholder/First Image) */}
            <div className="mb-8 rounded-xl overflow-hidden bg-warm-100 aspect-video flex items-center justify-center shadow-inner relative group">
              {node.imageUrl ? (
                <img
                  src={node.imageUrl}
                  alt={node.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 text-warmMuted">
                  <span className="text-4xl block mb-2">📷</span>
                  <span className="text-sm">Belum ada foto utama</span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b-2 border-warm-200 mb-6">
              <button
                onClick={() => setActiveTab("story")}
                className={`px-5 py-3 font-semibold text-sm rounded-t-lg transition-colors ${
                  activeTab === "story"
                    ? "text-gold-700 bg-gold-100 border-b-2 border-gold-500 -mb-[2px]"
                    : "text-warmMuted hover:text-warmText hover:bg-warm-100"
                }`}
              >
                📖 Cerita
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={`px-5 py-3 font-semibold text-sm rounded-t-lg transition-colors ${
                  activeTab === "gallery"
                    ? "text-gold-700 bg-gold-100 border-b-2 border-gold-500 -mb-[2px]"
                    : "text-warmMuted hover:text-warmText hover:bg-warm-100"
                }`}
              >
                🖼️ Galeri & Arsip
              </button>
            </div>

            {/* Content */}
            <div className="min-h-[200px]">
              {activeTab === "story" ? (
                <div className="space-y-6 animate-[fadeIn_0.3s]">
                  <div className="prose prose-stone max-w-none">
                    {node.content.description ? (
                      <p className="leading-relaxed text-warmText text-lg">
                        {node.content.description}
                      </p>
                    ) : (
                      <p className="text-warmMuted italic text-center py-8">
                        Belum ada cerita yang ditulis. Klik edit untuk
                        menambahkan biografi.
                      </p>
                    )}
                  </div>

                  {/* Works/Karya Section */}
                  {node.works && node.works.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-warm-200">
                      <h3 className="text-xs font-bold text-warmMuted mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Book className="w-4 h-4" /> Karya & Kreasi
                      </h3>
                      <div className="grid gap-3">
                        {node.works.map((work, index) => {
                          const getWorkIcon = (type: WorkItem["type"]) => {
                            const iconClass = "w-5 h-5";
                            switch (type) {
                              case "book":
                                return <Book className={iconClass} />;
                              case "music":
                                return <Music className={iconClass} />;
                              case "film":
                                return <Film className={iconClass} />;
                              case "art":
                                return <Palette className={iconClass} />;
                              default:
                                return <Star className={iconClass} />;
                            }
                          };
                          const workTypeLabels: Record<
                            WorkItem["type"],
                            string
                          > = {
                            book: "Buku",
                            music: "Musik",
                            film: "Film",
                            art: "Seni",
                            other: "Lainnya",
                          };
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-4 bg-gradient-to-r from-gold-50 to-warm-50 rounded-xl border border-gold-200"
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold-100 flex items-center justify-center text-gold-700">
                                {getWorkIcon(work.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-warmText">
                                  {work.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-warmMuted">
                                  <span>{workTypeLabels[work.type]}</span>
                                  {work.year && (
                                    <>
                                      <span>•</span>
                                      <span>{work.year}</span>
                                    </>
                                  )}
                                </div>
                                {work.description && (
                                  <p className="text-sm text-warmMuted mt-1">
                                    {work.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={onEdit}
                      className="flex-1 py-2.5 px-4 bg-gold-700 hover:bg-gold-800 text-white rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      ✏️ Edit Profil
                    </button>
                    {node.line !== "self" && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Yakin hapus ${node.label} dari pohon keluarga?`
                            )
                          ) {
                            onDelete();
                          }
                        }}
                        className="py-2.5 px-4 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  {/* Add Relations Section */}
                  <div className="mt-8 pt-6 border-t border-warm-200">
                    <h3 className="text-xs font-bold text-warmMuted mb-4 uppercase tracking-wider">
                      Tambah Hubungan Keluarga
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => onAddRelative("parent")}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-warm-100 hover:bg-warm-200 border border-warm-200 transition-all text-warmMuted hover:text-warmText hover:shadow-sm"
                      >
                        <span className="text-xl">⬆️</span>
                        <span className="text-xs font-semibold">Orang Tua</span>
                      </button>
                      <button
                        onClick={() => onAddRelative("partner")}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-warm-100 hover:bg-warm-200 border border-warm-200 transition-all text-warmMuted hover:text-warmText hover:shadow-sm"
                      >
                        <span className="text-xl">❤️</span>
                        <span className="text-xs font-semibold">Pasangan</span>
                      </button>
                      <button
                        onClick={() => onAddRelative("child")}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-warm-100 hover:bg-warm-200 border border-warm-200 transition-all text-warmMuted hover:text-warmText hover:shadow-sm"
                      >
                        <span className="text-xl">⬇️</span>
                        <span className="text-xs font-semibold">Anak</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-[fadeIn_0.3s]">
                  <GalleryManager
                    media={node.content?.media || []}
                    readOnly={true}
                  />
                  <div className="mt-6 pt-6 border-t border-warm-200 text-center">
                    <button
                      onClick={onEdit}
                      className="py-2 px-6 border border-warm-200 rounded-xl text-sm text-warmMuted hover:bg-warm-100 font-medium transition-colors"
                    >
                      Kelola Galeri di Edit Mode
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
