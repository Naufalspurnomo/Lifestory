"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  Crown,
  Info,
  Search,
  ShieldOff,
  Sparkles,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useLanguage } from "../../components/providers/LanguageProvider";

type UserStatus = "active" | "inactive" | "suspended";

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  subscriptionActive: boolean;
  status: UserStatus;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { locale } = useLanguage();
  const reduce = useReducedMotion();
  const user = session?.user;
  const [users, setUsers] = useState<UserData[]>([]);
  const [filter, setFilter] = useState<"all" | UserStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const copy =
    locale === "id"
      ? {
          accessDenied: "Akses Ditolak",
          adminOnly: "Halaman ini hanya untuk admin.",
          alertUpdateFailed: "Gagal mengupdate status user",
          alertGeneralError: "Terjadi kesalahan",
          statusLabels: {
            active: "Berlangganan",
            inactive: "Belum Berlangganan",
            suspended: "Ditangguhkan",
          },
          headerLabel: "Admin Dashboard",
          headerTitle: "Manajemen Pengguna",
          headerDesc: "Kelola status langganan dan akses pengguna platform.",
          statTotalUsers: "Total Pengguna",
          statActive: "Berlangganan",
          statInactive: "Belum Berlangganan",
          statSuspended: "Ditangguhkan",
          filterAll: "Semua",
          filterActive: "Berlangganan",
          filterInactive: "Belum Bayar",
          filterSuspended: "Ditangguhkan",
          searchPlaceholder: "Cari nama atau email...",
          loadingText: "Memuat data...",
          thUser: "Pengguna",
          thRole: "Peran",
          thStatus: "Status",
          thAction: "Aksi",
          noUsers: "Tidak ada pengguna yang ditemukan.",
          roleAdmin: "Admin",
          roleUser: "Pengguna",
          updating: "Memperbarui...",
          activate: "Aktifkan",
          deactivate: "Nonaktifkan",
          suspend: "Tangguhkan",
          unsuspend: "Cabut Penangguhan",
          suspendConfirm: (name: string) =>
            `Tangguhkan ${name}? User tidak akan bisa mengakses platform.`,
          howItWorks: "Cara Kerja",
          howActive:
            "User dapat mengakses semua fitur (pohon keluarga, arsip, dll).",
          howInactive: "User sudah terdaftar tapi belum bayar langganan.",
          howSuspended: "User diberhentikan aksesnya karena pelanggaran.",
          howFooter:
            "Perubahan status akan langsung tersimpan ke database dan berlaku saat user login berikutnya.",
        }
      : {
          accessDenied: "Access Denied",
          adminOnly: "This page is for admins only.",
          alertUpdateFailed: "Failed to update user status",
          alertGeneralError: "An error occurred",
          statusLabels: {
            active: "Subscribed",
            inactive: "Not Subscribed",
            suspended: "Suspended",
          },
          headerLabel: "Admin Dashboard",
          headerTitle: "User Management",
          headerDesc: "Manage user subscription status and platform access.",
          statTotalUsers: "Total Users",
          statActive: "Subscribed",
          statInactive: "Not Subscribed",
          statSuspended: "Suspended",
          filterAll: "All",
          filterActive: "Subscribed",
          filterInactive: "Unpaid",
          filterSuspended: "Suspended",
          searchPlaceholder: "Search name or email...",
          loadingText: "Loading data...",
          thUser: "User",
          thRole: "Role",
          thStatus: "Status",
          thAction: "Action",
          noUsers: "No users found.",
          roleAdmin: "Admin",
          roleUser: "User",
          updating: "Updating...",
          activate: "Activate",
          deactivate: "Deactivate",
          suspend: "Suspend",
          unsuspend: "Remove Suspension",
          suspendConfirm: (name: string) =>
            `Suspend ${name}? This user will lose platform access.`,
          howItWorks: "How It Works",
          howActive:
            "User can access all features (family tree, archive, etc).",
          howInactive: "User has registered but has not paid yet.",
          howSuspended: "User access is blocked due to violations.",
          howFooter:
            "Status updates are saved directly to the database and apply on the next login.",
        };

  const isAdmin = user?.role === "admin";

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  if (!isAdmin) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#faf6ed] via-[#fdfbf6] to-[#faf6ed] text-[#40342c]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#dfceb0]/55 blur-3xl" />
          <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-[#ece2cc]/70 blur-3xl" />
        </div>
        <section className="relative mx-auto flex min-h-screen max-w-2xl items-center px-6 py-16">
          <div className="w-full rounded-[28px] border border-[#dfd2be] bg-white/86 p-10 text-center shadow-[0_22px_60px_rgba(88,74,51,0.18)] backdrop-blur-sm">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e7c9c9] bg-[#fff4f4] text-[#b34a4a]">
              <ShieldOff className="h-5 w-5" />
            </div>
            <h1 className="font-serif text-3xl text-[#3f342d]">
              {copy.accessDenied}
            </h1>
            <p className="mt-2 text-[#73685f]">{copy.adminOnly}</p>
          </div>
        </section>
      </div>
    );
  }

  async function updateUserStatus(userId: string, newStatus: UserStatus) {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  status: updatedUser.status,
                  subscriptionActive: updatedUser.subscriptionActive,
                }
              : u
          )
        );
      } else {
        alert(copy.alertUpdateFailed);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert(copy.alertGeneralError);
    } finally {
      setUpdating(null);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesFilter = filter === "all" || u.status === filter;
    const matchesSearch =
      searchQuery === "" ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    inactive: users.filter((u) => u.status === "inactive").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  const statusBadgeStyles: Record<UserStatus, string> = {
    active: "border-[#cfe3d2] bg-[#f1faef] text-[#3a6e44]",
    inactive: "border-[#e9d4a3] bg-[#fdfbf6] text-[#9d6e1c]",
    suspended: "border-[#e7c9c9] bg-[#fff4f4] text-[#b34a4a]",
  };

  const filterLabels = {
    all: copy.filterAll,
    active: copy.filterActive,
    inactive: copy.filterInactive,
    suspended: copy.filterSuspended,
  };

  type StatCard = {
    key: keyof typeof stats;
    label: string;
    value: number;
    icon: typeof Users;
    accent: string;
  };

  const statCards: StatCard[] = [
    {
      key: "total",
      label: copy.statTotalUsers,
      value: stats.total,
      icon: Users,
      accent:
        "border-[#dfd2be] bg-[linear-gradient(150deg,#fffaf0_0%,#fffdf6_100%)] text-[#7b5a26]",
    },
    {
      key: "active",
      label: copy.statActive,
      value: stats.active,
      icon: UserCheck,
      accent:
        "border-[#cfe3d2] bg-[linear-gradient(150deg,#f1faef_0%,#fbfff8_100%)] text-[#3a6e44]",
    },
    {
      key: "inactive",
      label: copy.statInactive,
      value: stats.inactive,
      icon: Crown,
      accent:
        "border-[#e9d4a3] bg-[linear-gradient(150deg,#fdfbf6_0%,#fffdf6_100%)] text-[#9d6e1c]",
    },
    {
      key: "suspended",
      label: copy.statSuspended,
      value: stats.suspended,
      icon: UserX,
      accent:
        "border-[#e7c9c9] bg-[linear-gradient(150deg,#fff4f4_0%,#fffafa_100%)] text-[#b34a4a]",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#faf6ed] via-[#fdfbf6] to-[#faf6ed] text-[#40342c]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#dfceb0]/40 blur-3xl" />
        <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-[#ece2cc]/55 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(164,146,117,0.05)_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <section className="relative mx-auto max-w-6xl space-y-8 px-6 py-12 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.5, ease: "easeOut" }}
          className="space-y-3"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-[#dccfb3] bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#82693c] backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#82693c]" />
            {copy.headerLabel}
          </p>
          <h1 className="font-serif text-[clamp(2rem,4.4vw,3.4rem)] leading-tight text-[#3f342d]">
            {copy.headerTitle}
          </h1>
          <p className="max-w-2xl text-[#73685f]">{copy.headerDesc}</p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduce ? 0.01 : 0.4, delay: reduce ? 0 : 0.04 * idx }}
                className={`rounded-2xl border p-5 shadow-[0_14px_28px_rgba(59,43,24,0.06)] backdrop-blur-sm ${card.accent}`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">
                    {card.label}
                  </p>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/70">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 font-serif text-4xl text-[#3f342d]">
                  {card.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-[#dfd2be] bg-white/82 p-5 shadow-[0_14px_28px_rgba(59,43,24,0.06)] backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "active", "inactive", "suspended"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                  filter === status
                    ? "bg-gradient-to-r from-[#82693c] to-[#604b2d] text-white shadow-[0_8px_18px_rgba(130,105,60,0.3)]"
                    : "border border-[#e2d4be] bg-white text-[#6c5a49] hover:border-[#c7b289] hover:bg-[#fffaf0]"
                }`}
              >
                {filterLabels[status]}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder={copy.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#e2d4be] bg-white px-4 py-2.5 pl-10 text-sm text-[#3f342d] placeholder:text-[#a99e8f] outline-none transition focus:border-[#82693c] focus:ring-2 focus:ring-[#efe4d0]"
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a99e8f]" />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#dfd2be] bg-white/86 shadow-[0_18px_36px_rgba(59,43,24,0.08)] backdrop-blur-sm">
          {loading ? (
            <div className="p-12 text-center text-[#7b6f63]">
              <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-[#82693c] border-t-transparent" />
              <p className="mt-3 text-sm">{copy.loadingText}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-[#ece2cc] bg-[#faf5ea]">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#82693c]">
                      {copy.thUser}
                    </th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#82693c]">
                      {copy.thRole}
                    </th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#82693c]">
                      {copy.thStatus}
                    </th>
                    <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#82693c]">
                      {copy.thAction}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece2cc]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-sm text-[#7b6f63]"
                      >
                        {copy.noUsers}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="transition hover:bg-[#fffaf0]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe3cc] text-sm font-bold text-[#6a5033]">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-[#3f342d]">{u.name}</p>
                              <p className="text-sm text-[#7b6f63]">{u.email}</p>
                              {u.phone && (
                                <p className="text-xs text-[#82693c]">{u.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                              u.role === "admin"
                                ? "border-[#dccef0] bg-[#f4eefe] text-[#6a4ab6]"
                                : "border-[#e2d4be] bg-[#fffcf7] text-[#6c5a49]"
                            }`}
                          >
                            {u.role === "admin" && <Crown className="h-3 w-3" />}
                            {u.role === "admin" ? copy.roleAdmin : copy.roleUser}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${statusBadgeStyles[u.status]}`}
                          >
                            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                            {copy.statusLabels[u.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {updating === u.id ? (
                              <span className="text-xs text-[#7b6f63]">
                                {copy.updating}
                              </span>
                            ) : (
                              <>
                                {u.status !== "active" && (
                                  <button
                                    onClick={() =>
                                      updateUserStatus(u.id, "active")
                                    }
                                    className="inline-flex items-center gap-1 rounded-full border border-[#cfe3d2] bg-[#f1faef] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3a6e44] transition hover:bg-[#e3f3e0]"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                    {copy.activate}
                                  </button>
                                )}
                                {u.status === "active" && (
                                  <button
                                    onClick={() =>
                                      updateUserStatus(u.id, "inactive")
                                    }
                                    className="inline-flex items-center gap-1 rounded-full border border-[#e9d4a3] bg-[#fdfbf6] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9d6e1c] transition hover:bg-[#fbecc4]"
                                  >
                                    {copy.deactivate}
                                  </button>
                                )}
                                {u.status !== "suspended" && u.role !== "admin" && (
                                  <button
                                    onClick={() => {
                                      if (confirm(copy.suspendConfirm(u.name))) {
                                        updateUserStatus(u.id, "suspended");
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 rounded-full border border-[#e7c9c9] bg-[#fff4f4] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#b34a4a] transition hover:bg-[#fbe6e6]"
                                  >
                                    <ShieldOff className="h-3 w-3" />
                                    {copy.suspend}
                                  </button>
                                )}
                                {u.status === "suspended" && (
                                  <button
                                    onClick={() =>
                                      updateUserStatus(u.id, "inactive")
                                    }
                                    className="inline-flex items-center rounded-full border border-[#e2d4be] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6c5a49] transition hover:border-[#c7b289] hover:bg-[#fffaf0]"
                                  >
                                    {copy.unsuspend}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[#dfd2be] bg-[linear-gradient(150deg,#fff8ea_0%,#fffdf6_60%,#fff_100%)] p-7 shadow-[0_14px_28px_rgba(59,43,24,0.08)]">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-[#dccfb3] bg-white text-[#82693c]">
              <Info className="h-5 w-5" />
            </span>
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#82693c]">
                {copy.howItWorks}
              </p>
              <ul className="space-y-2 text-sm text-[#5a4d42]">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-[#3a6e44]" />
                  <span>
                    <strong className="text-[#3f342d]">
                      {copy.statusLabels.active}
                    </strong>
                    : {copy.howActive}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-[#9d6e1c]" />
                  <span>
                    <strong className="text-[#3f342d]">
                      {copy.statusLabels.inactive}
                    </strong>
                    : {copy.howInactive}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-[#b34a4a]" />
                  <span>
                    <strong className="text-[#3f342d]">
                      {copy.statusLabels.suspended}
                    </strong>
                    : {copy.howSuspended}
                  </span>
                </li>
              </ul>
              <p className="border-t border-[#ece2cc] pt-3 text-xs text-[#7b6f63]">
                {copy.howFooter}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
