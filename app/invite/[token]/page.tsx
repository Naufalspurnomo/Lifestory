"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import type { TreeData } from "../../../lib/types/tree";
import { loadTrees, saveTrees } from "../../../lib/utils/storageUtils";

type InvitePayload = {
  treeName: string;
  treeData: TreeData;
  createdByEmail: string;
  expiresAt: string;
};

export default function InvitePage() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token || "";

  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InvitePayload | null>(null);

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
          setError(data?.error || "Invite link tidak valid.");
          return;
        }

        if (!isCancelled) {
          setInvite(data as InvitePayload);
        }
      } catch {
        if (!isCancelled) {
          setError("Gagal memuat undangan.");
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
  }, [token]);

  const expiresLabel = useMemo(() => {
    if (!invite?.expiresAt) return "-";
    return new Date(invite.expiresAt).toLocaleString("id-ID");
  }, [invite?.expiresAt]);

  async function importTree() {
    if (!invite?.treeData) return;

    const userId = session?.user?.email || session?.user?.id || "";
    if (!userId) {
      setError("Akun Anda tidak valid. Silakan login ulang.");
      return;
    }

    const sourceTree = invite.treeData;
    if (!Array.isArray(sourceTree.nodes) || sourceTree.nodes.length === 0) {
      setError("Data pohon pada undangan tidak valid.");
      return;
    }

    const existingTrees = loadTrees();
    const hasOwnTree = existingTrees.some((t) => t.ownerId === userId);

    if (
      hasOwnTree &&
      !window.confirm(
        "Anda sudah punya pohon sendiri. Import ini akan menggantikan pohon Anda saat ini. Lanjutkan?"
      )
    ) {
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

    const mergedTrees = [
      importedTree,
      ...existingTrees.filter((t) => t.ownerId !== userId),
    ];
    const saveResult = saveTrees(mergedTrees);

    if (!saveResult.success) {
      setImporting(false);
      setError(saveResult.error || "Gagal menyimpan pohon ke akun Anda.");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  if (loading || sessionStatus === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="inline-flex rounded-xl border border-warmBorder bg-white px-6 py-4 text-sm text-warmMuted">
          Memuat undangan...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-xl font-semibold text-red-700">
            Undangan tidak bisa digunakan
          </h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <Link
            href="/"
            className="mt-5 inline-block text-sm font-semibold text-accent-700 hover:underline"
          >
            Kembali ke beranda
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
            Undangan pohon keluarga
          </h1>
          <p className="mt-2 text-sm text-warmMuted">
            Anda diundang untuk melihat dan melanjutkan pohon:{" "}
            <span className="font-semibold text-warmText">{invite.treeName}</span>
          </p>
          <p className="mt-1 text-xs text-warmMuted">
            Dibuat oleh {invite.createdByEmail} | berlaku sampai {expiresLabel}
          </p>

          <div className="mt-6">
            <Link href={`/auth/login?next=/invite/${token}`}>
              <Button className="h-11 rounded-xl px-6">Login untuk Import</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="rounded-2xl border border-warmBorder bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-semibold text-warmText">
          Terima Undangan Pohon
        </h1>
        <p className="mt-2 text-sm text-warmMuted">
          Anda akan mengimpor pohon{" "}
          <span className="font-semibold text-warmText">{invite.treeName}</span>{" "}
          ke akun Anda.
        </p>
        <p className="mt-1 text-xs text-warmMuted">
          Dibuat oleh {invite.createdByEmail} | berlaku sampai {expiresLabel}
        </p>

        <div className="mt-6 rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-800">
          Import ini akan menyalin data pohon ke penyimpanan akun Anda saat ini.
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
            {importing ? "Mengimpor..." : "Import ke Akun Saya"}
          </Button>
          <Link href="/app">
            <Button variant="secondary" className="h-11 rounded-xl px-6">
              Batal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
