"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { useLanguage } from "../providers/LanguageProvider";
import { BrandLogo } from "./BrandLogo";

export function Footer() {
  const { locale } = useLanguage();
  const isId = locale === "id";

  const copy = isId
    ? {
        explore: "Jelajah",
        connect: "Terhubung",
        legacy: "Warisan",
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
        contactNote: "Studio dan konsultasi dengan janji.",
        email: "halo@lifestory.co",
        phone: "+62 812 3456 7890",
        location: "Jakarta, Indonesia",
        legacyTagline:
          "Setiap kisah hidup layak diabadikan, dirawat, dan diwariskan.",
      }
    : {
        explore: "Explore",
        connect: "Connect",
        legacy: "Legacy",
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
        contactNote: "Studio visits and consultations by appointment.",
        email: "hello@lifestory.co",
        phone: "+62 812 3456 7890",
        location: "Jakarta, Indonesia",
        legacyTagline:
          "Every life story deserves to be preserved, cared for, and passed on.",
      };

  return (
    <footer className="relative overflow-hidden border-t border-[#e4dccf] bg-[linear-gradient(180deg,#f7f5f1_0%,#f1ead9_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#f1d99b]/35 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-[#e6ddc6]/55 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1320px] px-6 py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12">
          <div className="space-y-5">
            <BrandLogo variant="footer" />
            <p className="max-w-xl text-sm leading-relaxed text-[#6e6258]">
              {copy.tagline}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dccfb7] bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9b845f] backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-[#c48b24]" />
              {copy.legacyTagline}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9b845f]">
              {copy.explore}
            </p>
            <ul className="space-y-2.5">
              {copy.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm font-medium text-[#5a4d42] transition hover:text-[#3f342d]"
                  >
                    <span className="h-px w-3 bg-[#c7b289] transition group-hover:w-5 group-hover:bg-[#a8761a]" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9b845f]">
              {copy.connect}
            </p>
            <ul className="space-y-3 text-sm text-[#5a4d42]">
              <li className="flex items-start gap-2.5">
                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-[#ddc7a2] bg-white text-[#b07f2f]">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <a
                  href={`mailto:${copy.email}`}
                  className="transition hover:text-[#3f342d]"
                >
                  {copy.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-[#ddc7a2] bg-white text-[#b07f2f]">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <span>{copy.phone}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-[#ddc7a2] bg-white text-[#b07f2f]">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                <span>{copy.location}</span>
              </li>
            </ul>
            <p className="text-xs text-[#7b6f63]">{copy.contactNote}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5dfd3] pt-5 text-xs text-[#8a7e72]">
          <p>
            &copy; {new Date().getFullYear()} Lifestory.co. {copy.rights}
          </p>
          <p className="font-serif italic text-[#9b845f]">
            {copy.legacy} &mdash; Lifestory.co
          </p>
        </div>
      </div>
    </footer>
  );
}
