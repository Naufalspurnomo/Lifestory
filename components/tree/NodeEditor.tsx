"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/Button";
import GalleryManager from "./GalleryManager";
import type { FamilyNode, MediaItem, WorkItem } from "../../lib/types/tree";
import { Book, Music, Film, Palette, Star, Plus, X } from "lucide-react";
import {
  compressImage,
  formatFileSize,
  getBase64Size,
} from "../../lib/utils/imageUtils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: Omit<FamilyNode, "id" | "generation" | "childrenIds">) => void;
  editingNode?: FamilyNode | null;
  addType?: "parent" | "partner" | "child";
  parentId?: string | null;
};

export default function NodeEditor({
  isOpen,
  onClose,
  onSave,
  editingNode,
  addType = "child",
  parentId = null,
}: Props) {
  const [label, setLabel] = useState("");
  const [year, setYear] = useState<string>("");
  const [deathYear, setDeathYear] = useState<string>("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [imageSize, setImageSize] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showWorks, setShowWorks] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when editingNode changes
  useEffect(() => {
    if (editingNode) {
      setLabel(editingNode.label);
      setYear(editingNode.year?.toString() || "");
      setDeathYear(editingNode.deathYear?.toString() || "");
      setDescription(editingNode.content.description || "");
      setImageUrl(editingNode.imageUrl);
      setMedia(editingNode.content.media || []);
      setWorks(editingNode.works || []);
      if (editingNode.imageUrl) {
        setImageSize(getBase64Size(editingNode.imageUrl));
      }
    } else {
      resetForm();
    }
  }, [editingNode]);

  const resetForm = () => {
    setLabel("");
    setYear("");
    setDeathYear("");
    setDescription("");
    setImageUrl(null);
    setMedia([]);
    setWorks([]);
    setImageSize(0);
    setError(null);
    setShowGallery(false);
  };

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const compressed = await compressImage(file);
      setImageUrl(compressed);
      setImageSize(getBase64Size(compressed));
    } catch (err) {
      setError("Gagal memproses gambar");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!label.trim()) {
      setError("Nama wajib diisi");
      return;
    }

    const birthYear = year ? parseInt(year) : null;
    const death = deathYear ? parseInt(deathYear) : null;

    // Date validation
    if (birthYear && death && death < birthYear) {
      setError("Tahun wafat tidak boleh sebelum tahun lahir");
      return;
    }

    // Determine line based on add type
    let line: FamilyNode["line"] = "paternal";
    if (editingNode && editingNode.line) {
      line = editingNode.line;
    }

    onSave({
      label: label.trim(),
      year: birthYear,
      deathYear: death,
      parentId:
        addType === "child" ? parentId : addType === "parent" ? null : parentId,
      partners: addType === "partner" && parentId ? [parentId] : [],
      line,
      imageUrl,
      content: {
        description,
        media,
      },
      works: works.length > 0 ? works : undefined,
    });

    resetForm();
    onClose();
  };

  const addTypeLabels = {
    parent: "Tambah Orang Tua",
    partner: "Tambah Pasangan",
    child: "Tambah Anak",
  };

  // Work type icons and labels
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 border-b border-warm-200 bg-white px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-warmText">
              {editingNode ? "Edit Profil" : addTypeLabels[addType]}
            </h2>
            {editingNode && (
              <button
                type="button"
                onClick={() => setShowGallery(!showGallery)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  showGallery
                    ? "bg-gold-100 text-gold-700"
                    : "bg-warm-100 text-warmMuted hover:bg-warm-200"
                }`}
              >
                📷 Galeri {media.length > 0 && `(${media.length})`}
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Gallery Section (for editing only) */}
          {showGallery && editingNode && (
            <div className="pb-4 border-b border-warm-200">
              <h3 className="text-sm font-medium text-warmMuted mb-3">
                Galeri Foto & Video
              </h3>
              <GalleryManager media={media} onChange={setMedia} maxItems={10} />
            </div>
          )}

          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-warm-100 to-warm-200 overflow-hidden hover:ring-4 hover:ring-gold-100 transition"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl text-gold-600">📷</span>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <p className="text-xs text-warmMuted">
              {imageUrl
                ? `Foto profil (${formatFileSize(imageSize)})`
                : "Klik untuk upload foto profil"}
            </p>
          </div>

          {/* Name */}
          <label className="block space-y-1">
            <span className="text-sm font-medium text-warmMuted">
              Nama Lengkap *
            </span>
            <input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nama anggota keluarga"
              className="w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-warmText placeholder:text-warmMuted/50 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-100"
            />
          </label>

          {/* Years */}
          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-warmMuted">
                Tahun Lahir
              </span>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="1990"
                min="1800"
                max={new Date().getFullYear()}
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-warmText placeholder:text-warmMuted/50 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-100"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-warmMuted">
                Tahun Wafat
              </span>
              <input
                type="number"
                value={deathYear}
                onChange={(e) => setDeathYear(e.target.value)}
                placeholder="Kosongkan jika masih hidup"
                min="1800"
                max={new Date().getFullYear()}
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-warmText placeholder:text-warmMuted/50 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-100"
              />
            </label>
          </div>

          {/* Description */}
          <label className="block space-y-1">
            <span className="text-sm font-medium text-warmMuted">
              Biografi Singkat
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan tentang anggota keluarga ini..."
              rows={3}
              className="w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-warmText placeholder:text-warmMuted/50 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-100 resize-none"
            />
          </label>

          {/* Works/Karya Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-warmMuted">
                Karya/Kreasi
              </span>
              <button
                type="button"
                onClick={() => setShowWorks(!showWorks)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                  showWorks
                    ? "bg-gold-100 text-gold-700"
                    : "bg-warm-100 text-warmMuted hover:bg-warm-200"
                }`}
              >
                {showWorks ? (
                  "Tutup"
                ) : works.length > 0 ? (
                  <>
                    <Book className="w-4 h-4" /> ({works.length})
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Tambah
                  </>
                )}
              </button>
            </div>

            {showWorks && (
              <div className="space-y-3 p-4 bg-warm-50 rounded-xl border border-warm-200">
                {/* Existing works */}
                {works.map((work, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-warm-200"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-700">
                      {getWorkIcon(work.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warmText truncate">
                        {work.title}
                      </p>
                      {work.year && (
                        <p className="text-xs text-warmMuted">{work.year}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setWorks(works.filter((_, i) => i !== index));
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Add new work form */}
                <div className="space-y-2 pt-2 border-t border-warm-200">
                  <p className="text-xs font-medium text-warmMuted">
                    Tambah Karya Baru
                  </p>
                  <div className="flex gap-2">
                    <select
                      id="workType"
                      className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warmText focus:border-gold-500 focus:outline-none"
                      defaultValue="book"
                    >
                      <option value="book">Buku</option>
                      <option value="music">Musik</option>
                      <option value="film">Film</option>
                      <option value="art">Seni</option>
                      <option value="other">Lainnya</option>
                    </select>
                    <input
                      id="workTitle"
                      type="text"
                      placeholder="Judul karya"
                      className="flex-1 rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warmText placeholder:text-warmMuted/50 focus:border-gold-500 focus:outline-none"
                    />
                    <input
                      id="workYear"
                      type="number"
                      placeholder="Tahun"
                      min="1800"
                      max={new Date().getFullYear()}
                      className="w-20 rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warmText placeholder:text-warmMuted/50 focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const typeEl = document.getElementById(
                        "workType"
                      ) as HTMLSelectElement;
                      const titleEl = document.getElementById(
                        "workTitle"
                      ) as HTMLInputElement;
                      const yearEl = document.getElementById(
                        "workYear"
                      ) as HTMLInputElement;

                      if (titleEl.value.trim()) {
                        const newWork: WorkItem = {
                          type: typeEl.value as WorkItem["type"],
                          title: titleEl.value.trim(),
                          year: yearEl.value
                            ? parseInt(yearEl.value)
                            : undefined,
                        };
                        setWorks([...works, newWork]);
                        titleEl.value = "";
                        yearEl.value = "";
                      }
                    }}
                    className="w-full py-2 rounded-lg bg-gold-500 text-white text-sm font-medium hover:bg-gold-600 transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Tambah Karya
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                resetForm();
                onClose();
              }}
              block
            >
              Batal
            </Button>
            <Button type="submit" block>
              {editingNode ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
