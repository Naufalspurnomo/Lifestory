"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  TreePine,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";

const publicLinks = [
  { href: "/gallery", label: "Galeri" },
  { href: "/about", label: "Tentang" },
  { href: "/contact", label: "Kontak" },
];

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isAdmin = user?.role === "admin";
  const isSubscribed = Boolean(user?.subscriptionActive);

  useEffect(() => {
    setShowUserMenu(false);
    setMobileOpen(false);
  }, [pathname]);

  function handleSignOut() {
    signOut({ callbackUrl: "/" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-warmBorder/70 bg-white/75 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-r from-gold-100/40 via-transparent to-accent-100/40" />

      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="group inline-flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-warmBorder bg-white shadow-sm">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(176,142,81,0.25),transparent_55%),radial-gradient(circle_at_70%_75%,rgba(31,111,98,0.25),transparent_58%)]" />
            <TreePine className="relative h-4.5 w-4.5 text-accent-700" />
          </span>
          <div>
            <p className="font-serif text-lg leading-none text-warmText">Lifestory</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-warmMuted">
              Family Archive
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-warmBorder bg-white/70 p-1 md:flex">
          {publicLinks.map((link) => {
            const active = isPathActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-accent-50 text-accent-700 shadow-sm"
                    : "text-warmMuted hover:bg-warm-100 hover:text-warmText"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {isLoggedIn && isSubscribed && (
            <Link
              href="/app"
              className={`rounded-full px-4 py-2 text-sm transition ${
                isPathActive(pathname, "/app")
                  ? "bg-gold-100 text-gold-800 shadow-sm"
                  : "text-warmMuted hover:bg-warm-100 hover:text-warmText"
              }`}
            >
              Pohon Keluarga
            </Link>
          )}

          {isLoggedIn && isAdmin && (
            <Link
              href="/dashboard"
              className={`rounded-full px-4 py-2 text-sm transition ${
                isPathActive(pathname, "/dashboard")
                  ? "bg-accent-100 text-accent-800 shadow-sm"
                  : "text-accent-700 hover:bg-accent-50"
              }`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {status === "loading" && (
            <div className="h-10 w-32 animate-pulse rounded-full border border-warmBorder bg-white" />
          )}

          {status === "unauthenticated" && (
            <>
              <Link
                href="/auth/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-warmMuted transition hover:bg-warm-100 hover:text-warmText"
              >
                Login
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="rounded-full px-5">
                  Mulai
                </Button>
              </Link>
            </>
          )}

          {status === "authenticated" && user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-warmBorder bg-white px-3 py-1.5 text-sm shadow-sm transition hover:border-accent-200 hover:bg-warm-50"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-xs font-semibold text-accent-700">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </span>
                <span className="max-w-[120px] truncate font-medium text-warmText">
                  {user.name || "Pengguna"}
                </span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-warmBorder bg-white shadow-[0_18px_45px_rgba(77,66,47,0.2)]"
                    >
                      <div className="space-y-2 border-b border-warmBorder bg-warm-50/70 px-4 py-3">
                        <p className="text-sm font-semibold text-warmText">{user.name || "Pengguna"}</p>
                        <p className="truncate text-xs text-warmMuted">{user.email || "-"}</p>
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[11px] font-semibold text-accent-700">
                              Admin
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              isSubscribed
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {isSubscribed ? "Langganan Aktif" : "Belum Berlangganan"}
                          </span>
                        </div>
                      </div>

                      <div className="p-1.5">
                        {isSubscribed && (
                          <Link
                            href="/app"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-warmText transition hover:bg-warm-100"
                          >
                            <TreePine className="h-4 w-4 text-accent-700" />
                            Pohon Keluarga
                          </Link>
                        )}

                        {!isSubscribed && (
                          <Link
                            href="/subscribe"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-warmText transition hover:bg-warm-100"
                          >
                            <Crown className="h-4 w-4 text-gold-700" />
                            Aktifkan Langganan
                          </Link>
                        )}

                        {isAdmin && (
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-warmText transition hover:bg-warm-100"
                          >
                            <LayoutDashboard className="h-4 w-4 text-accent-700" />
                            Dashboard Admin
                          </Link>
                        )}

                        <Link
                          href="/subscribe"
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-warmText transition hover:bg-warm-100"
                        >
                          <Sparkles className="h-4 w-4 text-gold-700" />
                          Status Langganan
                        </Link>

                        <button
                          onClick={handleSignOut}
                          className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Keluar
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-warmBorder bg-white text-warmText md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-t border-warmBorder bg-white/95 p-4 md:hidden"
          >
            <nav className="grid gap-2">
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    isPathActive(pathname, link.href)
                      ? "bg-accent-50 text-accent-700"
                      : "text-warmText hover:bg-warm-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {isLoggedIn && isSubscribed && (
                <Link
                  href="/app"
                  className={`rounded-xl px-3 py-2 text-sm ${
                    isPathActive(pathname, "/app")
                      ? "bg-gold-100 text-gold-800"
                      : "text-warmText hover:bg-warm-100"
                  }`}
                >
                  Pohon Keluarga
                </Link>
              )}

              {isLoggedIn && isAdmin && (
                <Link
                  href="/dashboard"
                  className={`rounded-xl px-3 py-2 text-sm ${
                    isPathActive(pathname, "/dashboard")
                      ? "bg-accent-100 text-accent-800"
                      : "text-warmText hover:bg-warm-100"
                  }`}
                >
                  Dashboard Admin
                </Link>
              )}
            </nav>

            <div className="mt-3 border-t border-warmBorder pt-3">
              {status === "loading" && (
                <div className="h-10 w-full animate-pulse rounded-xl border border-warmBorder bg-warm-50" />
              )}

              {status === "unauthenticated" && (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login" className="flex-1">
                    <Button variant="secondary" block>
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/register" className="flex-1">
                    <Button block>Daftar</Button>
                  </Link>
                </div>
              )}

              {status === "authenticated" && (
                <div className="space-y-2">
                  <p className="inline-flex items-center gap-2 text-sm text-warmMuted">
                    <UserRound className="h-4 w-4 text-accent-700" />
                    {user?.name || "Pengguna"}
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
