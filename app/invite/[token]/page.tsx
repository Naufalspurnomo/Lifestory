"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../../components/providers/LanguageProvider";
import { Button } from "../../../components/ui/Button";

type InvitePayload = {
  treeName: string;
  createdByName: string;
  expiresAt: string;
  role: "editor" | "viewer";
  accepted: boolean;
};

export default function InvitePage() {
  const { status: sessionStatus } = useSession();
  const { locale } = useLanguage();
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token || "";

  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InvitePayload | null>(null);

  const copy =
    locale === "id"
      ? {
          invalidLink: "Invite link tidak valid.",
          failedLoadInvite: "Gagal memuat undangan.",
          acceptFailed: "Gagal menerima undangan pohon.",
          loadingInvite: "Memuat undangan...",
          unusableInvite: "Undangan tidak bisa digunakan",
          backHome: "Kembali ke beranda",
          inviteTitle: "Undangan pohon keluarga",
          invitedToTree: "Anda diundang untuk berkolaborasi pada pohon:",
          createdByAndExpires: (name: string, expiry: string) =>
            `Dibuat oleh ${name} | berlaku sampai ${expiry}`,
          loginToAccept: "Login untuk Menerima",
          acceptTitle: "Terima Undangan Pohon",
          acceptBody: "Anda akan bergabung sebagai editor pada pohon",
          intoYourAccount: "yang sama.",
          importWarning:
            "Data tidak disalin. Semua kolaborator akan menyunting pohon keluarga yang sama.",
          importing: "Memproses...",
          importToMyAccount: "Terima Undangan",
          cancel: "Batal",
        }
      : {
          invalidLink: "Invalid invite link.",
          failedLoadInvite: "Failed to load invite.",
          acceptFailed: "Failed to accept tree invitation.",
          loadingInvite: "Loading invite...",
          unusableInvite: "Invite cannot be used",
          backHome: "Back to home",
          inviteTitle: "Family tree invite",
          invitedToTree: "You are invited to collaborate on the tree:",
          createdByAndExpires: (name: string, expiry: string) =>
            `Created by ${name} | expires at ${expiry}`,
          loginToAccept: "Login to Accept",
          acceptTitle: "Accept Tree Invite",
          acceptBody: "You will join as an editor on the same tree",
          intoYourAccount: ".",
          importWarning:
            "No tree data will be copied. Every collaborator will edit the same family tree.",
          importing: "Processing...",
          importToMyAccount: "Accept Invitation",
          cancel: "Cancel",
        };

  useEffect(() => {
    if (!token) return;

    let isCancelled = false;

    async function loadInvite() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setInvite(null);
          setError(data?.error || copy.invalidLink);
          return;
        }

        if (!isCancelled) {
          setInvite(data as InvitePayload);
        }
      } catch {
        if (!isCancelled) {
          setError(copy.failedLoadInvite);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadInvite();
    return () => {
      isCancelled = true;
    };
  }, [token, copy.invalidLink, copy.failedLoadInvite]);

  const expiresLabel = useMemo(() => {
    if (!invite?.expiresAt) return "-";
    return new Date(invite.expiresAt).toLocaleString(
      locale === "id" ? "id-ID" : "en-US"
    );
  }, [invite?.expiresAt, locale]);

  async function acceptInvite() {
    if (!invite) return;
    setImporting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invites/${token}`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error || copy.acceptFailed);
        return;
      }
    } catch {
      setImporting(false);
      setError(copy.acceptFailed);
      return;
    } finally {
      setImporting(false);
    }

    router.push("/app");
    router.refresh();
  }

  if (loading || sessionStatus === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="inline-flex rounded-xl border border-warmBorder bg-white px-6 py-4 text-sm text-warmMuted">
          {copy.loadingInvite}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-xl font-semibold text-red-700">
            {copy.unusableInvite}
          </h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Link
            href="/"
            className="mt-5 inline-block text-sm font-semibold text-accent-700 hover:underline"
          >
            {copy.backHome}
          </Link>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  if (sessionStatus !== "authenticated") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="rounded-2xl border border-warmBorder bg-white p-7 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-warmText">
            {copy.inviteTitle}
          </h1>
          <p className="mt-2 text-sm text-warmMuted">
            {copy.invitedToTree}{" "}
            <span className="font-semibold text-warmText">{invite.treeName}</span>
          </p>
          <p className="mt-1 text-xs text-warmMuted">
            {copy.createdByAndExpires(invite.createdByName, expiresLabel)}
          </p>

          <div className="mt-6">
            <Button href={`/auth/login?next=/invite/${token}`} className="h-11 rounded-xl px-6">{copy.loginToAccept}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="rounded-2xl border border-warmBorder bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-semibold text-warmText">{copy.acceptTitle}</h1>
        <p className="mt-2 text-sm text-warmMuted">
          {copy.acceptBody}{" "}
          <span className="font-semibold text-warmText">{invite.treeName}</span>{" "}
          {copy.intoYourAccount}
        </p>
        <p className="mt-1 text-xs text-warmMuted">
          {copy.createdByAndExpires(invite.createdByName, expiresLabel)}
        </p>

        <div className="mt-6 rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-800">
          {copy.importWarning}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={acceptInvite}
            disabled={importing}
            className="h-11 rounded-xl px-6"
          >
            {importing ? copy.importing : copy.importToMyAccount}
          </Button>
          <Button href="/app" variant="secondary" className="h-11 rounded-xl px-6">
            {copy.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}
