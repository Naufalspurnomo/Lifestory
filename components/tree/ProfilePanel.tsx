"use client";

import { Button } from "../ui/Button";

// Simple display props for profile panel
type ProfileMember = {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  bio?: string;
  photoUrl?: string;
  relationToRoot: string;
};

type Props = {
  member: ProfileMember;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ProfilePanel({
  member,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const birthYear = member.birthDate ? parseInt(member.birthDate) : null;
  const deathYear = member.deathDate ? parseInt(member.deathDate) : null;
  const isDeceased = !!member.deathDate;

  const relationLabels: Record<string, string> = {
    root: "Diri Sendiri",
    self: "Diri Sendiri",
    parent: "Orang Tua",
    paternal: "Jalur Ayah",
    maternal: "Jalur Ibu",
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col z-10">
      {/* Header */}
      <div className="border-b border-slate-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-forest-100 to-forest-200 overflow-hidden">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-forest-700">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {member.name}
              </h2>
              <p className="text-sm text-slate-500">
                {relationLabels[member.relationToRoot] || member.relationToRoot}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Life Timeline */}
        <div className="rounded-xl bg-slate-50 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Timeline Hidup
          </h3>
          <div className="flex items-center gap-4 text-slate-600">
            <div>
              <p className="text-xs text-slate-400">Lahir</p>
              <p className="font-medium">{birthYear || "-"}</p>
            </div>
            {isDeceased && (
              <>
                <span className="text-slate-300">→</span>
                <div>
                  <p className="text-xs text-slate-400">Wafat</p>
                  <p className="font-medium">{deathYear}</p>
                </div>
              </>
            )}
          </div>
          {birthYear && (
            <p className="text-sm text-slate-500">
              {isDeceased && deathYear
                ? `Meninggal pada usia ${deathYear - birthYear} tahun`
                : `Usia ${new Date().getFullYear() - birthYear} tahun`}
            </p>
          )}
        </div>

        {/* Biography */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
            Biografi
          </h3>
          {member.bio ? (
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
              {member.bio}
            </p>
          ) : (
            <p className="text-slate-400 italic">
              Belum ada cerita untuk anggota keluarga ini. Klik &quot;Edit&quot;
              untuk menambahkan.
            </p>
          )}
        </div>

        {/* Memorial Note for deceased */}
        {isDeceased && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
            <p className="text-sm text-amber-800">
              🕯️ <span className="font-medium">{member.name}</span> telah
              berpulang. Cerita dan kenangan beliau tetap hidup dalam sejarah
              keluarga.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-slate-100 p-6 space-y-3">
        <Button block onClick={onEdit}>
          ✏️ Edit Profil
        </Button>
        {/* Delete button - hidden only for root node (self) */}
        {member.relationToRoot !== "root" && (
          <button
            onClick={() => {
              if (confirm(`Yakin hapus ${member.name} dari pohon keluarga?`)) {
                onDelete();
              }
            }}
            className="w-full rounded-lg border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 transition"
          >
            🗑️ Hapus dari Pohon
          </button>
        )}
      </div>
    </div>
  );
}
