"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../../components/providers/LanguageProvider";
import { Button } from "../../../components/ui/Button";
import type { TreeData } from "../../../lib/types/tree";

type InvitePayload = {
  treeName: string;
  treeData: TreeData;
  createdByEmail: string;
  expiresAt: string;
};

export default function InvitePage() {
  const { data: session, status: sessionStatus } = useSession();
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
          invalidAccount: "Akun Anda tidak valid. Silakan login ulang.",
          invalidTreeData: "Data pohon pada undangan tidak valid.",
          replaceConfirm:
            "Anda sudah punya pohon sendiri. Import ini akan menggantikan pohon Anda saat ini. Lanjutkan?",
          saveFailed: "Gagal menyimpan pohon ke akun Anda.",
          loadingInvite: "Memuat undangan...",
          unusableInvite: "Undangan tidak bisa digunakan",
          backHome: "Kembali ke beranda",
          inviteTitle: "Undangan pohon keluarga",
          invitedToTree: "Anda diundang untuk melihat dan melanjutkan pohon:",
          createdByAndExpires: (email: string, expiry: string) =>
            `Dibuat oleh ${email} | berlaku sampai ${expiry}`,
          loginToImport: "Login untuk Import",
          acceptTitle: "Terima Undangan Pohon",
          acceptBody: "Anda akan mengimpor pohon",
          intoYourAccount: "ke akun Anda.",
          importWarning:
            "Import ini akan menyalin data pohon ke akun Anda di cloud.",
          importing: "Mengimpor...",
          importToMyAccount: "Import ke Akun Saya",
          cancel: "Batal",
        }
      : {
          invalidLink: "Invalid invite link.",
          failedLoadInvite: "Failed to load invite.",
          invalidAccount: "Your account is invalid. Please login again.",
          invalidTreeData: "Tree data in this invite is invalid.",
          replaceConfirm:
            "You already have your own tree. Importing will replace your current tree. Continue?",
          saveFailed: "Failed to save tree to your account.",
          loadingInvite: "Loading invite...",
          unusableInvite: "Invite cannot be used",
          backHome: "Back to home",
          inviteTitle: "Family tree invite",
          invitedToTree: "You are invited to view and continue the tree:",
          createdByAndExpires: (email: string, expiry: string) =>
            `Created by ${email} | expires at ${expiry}`,
          loginToImport: "Login to Import",
          acceptTitle: "Accept Tree Invite",
          acceptBody: "You are about to import tree",
          intoYourAccount: "into your account.",
          importWarning:
            "This import will copy the tree data into your account cloud storage.",
          importing: "Importing...",
          importToMyAccount: "Import to My Account",
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

  async function importTree() {
    if (!invite?.treeData) return;

    const userId = session?.user?.id || session?.user?.email || "";
    if (!userId) {
      setError(copy.invalidAccount);
      return;
    }

    const sourceTree = invite.treeData;
    if (!Array.isArray(sourceTree.nodes) || sourceTree.nodes.length === 0) {
      setError(copy.invalidTreeData);
      return;
    }

    let hasOwnTree = false;
    try {
      const existingResponse = await fetch("/api/tree", { method: "GET" });
      const existingPayload = await existingResponse.json().catch(() => ({}));
      hasOwnTree = Boolean(existingPayload?.tree);
    } catch {
      hasOwnTree = false;
    }

    if (hasOwnTree && !window.confirm(copy.replaceConfirm)) {
      return;
    }

    setImporting(true);
    setError(null);

    const now = new Date().toISOString();
    const importedTree: TreeData = {
      ...sourceTree,
      id: `tree-${Date.now()}`,
      ownerId: userId,
      name: invite.treeName,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const saveResponse = await fetch("/api/tree", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: importedTree.name,
          nodes: importedTree.nodes,
        }),
      });
      const savePayload = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok) {
        throw new Error(savePayload?.error || copy.saveFailed);
      }
    } catch (error) {
      setImporting(false);
      setError((error as Error).message || copy.saveFailed);
      return;
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
            {copy.createdByAndExpires(invite.createdByEmail, expiresLabel)}
          </p>

          <div className="mt-6">
            <Link href={`/auth/login?next=/invite/${token}`}>
              <Button className="h-11 rounded-xl px-6">{copy.loginToImport}</Button>
            </Link>
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
          {copy.createdByAndExpires(invite.createdByEmail, expiresLabel)}
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
            onClick={importTree}
            disabled={importing}
            className="h-11 rounded-xl px-6"
          >
            {importing ? copy.importing : copy.importToMyAccount}
          </Button>
          <Link href="/app">
            <Button variant="secondary" className="h-11 rounded-xl px-6">
              {copy.cancel}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
