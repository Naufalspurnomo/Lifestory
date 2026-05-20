"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ChevronDown,
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  TreePine,
  UserCircle2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../providers/LanguageProvider";
import { LanguageToggle } from "./LanguageToggle";
import { BrandLogo } from "./BrandLogo";
import { Button } from "../ui/Button";
import { ArrowRight } from "lucide-react";

type AccountLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { locale } = useLanguage();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isAdmin = user?.role === "admin";
  const isSubscribed = Boolean(user?.subscriptionActive);
  const copy =
    locale === "id"
      ? {
          nav: {
            home: "Beranda",
            gallery: "Galeri",
            familyTrees: "Pohon Keluarga",
            about: "Tentang Kami",
            contact: "Kontak",
          },
          startStory: "Mulai Cerita",
          accountAdmin: "Admin",
          accountMember: "Anggota",
          accountPending: "Menunggu",
          adminDashboard: "Dashboard Admin",
          collections: "Koleksi",
          activatePlan: "Aktifkan Paket",
          familyTrees: "Pohon Keluarga",
          signOut: "Keluar",
          noEmail: "Email tidak tersedia",
          adminAccount: "Akun Admin",
          memberAccount: "Akun Anggota",
          pendingMember: "Anggota Menunggu",
          closeAccountMenu: "Tutup latar menu akun",
          toggleMenu: "Buka/tutup menu",
        }
      : {
          nav: {
            home: "Home",
            gallery: "Gallery",
            familyTrees: "Family Trees",
            about: "About Us",
            contact: "Contact",
          },
          startStory: "Start Story",
          accountAdmin: "Admin",
          accountMember: "Member",
          accountPending: "Pending",
          adminDashboard: "Admin Dashboard",
          collections: "Collections",
          activatePlan: "Activate Plan",
          familyTrees: "Family Trees",
          signOut: "Sign Out",
          noEmail: "No email",
          adminAccount: "Admin Account",
          memberAccount: "Member Account",
          pendingMember: "Pending Member",
          closeAccountMenu: "Close account menu backdrop",
          toggleMenu: "Toggle menu",
        };
  const navLinks = [
    { href: "/", label: copy.nav.home },
    { href: "/gallery", label: copy.nav.gallery },
    { href: "/app", label: copy.nav.familyTrees },
    { href: "/about", label: copy.nav.about },
    { href: "/contact", label: copy.nav.contact },
  ];
  const displayName = user?.name?.trim() || copy.accountMember;
  const displayEmail = user?.email || copy.noEmail;
  const userInitial = displayName.charAt(0).toUpperCase();

  const accountLinks = useMemo<AccountLink[]>(() => {
    if (isAdmin) {
      return [
        { href: "/dashboard", label: copy.adminDashboard, icon: LayoutDashboard },
        { href: "/app", label: copy.familyTrees, icon: TreePine },
        { href: "/gallery", label: copy.collections, icon: Sparkles },
      ];
    }

    return [
      {
        href: isSubscribed ? "/app" : "/subscribe",
        label: isSubscribed ? copy.familyTrees : copy.activatePlan,
        icon: isSubscribed ? TreePine : Crown,
      },
      { href: "/gallery", label: copy.collections, icon: Sparkles },
    ];
  }, [copy, isAdmin, isSubscribed]);

  useEffect(() => {
    let current = window.scrollY > 24;
    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const next = window.scrollY > 24;
        if (next !== current) {
          current = next;
          setIsScrolled(next);
        }
      });
    }

    setIsScrolled(current);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  function handleSignOut() {
    setAccountOpen(false);
    setMobileOpen(false);
    signOut({ callbackUrl: "/" });
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        isScrolled
          ? "border-cream-300 bg-cream-50/95 shadow-soft backdrop-blur-md"
          : "border-cream-300/60 bg-cream-100/85 backdrop-blur-sm"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1320px] items-center justify-between px-4 transition-all duration-300 sm:px-6 ${
          isScrolled ? "h-[64px]" : "h-[78px]"
        }`}
      >
        <BrandLogo variant={isScrolled ? "navbar-compact" : "navbar"} />

        <nav
          className={`hidden items-center transition-all duration-300 lg:flex ${
            isScrolled ? "gap-5" : "gap-7"
          }`}
        >
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative pb-1.5 font-semibold tracking-[0.02em] transition ${
                  isScrolled ? "text-[14px]" : "text-[15px]"
                } ${
                  active ? "text-brand-500" : "text-ink-500 hover:text-ink-800"
                }`}
              >
                {link.label}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-brand-gradient transition-all duration-300 ${
                    active ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageToggle />

          {status === "loading" && (
            <div className="h-10 w-44 animate-pulse rounded-full border border-[#e4d7c1] bg-white/80" />
          )}

          {status === "unauthenticated" && (
            <Link href="/auth/register">
              <Button
                size={isScrolled ? "sm" : "md"}
                iconRight={<ArrowRight className="h-3.5 w-3.5" />}
                animateRightIcon
                className="uppercase tracking-[0.14em]"
              >
                {copy.startStory}
              </Button>
            </Link>
          )}

          {isLoggedIn && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-[#dfcfb4] bg-white/88 px-2.5 py-1.5 shadow-sm transition hover:bg-white"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#efe3cc] text-sm font-bold text-[#6a5033]">
                  {userInitial}
                </span>
                <span className="hidden max-w-[120px] truncate text-sm font-semibold text-[#4c3f34] xl:inline">
                  {displayName}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                    isAdmin
                      ? "bg-[#efe3ff] text-[#744ab2]"
                      : isSubscribed
                      ? "bg-[#e6f4ec] text-[#2f7d55]"
                      : "bg-[#f6ead6] text-[#8d6426]"
                  }`}
                >
                  {isAdmin
                    ? copy.accountAdmin
                    : isSubscribed
                    ? copy.accountMember
                    : copy.accountPending}
                </span>
                <ChevronDown className="h-4 w-4 text-[#7d6f62]" />
              </button>

              {accountOpen && (
                <>
                  <button
                    aria-label={copy.closeAccountMenu}
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setAccountOpen(false)}
                  />
                  <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-[310px] overflow-hidden rounded-2xl border border-[#dccdb5] bg-[#fffdf9] shadow-[0_22px_44px_rgba(46,34,20,0.2)]">
                    <div className="border-b border-[#e7ddcd] bg-[#f9f4ea] p-4">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#efe3cc] text-base font-bold text-[#6a5033]">
                          {userInitial}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#4c3f34]">
                            {displayName}
                          </p>
                          <p className="truncate text-xs text-[#7f7062]">
                            {displayEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      {accountLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#5a4d42] transition hover:bg-[#f5eee2] hover:text-[#3f342d]"
                          >
                            <Icon className="h-4 w-4 text-[#a27f4a]" />
                            {item.label}
                          </Link>
                        );
                      })}

                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#b34a4a] transition hover:bg-[#fff1f1]"
                      >
                        <LogOut className="h-4 w-4" />
                        {copy.signOut}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#dfd8cc] text-[#5f5247] lg:hidden"
          aria-label={copy.toggleMenu}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#ece6dd] bg-white px-6 py-4 lg:hidden">
          <div className="mb-4">
            <LanguageToggle />
          </div>

          <nav className="flex flex-col gap-2.5">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2 text-base ${
                    active
                      ? "bg-[#f8f0e0] text-[#d7991e]"
                      : "text-[#665a51] hover:bg-[#f6f3ee]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-[#efe7da] pt-4">
            {status === "loading" && (
              <div className="h-10 w-full animate-pulse rounded-xl border border-[#e4d7c1] bg-white/80" />
            )}

            {status === "unauthenticated" && (
              <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                <Button
                  block
                  size="md"
                  iconRight={<ArrowRight className="h-3.5 w-3.5" />}
                  animateRightIcon
                  className="uppercase tracking-[0.14em]"
                >
                  {copy.startStory}
                </Button>
              </Link>
            )}

            {isLoggedIn && (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#e4d7c1] bg-[#f9f4ea] p-3">
                  <p className="text-sm font-semibold text-[#4c3f34]">{displayName}</p>
                  <p className="truncate text-xs text-[#7f7062]">{displayEmail}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a27f4a]">
                    <UserCircle2 className="h-3.5 w-3.5" />
                    {isAdmin
                      ? copy.adminAccount
                      : isSubscribed
                      ? copy.memberAccount
                      : copy.pendingMember}
                  </p>
                </div>

                <div className="space-y-1.5">
                  {accountLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded-lg border border-[#e7dcc8] bg-white px-3 py-2 text-sm font-medium text-[#5a4d42]"
                      >
                        <Icon className="h-4 w-4 text-[#a27f4a]" />
                        {item.label}
                      </Link>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#f2d1d1] bg-[#fff4f4] px-3 py-2 text-sm font-semibold text-[#b34a4a]"
                  >
                    <LogOut className="h-4 w-4" />
                    {copy.signOut}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
