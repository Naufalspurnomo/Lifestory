"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  TreePine,
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

type NavLink = {
  href: string;
  label: string;
};

type Copy = ReturnType<typeof buildCopy>;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function buildCopy(locale: string) {
  return locale === "id"
    ? {
        nav: {
          home: "Beranda",
          gallery: "Galeri",
          familyTrees: "Pohon Keluarga",
          about: "Tentang Kami",
          contact: "Kontak",
        },
        startStory: "Mulai Cerita",
        adminDashboard: "Dashboard Admin",
        collections: "Koleksi",
        studioPackages: "Paket Studio",
        familyTrees: "Pohon Keluarga",
        signOut: "Keluar",
        noEmail: "Email tidak tersedia",
        accountMember: "Anggota",
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
        adminDashboard: "Admin Dashboard",
        collections: "Collections",
        studioPackages: "Studio Packages",
        familyTrees: "Family Trees",
        signOut: "Sign Out",
        noEmail: "No email",
        accountMember: "Member",
        closeAccountMenu: "Close account menu backdrop",
        toggleMenu: "Toggle menu",
      };
}

function useNavbarChrome(pathname: string) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
  }, [pathname]);

  return { mobileOpen, setMobileOpen, isScrolled };
}

export function NavBar() {
  const pathname = usePathname();
  const { locale } = useLanguage();

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return null;
  }

  const copy = buildCopy(locale);
  const navLinks: NavLink[] = [
    { href: "/", label: copy.nav.home },
    { href: "/gallery", label: copy.nav.gallery },
    { href: "/app", label: copy.nav.familyTrees },
    { href: "/about", label: copy.nav.about },
    { href: "/contact", label: copy.nav.contact },
  ];
  return (
    <SessionAwareNavBar
      pathname={pathname}
      locale={locale}
      copy={copy}
      navLinks={navLinks}
    />
  );
}

