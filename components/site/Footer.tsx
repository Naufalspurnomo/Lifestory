"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  TreePine,
} from "lucide-react";
import { useLanguage } from "../providers/LanguageProvider";
import { BrandLogo } from "./BrandLogo";

export function Footer() {
  const pathname = usePathname();
  const { locale } = useLanguage();

  if (pathname === "/app" || pathname?.startsWith("/app/")) {
    return null;
  }

  const isId = locale === "id";

  const copy = isId
    ? {
        explore: "Jelajah",
        services: "Layanan",
        getInTouch: "Hubungi Kami",
        taglineWords: "Abadikan Warisanmu",
        headline: "Setiap kisah hidup layak untuk terus dikenang.",
        description:
          "Kami membantu keluarga mengabadikan kenangan berharga, merawat warisan, dan meneruskan kisah hidup untuk generasi mendatang.",
        links: [
          { href: "/", label: "Beranda" },
          { href: "/gallery", label: "Galeri" },
          { href: "/app", label: "Pohon Keluarga" },
          { href: "/about", label: "Tentang Kami" },
          { href: "/contact", label: "Kontak" },
        ],
        serviceItems: [
          {
            icon: TreePine,
            title: "Pembuatan Pohon Keluarga",
            desc: "Bangun dan lestarikan silsilah keluarga Anda.",
          },
          {
            icon: MessageCircle,
            title: "Wawancara Kisah Hidup",
            desc: "Rekam cerita bermakna dari orang tercinta.",
          },
          {
            icon: Shield,
            title: "Pengarsipan Warisan Keluarga",
            desc: "Jaga kenangan untuk generasi mendatang.",
          },
          {
            icon: Heart,
            title: "Konsultasi Personal",
            desc: "Panduan personal untuk perjalanan keluarga Anda.",
          },
        ],
        contactNote:
          "Kunjungan studio dan konsultasi tersedia dengan perjanjian terlebih dahulu.",
        email: "halo@lifestory.co",
        phone: "+62 887 7669 990",
        location: "Jakarta, Indonesia",
        bookCta: "Jadwalkan Konsultasi",
        rights: "Hak cipta dilindungi.",
        bottomTagline: "Mengabadikan hari ini. Menginspirasi generasi mendatang.",
        bottomLegacy: "Legacy — Lifestory.co",
      }
    : {
        explore: "Explore",
        services: "Services",
        getInTouch: "Get in Touch",
        taglineWords: "Preserve Your Legacy",
        headline: "Every life story deserves to be remembered.",
        description:
          "We help families preserve precious memories, pass down their legacy, and keep their stories alive for generations to come.",
        links: [
          { href: "/", label: "Home" },
          { href: "/gallery", label: "Gallery" },
          { href: "/app", label: "Family Trees" },
          { href: "/about", label: "About Us" },
          { href: "/contact", label: "Contact" },
        ],
        serviceItems: [
          {
            icon: TreePine,
            title: "Family Tree Creation",
            desc: "Build and preserve your family legacy.",
          },
          {
            icon: MessageCircle,
            title: "Life Story Interviews",
            desc: "Capture meaningful stories from loved ones.",
          },
          {
            icon: Shield,
            title: "Legacy Preservation",
            desc: "Safeguard memories for future generations.",
          },
          {
            icon: Heart,
            title: "Consultation",
            desc: "Personalized guidance for your family's journey.",
          },
        ],
        contactNote: "Studio visits and consultations by appointment.",
        email: "hello@lifestory.co",
        phone: "+62 887 7669 990",
        location: "Jakarta, Indonesia",
        bookCta: "Book a Consultation",
        rights: "All rights reserved.",
        bottomTagline: "Preserving today. Inspiring tomorrow.",
        bottomLegacy: "Legacy — Lifestory.co",
      };

  return (
    <footer className="relative overflow-hidden border-t border-[#d4c4a8] bg-[linear-gradient(175deg,#faf7f2_0%,#f4ead6_100%)]">
      {/* Botanical line art decoration — left side */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-4 bottom-0 h-[480px] w-[280px] opacity-[0.10]"
      >
        <svg
          viewBox="0 0 280 480"
          fill="none"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main stem — curves upward from bottom */}
          <path
            d="M120 480c0-40 5-70 10-100s15-60 25-90c12-35 20-65 15-100-3-20-10-38-22-52"
            stroke="#b8956a"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          {/* Secondary stem branching left */}
          <path
            d="M140 340c-15 5-35 15-50 10s-25-20-20-35c4-12 15-18 28-15"
            stroke="#b8956a"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          {/* Branch going right */}
          <path
            d="M150 290c12-8 30-12 42-5s18 22 12 35c-4 9-14 14-25 12"
            stroke="#b8956a"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          {/* Small branch upper left */}
          <path
            d="M130 220c-18-5-38 0-48 14s-8 32 5 42c8 6 18 5 26-1"
            stroke="#b8956a"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          {/* Leaf cluster — left side lower */}
          <path
            d="M85 350c-8 3-12 12-8 18s14 8 20 3"
            stroke="#b8956a"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
          <path
            d="M78 360c-6 6-5 15 1 19s15 2 18-5"
            stroke="#b8956a"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
          {/* Leaves on right branch */}
          <path
            d="M175 280c5-8 14-10 20-6s8 12 4 18"
            stroke="#b8956a"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
          <path
            d="M185 295c7-4 16-2 19 4s0 14-7 16"
            stroke="#b8956a"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
          {/* Small elongated leaves along main stem */}
          <path
            d="M125 400c-6-2-8-10-4-15s12-6 16-2"
            stroke="#b8956a"
            strokeWidth="0.6"
            strokeLinecap="round"
          />
          <path
            d="M135 370c6-4 14-2 16 4s-2 12-8 14"
            stroke="#b8956a"
            strokeWidth="0.6"
            strokeLinecap="round"
          />
          <path
            d="M128 320c-7 1-11 8-9 14s9 9 15 6"
            stroke="#b8956a"
            strokeWidth="0.6"
            strokeLinecap="round"
          />
          {/* Flower bud — upper area */}
          <path
            d="M108 195c-3-6 0-14 6-17s14-1 16 5"
            stroke="#b8956a"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <path
            d="M112 190c1-7 7-12 13-11s10 7 9 13"
            stroke="#b8956a"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
          {/* Larger flower — bottom anchor */}
          <path
            d="M100 440c-10 5-14 16-9 24s16 10 24 5"
            stroke="#b8956a"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            d="M95 445c-5 10-2 20 6 24s18 0 21-9"
            stroke="#b8956a"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            d="M105 450c-8 6-9 16-4 22s15 7 21 2"
            stroke="#b8956a"
            strokeWidth="0.8"
            strokeLinecap="round"
          />
          <circle cx="108" cy="452" r="3" stroke="#b8956a" strokeWidth="0.7" />
          {/* Small buds / unopened leaves */}
          <path
            d="M145 250c3-5 2-11-2-14"
            stroke="#b8956a"
            strokeWidth="0.6"
            strokeLinecap="round"
          />
          <path
            d="M118 270c-4-3-4-9-1-12"
            stroke="#b8956a"
            strokeWidth="0.6"
            strokeLinecap="round"
          />
          {/* Tiny dots — pollen / detail */}
          <circle cx="92" cy="335" r="1.5" fill="#b8956a" fillOpacity="0.5" />
          <circle cx="168" cy="270" r="1.5" fill="#b8956a" fillOpacity="0.5" />
          <circle cx="75" cy="375" r="1.2" fill="#b8956a" fillOpacity="0.4" />
          <circle cx="112" cy="420" r="1.2" fill="#b8956a" fillOpacity="0.4" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative mx-auto max-w-[1320px] px-6 pb-6 pt-16 md:pt-20">
        {/* Four-column grid with vertical dividers */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_auto_0.7fr_auto_1.1fr_auto_1.1fr] lg:gap-0">
          {/* Column 1 — Brand identity */}
          <div className="lg:pr-10">
            <BrandLogo variant="footer" />
            <p
              className="mt-1.5 font-sans text-[10px] font-semibold uppercase text-[#b8956a]"
              style={{ letterSpacing: "2.5px" }}
            >
              {copy.taglineWords}
            </p>
            <h3 className="mt-5 max-w-[280px] font-serif text-[1.4rem] leading-[1.3] tracking-[-0.01em] text-[#3f342d]">
              {copy.headline}
            </h3>
            {/* Ornamental divider with diamond */}
            <div className="mt-5 flex items-center gap-2">
              <span className="h-[1px] w-10 bg-[#c9a96e]/60" />
              <svg
                aria-hidden
                width="8"
                height="8"
                viewBox="0 0 8 8"
                className="text-[#c9a96e]/70"
              >
                <rect
                  x="4"
                  y="0"
                  width="5.66"
                  height="5.66"
                  transform="rotate(45 4 0)"
                  fill="currentColor"
                />
              </svg>
              <span className="h-[1px] w-10 bg-[#c9a96e]/60" />
            </div>
            <p className="mt-5 max-w-[280px] text-[13px] leading-[1.7] text-[#6e6258]">
              {copy.description}
            </p>
          </div>

          {/* Vertical divider */}
          <div
            aria-hidden
            className="hidden w-px self-stretch bg-[#dcc9a8]/50 lg:block"
          />

          {/* Column 2 — Explore */}
          <div className="space-y-5 lg:px-8">
            <p
              className="font-sans text-[10.5px] font-bold uppercase text-[#9b845f]"
              style={{ letterSpacing: "2.2px" }}
            >
              {copy.explore}
            </p>
            <ul className="space-y-3.5">
              {copy.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2.5 text-[14px] font-medium text-[#5a4d42] transition hover:text-[#3f342d]"
                  >
                    <ArrowRight className="h-3 w-3 text-[#c9a96e] transition-transform duration-200 group-hover:translate-x-0.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Vertical divider */}
          <div
            aria-hidden
            className="hidden w-px self-stretch bg-[#dcc9a8]/50 lg:block"
          />

          {/* Column 3 — Services */}
          <div className="space-y-5 lg:px-8">
            <p
              className="font-sans text-[10.5px] font-bold uppercase text-[#9b845f]"
              style={{ letterSpacing: "2.2px" }}
            >
              {copy.services}
            </p>
            <ul className="space-y-4">
              {copy.serviceItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-[#dcc9a8] text-[#b8956a]">
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-tight text-[#3f342d]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#7b6f63]">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Vertical divider */}
          <div
            aria-hidden
            className="hidden w-px self-stretch bg-[#dcc9a8]/50 lg:block"
          />

          {/* Column 4 — Get in Touch */}
          <div className="space-y-5 lg:pl-8">
            <p
              className="font-sans text-[10.5px] font-bold uppercase text-[#9b845f]"
              style={{ letterSpacing: "2.2px" }}
            >
              {copy.getInTouch}
            </p>
            <ul className="space-y-3.5 text-[14px] text-[#5a4d42]">
              <li className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[#dcc9a8] text-[#b8956a]">
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
                <a
                  href={`mailto:${copy.email}`}
                  className="transition hover:text-[#3f342d]"
                >
                  {copy.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[#dcc9a8] text-[#b8956a]">
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
                <span>{copy.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[#dcc9a8] text-[#b8956a]">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
                <span>{copy.location}</span>
              </li>
            </ul>

            {/* Separator */}
            <span className="block h-px w-full bg-[#dcc9a8]/50" />

            <p className="text-[11.5px] leading-relaxed text-[#7b6f63]">
              {copy.contactNote}
            </p>

            {/* CTA Button */}
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 rounded-full border-2 border-[#c9a96e] bg-[#c9a96e] px-6 py-3 text-[10.5px] font-bold uppercase text-white shadow-[0_4px_12px_rgba(180,140,70,0.25)] transition hover:bg-[#b8956a] hover:border-[#b8956a] hover:shadow-[0_6px_16px_rgba(180,140,70,0.35)]"
              style={{ letterSpacing: "1.8px" }}
            >
              {copy.bookCta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Diamond ornament above bottom bar */}
        <div className="mt-14 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-[#dcc9a8]/60" />
          <svg
            aria-hidden
            width="10"
            height="10"
            viewBox="0 0 10 10"
            className="text-[#c9a96e]/50"
          >
            <rect
              x="5"
              y="0"
              width="7.07"
              height="7.07"
              transform="rotate(45 5 0)"
              fill="currentColor"
            />
          </svg>
          <span className="h-px w-8 bg-[#dcc9a8]/60" />
        </div>

        {/* Bottom bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#dcc9a8]/40 pt-5">
          {/* Left — Copyright */}
          <p className="text-[12px] text-[#8a7e72]">
            &copy; {new Date().getFullYear()} Lifestory.co. {copy.rights}
          </p>

          {/* Center — Tagline */}
          <p className="font-serif text-[13.5px] italic text-[#9b845f]">
            {copy.bottomTagline}
          </p>

          {/* Right — Legacy + Social */}
          <div className="flex items-center gap-4">
            <span className="font-serif text-[12px] italic text-[#8a7e72]">
              {copy.bottomLegacy}
            </span>
            <div className="flex items-center gap-2">
              <a
                href="#"
                aria-label="Instagram"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dcc9a8] text-[#8a7e72] transition hover:border-[#c9a96e] hover:text-[#c9a96e]"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dcc9a8] text-[#8a7e72] transition hover:border-[#c9a96e] hover:text-[#c9a96e]"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dcc9a8] text-[#8a7e72] transition hover:border-[#c9a96e] hover:text-[#c9a96e]"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
