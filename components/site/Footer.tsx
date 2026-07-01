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

  if (
    pathname === "/app" ||
    pathname?.startsWith("/app/") ||
    pathname === "/auth/login" ||
    pathname === "/auth/register"
  ) {
    return null;
  }

  const isId = locale === "id";
  const copy = isId
    ? {
        studio: "Lifestory.co",
        tagline: "Preserve Your Legacy",
        description:
          "Studio biografi keluarga untuk wawancara, arsip foto, buku, video, dan pohon keluarga digital.",
        consultation: "Mulai percakapan",
        explore: "Navigasi",
        contact: "Kontak",
        legal: "Legal",
        links: [
          { href: "/", label: "Beranda" },
          { href: "/gallery", label: "Galeri" },
          { href: "/app", label: "Pohon Keluarga" },
          { href: "/about", label: "Tentang Kami" },
          { href: "/contact", label: "Hubungi Kami" },
        ],
        legalLinks: [
          { href: "/privacy-policy", label: "Kebijakan Privasi" },
          { href: "/terms", label: "Syarat & Ketentuan" },
        ],
        rights: "Hak cipta dilindungi.",
        closing: "Mengabadikan cerita keluarga dengan rapi.",
      }
    : {
        studio: "Lifestory.co",
        tagline: "Preserve Your Legacy",
        description:
          "A family biography studio for interviews, photo archives, books, videos, and digital family trees.",
        consultation: "Start a conversation",
        explore: "Explore",
        contact: "Contact",
        legal: "Legal",
        links: [
          { href: "/", label: "Home" },
          { href: "/gallery", label: "Gallery" },
          { href: "/app", label: "Family Trees" },
          { href: "/about", label: "About Us" },
          { href: "/contact", label: "Get in Touch" },
        ],
        legalLinks: [
          { href: "/privacy-policy", label: "Privacy Policy" },
          { href: "/terms", label: "Terms & Conditions" },
        ],
        rights: "All rights reserved.",
        closing: "Preserving family stories with care.",
      };

  return (
    <footer className="border-t border-cream-300 bg-cream-50 text-ink-700">
      <div className="mx-auto max-w-[1320px] px-6 py-10 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.7fr_1fr_0.9fr] lg:gap-16">
          <div className="max-w-md">
            <BrandLogo variant="footer" />
            <p className="mt-3 font-serif text-lg italic leading-none text-ink-900">
              {copy.tagline}
            </p>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
              {copy.studio}
            </p>
            <p className="mt-4 text-sm leading-[1.75] text-ink-600">
              {copy.description}
            </p>
            <Link
              href="/contact"
              className="group mt-6 inline-flex items-center gap-3 border-b border-brand-400 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700 transition-colors hover:border-ink-900 hover:text-ink-900"
            >
              {copy.consultation}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          <FooterGroup title={copy.explore}>
            <ul className="space-y-3">
              {copy.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-600 transition-colors hover:text-ink-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterGroup>

          <FooterGroup title={copy.contact}>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="block text-sm text-ink-600 transition-colors hover:text-ink-900"
                >
                  {CONTACT_EMAIL}
                </a>
                <a
                  href={`tel:${CONTACT_PHONE_TEL}`}
                  className="block text-sm text-ink-600 transition-colors hover:text-ink-900"
                >
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </div>
              <address className="max-w-md text-sm not-italic leading-[1.75] text-ink-600">
                {STUDIO_ADDRESS}
              </address>
            </div>
          </FooterGroup>

          <FooterGroup title={copy.legal}>
            <ul className="space-y-3">
              {copy.legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-600 transition-colors hover:text-ink-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterGroup>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-cream-300 pt-6 text-[11px] text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Lifestory.co. {copy.rights}
          </p>
          <p className="text-sm text-ink-500">
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
      <h3 className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
        {title}
      </h3>
      {children}
    </div>
  );
}