function SessionAwareNavBar({
  pathname,
  locale,
  copy,
  navLinks,
}: {
  pathname: string;
  locale: string;
  copy: Copy;
  navLinks: NavLink[];
}) {
  const { data: session, status } = useSession();
  const { mobileOpen, setMobileOpen, isScrolled } = useNavbarChrome(pathname);
  const [accountOpen, setAccountOpen] = useState(false);
  const isHome = pathname === "/";

  const user = session?.user;
  const isLoggedIn = status === "authenticated";
  const isAdmin = user?.role === "admin";
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
      { href: "/app", label: copy.familyTrees, icon: TreePine },
      { href: "/subscribe", label: copy.studioPackages, icon: Sparkles },
      { href: "/gallery", label: copy.collections, icon: Sparkles },
    ];
  }, [copy, isAdmin]);

  useEffect(() => {
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
          isScrolled ? "h-[56px] lg:h-[64px]" : "h-[78px]"
        }`}
      >
        <div className="relative">
          <BrandLogo variant={isScrolled ? "navbar-compact" : "navbar"} />
          {isHome && (
            <span
              className="absolute left-0 top-full mt-[-2px] block whitespace-nowrap font-sans text-[9.5px] font-medium uppercase text-brand-700/75 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                letterSpacing: "1.8px",
                opacity: isScrolled ? 0 : 1,
                transform: isScrolled ? "translateY(-4px)" : "translateY(0)",
                pointerEvents: "none",
              }}
            >
              {locale === "id" ? "Abadikan Warisanmu" : "Preserve Your Legacy"}
            </span>
          )}
        </div>

        <nav
          className={`hidden items-center transition-all duration-300 lg:flex ${
            isScrolled ? "gap-8" : "gap-12"
          }`}
        >
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative pb-2 text-[14px] font-serif tracking-[0.03em] transition-all duration-300 ${
                  active
                    ? "text-ink-900 italic font-medium"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-1 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-brand-400 transition-all duration-300 ${
                    active
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          {status === "loading" && (
            <div className="h-10 w-44 animate-pulse rounded-full border border-cream-300 bg-cream-50/80" />
          )}

          {status === "unauthenticated" && (
            <Link href="/auth/login">
              <Button
                variant="outline"
                size={isScrolled ? "sm" : "md"}
                iconRight={<ArrowRight className="h-3.5 w-3.5" />}
                animateRightIcon
                className="rounded-none !border-brand-700 !text-brand-700 px-6 text-[10px] font-medium uppercase tracking-[0.15em] transition-colors duration-500 hover:!bg-brand-700 hover:!text-cream-50"
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
                className="group flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-all duration-300 hover:bg-cream-200/40"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-200/50 bg-brand-100 text-[13px] font-bold text-brand-800 shadow-sm">
                  {userInitial}
                </div>
                <span className="hidden max-w-[120px] truncate text-[13px] font-semibold tracking-[0.02em] text-ink-800 xl:inline">
                  {displayName}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-ink-400 transition-transform duration-300 ${
                    accountOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {accountOpen && (
                  <>
                    <button
                      aria-label={copy.closeAccountMenu}
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setAccountOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 top-[calc(100%+16px)] z-20 w-[280px] overflow-hidden rounded-3xl border border-cream-200/60 bg-cream-50/95 shadow-deep backdrop-blur-xl"
                    >
                      <div className="border-b border-cream-200/40 p-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-base font-bold text-brand-700 shadow-[inset_0_0_0_1px_rgba(130,105,60,0.1)]">
                            {userInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold tracking-tight text-ink-900">
                              {displayName}
                            </p>
                            <p className="truncate text-[12px] text-ink-400">{displayEmail}</p>
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
                              className="group flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-[13px] font-medium text-ink-500 transition-all hover:bg-cream-100/80 hover:text-ink-900"
                            >
                              <Icon className="h-4 w-4 text-ink-400 transition-colors group-hover:text-brand-600" />
                              {item.label}
                            </Link>
                          );
                        })}

                        <div className="my-1.5 mx-3 h-px bg-cream-200/40" />

                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="group flex w-full items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-[13px] font-medium text-ink-500 transition-all hover:bg-red-50/60 hover:text-[#b34a4a]"
                        >
                          <LogOut className="h-4 w-4 text-ink-400 transition-colors group-hover:text-[#b34a4a]" />
                          {copy.signOut}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          <LanguageToggle className="ml-2" />
        </div>

        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="relative z-[60] -mr-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-800 transition hover:bg-cream-200/50 lg:hidden"
          aria-label={copy.toggleMenu}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-cream-50 px-6 pb-10 pt-28 lg:hidden"
          >
            <nav className="flex flex-col gap-6">
              {navLinks.map((link, i) => {
                const active = isActive(pathname, link.href);
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block font-serif text-[2.5rem] leading-tight font-medium tracking-tight transition-colors ${
                        active
                          ? "text-brand-700 italic"
                          : "text-ink-800 hover:text-ink-500"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="mt-auto pt-12">
              {status === "loading" && (
                <div className="h-12 w-full animate-pulse rounded-full border border-cream-300 bg-cream-100/80" />
              )}

              {status === "unauthenticated" && (
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="outline"
                    block
                    size="lg"
                    iconRight={<ArrowRight className="h-4 w-4" />}
                    animateRightIcon
                    className="w-full rounded-none py-6 font-sans text-[12px] font-medium uppercase tracking-[0.15em] !border-brand-700 !text-brand-700 hover:!bg-brand-700 hover:!text-cream-50"
                  >
                    {copy.startStory}
                  </Button>
                </Link>
              )}

              {isLoggedIn && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mt-4 flex flex-col gap-8 border-t border-brand-200/30 pt-8"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-base font-bold text-brand-700 shadow-[inset_0_0_0_1px_rgba(130,105,60,0.2)]">
                      {userInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold tracking-tight text-ink-900">
                        {displayName}
                      </p>
                      <p className="truncate text-[12px] text-ink-400">{displayEmail}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    {accountLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-4 text-[12px] font-bold uppercase tracking-[0.15em] text-ink-600 transition hover:text-ink-900"
                      >
                        {item.label}
                      </Link>
                    ))}

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-4 text-[12px] font-bold uppercase tracking-[0.15em] text-[#b34a4a] transition hover:text-red-700"
                    >
                      {copy.signOut}
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="mt-12 flex justify-start">
                <LanguageToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
