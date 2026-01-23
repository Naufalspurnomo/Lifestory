import { useState, useMemo } from "react";
import { FamilyNode } from "../../lib/types/tree";

interface GlobalStoriesProps {
  nodes: FamilyNode[];
  onSelectNode: (node: FamilyNode) => void;
}

export default function GlobalStories({
  nodes,
  onSelectNode,
}: GlobalStoriesProps) {
  const [activeTab, setActiveTab] = useState<"stories" | "gallery">("stories");

  // Aggregate stories (nodes with content.description)
  const stories = useMemo(() => {
    return nodes
      .filter((n) => n.content.description && n.content.description.length > 20)
      .sort((a, b) => (b.year && a.year ? b.year - a.year : 0));
  }, [nodes]);

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-warm-200">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <h2 className="text-3xl font-bold text-warmText font-playfair">
          Cerita & Arsip Keluarga
        </h2>

        <div className="flex bg-warm-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("stories")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "stories"
                ? "bg-white text-gold-700 shadow-sm"
                : "text-warmMuted hover:text-warmText"
              }`}
          >
            📖 Cerita ({stories.length})
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "gallery"
                ? "bg-white text-gold-700 shadow-sm"
                : "text-warmMuted hover:text-warmText"
              }`}
          >
            🖼️ Galeri Semua
          </button>
        </div>
      </div>

      {activeTab === "stories" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.length > 0 ? (
            stories.map((node) => (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className="group cursor-pointer bg-white border border-warm-200 rounded-xl overflow-hidden hover:shadow-lg transition-all hover:border-gold-300"
              >
                {node.imageUrl ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={node.imageUrl}
                      alt={node.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-gold-50 to-warm-100 flex items-center justify-center text-4xl text-gold-200">
                    📖
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gold-600">
                      {node.year}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-warm-200"></span>
                    <span className="text-xs text-warmMuted">
                      Gen {node.generation}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-warmText mb-2 font-playfair group-hover:text-gold-700 transition-colors">
                    {node.label}
                  </h3>
                  <p className="text-warmMuted text-sm line-clamp-3 leading-relaxed">
                    {node.content.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-warm-100 text-gold-600 text-sm font-medium flex items-center gap-2">
                    Baca selengkapnya{" "}
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-warm-50 rounded-2xl border-2 border-dashed border-warm-200">
              <p className="text-warmMuted mb-4">
                Belum ada cerita keluarga yang ditulis.
              </p>
              <p className="text-sm text-warmMuted/70">
                Tambahkan biografi pada profil anggota keluarga untuk
                menampilkannya di sini.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Reusing GalleryManager logic but passing 'all' if supported or just placeholder for now since GalleryManager is node-specific currently */}
          {/* In a real implementation we would refactor GalleryManager to accept a list of images or fetch global images */}
          <div className="bg-accent-50 p-6 rounded-xl text-center text-accent-700 mb-6 border border-accent-100">
            💡 Menampilkan arsip foto dari seluruh anggota keluarga.
          </div>

          {/* Temporary visualization of gallery grid */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {nodes
              .filter((n) => n.imageUrl)
              .map((node) => (
                <div
                  key={node.id}
                  className="break-inside-avoid relative group rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => onSelectNode(node)}
                >
                  {node.imageUrl && (
                    <img
                      src={node.imageUrl}
                      className="w-full rounded-lg hover:brightness-110 transition-all"
                      alt={node.label}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <span className="text-white font-medium text-sm">
                      {node.label}
                    </span>
                    <span className="text-white/80 text-xs">{node.year}</span>
                  </div>
                </div>
              ))}
          </div>

          {nodes.filter((n) => n.imageUrl).length === 0 && (
            <div className="text-center py-20 text-warmMuted italic">
              Belum ada foto yang diunggah ke pohon keluarga ini.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
