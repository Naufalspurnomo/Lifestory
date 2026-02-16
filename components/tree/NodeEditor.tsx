"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import GalleryManager from "./GalleryManager";
import type { FamilyNode, MediaItem, WorkItem } from "../../lib/types/tree";
import {
  Book,
  Music,
  Film,
  Palette,
  Star,
  Plus,
  X,
  Instagram,
  Music2,
  Linkedin,
} from "lucide-react";
import {
  compressImage,
  formatFileSize,
  getBase64Size,
} from "../../lib/utils/imageUtils";
import {
  normalizeInstagramHandle,
  normalizeTikTokHandle,
  normalizeLinkedInHandle,
} from "../../lib/utils/socialLinks";
import { useLanguage } from "../providers/LanguageProvider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: Omit<FamilyNode, "id" | "generation" | "childrenIds">) => void;
  editingNode?: FamilyNode | null;
  addType?: "parent" | "partner" | "child" | "sibling";
  parentId?: string | null;
  coParentOptions?: Array<{
    id: string;
    label: string;
  }>;
};

export default function NodeEditor({
  isOpen,
  onClose,
  onSave,
  editingNode,
  addType = "child",
  parentId = null,
  coParentOptions = [],
}: Props) {
  const { locale } = useLanguage();
  const [label, setLabel] = useState("");
  const [year, setYear] = useState<string>("");
  const [deathYear, setDeathYear] = useState<string>("");
  const [coParentId, setCoParentId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [imageSize, setImageSize] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showWorks, setShowWorks] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const copy =
    locale === "id"
      ? {
          editProfile: "Edit Profil",
          addTypeLabels: {
            parent: "Tambah Orang Tua",
            partner: "Tambah Pasangan",
            child: "Tambah Anak",
            sibling: "Tambah Saudara",
          },
          gallery: "Galeri",
          galleryMedia: "Galeri Foto & Video",
          imageProcessFailed: "Gagal memproses gambar",
          requiredName: "Nama wajib diisi",
          invalidInstagram:
            "Format Instagram tidak valid. Gunakan @username atau link instagram.com/username",
          invalidTikTok:
            "Format TikTok tidak valid. Gunakan @username atau link tiktok.com/@username",
          invalidLinkedIn:
            "Format LinkedIn tidak valid. Gunakan username, in/username, atau link linkedin.com/in/username",
          invalidDeathYear: "Tahun wafat tidak boleh sebelum tahun lahir",
          profilePhotoLabel: "Foto profil",
          clickUpload: "Klik untuk upload foto profil",
          fullName: "Nama Lengkap *",
          fullNamePlaceholder: "Nama anggota keluarga",
          birthYear: "Tahun Lahir",
          deathYear: "Tahun Wafat",
          deathPlaceholder: "Kosongkan jika masih hidup",
          coParent: "Orang Tua Kedua",
          coParentHint:
            "Pilih jika anak ini juga milik pasangan tertentu. Jika kosong, hanya terhubung ke parent yang dipilih.",
          coParentNone: "Tidak ada / hanya satu orang tua",
          socialMedia: "Sosial Media",
          socialHint: "Opsional. Boleh isi username atau link profil.",
          instagramPlaceholder: "@username atau instagram.com/username",
          tiktokPlaceholder: "@username atau tiktok.com/@username",
          linkedinPlaceholder: "username, in/username, atau linkedin.com/in/username",
          shortBio: "Biografi Singkat",
          bioPlaceholder: "Ceritakan tentang anggota keluarga ini...",
          works: "Karya/Kreasi",
          close: "Tutup",
          add: "Tambah",
          addNewWork: "Tambah Karya Baru",
          workOptions: {
            book: "Buku",
            music: "Musik",
            film: "Film",
            art: "Seni",
            other: "Lainnya",
          } as Record<WorkItem["type"], string>,
          workTitlePlaceholder: "Judul karya",
          yearPlaceholder: "Tahun",
          addWork: "Tambah Karya",
          cancel: "Batal",
          save: "Simpan",
        }
      : {
          editProfile: "Edit Profile",
          addTypeLabels: {
            parent: "Add Parent",
            partner: "Add Partner",
            child: "Add Child",
            sibling: "Add Sibling",
          },
          gallery: "Gallery",
          galleryMedia: "Photo & Video Gallery",
          imageProcessFailed: "Failed to process image",
          requiredName: "Name is required",
          invalidInstagram:
            "Invalid Instagram format. Use @username or instagram.com/username",
          invalidTikTok:
            "Invalid TikTok format. Use @username or tiktok.com/@username",
          invalidLinkedIn:
            "Invalid LinkedIn format. Use username, in/username, or linkedin.com/in/username",
          invalidDeathYear: "Death year cannot be earlier than birth year",
          profilePhotoLabel: "Profile photo",
          clickUpload: "Click to upload profile photo",
          fullName: "Full Name *",
          fullNamePlaceholder: "Family member name",
          birthYear: "Birth Year",
          deathYear: "Death Year",
          deathPlaceholder: "Leave empty if still alive",
          coParent: "Second Parent",
          coParentHint:
            "Select this only if the child should also be linked to a specific partner.",
          coParentNone: "None / single parent only",
          socialMedia: "Social Media",
          socialHint: "Optional. You may use username or profile URL.",
          instagramPlaceholder: "@username or instagram.com/username",
          tiktokPlaceholder: "@username or tiktok.com/@username",
          linkedinPlaceholder: "username, in/username, or linkedin.com/in/username",
          shortBio: "Short Biography",
          bioPlaceholder: "Tell a short story about this family member...",
          works: "Works/Creations",
          close: "Close",
          add: "Add",
          addNewWork: "Add New Work",
          workOptions: {
            book: "Book",
            music: "Music",
            film: "Film",
            art: "Art",
            other: "Other",
          } as Record<WorkItem["type"], string>,
          workTitlePlaceholder: "Work title",
          yearPlaceholder: "Year",
          addWork: "Add Work",
          cancel: "Cancel",
          save: "Save",
        };

  useEffect(() => {
    if (editingNode) {
      setLabel(editingNode.label);
      setYear(editingNode.year?.toString() || "");
      setDeathYear(editingNode.deathYear?.toString() || "");
      setCoParentId("");
      setDescription(editingNode.content?.description || "");
      setInstagram(editingNode.content?.instagram || "");
      setTiktok(editingNode.content?.tiktok || "");
      setLinkedin(editingNode.content?.linkedin || "");
      setImageUrl(editingNode.imageUrl);
      setMedia(editingNode.content?.media || []);
      setWorks(editingNode.works || []);
      if (editingNode.imageUrl) {
        setImageSize(getBase64Size(editingNode.imageUrl));
      }
    } else {
      resetForm();
    }
  }, [editingNode]);

  useEffect(() => {
    if (!isOpen || editingNode || addType !== "child") {
      setCoParentId("");
      return;
    }

    const stillValid = coParentOptions.some((option) => option.id === coParentId);
    if (!stillValid) {
      setCoParentId("");
    }
  }, [addType, coParentId, coParentOptions, editingNode, isOpen]);

  const resetForm = () => {
    setLabel("");
    setYear("");
    setDeathYear("");
    setCoParentId("");
    setDescription("");
    setInstagram("");
    setTiktok("");
    setLinkedin("");
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
      setError(copy.imageProcessFailed);
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!label.trim()) {
      setError(copy.requiredName);
      return;
    }

    const birthYear = year ? parseInt(year) : null;
    const death = deathYear ? parseInt(deathYear) : null;
    const hasInstagramValue = instagram.trim().length > 0;
    const normalizedInstagram = normalizeInstagramHandle(instagram);
    const hasTikTokValue = tiktok.trim().length > 0;
    const normalizedTikTok = normalizeTikTokHandle(tiktok);
    const hasLinkedInValue = linkedin.trim().length > 0;
    const normalizedLinkedIn = normalizeLinkedInHandle(linkedin);

    if (hasInstagramValue && !normalizedInstagram) {
      setError(copy.invalidInstagram);
      return;
    }
    if (hasTikTokValue && !normalizedTikTok) {
      setError(copy.invalidTikTok);
      return;
    }
    if (hasLinkedInValue && !normalizedLinkedIn) {
      setError(copy.invalidLinkedIn);
      return;
    }

    if (birthYear && death && death < birthYear) {
      setError(copy.invalidDeathYear);
      return;
    }

    const selectedParentIds =
      addType === "child"
        ? Array.from(
            new Set(
              [parentId, coParentId || null].filter(
                (id): id is string => Boolean(id)
              )
            )
          )
        : [];

    const relationData: Pick<
      Omit<FamilyNode, "id" | "generation" | "childrenIds">,
      "parentId" | "parentIds" | "partners" | "line"
    > = editingNode
      ? {
          parentId:
            editingNode.parentIds?.[0] ??
            editingNode.parentId ??
            null,
          parentIds:
            editingNode.parentIds ||
            (editingNode.parentId ? [editingNode.parentId] : []),
          partners: editingNode.partners || [],
          line: editingNode.line || "paternal",
        }
      : {
          parentId: addType === "child" ? (selectedParentIds[0] || null) : null,
          parentIds: addType === "child" ? selectedParentIds : undefined,
          partners: addType === "partner" && parentId ? [parentId] : [],
          line: "paternal",
        };

    onSave({
      label: label.trim(),
      year: birthYear,
      deathYear: death,
      ...relationData,
      imageUrl,
      content: {
        description,
        media,
        instagram: normalizedInstagram || undefined,
        tiktok: normalizedTikTok || undefined,
        linkedin: normalizedLinkedIn || undefined,
      },
      works: works.length > 0 ? works : undefined,
    });

    resetForm();
    onClose();
  };

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
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 rounded-t-2xl border-b border-warm-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-warmText">
              {editingNode ? copy.editProfile : copy.addTypeLabels[addType]}
            </h2>
            {editingNode && (
              <button
                type="button"
                onClick={() => setShowGallery(!showGallery)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                  showGallery
                    ? "bg-gold-100 text-gold-700"
                    : "bg-warm-100 text-warmMuted hover:bg-warm-200"
                }`}
              >
                📷 {copy.gallery} {media.length > 0 && `(${media.length})`}
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {showGallery && editingNode && (
            <div className="border-b border-warm-200 pb-4">
              <h3 className="mb-3 text-sm font-medium text-warmMuted">
                {copy.galleryMedia}
              </h3>
              <GalleryManager media={media} onChange={setMedia} maxItems={10} />
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-warm-100 to-warm-200 transition hover:ring-4 hover:ring-gold-100"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" />
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
                ? `${copy.profilePhotoLabel} (${formatFileSize(imageSize)})`
                : copy.clickUpload}
            </p>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-warmMuted">{copy.fullName}</span>
            <input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={copy.fullNamePlaceholder}
              className="w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-warmText placeholder:text-warmMuted/50 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-100"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-warmMuted">{copy.birthYear}</span>
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
              <span className="text-sm font-medium text-warmMuted">{copy.deathYear}</span>
              <input
                type="number"
                value={deathYear}
                onChange={(e) => setDeathYear(e.target.value)}
                placeholder={copy.deathPlaceholder}
                min="1800"
                max={new Date().getFullYear()}
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-warmText placeholder:text-warmMuted/50 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-100"
              />
            </label>
          </div>

          {!editingNode && addType === "child" && parentId && coParentOptions.length > 0 && (
            <label className="block space-y-1">
              <span className="text-sm font-medium text-warmMuted">{copy.coParent}</span>
              <select
                value={coParentId}
                onChange={(e) => setCoParentId(e.target.value)}
                className="w-full rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-warmText focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-100"
              >
                <option value="">{copy.coParentNone}</option>
                {coParentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-warmMuted">{copy.coParentHint}</p>
            </label>
          )}

          <div className="space-y-3 rounded-xl border border-warm-200 bg-warm-50 p-4">
            <div className="text-sm font-semibold text-warmText">{copy.socialMedia}</div>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-warmMuted">Instagram</span>
              <div className="flex items-center gap-2 rounded-xl border border-warm-200 bg-white px-3 py-2.5 focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-100">
                <Instagram className="h-4 w-4 text-warmMuted" />
                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder={copy.instagramPlaceholder}
                  className="w-full bg-transparent text-warmText placeholder:text-warmMuted/50 focus:outline-none"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-warmMuted">TikTok</span>
              <div className="flex items-center gap-2 rounded-xl border border-warm-200 bg-white px-3 py-2.5 focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-100">
                <Music2 className="h-4 w-4 text-warmMuted" />
                <input
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder={copy.tiktokPlaceholder}
                  className="w-full bg-transparent text-warmText placeholder:text-warmMuted/50 focus:outline-none"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-warmMuted">LinkedIn</span>
              <div className="flex items-center gap-2 rounded-xl border border-warm-200 bg-white px-3 py-2.5 focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-100">
                <Linkedin className="h-4 w-4 text-warmMuted" />
                <input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder={copy.linkedinPlaceholder}
                  className="w-full bg-transparent text-warmText placeholder:text-warmMuted/50 focus:outline-none"
                />
              </div>
            </label>

            <p className="text-xs text-warmMuted">{copy.socialHint}</p>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-warmMuted">{copy.shortBio}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={copy.bioPlaceholder}
              rows={3}
              className="w-full resize-none rounded-xl border border-warm-200 bg-white px-4 py-2.5 text-warmText placeholder:text-warmMuted/50 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-100"
            />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-warmMuted">{copy.works}</span>
              <button
                type="button"
                onClick={() => setShowWorks(!showWorks)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-medium transition ${
                  showWorks
                    ? "bg-gold-100 text-gold-700"
                    : "bg-warm-100 text-warmMuted hover:bg-warm-200"
                }`}
              >
                {showWorks ? (
                  copy.close
                ) : works.length > 0 ? (
                  <>
                    <Book className="h-4 w-4" /> ({works.length})
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> {copy.add}
                  </>
                )}
              </button>
            </div>

            {showWorks && (
              <div className="space-y-3 rounded-xl border border-warm-200 bg-warm-50 p-4">
                {works.map((work, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-warm-200 bg-white p-3"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                      {getWorkIcon(work.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-warmText">
                        {work.title}
                      </p>
                      {work.year && <p className="text-xs text-warmMuted">{work.year}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setWorks(works.filter((_, i) => i !== index))}
                      className="rounded-full p-1.5 text-red-500 transition hover:bg-red-50"
                      aria-label="remove work"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <div className="space-y-2 border-t border-warm-200 pt-2">
                  <p className="text-xs font-medium text-warmMuted">{copy.addNewWork}</p>
                  <div className="flex gap-2">
                    <select
                      id="workType"
                      className="rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warmText focus:border-gold-500 focus:outline-none"
                      defaultValue="book"
                    >
                      <option value="book">{copy.workOptions.book}</option>
                      <option value="music">{copy.workOptions.music}</option>
                      <option value="film">{copy.workOptions.film}</option>
                      <option value="art">{copy.workOptions.art}</option>
                      <option value="other">{copy.workOptions.other}</option>
                    </select>
                    <input
                      id="workTitle"
                      type="text"
                      placeholder={copy.workTitlePlaceholder}
                      className="flex-1 rounded-lg border border-warm-200 bg-white px-3 py-2 text-sm text-warmText placeholder:text-warmMuted/50 focus:border-gold-500 focus:outline-none"
                    />
                    <input
                      id="workYear"
                      type="number"
                      placeholder={copy.yearPlaceholder}
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
                          year: yearEl.value ? parseInt(yearEl.value) : undefined,
                        };
                        setWorks([...works, newWork]);
                        titleEl.value = "";
                        yearEl.value = "";
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-2 text-sm font-medium text-white transition hover:bg-gold-600"
                  >
                    <Plus className="h-4 w-4" /> {copy.addWork}
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

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
              {copy.cancel}
            </Button>
            <Button type="submit" block>
              {editingNode ? copy.save : copy.add}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
