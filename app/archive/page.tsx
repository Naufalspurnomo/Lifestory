"use client";

import { useSession } from "next-auth/react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useTreeState } from "../../lib/hooks/useTreeState";
import { Button } from "../../components/ui/Button";
import type { MediaItem } from "../../lib/types/tree";

type MediaWithOwner = MediaItem & {
  ownerId: string;
  ownerName: string;
};

export default function ArchivePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const userId = user?.email || "";
  const userName = user?.name || "User";

  const { currentTree } = useTreeState(userId, userName);

  const [selectedMedia, setSelectedMedia] = useState<MediaWithOwner | null>(
    null
  );
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  // Collect all media from all nodes
  const allMedia = useMemo(() => {
    if (!currentTree) return [];

    const media: MediaWithOwner[] = [];

    for (const node of currentTree.nodes) {
      // Add profile image
      if (node.imageUrl) {
        media.push({
          type: "image",
          url: node.imageUrl,
          caption: `Foto profil ${node.label}`,
          ownerId: node.id,
          ownerName: node.label,
        });
      }

      // Add gallery items
      for (const item of node.content.media) {
        media.push({
          ...item,
          ownerId: node.id,
          ownerName: node.label,
        });
      }
    }

    return media;
  }, [currentTree]);

  // Filter media
  const filteredMedia = useMemo(() => {
    if (filter === "all") return allMedia;
    return allMedia.filter((m) => m.type === filter);
  }, [allMedia, filter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: allMedia.length,
      images: allMedia.filter((m) => m.type === "image").length,
      videos: allMedia.filter((m) => m.type === "video").length,
    };
  }, [allMedia]);

  if (!currentTree) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📷</div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Arsip Keluarga
          </h1>
          <p className="text-slate-600 mb-6">
            Buat pohon keluarga terlebih dahulu untuk melihat arsip media.
          </p>
          <Link href="/app">
            <Button>Buka Pohon Keluarga</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                📷 Arsip Keluarga
              </h1>
              <p className="text-sm text-slate-500">
                {stats.total} media dari {currentTree.nodes.length} anggota
              </p>
            </div>
            <Link href="/app">
              <Button variant="secondary" size="sm">
                ← Kembali ke Pohon
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div
            onClick={() => setFilter("all")}
            className={`cursor-pointer rounded-xl p-4 text-center transition ${
              filter === "all"
                ? "bg-forest-100 ring-2 ring-forest-400"
                : "bg-white hover:bg-slate-50"
            }`}
          >
            <div className="text-3xl font-bold text-forest-600">
              {stats.total}
            </div>
            <div className="text-sm text-slate-600">Total Media</div>
          </div>
          <div
            onClick={() => setFilter("image")}
            className={`cursor-pointer rounded-xl p-4 text-center transition ${
              filter === "image"
                ? "bg-blue-100 ring-2 ring-blue-400"
                : "bg-white hover:bg-slate-50"
            }`}
          >
            <div className="text-3xl font-bold text-blue-600">
              {stats.images}
            </div>
            <div className="text-sm text-slate-600">Foto</div>
          </div>
          <div
            onClick={() => setFilter("video")}
            className={`cursor-pointer rounded-xl p-4 text-center transition ${
              filter === "video"
                ? "bg-purple-100 ring-2 ring-purple-400"
                : "bg-white hover:bg-slate-50"
            }`}
          >
            <div className="text-3xl font-bold text-purple-600">
              {stats.videos}
            </div>
            <div className="text-sm text-slate-600">Video</div>
          </div>
        </div>

        {/* Empty state */}
        {filteredMedia.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🖼️</div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Belum ada media
            </h2>
            <p className="text-slate-500">
              Upload foto dan video ke anggota keluarga untuk melihatnya di
              sini.
            </p>
          </div>
        )}

        {/* Media Grid */}
        {filteredMedia.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMedia.map((item, index) => (
              <div
                key={`${item.ownerId}-${index}`}
                onClick={() => setSelectedMedia(item)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer hover:ring-4 hover:ring-forest-200 transition"
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.caption || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-medium text-sm truncate">
                      {item.ownerName}
                    </p>
                    {item.caption && (
                      <p className="text-white/80 text-xs truncate">
                        {item.caption}
                      </p>
                    )}
                  </div>
                </div>

                {/* Video badge */}
                {item.type === "video" && (
                  <div className="absolute top-2 left-2 bg-black/60 rounded px-2 py-0.5 text-xs text-white">
                    🎬
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute -top-12 right-0 text-white text-2xl hover:text-slate-300"
            >
              ✕
            </button>

            {/* Media */}
            {selectedMedia.type === "image" ? (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.caption || ""}
                className="w-full rounded-xl"
              />
            ) : (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                className="w-full rounded-xl"
              />
            )}

            {/* Info */}
            <div className="mt-4 text-white">
              <p className="font-semibold text-lg">{selectedMedia.ownerName}</p>
              {selectedMedia.caption && (
                <p className="text-white/80">{selectedMedia.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
