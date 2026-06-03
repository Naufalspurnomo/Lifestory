import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Book,
  Camera,
  CalendarDays,
  ExternalLink,
  Film,
  Heart,
  ImageIcon,
  Instagram,
  Linkedin,
  Music,
  Music2,
  Palette,
  Pencil,
  Plus,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { FamilyNode, WorkItem } from "../../lib/types/tree";
import {
  normalizeInstagramHandle,
  normalizeTikTokHandle,
  normalizeLinkedInHandle,
  toInstagramUrl,
  toTikTokUrl,
  toLinkedInUrl,
} from "../../lib/utils/socialLinks";
import { resolveDisplayMediaUrl } from "../../lib/media/public-url";
import { useLanguage } from "../providers/LanguageProvider";
import GalleryManager from "./GalleryManager";

interface BioModalProps {
  node: FamilyNode;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddRelative: (type: "parent" | "partner" | "child") => void;
}

type Tab = "story" | "gallery" | "relations";

export default function BioModal({
  node,
  onClose,
  onEdit,
  onDelete,
  onAddRelative,
}: BioModalProps) {
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("story");
  const isDeceased = node.deathYear !== null;
  const instagramHandle = normalizeInstagramHandle(node.content?.instagram);
  const instagramUrl = instagramHandle ? toInstagramUrl(instagramHandle) : null;
  const tiktokHandle = normalizeTikTokHandle(node.content?.tiktok);
  const tiktokUrl = tiktokHandle ? toTikTokUrl(tiktokHandle) : null;
  const linkedinHandle = normalizeLinkedInHandle(node.content?.linkedin);
  const linkedinUrl = linkedinHandle ? toLinkedInUrl(linkedinHandle) : null;
  const linkedinLabel = linkedinHandle
    ? linkedinHandle.startsWith("in/")
      ? linkedinHandle.slice(3)
      : linkedinHandle
    : null;
  const displayImageUrl = node.imageUrl
    ? resolveDisplayMediaUrl(node.imageUrl)
    : null;

  const copy =
    locale === "id"
      ? {
          memorial: "Mengenang",
          generation: "Generasi",
          branch: "Cabang",
          unknownYear: "Tahun belum dicatat",
          noMainPhoto: "Belum ada foto utama",
          tabStory: "Cerita",
          tabGallery: "Galeri",
          tabRelations: "Relasi",
          noStoryTitle: "Cerita keluarga ini belum ditulis.",
          noStoryBody: "Tambahkan biografi agar ingatan tentang anggota ini tersimpan rapi.",
          writeStory: "Tulis cerita",
          worksTitle: "Karya & Kreasi",
          archiveEmptyTitle: "Arsip belum berisi media.",
          archiveEmptyBody: "Tambahkan foto atau dokumen dari mode edit profil.",
          manageArchive: "Kelola arsip",
          editProfile: "Edit profil",
          deleteLabel: "Hapus anggota",
          deleteConfirm: (name: string) =>
            `Yakin hapus ${name} dari pohon keluarga?`,
          relationsTitle: "Hubungan keluarga",
          relationsBody: "Tambahkan relasi baru dari profil ini.",
          parent: "Orang tua",
          parentHint: "Tambah generasi di atas",
          partner: "Pasangan",
          partnerHint: "Hubungkan pasangan",
          child: "Anak",
          childHint: "Tambah keturunan",
          workTypes: {
            book: "Buku",
            music: "Musik",
            film: "Film",
            art: "Seni",
            other: "Lainnya",
          } as Record<WorkItem["type"], string>,
        }
      : {
          memorial: "In memory",
          generation: "Generation",
          branch: "Branch",
          unknownYear: "Year not recorded",
          noMainPhoto: "No main photo yet",
          tabStory: "Story",
          tabGallery: "Gallery",
          tabRelations: "Relations",
          noStoryTitle: "This family story has not been written.",
          noStoryBody: "Add a biography to preserve this member's memory.",
          writeStory: "Write story",
          worksTitle: "Works & Creations",
          archiveEmptyTitle: "The archive has no media yet.",
          archiveEmptyBody: "Add photos or documents from edit profile mode.",
          manageArchive: "Manage archive",
          editProfile: "Edit profile",
          deleteLabel: "Delete member",
          deleteConfirm: (name: string) =>
            `Are you sure you want to delete ${name} from the family tree?`,
          relationsTitle: "Family relations",
          relationsBody: "Add a new relation from this profile.",
          parent: "Parent",
          parentHint: "Add an older generation",
          partner: "Partner",
          partnerHint: "Connect a partner",
          child: "Child",
          childHint: "Add a descendant",
          workTypes: {
            book: "Book",
            music: "Music",
            film: "Film",
            art: "Art",
            other: "Other",
          } as Record<WorkItem["type"], string>,
        };

  const lifespan = node.year
    ? node.deathYear
      ? `${node.year} - ${node.deathYear}`
      : `${node.year}`
    : copy.unknownYear;

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

  const relationActions = [
    {
      type: "parent" as const,
      label: copy.parent,
      hint: copy.parentHint,
      icon: ArrowUp,
    },
    {
      type: "partner" as const,
      label: copy.partner,
      hint: copy.partnerHint,
      icon: Heart,
    },
    {
      type: "child" as const,
      label: copy.child,
      hint: copy.childHint,
      icon: ArrowDown,
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-[#1d1610]/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="close profile panel"
      />

      <aside
        className="relative z-[1] flex h-full w-full max-w-[520px] flex-col border-l border-brand-200 bg-cream-50 bg-grain shadow-deep"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative h-56 shrink-0 overflow-hidden border-b border-brand-200 bg-ink-900 text-cream-50">
          {displayImageUrl ? (
            <img src={displayImageUrl} alt={node.label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#82693c_0%,#4f3724_58%,#1d1610_100%)]">
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-cream-300/45 bg-cream-50/10 text-5xl font-black text-cream-50 shadow-soft">
                {node.label.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1d1610] via-[#1d1610]/42 to-transparent" />
          <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-lg border border-cream-300/25 bg-cream-50/12 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-md">
              <UserRound className="h-3.5 w-3.5" />
              {node.line === "self" ? copy.branch : copy.generation}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cream-300/25 bg-cream-50/12 text-cream-50 backdrop-blur-md transition hover:bg-cream-50/22"
              aria-label="close profile panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute bottom-5 left-5 right-5">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-cream-100/90">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-cream-50/12 px-2.5 py-1 backdrop-blur-md">
                <CalendarDays className="h-3.5 w-3.5" />
                {lifespan}
              </span>
              {isDeceased && (
                <span className="rounded-md bg-cream-50/12 px-2.5 py-1 backdrop-blur-md">
                  {copy.memorial}
                </span>
              )}
              <span className="rounded-md bg-cream-50/12 px-2.5 py-1 backdrop-blur-md">
                {copy.generation} {node.generation}
              </span>
            </div>
            <h2 className="font-serif text-3xl font-bold leading-tight tracking-normal text-cream-50">
              {node.label}
            </h2>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-brand-200 bg-cream-100/86 px-5 py-4 backdrop-blur-md">
            <div className="flex gap-2 rounded-xl border border-brand-200 bg-cream-50 p-1 shadow-soft">
              {[
                { id: "story" as const, label: copy.tabStory, icon: Book },
                { id: "gallery" as const, label: copy.tabGallery, icon: ImageIcon },
                { id: "relations" as const, label: copy.tabRelations, icon: Plus },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-xs font-bold transition ${
                      activeTab === tab.id
                        ? "bg-brand-700 text-white shadow-sm"
                        : "text-ink-600 hover:bg-cream-200 hover:text-ink-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {(instagramUrl || tiktokUrl || linkedinUrl) && (
              <div className="mb-5 flex flex-wrap gap-2">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-cream-100 px-3 py-2 text-xs font-bold text-ink-700 transition hover:border-brand-400 hover:bg-cream-50"
                  >
                    <Instagram className="h-4 w-4 text-brand-700" />
                    @{instagramHandle}
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-cream-100 px-3 py-2 text-xs font-bold text-ink-700 transition hover:border-brand-400 hover:bg-cream-50"
                  >
                    <Music2 className="h-4 w-4 text-brand-700" />
                    @{tiktokHandle}
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-cream-100 px-3 py-2 text-xs font-bold text-ink-700 transition hover:border-brand-400 hover:bg-cream-50"
                  >
                    <Linkedin className="h-4 w-4 text-brand-700" />
                    {linkedinLabel || "LinkedIn"}
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                )}
              </div>
            )}

            {activeTab === "story" && (
              <div className="space-y-5">
                {node.content?.description ? (
                  <div className="rounded-xl border border-brand-200 bg-cream-50/92 p-5 shadow-soft">
                    <p className="whitespace-pre-line text-base leading-8 text-ink-700">
                      {node.content.description}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-brand-300 bg-cream-100/78 p-6 text-center">
                    <Camera className="mx-auto mb-3 h-8 w-8 text-brand-700" />
                    <h3 className="font-serif text-xl font-bold text-ink-800">
                      {copy.noStoryTitle}
                    </h3>
                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink-500">
                      {copy.noStoryBody}
                    </p>
                    <button
                      type="button"
                      onClick={onEdit}
                      className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-bold text-white shadow-cta transition hover:bg-brand-800"
                    >
                      <Pencil className="h-4 w-4" />
                      {copy.writeStory}
                    </button>
                  </div>
                )}

                {node.works && node.works.length > 0 && (
                  <section>
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-brand-700">
                      <Book className="h-4 w-4" />
                      {copy.worksTitle}
                    </h3>
                    <div className="space-y-3">
                      {node.works.map((work, index) => (
                        <div
                          key={`${work.title}-${index}`}
                          className="flex items-center gap-3 rounded-xl border border-brand-200 bg-cream-50/92 p-4 shadow-soft"
                        >
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                            {getWorkIcon(work.type)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-ink-800">
                              {work.title}
                            </p>
                            <p className="text-xs font-semibold text-ink-500">
                              {copy.workTypes[work.type]}
                              {work.year ? ` - ${work.year}` : ""}
                            </p>
                            {work.description && (
                              <p className="mt-1 text-sm leading-5 text-ink-500">
                                {work.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {activeTab === "gallery" && (
              <div className="space-y-5">
                {node.content?.media?.length ? (
                  <GalleryManager media={node.content.media} readOnly={true} />
                ) : (
                  <div className="rounded-xl border border-dashed border-brand-300 bg-cream-100/78 p-6 text-center">
                    <ImageIcon className="mx-auto mb-3 h-8 w-8 text-brand-700" />
                    <h3 className="font-serif text-xl font-bold text-ink-800">
                      {copy.archiveEmptyTitle}
                    </h3>
                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink-500">
                      {copy.archiveEmptyBody}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-300 bg-cream-50 px-4 text-sm font-bold text-brand-800 transition hover:bg-cream-100"
                >
                  <Pencil className="h-4 w-4" />
                  {copy.manageArchive}
                </button>
              </div>
            )}

            {activeTab === "relations" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-brand-200 bg-cream-50/92 p-5 shadow-soft">
                  <h3 className="font-serif text-xl font-bold text-ink-800">
                    {copy.relationsTitle}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    {copy.relationsBody}
                  </p>
                  <div className="mt-5 grid gap-3">
                    {relationActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.type}
                          type="button"
                          onClick={() => onAddRelative(action.type)}
                          className="flex items-center gap-4 rounded-xl border border-brand-200 bg-cream-100 p-4 text-left transition hover:border-brand-400 hover:bg-cream-50 hover:shadow-soft"
                        >
                          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-black text-ink-800">
                              {action.label}
                            </span>
                            <span className="block text-xs font-semibold text-ink-500">
                              {action.hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {node.line !== "self" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(copy.deleteConfirm(node.label))) {
                        onDelete();
                      }
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    {copy.deleteLabel}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-brand-200 bg-cream-100/92 px-5 py-4 backdrop-blur-md">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-black text-white shadow-cta transition hover:bg-brand-800"
            >
              <Pencil className="h-4 w-4" />
              {copy.editProfile}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
