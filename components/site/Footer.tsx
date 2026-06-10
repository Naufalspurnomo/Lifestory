"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "../providers/LanguageProvider";
import { BrandLogo } from "./BrandLogo";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
  STUDIO_ADDRESS,
} from "../../lib/contact-info";

export function Footer() {
  const pathname = usePathname();
  const { locale } = useLanguage();

  if (pathname === "/app" || pathname?.startsWith("/app/")) {
    return null;
  }

  const isId = locale === "id";
  const copy = isId
    ? {
        studio: "Studio biografi keluarga",
        headline: "Kisah keluarga tidak seharusnya berakhir di satu generasi.",
        description:
          "Kami membantu keluarga mendengarkan, menyusun, dan menjaga cerita hidup agar tetap bermakna untuk generasi berikutnya.",
        consultation: "Mulai percakapan",
        explore: "Jelajah",
        services: "Layanan",
        contact: "Kontak",
        links: [
          { href: "/", label: "Beranda" },
          { href: "/gallery", label: "Galeri" },
          { href: "/app", label: "Pohon Keluarga" },
          { href: "/about", label: "Tentang Kami" },
          { href: "/contact", label: "Hubungi Kami" },
        ],
        serviceItems: [
          "Buku biografi keluarga",
          "Wawancara kisah hidup",
          "Dokumenter keluarga",
          "Pohon keluarga digital",
        ],
        rights: "Hak cipta dilindungi.",
        closing: "Mengabadikan hari ini untuk generasi mendatang.",
      }
    : {
        studio: "Family biography studio",
        headline: "A family story should not end with one generation.",
        description:
          "We help families listen, shape, and preserve life stories so they remain meaningful for generations to come.",
        consultation: "Start a conversation",
        explore: "Explore",
        services: "Services",
        contact: "Contact",
        links: [
          { href: "/", label: "Home" },
          { href: "/gallery", label: "Gallery" },
          { href: "/app", label: "Family Trees" },
          { href: "/about", label: "About Us" },
          { href: "/contact", label: "Get in Touch" },
        ],
        serviceItems: [
          "Family biography books",
          "Life story interviews",
          "Family documentaries",
          "Digital family trees",
        ],
        rights: "All rights reserved.",
        closing: "Preserving today for generations to come.",
      };

  return (
    <footer className="border-t border-brand-700 bg-brand-900 text-cream-50">
      <div className="mx-auto max-w-[1320px] px-6 pb-7 pt-16 md:pt-20 lg:pt-24">
        <div className="grid gap-12 pb-16 lg:grid-cols-[1.45fr_0.55fr] lg:items-end lg:gap-20 lg:pb-20">
          <div>
            <BrandLogo variant="footer" />
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
              {copy.studio}
            </p>
            <h2 className="mt-7 max-w-[880px] font-serif text-[clamp(2.65rem,5.5vw,5.75rem)] font-light leading-[0.98] tracking-normal text-cream-50">
              {copy.headline}
            </h2>
          </div>

          <div className="max-w-sm lg:justify-self-end">
            <p className="text-sm font-light leading-[1.8] text-brand-100/80 md:text-base">
              {copy.description}
            </p>
            <Link
              href="/contact"
              className="group mt-8 inline-flex items-center gap-4 border-b border-brand-300 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-200 transition-colors hover:border-cream-50 hover:text-cream-50"
            >
              {copy.consultation}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="grid gap-12 border-t border-brand-700/70 py-12 sm:grid-cols-2 lg:grid-cols-[0.7fr_1fr_1.35fr] lg:gap-20 lg:py-14">
          <FooterGroup title={copy.explore}>
            <ul className="space-y-3">
              {copy.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-100/80 transition-colors hover:text-cream-50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterGroup>

          <FooterGroup title={copy.services}>
            <ul className="space-y-3">
              {copy.serviceItems.map((item) => (
                <li key={item} className="text-sm text-brand-100/80">
                  {item}
                </li>
              ))}
            </ul>
          </FooterGroup>

          <FooterGroup title={copy.contact} className="sm:col-span-2 lg:col-span-1">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="block text-sm text-brand-100/80 transition-colors hover:text-cream-50"
                >
                  {CONTACT_EMAIL}
                </a>
                <a
                  href={`tel:${CONTACT_PHONE_TEL}`}
                  className="block text-sm text-brand-100/80 transition-colors hover:text-cream-50"
                >
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </div>
              <address className="max-w-md text-sm not-italic leading-[1.75] text-brand-100/80">
                {STUDIO_ADDRESS}
              </address>
            </div>
          </FooterGroup>
        </div>

        <div className="flex flex-col gap-3 border-t border-brand-700/70 pt-6 text-[11px] text-brand-200/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Lifestory.co. {copy.rights}
          </p>
          <p className="font-serif text-sm italic text-brand-300">
            {copy.closing}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <h3 className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
        {title}
      </h3>
      {children}
    </div>
  );
}
