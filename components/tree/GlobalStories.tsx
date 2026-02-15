import { useMemo, useState } from "react";
import { FamilyNode } from "../../lib/types/tree";
import { useLanguage } from "../providers/LanguageProvider";

interface GlobalStoriesProps {
  nodes: FamilyNode[];
  onSelectNode: (node: FamilyNode) => void;
}

export default function GlobalStories({ nodes, onSelectNode }: GlobalStoriesProps) {
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<"stories" | "gallery">("stories");
  const copy =
    locale === "id"
      ? {
          title: "Cerita & Arsip Keluarga",
          stories: "Cerita",
          allGallery: "Semua Galeri",
          generationShort: "Gen",
          readMore: "Baca selengkapnya",
          emptyStoriesTitle: "Belum ada cerita keluarga yang ditulis.",
          emptyStoriesBody:
            "Tambahkan biografi pada profil anggota keluarga untuk menampilkannya di sini.",
          archiveHint: "Menampilkan arsip foto dari seluruh anggota keluarga.",
          emptyGallery: "Belum ada foto yang diunggah ke pohon keluarga ini.",
        }
      : {
          title: "Family Stories & Archives",
          stories: "Stories",
          allGallery: "All Gallery",
          generationShort: "Gen",
          readMore: "Read more",
          emptyStoriesTitle: "No family story has been written yet.",
          emptyStoriesBody:
            "Add biographies to family member profiles to show them here.",
          archiveHint: "Displaying photo archives from all family members.",
          emptyGallery: "No photo has been uploaded to this family tree yet.",
        };

  const stories = useMemo(() => {
    return nodes
      .filter((n) => n.content.description && n.content.description.length > 20)
      .sort((a, b) => (b.year && a.year ? b.year - a.year : 0));
  }, [nodes]);

  return (
    <div className="rounded-2xl border border-warm-200 bg-white p-8 shadow-sm">
      <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row">
        <h2 className="font-playfair text-3xl font-bold text-warmText">
          {copy.title}
        </h2>

        <div className="flex rounded-xl bg-warm-100 p-1">
          <button
            onClick={() => setActiveTab("stories")}
            className={`rounded-lg px-6 py-2 text-sm font-semibold transition-all ${
              activeTab === "stories"
                ? "bg-white text-gold-700 shadow-sm"
                : "text-warmMuted hover:text-warmText"
            }`}
          >
            📖 {copy.stories} ({stories.length})
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`rounded-lg px-6 py-2 text-sm font-semibold transition-all ${
              activeTab === "gallery"
                ? "bg-white text-gold-700 shadow-sm"
                : "text-warmMuted hover:text-warmText"
            }`}
          >
            🖼️ {copy.allGallery}
          </button>
        </div>
      </div>

      {activeTab === "stories" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories.length > 0 ? (
            stories.map((node) => (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className="group cursor-pointer overflow-hidden rounded-xl border border-warm-200 bg-white transition-all hover:border-gold-300 hover:shadow-lg"
              >
                {node.imageUrl ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={node.imageUrl}
                      alt={node.label}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-gradient-to-br from-gold-50 to-warm-100 text-4xl text-gold-200">
                    📖
                  </div>
                )}

                <div className="p-6">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gold-600">
                      {node.year}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-warm-200" />
                    <span className="text-xs text-warmMuted">
                      {copy.generationShort} {node.generation}
                    </span>
                  </div>

                  <h3 className="mb-2 font-playfair text-xl font-bold text-warmText transition-colors group-hover:text-gold-700">
                    {node.label}
                  </h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-warmMuted">
                    {node.content.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 border-t border-warm-100 pt-4 text-sm font-medium text-gold-600">
                    {copy.readMore}
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-warm-200 bg-warm-50 py-20 text-center">
              <p className="mb-4 text-warmMuted">{copy.emptyStoriesTitle}</p>
              <p className="text-sm text-warmMuted/70">{copy.emptyStoriesBody}</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-6 rounded-xl border border-accent-100 bg-accent-50 p-6 text-center text-accent-700">
            💡 {copy.archiveHint}
          </div>

          <div className="columns-2 space-y-4 gap-4 md:columns-3 lg:columns-4">
            {nodes
              .filter((n) => n.imageUrl)
              .map((node) => (
                <div
                  key={node.id}
                  className="group relative cursor-pointer overflow-hidden rounded-lg break-inside-avoid"
                  onClick={() => onSelectNode(node)}
                >
                  {node.imageUrl && (
                    <img
                      src={node.imageUrl}
                      className="w-full rounded-lg transition-all hover:brightness-110"
                      alt={node.label}
                    />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-sm font-medium text-white">
                      {node.label}
                    </span>
                    <span className="text-xs text-white/80">{node.year}</span>
                  </div>
                </div>
              ))}
          </div>

          {nodes.filter((n) => n.imageUrl).length === 0 && (
            <div className="py-20 text-center italic text-warmMuted">
              {copy.emptyGallery}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
