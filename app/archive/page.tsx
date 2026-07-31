"use client";

import { useSession } from "next-auth/react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Film,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import { useTreeState } from "../../lib/hooks/useTreeState";
import { useLanguage } from "../../components/providers/LanguageProvider";
import { resolveDisplayMediaUrl } from "../../lib/media/public-url";
import type { MediaItem } from "../../lib/types/tree";

type MediaWithOwner = MediaItem & {
  ownerId: string;
  ownerName: string;
};

export default function ArchivePage() {
  const { data: session } = useSession();
  const { locale } = useLanguage();
  const user = session?.user;
  const userId = user?.id || user?.email || "";
  const userName = user?.name || (locale === "id" ? "Pengguna" : "User");

  const { currentTree } = useTreeState(userId, userName);

  const [selectedMedia, setSelectedMedia] = useState<MediaWithOwner | null>(
    null
  );
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  const copy = useMemo(
    () =>
      locale === "id"
        ? {
          badge: "Arsip Keluarga",
          title: "Arsip Keluarga",
          noTreeTitle: "Belum ada arsip",
          noTreeBody:
            "Buat pohon keluarga terlebih dahulu untuk mulai menyimpan foto dan video kenangan.",
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
          badge: "Family Archive",
          title: "Family Archive",
          noTreeTitle: "No archive yet",
          noTreeBody:
            "Create your family tree first to start storing photos and memory videos.",
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
        },
    [locale]
  );

  const allMedia = useMemo(() => {
    if (!currentTree) return [];

    const media: MediaWithOwner[] = [];

    for (const node of currentTree.nodes) {
      if (node.imageUrl) {
        media.push({
          type: "image",
          url: resolveDisplayMediaUrl(node.imageUrl),
          caption: copy.profileCaption(node.label),
          ownerId: node.id,
          ownerName: node.label,
        });
      }

      for (const item of node.content.media) {
        media.push({
          ...item,
          url: resolveDisplayMediaUrl(item.url),
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
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#faf6ed] via-[#fdfbf6] to-[#faf6ed] text-[#40342c]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#dfceb0]/55 blur-3xl" />
          <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-[#ece2cc]/70 blur-3xl" />
        </div>
        <section className="relative mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
          <div className="w-full rounded-[28px] border border-[#dfd2be] bg-white/86 p-10 text-center shadow-[0_22px_60px_rgba(88,74,51,0.18)] backdrop-blur-sm">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#dccfb3] bg-[#fdfbf6] text-[#82693c]">
              <Camera className="h-5 w-5" />
            </div>
            <h1 className="font-serif text-3xl text-[#3f342d]">
              {copy.noTreeTitle}
            </h1>
            <p className="mt-3 text-[#73685f]">{copy.noTreeBody}</p>
            <a
              href="/app"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#82693c] to-[#604b2d] px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_14px_30px_rgba(130,105,60,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(130,105,60,0.4)]"
            >
              {copy.openTree}
            </a>
          </div>
        </section>
      </div>
    );
  }

  type FilterCard = {
    key: "all" | "image" | "video";
    label: string;
    value: number;
    icon: typeof Layers;
  };

  const filterCards: FilterCard[] = [
    {
      key: "all",
      label: copy.totalMedia,
      value: stats.total,
      icon: Layers,
    },
    {
      key: "image",
      label: copy.photos,
      value: stats.images,
      icon: Camera,
    },
    {
      key: "video",
      label: copy.videos,
      value: stats.videos,
      icon: Film,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#faf6ed] via-[#fdfbf6] to-[#faf6ed] text-[#40342c]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#dfceb0]/40 blur-3xl" />
        <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-[#ece2cc]/55 blur-3xl" />
      </div>

      <header className="sticky top-[0] z-10 border-b border-[#e4dccf] bg-[rgba(255,253,249,0.92)] backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#dccfb3] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#82693c]">
                <Sparkles className="h-3 w-3 text-[#82693c]" />
                {copy.badge}
              </p>
              <h1 className="font-serif text-2xl text-[#3f342d] md:text-3xl">
                {copy.title}
              </h1>
              <p className="text-sm text-[#7b6f63]">
                {copy.fromMembers(stats.total, currentTree.nodes.length)}
              </p>
            </div>
            <a
              href="/app"
              className="inline-flex items-center gap-2 rounded-full border border-[#d7c4a1] bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#6a584a] backdrop-blur-sm transition hover:bg-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {copy.backToTree}
            </a>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 grid grid-cols-3 gap-3 md:gap-4">
          {filterCards.map((card) => {
            const Icon = card.icon;
            const active = filter === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setFilter(card.key)}
                className={`group rounded-2xl border p-4 text-left transition md:p-5 ${
                  active
                    ? "border-[#c8b187] bg-[linear-gradient(150deg,#fff8ea_0%,#fffdf6_100%)] shadow-[0_14px_30px_rgba(130,105,60,0.18)]"
                    : "border-[#e2d4be] bg-white/78 hover:border-[#c8b187] hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#82693c]">
                    {card.label}
                  </p>
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                      active
                        ? "border-[#c8b187] bg-white text-[#82693c]"
                        : "border-[#e2d4be] bg-[#fffcf7] text-[#a99066]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 font-serif text-3xl text-[#3f342d] md:text-4xl">
                  {card.value}
                </p>
              </button>
            );
          })}
        </div>

        {filteredMedia.length === 0 && (
          <div className="rounded-3xl border border-[#dfd2be] bg-white/82 p-12 text-center shadow-[0_14px_28px_rgba(59,43,24,0.06)] backdrop-blur-sm">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#dccfb3] bg-[#fdfbf6] text-[#82693c]">
              <Camera className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-2xl text-[#3f342d]">
              {copy.emptyMedia}
            </h2>
            <p className="mt-2 text-sm text-[#73685f]">{copy.emptyMediaDesc}</p>
          </div>
        )}

        {filteredMedia.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          >
            {filteredMedia.map((item, index) => (
              <button
                key={`${item.ownerId}-${index}`}
                type="button"
                onClick={() => setSelectedMedia(item)}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-[#dfd2be] bg-[#fffcf7] shadow-[0_10px_22px_rgba(59,43,24,0.08)] transition hover:-translate-y-0.5 hover:border-[#c8b187] hover:shadow-[0_18px_30px_rgba(59,43,24,0.16)]"
              >
                {item.type === "image" ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.url}
                    alt={item.caption || ""}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="h-full w-full object-cover"
                    muted
                  />
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(33,22,10,0.78)] via-transparent to-transparent opacity-0 transition group-hover:opacity-100">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.ownerName}
                    </p>
                    {item.caption && (
                      <p className="truncate text-xs text-white/85">
                        {item.caption}
                      </p>
                    )}
                  </div>
                </div>

                {item.type === "video" && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/30 bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                    <Film className="h-3 w-3" />
                    {copy.videoBadge}
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </main>

      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,11,7,0.85)] p-4 backdrop-blur-sm sm:p-8"
          onClick={() => setSelectedMedia(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute -top-12 right-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
              aria-label={copy.closePreview}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="overflow-hidden rounded-3xl border border-[#bca783]/45 bg-[#f5efe4] shadow-[0_28px_60px_rgba(17,12,8,0.42)]">
              {selectedMedia.type === "image" ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.caption || ""}
                  className="w-full"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="w-full bg-black"
                />
              )}
              <div className="border-t border-[#deceb6] bg-[#f7f1e6] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#82693c]">
                  {selectedMedia.type === "video" ? copy.videos : copy.photos}
                </p>
                <p className="mt-1 font-serif text-xl text-[#3f342d]">
                  {selectedMedia.ownerName}
                </p>
                {selectedMedia.caption && (
                  <p className="mt-1 text-sm text-[#6e6258]">
                    {selectedMedia.caption}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
