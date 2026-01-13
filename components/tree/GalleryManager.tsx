"use client";

import { useState, useRef } from "react";
import { Button } from "../ui/Button";
import { compressImage, getBase64Size } from "../../lib/utils/imageUtils";
import type { MediaItem } from "../../lib/types/tree";

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
  const [isUploading, setIsUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          // For videos, store as data URL (limited by localStorage)
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });

          // Only allow small videos (< 500kb)
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
      {/* Media Grid */}
      {media.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {media.map((item, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-lg overflow-hidden bg-warm-100 cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              {item.type === "image" ? (
                <img
                  src={item.url}
                  alt={item.caption || `Media ${index + 1}`}
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
              {!readOnly && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              )}

              {/* Type badge */}
              {item.type === "video" && (
                <div className="absolute top-1 left-1 bg-black/60 rounded px-1 text-xs text-white">
                  🎬
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        readOnly && (
          <div className="text-center py-12 text-warmMuted border-2 border-dashed border-warm-200 rounded-xl">
            Belum ada foto/video di galeri ini.
          </div>
        )
      )}

      {/* Upload Button */}
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
                <span className="animate-spin inline-block mr-2">⏳</span>
                Mengupload...
              </>
            ) : (
              <>
                📷 Tambah Foto/Video ({media.length}/{maxItems})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && selectedIndex !== null && media[selectedIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-12 right-0 text-white text-2xl hover:text-warm-200"
            >
              ✕
            </button>

            {/* Media */}
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

            {/* Caption editor */}
            {readOnly ? (
              <div className="mt-4 text-white text-center text-lg italic font-playfair">
                {media[selectedIndex].caption || "Tanpa Keterangan"}
              </div>
            ) : (
              <input
                type="text"
                value={media[selectedIndex].caption || ""}
                onChange={(e) =>
                  handleCaptionChange(selectedIndex, e.target.value)
                }
                placeholder="Tambahkan keterangan..."
                className="mt-4 w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-gold-500"
              />
            )}

            {/* Navigation */}
            {media.length > 1 && (
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-4">
                <button
                  onClick={() =>
                    setSelectedIndex(
                      (selectedIndex - 1 + media.length) % media.length
                    )
                  }
                  className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  ←
                </button>
                <button
                  onClick={() =>
                    setSelectedIndex((selectedIndex + 1) % media.length)
                  }
                  className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30"
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
