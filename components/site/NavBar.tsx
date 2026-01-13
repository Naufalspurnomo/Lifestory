"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "../ui/Button";
import { useState } from "react";

export function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isAdmin = user?.role === "admin";
  const isSubscribed = user?.subscriptionActive;

  // Public links (always visible)
  const publicLinks = [
    { href: "/gallery", label: "Galeri" },
    { href: "/about", label: "Tentang" },
    { href: "/contact", label: "Kontak" },
  ];

  // Member links (when logged in + subscribed)
  const memberLinks = [{ href: "/app", label: "Pohon Keluarga" }];

  // Admin links
  const adminLinks = [{ href: "/dashboard", label: "Dashboard Admin" }];

  function handleSignOut() {
    signOut({ callbackUrl: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-forest-700"
        >
          <span className="text-xl">🌳</span>
          Lifestory
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {/* Public Links */}
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                pathname === link.href
                  ? "bg-forest-50 text-forest-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Divider if logged in */}
          {isLoggedIn && <div className="mx-2 h-4 w-px bg-slate-200" />}

          {/* Member Links (when subscribed) */}
          {isLoggedIn &&
            isSubscribed &&
            memberLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  pathname.startsWith(link.href)
                    ? "bg-forest-50 text-forest-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}

          {/* Admin Links */}
          {isLoggedIn &&
            isAdmin &&
            adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  pathname.startsWith(link.href)
                    ? "bg-purple-50 text-purple-700 font-medium"
                    : "text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                }`}
              >
                ⚙️ {link.label}
              </Link>
            ))}
        </nav>

        {/* Right Side - Auth Actions */}
        <div className="flex items-center gap-3">
          {status === "loading" && (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
          )}

          {status === "unauthenticated" && (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Login
              </Link>
              <Link href="/subscribe">
                <Button size="sm">Berlangganan</Button>
              </Link>
            </>
          )}

          {status === "authenticated" && user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 transition"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-100 text-xs font-semibold text-forest-700">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="hidden font-medium text-slate-700 sm:block">
                  {user.name || "User"}
                </span>
                <svg
                  className={`h-4 w-4 text-slate-400 transition ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                    {/* User Info */}
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                      <div className="mt-2 flex gap-2">
                        {isAdmin && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                            Admin
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            isSubscribed
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {isSubscribed ? "Aktif" : "Belum Berlangganan"}
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {isSubscribed && (
                        <Link
                          href="/app"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          🌳 Pohon Keluarga
                        </Link>
                      )}

                      {!isSubscribed && (
                        <Link
                          href="/subscribe"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-forest-700 font-medium hover:bg-forest-50"
                        >
                          ⭐ Aktifkan Langganan
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          href="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          ⚙️ Dashboard Admin
                        </Link>
                      )}

                      <Link
                        href="/subscribe"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        💳 Status Langganan
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        🚪 Keluar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar (visible when logged in) */}
      {isLoggedIn && (
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-6 py-2 md:hidden">
          {isSubscribed &&
            memberLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                  pathname.startsWith(link.href)
                    ? "bg-forest-100 text-forest-700 font-medium"
                    : "text-slate-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          {isAdmin &&
            adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                  pathname.startsWith(link.href)
                    ? "bg-purple-100 text-purple-700 font-medium"
                    : "text-purple-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
        </div>
      )}
    </header>
  );
}
