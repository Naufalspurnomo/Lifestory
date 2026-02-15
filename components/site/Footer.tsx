"use client";

import Link from "next/link";
import { BookMarked } from "lucide-react";
import { useLanguage } from "../providers/LanguageProvider";

export function Footer() {
  const { locale } = useLanguage();
  const copy =
    locale === "id"
      ? {
          links: [
            { href: "/", label: "Beranda" },
            { href: "/gallery", label: "Galeri" },
            { href: "/app", label: "Pohon Keluarga" },
            { href: "/about", label: "Tentang Kami" },
            { href: "/contact", label: "Kontak" },
          ],
          tagline:
            "Mengabadikan kisah keluarga dengan pengalaman premium yang tak lekang waktu. Dibangun untuk memori, warisan, dan kolaborasi modern.",
          rights: "Hak cipta dilindungi.",
        }
      : {
          links: [
            { href: "/", label: "Home" },
            { href: "/gallery", label: "Gallery" },
            { href: "/app", label: "Family Trees" },
            { href: "/about", label: "About Us" },
            { href: "/contact", label: "Contact" },
          ],
          tagline:
            "Preserving family stories with a timeless, premium experience. Built for memory, legacy, and modern collaboration.",
          rights: "All rights reserved.",
        };

  return (
    <footer className="border-t border-[#e4dccf] bg-[#f7f5f1]">
      <div className="mx-auto max-w-[1320px] px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border-2 border-[#e3a621] text-[#e3a621]">
                <BookMarked className="h-5 w-5" />
              </span>
              <span className="font-serif text-[clamp(1.6rem,2.5vw,2rem)] leading-none tracking-[-0.03em] text-[#3f342d]">
                Lifestory<span className="text-[#e3a621]">.co</span>
              </span>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-[#786b5e]">
              {copy.tagline}
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {copy.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-[#6f6358] transition hover:text-[#3f342d]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-[#e5dfd3] pt-5 text-xs text-[#8a7e72]">
          <p>
            &copy; {new Date().getFullYear()} Lifestory.co. {copy.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
