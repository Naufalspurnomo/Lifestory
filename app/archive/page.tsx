"use client";

import { useSession } from "next-auth/react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useTreeState } from "../../lib/hooks/useTreeState";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { Button } from "../../components/ui/Button";
import type { MediaItem } from "../../lib/types/tree";

type MediaWithOwner = MediaItem & {
  ownerId: string;
  ownerName: string;
};

export default function ArchivePage() {
  const { data: session } = useSession();
  const { locale } = useLanguage();
  const user = session?.user;
  const userId = user?.email || "";
  const userName = user?.name || (locale === "id" ? "Pengguna" : "User");

  const { currentTree } = useTreeState(userId, userName);

  const [selectedMedia, setSelectedMedia] = useState<MediaWithOwner | null>(
    null
  );
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  const copy =
    locale === "id"
      ? {
          title: "Arsip Keluarga",
          noTreeTitle: "Arsip Keluarga",
          noTreeBody:
            "Buat pohon keluarga terlebih dahulu untuk melihat arsip media.",
          openTree: "Buka Pohon Keluarga",
          fromMembers: (mediaCount: number, memberCount: number) =>
            `${mediaCount} media dari ${memberCount} anggota`,
          backToTree: "Kembali ke Pohon",
          totalMedia: "Total Media",
          photos: "Foto",
          videos: "Video",
          emptyMedia: "Belum ada media",
          emptyMediaDesc:
            "Upload foto dan video ke anggota keluarga untuk melihatnya di sini.",
          profileCaption: (name: string) => `Foto profil ${name}`,
          videoBadge: "Video",
          closePreview: "Tutup preview",
        }
      : {
          title: "Family Archive",
          noTreeTitle: "Family Archive",
          noTreeBody:
            "Create your family tree first to view the media archive.",
          openTree: "Open Family Tree",
          fromMembers: (mediaCount: number, memberCount: number) =>
            `${mediaCount} media from ${memberCount} members`,
          backToTree: "Back to Tree",
          totalMedia: "Total Media",
          photos: "Photos",
          videos: "Videos",
          emptyMedia: "No media yet",
          emptyMediaDesc:
            "Upload photos and videos to family members to see them here.",
          profileCaption: (name: string) => `${name} profile photo`,
          videoBadge: "Video",
          closePreview: "Close preview",
        };

  const allMedia = useMemo(() => {
    if (!currentTree) return [];

    const media: MediaWithOwner[] = [];

    for (const node of currentTree.nodes) {
      if (node.imageUrl) {
        media.push({
          type: "image",
          url: node.imageUrl,
          caption: copy.profileCaption(node.label),
          ownerId: node.id,
          ownerName: node.label,
        });
      }

      for (const item of node.content.media) {
        media.push({
          ...item,
          ownerId: node.id,
          ownerName: node.label,
        });
      }
    }

    return media;
  }, [currentTree, copy]);

  const filteredMedia = useMemo(() => {
    if (filter === "all") return allMedia;
    return allMedia.filter((m) => m.type === filter);
  }, [allMedia, filter]);

  const stats = useMemo(() => {
    return {
      total: allMedia.length,
      images: allMedia.filter((m) => m.type === "image").length,
      videos: allMedia.filter((m) => m.type === "video").length,
    };
  }, [allMedia]);

  if (!currentTree) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-slate-50">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">
            {copy.noTreeTitle}
          </h1>
          <p className="mb-6 text-slate-600">{copy.noTreeBody}</p>
          <Link href="/app">
            <Button>{copy.openTree}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {copy.title}
              </h1>
              <p className="text-sm text-slate-500">
                {copy.fromMembers(stats.total, currentTree.nodes.length)}
              </p>
            </div>
            <Link href="/app">
              <Button variant="secondary" size="sm">
                {copy.backToTree}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div
            onClick={() => setFilter("all")}
            className={`cursor-pointer rounded-xl p-4 text-center transition ${
              filter === "all"
                ? "bg-forest-100 ring-2 ring-forest-400"
                : "bg-white hover:bg-slate-50"
            }`}
          >
            <div className="text-3xl font-bold text-forest-600">{stats.total}</div>
            <div className="text-sm text-slate-600">{copy.totalMedia}</div>
          </div>
          <div
            onClick={() => setFilter("image")}
            className={`cursor-pointer rounded-xl p-4 text-center transition ${
              filter === "image"
                ? "bg-blue-100 ring-2 ring-blue-400"
                : "bg-white hover:bg-slate-50"
            }`}
          >
            <div className="text-3xl font-bold text-blue-600">{stats.images}</div>
            <div className="text-sm text-slate-600">{copy.photos}</div>
          </div>
          <div
            onClick={() => setFilter("video")}
            className={`cursor-pointer rounded-xl p-4 text-center transition ${
              filter === "video"
                ? "bg-purple-100 ring-2 ring-purple-400"
                : "bg-white hover:bg-slate-50"
            }`}
          >
            <div className="text-3xl font-bold text-purple-600">{stats.videos}</div>
            <div className="text-sm text-slate-600">{copy.videos}</div>
          </div>
        </div>

        {filteredMedia.length === 0 && (
          <div className="py-16 text-center">
            <h2 className="mb-2 text-xl font-semibold text-slate-700">
              {copy.emptyMedia}
            </h2>
            <p className="text-slate-500">{copy.emptyMediaDesc}</p>
          </div>
        )}

        {filteredMedia.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredMedia.map((item, index) => (
              <div
                key={`${item.ownerId}-${index}`}
                onClick={() => setSelectedMedia(item)}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-slate-100 transition hover:ring-4 hover:ring-forest-200"
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.caption || ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <video src={item.url} className="h-full w-full object-cover" muted />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="truncate text-sm font-medium text-white">
                      {item.ownerName}
                    </p>
                    {item.caption && (
                      <p className="truncate text-xs text-white/80">{item.caption}</p>
                    )}
                  </div>
                </div>

                {item.type === "video" && (
                  <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                    {copy.videoBadge}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-8"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute -top-12 right-0 text-2xl text-white hover:text-slate-300"
              aria-label={copy.closePreview}
            >
              X
            </button>

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

            <div className="mt-4 text-white">
              <p className="text-lg font-semibold">{selectedMedia.ownerName}</p>
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
