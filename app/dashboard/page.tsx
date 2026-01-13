"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";

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
  const user = session?.user;
  const [users, setUsers] = useState<UserData[]>([]);
  const [filter, setFilter] = useState<"all" | UserStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  // Fetch users from API
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
      <div className="bg-white min-h-screen">
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Akses Ditolak
          </h1>
          <p className="mt-2 text-slate-600">Halaman ini hanya untuk admin.</p>
        </section>
      </div>
    );
  }

  // Update user status via API
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
        alert("Gagal mengupdate status user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Terjadi kesalahan");
    } finally {
      setUpdating(null);
    }
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesFilter = filter === "all" || u.status === filter;
    const matchesSearch =
      searchQuery === "" ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Stats
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

  const statusLabels = {
    active: "Berlangganan",
    inactive: "Belum Berlangganan",
    suspended: "Ditangguhkan",
  };

  return (
    <div className="bg-gradient-to-b from-white to-slate-50 min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-600">
            Admin Dashboard
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Manajemen Pengguna
          </h1>
          <p className="mt-1 text-slate-600">
            Kelola status langganan dan akses pengguna platform.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Users</p>
            <p className="text-3xl font-semibold text-slate-900">
              {stats.total}
            </p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <p className="text-sm text-green-600">Berlangganan</p>
            <p className="text-3xl font-semibold text-green-700">
              {stats.active}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-600">Belum Berlangganan</p>
            <p className="text-3xl font-semibold text-amber-700">
              {stats.inactive}
            </p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-600">Ditangguhkan</p>
            <p className="text-3xl font-semibold text-red-700">
              {stats.suspended}
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            {(["all", "active", "inactive", "suspended"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    filter === status
                      ? "bg-forest-600 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {status === "all"
                    ? "Semua"
                    : status === "active"
                    ? "Berlangganan"
                    : status === "inactive"
                    ? "Belum Bayar"
                    : "Ditangguhkan"}
                </button>
              )
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 rounded-lg border border-slate-200 bg-white px-4 py-2 pl-10 text-sm focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-100"
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

        {/* User Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-forest-600 border-t-transparent"></div>
              <p className="mt-2">Memuat data...</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                    Pengguna
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                    Role
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      Tidak ada pengguna yang ditemukan.
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
                            <p className="font-medium text-slate-900">
                              {u.name}
                            </p>
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
                          {u.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                            statusColors[u.status]
                          }`}
                        >
                          {statusLabels[u.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {updating === u.id ? (
                            <span className="text-sm text-slate-500">
                              Updating...
                            </span>
                          ) : (
                            <>
                              {u.status !== "active" && (
                                <button
                                  onClick={() =>
                                    updateUserStatus(u.id, "active")
                                  }
                                  className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition"
                                >
                                  Aktifkan
                                </button>
                              )}
                              {u.status === "active" && (
                                <button
                                  onClick={() =>
                                    updateUserStatus(u.id, "inactive")
                                  }
                                  className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition"
                                >
                                  Nonaktifkan
                                </button>
                              )}
                              {u.status !== "suspended" &&
                                u.role !== "admin" && (
                                  <button
                                    onClick={() => {
                                      if (
                                        confirm(
                                          `Tangguhkan ${u.name}? User tidak akan bisa mengakses platform.`
                                        )
                                      ) {
                                        updateUserStatus(u.id, "suspended");
                                      }
                                    }}
                                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition"
                                  >
                                    Tangguhkan
                                  </button>
                                )}
                              {u.status === "suspended" && (
                                <button
                                  onClick={() =>
                                    updateUserStatus(u.id, "inactive")
                                  }
                                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
                                >
                                  Cabut Penangguhan
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

        {/* Info Box */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-6 space-y-3">
          <h3 className="font-semibold text-blue-900">ℹ️ Cara Kerja</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              • <strong>Berlangganan</strong>: User dapat mengakses semua fitur
              (pohon keluarga, arsip, dll)
            </li>
            <li>
              • <strong>Belum Berlangganan</strong>: User sudah terdaftar tapi
              belum bayar langganan
            </li>
            <li>
              • <strong>Ditangguhkan</strong>: User diberhentikan aksesnya
              karena pelanggaran
            </li>
          </ul>
          <p className="text-sm text-blue-700 pt-2">
            ✅ Perubahan status akan langsung tersimpan ke database dan berlaku
            saat user login berikutnya.
          </p>
        </div>
      </section>
    </div>
  );
}
