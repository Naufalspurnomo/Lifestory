"use client";

import { useRef, useState } from "react";
import { Button } from "../ui/Button";
import { compressImage, getBase64Size } from "../../lib/utils/imageUtils";
import type { MediaItem } from "../../lib/types/tree";
import { useLanguage } from "../providers/LanguageProvider";

type Props = {
  media: MediaItem[];
  onChange?: (media: MediaItem[]) => void;
  maxItems?: number;
  readOnly?: boolean;
};

export default function GalleryManager({
  media,
  onChange,
  maxItems = 10,
  readOnly = false,
}: Props) {
  const { locale } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const copy =
    locale === "id"
      ? {
          empty: "Belum ada foto/video di galeri ini.",
          uploading: "Mengunggah...",
          addMedia: (count: number, max: number) =>
            `Tambah Foto/Video (${count}/${max})`,
          noCaption: "Tanpa keterangan",
          captionPlaceholder: "Tambahkan keterangan...",
        }
      : {
          empty: "No photos/videos in this gallery yet.",
          uploading: "Uploading...",
          addMedia: (count: number, max: number) =>
            `Add Photos/Videos (${count}/${max})`,
          noCaption: "No caption",
          captionPlaceholder: "Add caption...",
        };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || !onChange) return;

    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newMedia: MediaItem[] = [];

    try {
      for (const file of Array.from(files)) {
        if (media.length + newMedia.length >= maxItems) break;

        if (file.type.startsWith("image/")) {
          const compressed = await compressImage(file);
          newMedia.push({
            type: "image",
            url: compressed,
            caption: file.name.replace(/\.[^/.]+$/, ""),
          });
        } else if (file.type.startsWith("video/")) {
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          if (getBase64Size(dataUrl) < 500 * 1024) {
            newMedia.push({
              type: "video",
              url: dataUrl,
              caption: file.name.replace(/\.[^/.]+$/, ""),
            });
          }
        }
      }

      if (newMedia.length > 0) {
        onChange([...media, ...newMedia]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
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

  return (
    <div className="space-y-4">
      {media.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {media.map((item, index) => (
            <div
              key={index}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-warm-100"
              onClick={() => openLightbox(index)}
            >
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt={item.caption || `Media ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <video src={item.url} className="h-full w-full object-cover" muted />
              )}

              {!readOnly && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    className="rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
                    aria-label="remove media"
                  >
                    🗑️
                  </button>
                </div>
              )}

              {item.type === "video" && (
                <div className="absolute left-1 top-1 rounded bg-black/60 px-1 text-xs text-white">
                  🎬
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        readOnly && (
          <div className="rounded-xl border-2 border-dashed border-warm-200 py-12 text-center text-warmMuted">
            {copy.empty}
          </div>
        )
      )}

      {!readOnly && media.length < maxItems && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            block
          >
            {isUploading ? (
              <>
                <span className="mr-2 inline-block animate-spin">⏳</span>
                {copy.uploading}
              </>
            ) : (
              <>📷 {copy.addMedia(media.length, maxItems)}</>
            )}
          </Button>
        </div>
      )}

      {showLightbox && selectedIndex !== null && media[selectedIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-12 right-0 text-2xl text-white hover:text-warm-200"
              aria-label="close lightbox"
            >
              ×
            </button>

            {media[selectedIndex].type === "image" ? (
              <img
                src={media[selectedIndex].url}
                alt={media[selectedIndex].caption || ""}
                className="w-full rounded-lg"
              />
            ) : (
              <video
                src={media[selectedIndex].url}
                controls
                className="w-full rounded-lg"
              />
            )}

            {readOnly ? (
              <div className="mt-4 text-center font-playfair text-lg italic text-white">
                {media[selectedIndex].caption || copy.noCaption}
              </div>
            ) : (
              <input
                type="text"
                value={media[selectedIndex].caption || ""}
                onChange={(e) => handleCaptionChange(selectedIndex, e.target.value)}
                placeholder={copy.captionPlaceholder}
                className="mt-4 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:border-gold-500 focus:outline-none"
              />
            )}

            {media.length > 1 && (
              <div className="absolute left-0 right-0 top-1/2 flex -translate-y-1/2 justify-between px-4">
                <button
                  onClick={() =>
                    setSelectedIndex((selectedIndex - 1 + media.length) % media.length)
                  }
                  className="rounded-full bg-white/20 p-3 text-white hover:bg-white/30"
                  aria-label="previous media"
                >
                  ←
                </button>
                <button
                  onClick={() => setSelectedIndex((selectedIndex + 1) % media.length)}
                  className="rounded-full bg-white/20 p-3 text-white hover:bg-white/30"
                  aria-label="next media"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
