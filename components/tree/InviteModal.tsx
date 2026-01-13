"use client";

import { useState } from "react";
import { Button } from "../ui/Button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  treeId: string;
  treeName: string;
};

export default function InviteModal({
  isOpen,
  onClose,
  treeId,
  treeName,
}: Props) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate invite link (in production, this would call an API to create a token)
  const inviteToken = btoa(`${treeId}-${Date.now()}`);
  const inviteLink = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/invite/${inviteToken}`;

  const whatsappMessage = encodeURIComponent(
    `Hai! Saya mengundang kamu untuk berkontribusi ke pohon keluarga "${treeName}" di Lifestory.\n\nKlik link berikut untuk bergabung:\n${inviteLink}`
  );

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-warm-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-warmText">
            Undang Anggota Keluarga
          </h2>
          <p className="text-sm text-warmMuted">
            Bagikan link agar keluarga bisa ikut mengisi pohon silsilah
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-warmMuted">
              Link Undangan
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteLink}
                className="flex-1 rounded-xl border border-warm-200 bg-warm-50 px-3 py-2 text-sm text-warmMuted truncate"
              />
              <Button onClick={copyLink} variant="secondary">
                {copied ? "✓ Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-warmMuted">
              Bagikan via
            </label>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-3 font-medium text-white hover:bg-accent-600 transition"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
              <a
                href={`mailto:?subject=Undangan Pohon Keluarga&body=${whatsappMessage}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-gold-700 px-4 py-3 font-medium text-white hover:bg-gold-800 transition"
              >
                📧 Email
              </a>
            </div>
          </div>

          {/* Permission note */}
          <div className="rounded-xl bg-gold-100 border border-gold-200 p-4">
            <p className="text-sm text-gold-800">
              ⚠️ Siapa pun dengan link ini dapat melihat dan mengedit pohon
              keluarga Anda. Bagikan hanya kepada anggota keluarga yang
              terpercaya.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-warm-200 px-6 py-4">
          <Button variant="secondary" block onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
