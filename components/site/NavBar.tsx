"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/gallery", label: "Gallery" },
  { href: "/app", label: "Family Trees" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8e1d6] bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex h-[74px] max-w-[1320px] items-center justify-between px-6">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border-2 border-[#e3a621] text-[#e3a621]">
            <BookMarked className="h-5 w-5" />
          </span>
          <span className="font-serif text-[clamp(1.65rem,2.6vw,2.2rem)] leading-none tracking-[-0.03em] text-[#3f342d]">
            Lifestory<span className="text-[#e3a621]">.co</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative pb-1.5 text-[15px] font-semibold tracking-[0.02em] transition ${
                  active ? "text-[#d7991e]" : "text-[#7f756e] hover:text-[#4a3f37]"
                }`}
              >
                {link.label}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] bg-[#d7991e] transition-all duration-300 ${
                    active ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/auth/register"
            className="inline-flex items-center rounded-full border border-[#e3cca1] bg-[linear-gradient(180deg,#f9e6bf,#f2d69d)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#6f552d] transition hover:shadow-[0_10px_20px_rgba(164,117,35,0.22)]"
          >
            Start Story
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#dfd8cc] text-[#5f5247] lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#ece6dd] bg-white px-6 py-4 lg:hidden">
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
            <Link
              href="/auth/register"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-md bg-[#e4a429] px-3 py-2 text-center text-sm font-semibold text-white"
            >
              Start Story
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
