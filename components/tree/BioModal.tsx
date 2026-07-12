import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Book,
  CalendarDays,
  ExternalLink,
  Film,
  Heart,
  ImageIcon,
  Instagram,
  Linkedin,
  Music,
  Music2,
  MessageCircle,
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
  onAddRelative: (type: "parent" | "partner" | "child" | "sibling") => void;
  onRequestMemory?: () => void;
  canRequestMemory?: boolean;
  readOnly?: boolean;
}

type Tab = "story" | "gallery" | "relations";

export default function BioModal({
  node,
  onClose,
  onEdit,
  onDelete,
  onAddRelative,
  onRequestMemory,
  canRequestMemory = false,
  readOnly = false,
}: BioModalProps) {
  const { locale } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLElement>(null);
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
          requestMemory: "Minta kenangan",
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
          sibling: "Saudara",
          siblingHint: "Tambah anggota segenerasi",
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
          requestMemory: "Request a memory",
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
          sibling: "Sibling",
          siblingHint: "Add the same generation",
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
    {
      type: "sibling" as const,
      label: copy.sibling,
      hint: copy.siblingHint,
      icon: UserRound,
    },
  ];

  const fadeTransition = { duration: shouldReduceMotion ? 0 : 0.18 };
  const panelTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 38, mass: 0.9 };

  useEffect(() => {
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const tabs = [
    { id: "story" as const, label: copy.tabStory, icon: Book },
    { id: "gallery" as const, label: copy.tabGallery, icon: ImageIcon },
    { id: "relations" as const, label: copy.tabRelations, icon: Plus },
  ];

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[100] flex justify-end"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
      transition={fadeTransition}
    >
      <motion.div
        className="pointer-events-auto absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        transition={fadeTransition}
        onClick={onClose}
      />
      <motion.aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="family-member-dialog-title"
        tabIndex={-1}
        className="pointer-events-auto relative z-[1] flex h-full w-full max-w-[472px] flex-col bg-cream-50 bg-grain shadow-deep ring-1 ring-ink-900/10"
        initial={shouldReduceMotion ? false : { x: "100%", opacity: 0.94 }}
        animate={{ x: 0, opacity: 1 }}
        exit={shouldReduceMotion ? { x: 0, opacity: 1 } : { x: "100%", opacity: 0.94 }}
        transition={panelTransition}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Bronze edge accent */}
        <span className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-px bg-gradient-to-b from-brand-400/0 via-brand-400/60 to-brand-400/0" />

        {/* Portrait header */}
        <div className="relative h-60 shrink-0 overflow-hidden bg-ink-900 text-cream-50">
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt={node.label}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_25%,#9c8052_0%,#5a3f28_55%,#1d1610_100%)]">
              <span className="flex h-24 w-24 items-center justify-center rounded-xl border border-cream-50/25 bg-cream-50/5 font-serif text-5xl font-bold text-cream-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                {node.label.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/45 to-transparent" />
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(15,10,6,0.55)]" />

          <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cream-50/20 bg-ink-900/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-md">
              <UserRound className="h-3.5 w-3.5" />
              {node.line === "self" ? copy.branch : `${copy.generation} ${node.generation}`}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cream-50/20 bg-ink-900/30 text-cream-50 backdrop-blur-md transition hover:bg-ink-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream-50/60"
              aria-label="close profile panel"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div className="absolute bottom-5 left-6 right-6">
            <div className="mb-2.5 flex items-center gap-2.5 text-[11px] font-semibold text-cream-100/90">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-brand-300" />
                {lifespan}
              </span>
              {isDeceased && (
                <>
                  <span className="h-1 w-1 rounded-full bg-cream-100/40" />
                  <span className="uppercase tracking-[0.14em] text-brand-300">
                    {copy.memorial}
                  </span>
                </>
              )}
            </div>
            <h2 id="family-member-dialog-title" className="font-serif text-[28px] font-bold leading-[1.1] text-cream-50 [text-shadow:0_1px_18px_rgba(0,0,0,0.45)]">
              {node.label}
            </h2>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {/* Tabs */}
          <div className="border-b border-cream-300 bg-cream-100/85 px-5 py-3 backdrop-blur-md">
            <div className="flex gap-1 rounded-full border border-cream-400 bg-cream-200 p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full text-xs font-bold transition ${
                      isActive
                        ? "bg-brand-700 text-white shadow-[0_2px_8px_-1px_rgba(130,105,60,0.45)]"
                        : "text-ink-500 hover:text-ink-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {(instagramUrl || tiktokUrl || linkedinUrl) && (
              <div className="mb-6 flex flex-wrap gap-2">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-3 py-1.5 text-xs font-bold text-ink-700 transition hover:border-brand-400 hover:text-ink-900"
                  >
                    <Instagram className="h-3.5 w-3.5 text-brand-700" />
                    @{instagramHandle}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-3 py-1.5 text-xs font-bold text-ink-700 transition hover:border-brand-400 hover:text-ink-900"
                  >
                    <Music2 className="h-3.5 w-3.5 text-brand-700" />
                    @{tiktokHandle}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-3 py-1.5 text-xs font-bold text-ink-700 transition hover:border-brand-400 hover:text-ink-900"
                  >
                    <Linkedin className="h-3.5 w-3.5 text-brand-700" />
                    {linkedinLabel || "LinkedIn"}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                )}
              </div>
            )}

            {activeTab === "story" && (
              <div className="space-y-7">
                {node.content?.description ? (
                  <article>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                        {copy.tabStory}
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-r from-brand-400/50 to-transparent" />
                    </div>
                    <p className="whitespace-pre-line text-[15px] leading-[1.9] text-ink-700 first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-[52px] first-letter:font-bold first-letter:leading-[0.82] first-letter:text-brand-700">
                      {node.content.description}
                    </p>
                  </article>
                ) : (
                  <div className="rounded-2xl border border-cream-300 bg-cream-100/50 px-7 py-10 text-center">
                    <p className="font-serif text-2xl font-bold leading-snug text-ink-800">
                      {copy.noStoryTitle}
                    </p>
                    <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-ink-500">
                      {copy.noStoryBody}
                    </p>
                    {!readOnly && <button
                      type="button"
                      onClick={onEdit}
                      className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-brand-700 px-5 text-sm font-bold text-white shadow-cta transition hover:bg-brand-800"
                    >
                      <Pencil className="h-4 w-4" />
                      {copy.writeStory}
                    </button>}
                    {canRequestMemory && onRequestMemory && <button
                      type="button"
                      onClick={onRequestMemory}
                      className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-brand-400 bg-cream-50 px-5 text-sm font-bold text-brand-800 transition hover:bg-brand-50"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {copy.requestMemory}
                    </button>}
                  </div>
                )}

                {node.works && node.works.length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                        {copy.worksTitle}
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-r from-brand-400/50 to-transparent" />
                    </div>
                    <div className="space-y-2.5">
                      {node.works.map((work, index) => (
                        <div
                          key={`${work.title}-${index}`}
                          className="flex items-start gap-3.5 rounded-xl border border-cream-300 bg-cream-50 p-4 transition hover:border-brand-300"
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
                              {work.year ? ` · ${work.year}` : ""}
                            </p>
                            {work.description && (
                              <p className="mt-1.5 text-sm leading-6 text-ink-500">
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
                  <div className="rounded-2xl border border-cream-300 bg-cream-100/50 px-7 py-10 text-center">
                    <p className="font-serif text-2xl font-bold leading-snug text-ink-800">
                      {copy.archiveEmptyTitle}
                    </p>
                    <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-ink-500">
                      {copy.archiveEmptyBody}
                    </p>
                  </div>
                )}
                {!readOnly && <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-cream-400 bg-cream-50 px-4 text-sm font-bold text-brand-800 transition hover:border-brand-400 hover:bg-cream-100"
                >
                  <Pencil className="h-4 w-4" />
                  {copy.manageArchive}
                </button>}
              </div>
            )}

            {activeTab === "relations" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-xl font-bold text-ink-800">
                    {copy.relationsTitle}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    {copy.relationsBody}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {!readOnly && relationActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.type}
                        type="button"
                        onClick={() => onAddRelative(action.type)}
                        className="group flex flex-col gap-2.5 rounded-xl border border-cream-300 bg-cream-50 p-4 text-left transition hover:border-brand-400 hover:shadow-soft"
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-ink-800">
                            {action.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] font-medium leading-4 text-ink-500">
                            {action.hint}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {!readOnly && node.line !== "self" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(copy.deleteConfirm(node.label))) {
                        onDelete();
                      }
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-danger/30 bg-danger/5 px-4 text-sm font-bold text-danger transition hover:bg-danger/12"
                  >
                    <Trash2 className="h-4 w-4" />
                    {copy.deleteLabel}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-cream-300 bg-cream-100/90 px-6 py-4 backdrop-blur-md">
            {!readOnly && <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-700 text-sm font-bold text-white shadow-cta transition hover:bg-brand-800"
            >
              <Pencil className="h-4 w-4" />
              {copy.editProfile}
            </button>}
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
}
