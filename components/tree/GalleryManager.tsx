"use client";

import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  ImageIcon,
  ImagePlus,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { uploadMediaFile, type MediaUploadStage } from "../../lib/media/client";
import { resolveDisplayMediaUrl } from "../../lib/media/public-url";
import type { MediaItem } from "../../lib/types/tree";
import { useLanguage } from "../providers/LanguageProvider";

type Props = {
  media: MediaItem[];
  onChange?: (media: MediaItem[]) => void;
  maxItems?: number;
  readOnly?: boolean;
  treeId?: string;
  nodeId?: string | null;
  onError?: (message: string) => void;
};

export default function GalleryManager({
  media,
  onChange,
  maxItems = 10,
  readOnly = false,
  treeId,
  nodeId,
  onError,
}: Props) {
  const { locale } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<MediaUploadStage | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copy =
    locale === "id"
      ? {
          emptyTitle: "Belum ada arsip.",
          emptyBody: "Tambahkan foto atau media yang menjadi bagian dari cerita keluarga.",
          uploading: "Mengunggah...",
          uploadStages: {
            optimizing: "Mengoptimalkan foto...",
            presigning: "Menyiapkan upload...",
            uploading: "Mengunggah foto...",
            done: "Upload selesai",
          } as Record<MediaUploadStage, string>,
          uploadNeedsTree: "Pohon keluarga harus tersimpan sebelum upload media.",
          uploadFailed: "Gagal mengunggah media",
          addMedia: (count: number, max: number) =>
            `Tambah media (${count}/${max})`,
          noCaption: "Tanpa keterangan",
          captionPlaceholder: "Tambahkan keterangan...",
          removeMedia: "Hapus media",
          close: "Tutup galeri",
          previous: "Sebelumnya",
          next: "Berikutnya",
        }
      : {
          emptyTitle: "No archive media yet.",
          emptyBody: "Add photos or media that belong to this family story.",
          uploading: "Uploading...",
          uploadStages: {
            optimizing: "Optimizing photo...",
            presigning: "Preparing upload...",
            uploading: "Uploading photo...",
            done: "Upload complete",
          } as Record<MediaUploadStage, string>,
          uploadNeedsTree: "The family tree must be saved before uploading media.",
          uploadFailed: "Failed to upload media",
          addMedia: (count: number, max: number) =>
            `Add media (${count}/${max})`,
          noCaption: "No caption",
          captionPlaceholder: "Add caption...",
          removeMedia: "Remove media",
          close: "Close gallery",
          previous: "Previous",
          next: "Next",
        };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || !onChange) return;

    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadStage("optimizing");
    const newMedia: MediaItem[] = [];

    try {
      if (!treeId) {
        onError?.(copy.uploadNeedsTree);
        return;
      }

      for (const file of Array.from(files)) {
        if (media.length + newMedia.length >= maxItems) break;

        if (file.type.startsWith("image/")) {
          const uploaded = await uploadMediaFile({
            treeId,
            nodeId,
            purpose: "gallery",
            file,
            onStage: setUploadStage,
          });
          newMedia.push({
            ...uploaded,
            type: "image",
            caption: file.name.replace(/\.[^/.]+$/, ""),
          });
        }
      }

      if (newMedia.length > 0) {
        onChange([...media, ...newMedia]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.uploadFailed;
      onError?.(`${copy.uploadFailed}: ${message}`);
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      setUploadStage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    if (readOnly || !onChange) return;
    const updated = media.filter((_, i) => i !== index);
    onChange(updated);
    setSelectedIndex(null);
  };

  const handleCaptionChange = (index: number, caption: string) => {
    if (readOnly || !onChange) return;
    const updated = media.map((m, i) => (i === index ? { ...m, caption } : m));
    onChange(updated);
  };

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setShowLightbox(true);
  };

  const selectedMedia =
    selectedIndex !== null ? media[selectedIndex] : undefined;
  const selectedMediaUrl = selectedMedia
    ? resolveDisplayMediaUrl(selectedMedia.url)
    : "";

  return (
    <div className="space-y-4">
      {media.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((item, index) => {
            const displayUrl = resolveDisplayMediaUrl(item.url);
            return (
              <div
                key={`${item.url}-${index}`}
                role="button"
                tabIndex={0}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-brand-200 bg-cream-200 text-left shadow-soft transition hover:border-brand-400 hover:shadow-elev"
                onClick={() => openLightbox(index)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openLightbox(index);
                  }
                }}
              >
                {item.type === "image" ? (
                  <img
                    src={displayUrl}
                    alt={item.caption || `Media ${index + 1}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <video
                    src={displayUrl}
                    className="h-full w-full object-cover"
                    muted
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent opacity-80 transition group-hover:opacity-100" />

                <div className="absolute bottom-2 left-2 right-2">
                  <p className="truncate text-xs font-black text-white">
                    {item.caption || copy.noCaption}
                  </p>
                </div>

                {item.type === "video" && (
                  <span className="absolute left-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-ink-900/70 text-white backdrop-blur-md">
                    <Film className="h-4 w-4" />
                  </span>
                )}

                {!readOnly && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemove(index);
                    }}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/90 text-white opacity-0 shadow-sm transition hover:bg-red-700 group-hover:opacity-100"
                    aria-label={copy.removeMedia}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-brand-300 bg-cream-100/78 px-5 py-8 text-center">
          <ImageIcon className="mx-auto mb-3 h-8 w-8 text-brand-700" />
          <p className="font-serif text-lg font-bold text-ink-800">{copy.emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-ink-500">
            {copy.emptyBody}
          </p>
        </div>
      )}

      {!readOnly && media.length < maxItems && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand-300 bg-cream-100 px-4 text-sm font-black text-brand-800 shadow-sm transition hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploadStage ? copy.uploadStages[uploadStage] : copy.uploading}
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                {copy.addMedia(media.length, maxItems)}
              </>
            )}
          </button>
        </div>
      )}

      {showLightbox && selectedIndex !== null && selectedMedia && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-ink-900/92 p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="absolute -top-12 right-0 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
              aria-label={copy.close}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="overflow-hidden rounded-xl border border-white/15 bg-black shadow-deep">
              {selectedMedia.type === "image" ? (
                <img
                  src={selectedMediaUrl}
                  alt={selectedMedia.caption || ""}
                  className="max-h-[78dvh] w-full object-contain"
                />
              ) : (
                <video
                  src={selectedMediaUrl}
                  controls
                  className="max-h-[78dvh] w-full"
                />
              )}
            </div>

            {readOnly ? (
              <div className="mt-4 text-center font-serif text-lg italic text-cream-50">
                {selectedMedia.caption || copy.noCaption}
              </div>
            ) : (
              <input
                type="text"
                value={selectedMedia.caption || ""}
                onChange={(event) => handleCaptionChange(selectedIndex, event.target.value)}
                placeholder={copy.captionPlaceholder}
                className="mt-4 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white placeholder:text-white/50 focus:border-brand-400 focus:outline-none"
              />
            )}

            {media.length > 1 && (
              <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((selectedIndex - 1 + media.length) % media.length)
                  }
                  className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white/14 text-white backdrop-blur-md transition hover:bg-white/24"
                  aria-label={copy.previous}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIndex((selectedIndex + 1) % media.length)}
                  className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white/14 text-white backdrop-blur-md transition hover:bg-white/24"
                  aria-label={copy.next}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
