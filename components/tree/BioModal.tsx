import { useState } from "react";
import { FamilyNode, WorkItem } from "../../lib/types/tree";
import GalleryManager from "./GalleryManager";
import {
  Book,
  Music,
  Film,
  Palette,
  Star,
  Instagram,
  Music2,
  Linkedin,
  ExternalLink,
} from "lucide-react";
import {
  normalizeInstagramHandle,
  normalizeTikTokHandle,
  normalizeLinkedInHandle,
  toInstagramUrl,
  toTikTokUrl,
  toLinkedInUrl,
} from "../../lib/utils/socialLinks";
import { useLanguage } from "../providers/LanguageProvider";

interface BioModalProps {
  node: FamilyNode;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddRelative: (type: "parent" | "partner" | "child") => void;
}

export default function BioModal({
  node,
  onClose,
  onEdit,
  onDelete,
  onAddRelative,
}: BioModalProps) {
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<"story" | "gallery">("story");
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
  const copy =
    locale === "id"
      ? {
          memorial: "Mengenang",
          generation: "Generasi",
          noMainPhoto: "Belum ada foto utama",
          tabStory: "Cerita",
          tabGallery: "Galeri & Arsip",
          noStory:
            "Belum ada cerita yang ditulis. Klik edit untuk menambahkan biografi.",
          worksTitle: "Karya & Kreasi",
          workTypes: {
            book: "Buku",
            music: "Musik",
            film: "Film",
            art: "Seni",
            other: "Lainnya",
          } as Record<WorkItem["type"], string>,
          editProfile: "Edit Profil",
          deleteConfirm: (name: string) => `Yakin hapus ${name} dari pohon keluarga?`,
          addRelations: "Tambah Hubungan Keluarga",
          parent: "Orang Tua",
          partner: "Pasangan",
          child: "Anak",
          manageGallery: "Kelola Galeri di Edit Mode",
        }
      : {
          memorial: "In Memory",
          generation: "Generation",
          noMainPhoto: "No main photo yet",
          tabStory: "Story",
          tabGallery: "Gallery & Archive",
          noStory: "No story has been written yet. Click edit to add a biography.",
          worksTitle: "Works & Creations",
          workTypes: {
            book: "Book",
            music: "Music",
            film: "Film",
            art: "Art",
            other: "Other",
          } as Record<WorkItem["type"], string>,
          editProfile: "Edit Profile",
          deleteConfirm: (name: string) =>
            `Are you sure you want to delete ${name} from the family tree?`,
          addRelations: "Add Family Relations",
          parent: "Parent",
          partner: "Partner",
          child: "Child",
          manageGallery: "Manage Gallery in Edit Mode",
        };

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
        <div
          className="pointer-events-auto relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-6 top-6 z-10 rounded-full bg-warm-100 p-2 text-warmMuted transition-colors hover:bg-warm-200 hover:text-warmText"
            aria-label="close profile modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="p-8">
            <h2 className="mb-2 pr-12 font-playfair text-3xl font-bold text-warmText">
              {node.label}
            </h2>
            <div className="mb-6 flex items-center gap-2 text-sm font-medium text-warmMuted">
              <span>
                {node.year} {node.deathYear ? `- ${node.deathYear}` : ""}
              </span>
              {isDeceased && <span>• 🕯️ {copy.memorial}</span>}
              <span>
                • {copy.generation} {node.generation}
              </span>
            </div>

            {(instagramUrl || tiktokUrl || linkedinUrl) && (
              <div className="mb-6 flex flex-wrap gap-2">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[#f1d4df] bg-gradient-to-r from-[#fff1f6] to-[#fff8fb] px-4 py-2 text-sm font-semibold text-[#b83b72] transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>@{instagramHandle}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                  </a>
                )}

                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[#d8d8d8] bg-gradient-to-r from-[#f8f8f8] to-[#f1f1f1] px-4 py-2 text-sm font-semibold text-[#1f1f1f] transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <Music2 className="h-4 w-4" />
                    <span>@{tiktokHandle}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                  </a>
                )}

                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[#cddff2] bg-gradient-to-r from-[#eef5fc] to-[#f8fbff] px-4 py-2 text-sm font-semibold text-[#0a66c2] transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <Linkedin className="h-4 w-4" />
                    <span>{linkedinLabel || "LinkedIn"}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                  </a>
                )}
              </div>
            )}

            <div className="relative mb-8 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-warm-100 shadow-inner">
              {node.imageUrl ? (
                <img
                  src={node.imageUrl}
                  alt={node.label}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="p-6 text-center text-warmMuted">
                  <span className="mb-2 block text-4xl">📷</span>
                  <span className="text-sm">{copy.noMainPhoto}</span>
                </div>
              )}
            </div>

            <div className="mb-6 flex gap-1 border-b-2 border-warm-200">
              <button
                onClick={() => setActiveTab("story")}
                className={`rounded-t-lg px-5 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "story"
                    ? "-mb-[2px] border-b-2 border-gold-500 bg-gold-100 text-gold-700"
                    : "text-warmMuted hover:bg-warm-100 hover:text-warmText"
                }`}
              >
                📖 {copy.tabStory}
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={`rounded-t-lg px-5 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "gallery"
                    ? "-mb-[2px] border-b-2 border-gold-500 bg-gold-100 text-gold-700"
                    : "text-warmMuted hover:bg-warm-100 hover:text-warmText"
                }`}
              >
                🖼️ {copy.tabGallery}
              </button>
            </div>

            <div className="min-h-[200px]">
              {activeTab === "story" ? (
                <div className="space-y-6 animate-[fadeIn_0.3s]">
                  <div className="prose prose-stone max-w-none">
                    {node.content?.description ? (
                      <p className="text-lg leading-relaxed text-warmText">
                        {node.content.description}
                      </p>
                    ) : (
                      <p className="py-8 text-center italic text-warmMuted">
                        {copy.noStory}
                      </p>
                    )}
                  </div>

                  {node.works && node.works.length > 0 && (
                    <div className="mt-6 border-t border-warm-200 pt-6">
                      <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warmMuted">
                        <Book className="h-4 w-4" /> {copy.worksTitle}
                      </h3>
                      <div className="grid gap-3">
                        {node.works.map((work, index) => {
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
                            <div
                              key={index}
                              className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gradient-to-r from-gold-50 to-warm-50 p-4"
                            >
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                                {getWorkIcon(work.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-warmText">{work.title}</p>
                                <div className="flex items-center gap-2 text-xs text-warmMuted">
                                  <span>{copy.workTypes[work.type]}</span>
                                  {work.year && (
                                    <>
                                      <span>•</span>
                                      <span>{work.year}</span>
                                    </>
                                  )}
                                </div>
                                {work.description && (
                                  <p className="mt-1 text-sm text-warmMuted">
                                    {work.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={onEdit}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold-700 px-4 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-gold-800 hover:shadow-md"
                    >
                      ✏️ {copy.editProfile}
                    </button>
                    {node.line !== "self" && (
                      <button
                        onClick={() => {
                          if (confirm(copy.deleteConfirm(node.label))) {
                            onDelete();
                          }
                        }}
                        className="rounded-xl border border-red-200 px-4 py-2.5 font-semibold text-red-600 transition-colors hover:bg-red-50"
                        aria-label="delete node"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  <div className="mt-8 border-t border-warm-200 pt-6">
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-warmMuted">
                      {copy.addRelations}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => onAddRelative("parent")}
                        className="flex flex-col items-center gap-2 rounded-xl border border-warm-200 bg-warm-100 p-3 text-warmMuted transition-all hover:bg-warm-200 hover:text-warmText hover:shadow-sm"
                      >
                        <span className="text-xl">⬆️</span>
                        <span className="text-xs font-semibold">{copy.parent}</span>
                      </button>
                      <button
                        onClick={() => onAddRelative("partner")}
                        className="flex flex-col items-center gap-2 rounded-xl border border-warm-200 bg-warm-100 p-3 text-warmMuted transition-all hover:bg-warm-200 hover:text-warmText hover:shadow-sm"
                      >
                        <span className="text-xl">❤️</span>
                        <span className="text-xs font-semibold">{copy.partner}</span>
                      </button>
                      <button
                        onClick={() => onAddRelative("child")}
                        className="flex flex-col items-center gap-2 rounded-xl border border-warm-200 bg-warm-100 p-3 text-warmMuted transition-all hover:bg-warm-200 hover:text-warmText hover:shadow-sm"
                      >
                        <span className="text-xl">⬇️</span>
                        <span className="text-xs font-semibold">{copy.child}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-[fadeIn_0.3s]">
                  <GalleryManager media={node.content?.media || []} readOnly={true} />
                  <div className="mt-6 border-t border-warm-200 pt-6 text-center">
                    <button
                      onClick={onEdit}
                      className="rounded-xl border border-warm-200 px-6 py-2 text-sm font-medium text-warmMuted transition-colors hover:bg-warm-100"
                    >
                      {copy.manageGallery}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
