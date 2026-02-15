"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TreeData } from "../../lib/types/tree";
import { Button } from "../ui/Button";
import { useLanguage } from "../providers/LanguageProvider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  treeName: string;
  treeData: TreeData;
};

export default function InviteModal({
  isOpen,
  onClose,
  treeName,
  treeData,
}: Props) {
  const { locale } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const copy =
    locale === "id"
      ? {
          title: "Undang Anggota Keluarga",
          subtitle: "Bagikan link agar keluarga bisa ikut mengisi pohon silsilah",
          failedCreateLink: "Gagal membuat link undangan",
          failedGeneral: "Terjadi kesalahan saat membuat link undangan",
          labelInviteLink: "Link Undangan",
          creatingLink: "Membuat link...",
          copied: "Tersalin",
          copy: "Salin",
          expires: "Berlaku sampai",
          shareVia: "Bagikan via",
          mailSubject: "Undangan Pohon Keluarga",
          processing: "Memproses...",
          regen: "Generate Ulang Link",
          warning:
            "Siapa pun dengan link ini dapat melihat dan mengedit pohon keluarga Anda. Bagikan hanya kepada anggota keluarga terpercaya.",
          close: "Tutup",
          whatsappMessage: (name: string, link: string) =>
            `Hai! Saya mengundang kamu untuk berkontribusi ke pohon keluarga "${name}" di Lifestory.\n\nKlik link berikut untuk bergabung:\n${link}`,
        }
      : {
          title: "Invite Family Members",
          subtitle: "Share this link so family can contribute to the tree",
          failedCreateLink: "Failed to create invite link",
          failedGeneral: "An error occurred while creating the invite link",
          labelInviteLink: "Invite Link",
          creatingLink: "Creating link...",
          copied: "Copied",
          copy: "Copy",
          expires: "Expires at",
          shareVia: "Share via",
          mailSubject: "Family Tree Invitation",
          processing: "Processing...",
          regen: "Regenerate Link",
          warning:
            "Anyone with this link can view and edit your family tree. Share only with trusted family members.",
          close: "Close",
          whatsappMessage: (name: string, link: string) =>
            `Hi! I invite you to contribute to the "${name}" family tree on Lifestory.\n\nClick the following link to join:\n${link}`,
        };

  const expiresLabel = useMemo(() => {
    if (!expiresAt) return "-";
    return new Date(expiresAt).toLocaleString(
      locale === "id" ? "id-ID" : "en-US"
    );
  }, [expiresAt, locale]);

  const generateInvite = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          treeName,
          treeData,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setInviteLink("");
        setExpiresAt(null);
        setError(payload?.error || copy.failedCreateLink);
        return;
      }

      setInviteLink(payload.inviteLink || "");
      setExpiresAt(payload.expiresAt || null);
    } catch {
      setInviteLink("");
      setExpiresAt(null);
      setError(copy.failedGeneral);
    } finally {
      setLoading(false);
    }
  }, [copy.failedCreateLink, copy.failedGeneral, treeData, treeName]);

  useEffect(() => {
    if (!isOpen) return;
    generateInvite();
  }, [isOpen, generateInvite]);

  if (!isOpen) return null;

  const whatsappMessage = encodeURIComponent(
    copy.whatsappMessage(treeName, inviteLink)
  );

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canShare = Boolean(inviteLink) && !loading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-warm-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-warmText">{copy.title}</h2>
          <p className="text-sm text-warmMuted">{copy.subtitle}</p>
        </div>

        <div className="space-y-6 p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-warmMuted">
              {copy.labelInviteLink}
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={loading ? copy.creatingLink : inviteLink}
                className="flex-1 truncate rounded-xl border border-warm-200 bg-warm-50 px-3 py-2 text-sm text-warmMuted"
              />
              <Button onClick={copyLink} variant="secondary" disabled={!canShare}>
                {copied ? copy.copied : copy.copy}
              </Button>
            </div>
            <p className="text-xs text-warmMuted">
              {copy.expires}: {expiresLabel}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-warmMuted">
              {copy.shareVia}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium text-white transition ${
                  canShare
                    ? "bg-accent-500 hover:bg-accent-600"
                    : "pointer-events-none bg-slate-300"
                }`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  copy.mailSubject
                )}&body=${whatsappMessage}`}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium text-white transition ${
                  canShare
                    ? "bg-gold-700 hover:bg-gold-800"
                    : "pointer-events-none bg-slate-300"
                }`}
              >
                Email
              </a>
            </div>
          </div>

          <Button
            onClick={generateInvite}
            variant="secondary"
            block
            disabled={loading}
          >
            {loading ? copy.processing : copy.regen}
          </Button>

          <div className="rounded-xl border border-gold-200 bg-gold-100 p-4">
            <p className="text-sm text-gold-800">{copy.warning}</p>
          </div>
        </div>

        <div className="border-t border-warm-200 px-6 py-4">
          <Button variant="secondary" block onClick={onClose}>
            {copy.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
