"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../components/providers/LanguageProvider";

type UserStatus = "active" | "inactive" | "suspended";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptionActive: boolean;
  status: UserStatus;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { locale } = useLanguage();
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
          howInactive:
            "User sudah terdaftar tapi belum bayar langganan.",
          howSuspended:
            "User diberhentikan aksesnya karena pelanggaran.",
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
          howInactive:
            "User has registered but has not paid yet.",
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
      <div className="min-h-screen bg-white">
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            {copy.accessDenied}
          </h1>
          <p className="mt-2 text-slate-600">{copy.adminOnly}</p>
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

  const statusColors = {
    active: "bg-green-100 text-green-700",
    inactive: "bg-amber-100 text-amber-700",
    suspended: "bg-red-100 text-red-700",
  };

  const filterLabels = {
    all: copy.filterAll,
    active: copy.filterActive,
    inactive: copy.filterInactive,
    suspended: copy.filterSuspended,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <section className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">
            {copy.headerLabel}
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            {copy.headerTitle}
          </h1>
          <p className="mt-1 text-slate-600">{copy.headerDesc}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{copy.statTotalUsers}</p>
            <p className="text-3xl font-semibold text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm text-green-600">{copy.statActive}</p>
            <p className="text-3xl font-semibold text-green-700">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-600">{copy.statInactive}</p>
            <p className="text-3xl font-semibold text-amber-700">
              {stats.inactive}
            </p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-600">{copy.statSuspended}</p>
            <p className="text-3xl font-semibold text-red-700">
              {stats.suspended}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            {(["all", "active", "inactive", "suspended"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filter === status
                    ? "bg-forest-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {filterLabels[status]}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder={copy.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 pl-10 text-sm focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100 md:w-64"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-forest-600 border-t-transparent" />
              <p className="mt-2">{copy.loadingText}</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {copy.thUser}
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {copy.thRole}
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {copy.thStatus}
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {copy.thAction}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      {copy.noUsers}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-100 text-sm font-semibold text-forest-700">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{u.name}</p>
                            <p className="text-sm text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.role === "admin" ? copy.roleAdmin : copy.roleUser}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                            statusColors[u.status]
                          }`}
                        >
                          {copy.statusLabels[u.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {updating === u.id ? (
                            <span className="text-sm text-slate-500">
                              {copy.updating}
                            </span>
                          ) : (
                            <>
                              {u.status !== "active" && (
                                <button
                                  onClick={() => updateUserStatus(u.id, "active")}
                                  className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100"
                                >
                                  {copy.activate}
                                </button>
                              )}
                              {u.status === "active" && (
                                <button
                                  onClick={() => updateUserStatus(u.id, "inactive")}
                                  className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
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
                                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                                >
                                  {copy.suspend}
                                </button>
                              )}
                              {u.status === "suspended" && (
                                <button
                                  onClick={() => updateUserStatus(u.id, "inactive")}
                                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
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
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-6">
          <h3 className="font-semibold text-blue-900">{copy.howItWorks}</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              <strong>{copy.statusLabels.active}</strong>: {copy.howActive}
            </li>
            <li>
              <strong>{copy.statusLabels.inactive}</strong>: {copy.howInactive}
            </li>
            <li>
              <strong>{copy.statusLabels.suspended}</strong>: {copy.howSuspended}
            </li>
          </ul>
          <p className="pt-2 text-sm text-blue-700">{copy.howFooter}</p>
        </div>
      </section>
    </div>
  );
}
