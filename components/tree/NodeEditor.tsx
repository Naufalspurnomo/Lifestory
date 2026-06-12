"use client";

import { useEffect, useRef, useState } from "react";
import {
  Archive,
  Book,
  BookOpen,
  CalendarDays,
  Camera,
  Film,
  ImagePlus,
  Instagram,
  Linkedin,
  Loader2,
  Music,
  Music2,
  Palette,
  Plus,
  Save,
  Star,
  UserRound,
  X,
} from "lucide-react";
import GalleryManager from "./GalleryManager";
import type { FamilyNode, MediaItem, WorkItem } from "../../lib/types/tree";
import {
  formatFileSize,
  getBase64Size,
} from "../../lib/utils/imageUtils";
import { uploadMediaFile, type MediaUploadStage } from "../../lib/media/client";
import { resolveDisplayMediaUrl } from "../../lib/media/public-url";
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
  treeId?: string;
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
  treeId,
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
  const [coParentTouched, setCoParentTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageStorageKey, setImageStorageKey] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [imageSize, setImageSize] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<MediaUploadStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workTypeRef = useRef<HTMLSelectElement>(null);
  const workTitleRef = useRef<HTMLInputElement>(null);
  const workYearRef = useRef<HTMLInputElement>(null);

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
          profileRecord: "Catatan keluarga",
          profilePhotoLabel: "Foto profil",
          addPhoto: "Tambah foto profil",
          replacePhoto: "Ganti foto profil",
          photoHint: "Foto profil tampil di kartu pohon dan header profil.",
          identity: "Identitas",
          lifeRecord: "Tahun hidup",
          socialMedia: "Sosial media",
          socialHint: "Opsional. Isi username atau link profil.",
          storySection: "Biografi",
          worksSection: "Karya & Kreasi",
          archiveSection: "Galeri & Arsip",
          galleryMedia: "Foto dan media arsip",
          imageProcessFailed: "Gagal memproses gambar",
          imageUploadFailed: "Gagal mengunggah foto",
          uploadStages: {
            optimizing: "Mengoptimalkan foto...",
            presigning: "Menyiapkan upload...",
            uploading: "Mengunggah foto...",
            done: "Upload selesai",
          } as Record<MediaUploadStage, string>,
          saveTreeFirst: "Pohon keluarga harus tersimpan sebelum upload foto.",
          requiredName: "Nama wajib diisi",
          invalidInstagram:
            "Format Instagram tidak valid. Gunakan @username atau link instagram.com/username",
          invalidTikTok:
            "Format TikTok tidak valid. Gunakan @username atau link tiktok.com/@username",
          invalidLinkedIn:
            "Format LinkedIn tidak valid. Gunakan username, in/username, atau link linkedin.com/in/username",
          invalidDeathYear: "Tahun wafat tidak boleh sebelum tahun lahir",
          fullName: "Nama Lengkap *",
          fullNamePlaceholder: "Nama anggota keluarga",
          birthYear: "Tahun Lahir",
          deathYear: "Tahun Wafat",
          deathPlaceholder: "Kosongkan jika masih hidup",
          coParent: "Orang Tua Kedua",
          coParentHint:
            "Pilih jika anak ini juga terhubung ke pasangan tertentu.",
          coParentNone: "Tidak ada / hanya satu orang tua",
          instagramPlaceholder: "@username atau instagram.com/username",
          tiktokPlaceholder: "@username atau tiktok.com/@username",
          linkedinPlaceholder: "username, in/username, atau linkedin.com/in/username",
          bioPlaceholder: "Tulis cerita singkat, kenangan, atau peran beliau di keluarga...",
          addNewWork: "Tambah karya baru",
          workOptions: {
            book: "Buku",
            music: "Musik",
            film: "Film",
            art: "Seni",
            other: "Lainnya",
          } as Record<WorkItem["type"], string>,
          workTitlePlaceholder: "Judul karya",
          yearPlaceholder: "Tahun",
          addWork: "Tambah karya",
          cancel: "Batal",
          save: "Simpan Perubahan",
          add: "Tambah Anggota",
          removeWork: "Hapus karya",
        }
      : {
          editProfile: "Edit Profile",
          addTypeLabels: {
            parent: "Add Parent",
            partner: "Add Partner",
            child: "Add Child",
            sibling: "Add Sibling",
          },
          profileRecord: "Family record",
          profilePhotoLabel: "Profile photo",
          addPhoto: "Add profile photo",
          replacePhoto: "Replace profile photo",
          photoHint: "The profile photo appears on the tree card and profile header.",
          identity: "Identity",
          lifeRecord: "Life years",
          socialMedia: "Social media",
          socialHint: "Optional. Use username or profile URL.",
          storySection: "Biography",
          worksSection: "Works & Creations",
          archiveSection: "Gallery & Archive",
          galleryMedia: "Archive photos and media",
          imageProcessFailed: "Failed to process image",
          imageUploadFailed: "Failed to upload photo",
          uploadStages: {
            optimizing: "Optimizing photo...",
            presigning: "Preparing upload...",
            uploading: "Uploading photo...",
            done: "Upload complete",
          } as Record<MediaUploadStage, string>,
          saveTreeFirst: "The family tree must be saved before uploading photos.",
          requiredName: "Name is required",
          invalidInstagram:
            "Invalid Instagram format. Use @username or instagram.com/username",
          invalidTikTok:
            "Invalid TikTok format. Use @username or tiktok.com/@username",
          invalidLinkedIn:
            "Invalid LinkedIn format. Use username, in/username, or linkedin.com/in/username",
          invalidDeathYear: "Death year cannot be earlier than birth year",
          fullName: "Full Name *",
          fullNamePlaceholder: "Family member name",
          birthYear: "Birth Year",
          deathYear: "Death Year",
          deathPlaceholder: "Leave empty if still alive",
          coParent: "Second Parent",
          coParentHint:
            "Select this only if the child should also be linked to a specific partner.",
          coParentNone: "None / single parent only",
          instagramPlaceholder: "@username or instagram.com/username",
          tiktokPlaceholder: "@username or tiktok.com/@username",
          linkedinPlaceholder: "username, in/username, or linkedin.com/in/username",
          bioPlaceholder: "Write a short story, memory, or role in the family...",
          addNewWork: "Add new work",
          workOptions: {
            book: "Book",
            music: "Music",
            film: "Film",
            art: "Art",
            other: "Other",
          } as Record<WorkItem["type"], string>,
          workTitlePlaceholder: "Work title",
          yearPlaceholder: "Year",
          addWork: "Add work",
          cancel: "Cancel",
          save: "Save Changes",
          add: "Add Member",
          removeWork: "Remove work",
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
      setImageStorageKey(editingNode.imageStorageKey ?? null);
      setImageMimeType(editingNode.imageMimeType ?? null);
      setMedia(editingNode.content?.media || []);
      setWorks(editingNode.works || []);
      if (editingNode.imageSizeBytes) {
        setImageSize(editingNode.imageSizeBytes);
      } else if (editingNode.imageUrl?.startsWith("data:")) {
        setImageSize(getBase64Size(editingNode.imageUrl));
      } else {
        setImageSize(0);
      }
    } else {
      resetForm();
    }
  }, [editingNode]);

  useEffect(() => {
    if (!isOpen || editingNode || addType !== "child") {
      setCoParentId("");
      setCoParentTouched(false);
      return;
    }

    const stillValid = coParentOptions.some((option) => option.id === coParentId);
    if (coParentId && !stillValid) {
      setCoParentId("");
      setCoParentTouched(false);
      return;
    }

    if (!coParentTouched && !coParentId && coParentOptions.length > 0) {
      setCoParentId(coParentOptions[0].id);
    }
  }, [
    addType,
    coParentId,
    coParentOptions,
    coParentTouched,
    editingNode,
    isOpen,
  ]);

  const resetForm = () => {
    setLabel("");
    setYear("");
    setDeathYear("");
    setCoParentId("");
    setCoParentTouched(false);
    setDescription("");
    setInstagram("");
    setTiktok("");
    setLinkedin("");
    setImageUrl(null);
    setImageStorageKey(null);
    setImageMimeType(null);
    setMedia([]);
    setWorks([]);
    setImageSize(0);
    setUploadStage(null);
    setError(null);
  };

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStage("optimizing");
    setError(null);

    try {
      if (!treeId) {
        setError(copy.saveTreeFirst);
        return;
      }

      const asset = await uploadMediaFile({
        treeId,
        nodeId: editingNode?.id ?? null,
        purpose: "profile",
        file,
        onStage: setUploadStage,
      });
      setImageUrl(asset.url);
      setImageStorageKey(asset.storageKey);
      setImageMimeType(asset.mimeType);
      setImageSize(asset.sizeBytes);
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.imageProcessFailed;
      setError(`${copy.imageUploadFailed}: ${message}`);
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadStage(null);
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
      imageStorageKey,
      imageMimeType,
      imageSizeBytes: imageSize > 0 ? imageSize : null,
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
    const iconClass = "h-4 w-4";
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

  const addWork = () => {
    const typeEl = workTypeRef.current;
    const titleEl = workTitleRef.current;
    const yearEl = workYearRef.current;

    if (!titleEl?.value.trim()) return;

    const newWork: WorkItem = {
      type: (typeEl?.value || "book") as WorkItem["type"],
      title: titleEl.value.trim(),
      year: yearEl?.value ? parseInt(yearEl.value) : undefined,
    };
    setWorks([...works, newWork]);
    titleEl.value = "";
    if (yearEl) yearEl.value = "";
  };

  const panelTitle = editingNode ? copy.editProfile : copy.addTypeLabels[addType];
  const displayImageUrl = imageUrl ? resolveDisplayMediaUrl(imageUrl) : null;
  const inputClass =
    "w-full rounded-lg border border-brand-200 bg-cream-50 px-3 py-2.5 text-sm font-semibold text-ink-800 placeholder:text-ink-300 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";
  const labelClass = "text-xs font-black uppercase tracking-[0.12em] text-ink-500";
  const sectionClass = "rounded-xl border border-brand-200 bg-cream-50/92 p-4 shadow-soft";

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-[#1d1610]/55 backdrop-blur-[2px]"
        onClick={() => {
          resetForm();
          onClose();
        }}
        aria-label="close editor"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-[1] flex h-full w-full max-w-[560px] flex-col border-l border-brand-200 bg-cream-50 bg-grain shadow-deep"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-brand-200 bg-cream-100/92 px-5 py-4 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">
                {copy.profileRecord}
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold leading-tight text-ink-800">
                {panelTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-cream-50 text-ink-600 transition hover:bg-cream-200 hover:text-ink-800"
              aria-label="close editor"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-5">
            <section className={sectionClass}>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="group relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-200 bg-cream-200 text-brand-700 shadow-soft transition hover:border-brand-400"
                >
                  {displayImageUrl ? (
                    <img src={displayImageUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-9 w-9" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-ink-900/55 text-white opacity-0 transition group-hover:opacity-100">
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <ImagePlus className="h-6 w-6" />
                    )}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className={labelClass}>{copy.profilePhotoLabel}</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-brand-300 bg-cream-100 px-4 text-sm font-black text-brand-800 transition hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    {isUploading && uploadStage
                      ? copy.uploadStages[uploadStage]
                      : imageUrl
                      ? copy.replacePhoto
                      : copy.addPhoto}
                  </button>
                  <p className="mt-3 text-xs leading-5 text-ink-500">
                    {isUploading && uploadStage
                      ? copy.uploadStages[uploadStage]
                      : imageUrl
                      ? formatFileSize(imageSize)
                      : copy.photoHint}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </section>

            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-brand-700" />
                <h3 className={labelClass}>{copy.identity}</h3>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-ink-700">{copy.fullName}</span>
                <input
                  required
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder={copy.fullNamePlaceholder}
                  className={inputClass}
                />
              </label>
            </section>

            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-700" />
                <h3 className={labelClass}>{copy.lifeRecord}</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-ink-700">{copy.birthYear}</span>
                  <input
                    type="number"
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                    placeholder="1990"
                    min="1800"
                    max={new Date().getFullYear()}
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-ink-700">{copy.deathYear}</span>
                  <input
                    type="number"
                    value={deathYear}
                    onChange={(event) => setDeathYear(event.target.value)}
                    placeholder={copy.deathPlaceholder}
                    min="1800"
                    max={new Date().getFullYear()}
                    className={inputClass}
                  />
                </label>
              </div>

              {!editingNode && addType === "child" && parentId && coParentOptions.length > 0 && (
                <label className="mt-4 block space-y-2">
                  <span className="text-sm font-bold text-ink-700">{copy.coParent}</span>
                  <select
                    value={coParentId}
                    onChange={(event) => {
                      setCoParentTouched(true);
                      setCoParentId(event.target.value);
                    }}
                    className={inputClass}
                  >
                    <option value="">{copy.coParentNone}</option>
                    {coParentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs leading-5 text-ink-500">{copy.coParentHint}</p>
                </label>
              )}
            </section>

            <section className={sectionClass}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-brand-700" />
                  <h3 className={labelClass}>{copy.socialMedia}</h3>
                </div>
                <p className="text-xs font-semibold text-ink-500">{copy.socialHint}</p>
              </div>
              <div className="space-y-3">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-ink-700">Instagram</span>
                  <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-cream-50 px-3 py-2.5 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                    <Instagram className="h-4 w-4 shrink-0 text-brand-700" />
                    <input
                      value={instagram}
                      onChange={(event) => setInstagram(event.target.value)}
                      placeholder={copy.instagramPlaceholder}
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink-800 placeholder:text-ink-300 focus:outline-none"
                    />
                  </div>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-ink-700">TikTok</span>
                  <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-cream-50 px-3 py-2.5 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                    <Music2 className="h-4 w-4 shrink-0 text-brand-700" />
                    <input
                      value={tiktok}
                      onChange={(event) => setTiktok(event.target.value)}
                      placeholder={copy.tiktokPlaceholder}
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink-800 placeholder:text-ink-300 focus:outline-none"
                    />
                  </div>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-ink-700">LinkedIn</span>
                  <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-cream-50 px-3 py-2.5 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                    <Linkedin className="h-4 w-4 shrink-0 text-brand-700" />
                    <input
                      value={linkedin}
                      onChange={(event) => setLinkedin(event.target.value)}
                      placeholder={copy.linkedinPlaceholder}
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink-800 placeholder:text-ink-300 focus:outline-none"
                    />
                  </div>
                </label>
              </div>
            </section>

            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand-700" />
                <h3 className={labelClass}>{copy.storySection}</h3>
              </div>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={copy.bioPlaceholder}
                rows={5}
                className={`${inputClass} resize-none leading-6`}
              />
            </section>

            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-2">
                <Book className="h-4 w-4 text-brand-700" />
                <h3 className={labelClass}>{copy.worksSection}</h3>
              </div>

              {works.length > 0 && (
                <div className="mb-4 space-y-2">
                  {works.map((work, index) => (
                    <div
                      key={`${work.title}-${index}`}
                      className="flex items-center gap-3 rounded-lg border border-brand-200 bg-cream-100 p-3"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                        {getWorkIcon(work.type)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-ink-800">
                          {work.title}
                        </span>
                        {work.year && (
                          <span className="block text-xs font-semibold text-ink-500">
                            {work.year}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => setWorks(works.filter((_, itemIndex) => itemIndex !== index))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                        aria-label={copy.removeWork}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[120px_1fr_92px]">
                <select
                  ref={workTypeRef}
                  className={inputClass}
                  defaultValue="book"
                >
                  <option value="book">{copy.workOptions.book}</option>
                  <option value="music">{copy.workOptions.music}</option>
                  <option value="film">{copy.workOptions.film}</option>
                  <option value="art">{copy.workOptions.art}</option>
                  <option value="other">{copy.workOptions.other}</option>
                </select>
                <input
                  ref={workTitleRef}
                  type="text"
                  placeholder={copy.workTitlePlaceholder}
                  className={inputClass}
                />
                <input
                  ref={workYearRef}
                  type="number"
                  placeholder={copy.yearPlaceholder}
                  min="1800"
                  max={new Date().getFullYear()}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={addWork}
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-brand-300 bg-cream-100 px-4 text-sm font-black text-brand-800 transition hover:bg-cream-200"
              >
                <Plus className="h-4 w-4" />
                {copy.addWork}
              </button>
            </section>

            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-2">
                <Archive className="h-4 w-4 text-brand-700" />
                <h3 className={labelClass}>{copy.archiveSection}</h3>
              </div>
              <p className="mb-3 text-sm font-semibold text-ink-500">
                {copy.galleryMedia}
              </p>
              <GalleryManager
                media={media}
                onChange={setMedia}
                maxItems={10}
                treeId={treeId}
                nodeId={editingNode?.id ?? null}
                onError={setError}
              />
            </section>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-brand-200 bg-cream-100/95 px-5 py-4 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-brand-200 bg-cream-50 px-4 text-sm font-black text-ink-600 transition hover:bg-cream-200 hover:text-ink-800"
            >
              {copy.cancel}
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-black text-white shadow-cta transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isUploading && uploadStage
                ? copy.uploadStages[uploadStage]
                : editingNode
                ? copy.save
                : copy.add}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
