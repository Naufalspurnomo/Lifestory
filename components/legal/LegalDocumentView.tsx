"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  ArrowRight, 
  BadgeCheck, 
  CalendarDays, 
  FileText, 
  Download,
  Link as LinkIcon,
  Check,
  Menu,
  X,
  Clock3,
  ChevronRight,
} from "lucide-react";
import { useLanguage, type Locale } from "../providers/LanguageProvider";

export type LegalSection = {
  title: string;
  body: string;
  points?: string[];
  tone?: "default" | "critical";
  badge?: string;
};

type LegalBlock = {
  title: string;
  label: string;
  intro: string;
  effectiveLabel: string;
  versionLabel: string;
  contentsLabel: string;
  reviewedLabel: string;
  changesLabel?: string;
  changesSummary?: string;
  links: Array<{ href: string; label: string; download?: boolean }>;
  sections: LegalSection[];
};

type Props = {
  content: Record<Locale, LegalBlock>;
  effectiveDate: string;
  policyVersion: string;
};

function getDisplaySectionTitle(title: string) {
  return title.replace(/^\s*\d+\s*[\.:\-)]?\s*/, "");
}

export default function LegalDocumentView({ content, effectiveDate, policyVersion }: Props) {
  const { locale } = useLanguage();
  const block = content[locale] ?? content.id;

  // --- UX FEATURES STATE ---
  const [activeSection, setActiveSection] = useState<string>("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const activeSectionIndex = Math.max(
    block.sections.findIndex((_, idx) => `section-${idx}` === activeSection),
    0
  );
  const activeSectionLabel = getDisplaySectionTitle(block.sections[activeSectionIndex]?.title ?? block.sections[0]?.title ?? "");
  const readingMinutes = Math.max(
    3,
    Math.ceil(
      `${block.title} ${block.intro} ${block.sections
        .map((section) => `${section.title} ${section.body} ${(section.points ?? []).join(" ")}`)
        .join(" ")}`.split(/\s+/).filter(Boolean).length / 180
    )
  );

  // --- PROGRESS BAR & SCROLL SPY LOGIC ---
  useEffect(() => {
    setActiveSection(block.sections[0] ? "section-0" : "");

    // 1. Reading Progress Bar Logic
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${(totalScroll / Math.max(windowHeight, 1)) * 100}`;
      setScrollProgress(Number(scroll));
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    // 2. Intersection Observer for Scroll Spy
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Update active section saat bagian dokumen menyentuh viewport
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -70% 0px", // Memicu pergantian status saat section mencapai 20% dari atas layar
      }
    );

    const sectionElements = document.querySelectorAll("section[id^='section-']");
    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      sectionElements.forEach((el) => observer.unobserve(el));
    };
  }, [block.sections]);

  useEffect(() => {
    if (!mobileTocOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileTocOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileTocOpen]);

  // --- COPY LINK LOGIC ---
  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000); // Reset icon setelah 2 detik
  };

  return (
    <div className="min-h-screen bg-[#f7f1e6] text-[#1f1a17] font-sans selection:bg-[#d8c7a9] selection:text-[#1b1714]">
      
      {/* 1. READING PROGRESS BAR */}
      <div 
        className="fixed top-0 left-0 h-1 bg-[#8e7a5d] z-50 transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* HEADER SECTION */}
      <header className="relative border-b border-[#eaddc5] bg-gradient-to-b from-[#fffaf1] to-[#f7f1e6] px-6 pb-20 pt-28 sm:pt-36">
        <div className="mx-auto max-w-7xl">
          <div className="flex max-w-4xl flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#8e7a5d]/50"></span>
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-[#8e7a5d] font-semibold">
                {block.label}
              </span>
            </div>
            <h1 className="font-serif text-5xl font-light tracking-tight text-[#2a221b] md:text-7xl lg:text-[5rem] lg:leading-[1.1]">
              {block.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg font-normal leading-relaxed text-[#5f5348] md:text-xl md:leading-9">
              {block.intro}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#7b6d60]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#eaddc5] bg-white/70 px-3 py-1.5 backdrop-blur-sm">
                <Clock3 className="h-3.5 w-3.5 text-[#8e7a5d]" />
                ± {readingMinutes} menit baca
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#eaddc5] bg-white/70 px-3 py-1.5 backdrop-blur-sm">
                Bagian {Math.min(activeSectionIndex + 1, block.sections.length)} dari {block.sections.length}
              </span>
              {activeSectionLabel ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#eaddc5] bg-white/70 px-3 py-1.5 backdrop-blur-sm">
                  {activeSectionLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT SECTION */}
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-20">
          
          {/* SIDEBAR */}
          <aside className="lg:col-span-4 flex flex-col gap-10">
            <div className="sticky top-12 hidden rounded-[2rem] border border-[#eaddc5] bg-white/80 shadow-sm backdrop-blur-sm md:block">
              <div className="flex flex-col gap-6 p-7">
                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-[#f7f1e6] p-2 text-[#8e7a5d]">
                    <CalendarDays className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e7a5d] font-semibold">
                      {block.effectiveLabel}
                    </p>
                    <p className="text-sm font-semibold text-[#241d18]">{effectiveDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 rounded-full bg-[#f7f1e6] p-2 text-[#8e7a5d]">
                    <FileText className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e7a5d] font-semibold">
                      {block.versionLabel}
                    </p>
                    <p className="text-sm font-semibold text-[#241d18]">{policyVersion}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-[#eaddc5] bg-[#fffaf1] px-4 py-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8e7a5d]" strokeWidth={2} />
                  <p className="text-xs leading-relaxed font-medium text-[#7b6d60]">
                    {block.reviewedLabel}
                  </p>
                </div>

                {block.changesSummary ? (
                  <div className="rounded-2xl border border-[#eaddc5] bg-[#fffaf1] px-4 py-3">
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#8e7a5d] font-semibold">
                      {block.changesLabel ?? "Apa yang berubah"}
                    </p>
                    <p className="text-sm leading-7 text-[#4f443b]">{block.changesSummary}</p>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-[#eaddc5] px-7 py-6">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[#8e7a5d] font-semibold">
                  Daftar Isi
                </p>
                <nav className="flex flex-col gap-1">
                  {block.sections.map((section, idx) => {
                    const sectionId = `section-${idx}`;
                    const isActive = activeSection === sectionId;

                    return (
                      <a
                        key={sectionId}
                        href={`#${sectionId}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={`group flex items-center gap-3 py-2 text-sm font-medium transition-all duration-300 ${isActive ? "text-[#1f1a17]" : "text-[#8c8075] hover:text-[#4f443b]"}`}
                      >
                        <span 
                          className={`h-1.5 rounded-full bg-[#8e7a5d] transition-all duration-300 ${isActive ? "w-6 opacity-100" : "w-1.5 opacity-0 group-hover:opacity-50"}`} 
                        />
                        {getDisplaySectionTitle(section.title)}
                      </a>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-[#eaddc5] px-7 py-6">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[#8e7a5d] font-semibold">
                  {block.contentsLabel || "Quick Links"}
                </p>
                <nav className="flex flex-col gap-2">
                  {block.links.map((link, idx) => {
                    const LinkWrapper = link.download ? "a" : Link;
                    const Icon = link.download ? Download : ArrowRight;

                    return (
                      <LinkWrapper
                        key={idx}
                        href={link.href}
                        {...(link.download ? { download: true } : {})}
                        className="group flex items-center justify-between rounded-xl border border-transparent px-4 py-3.5 text-sm font-medium text-[#6d6054] transition-all duration-300 hover:border-[#eaddc5] hover:bg-white hover:text-[#1f1a17] hover:shadow-sm"
                      >
                        <span className="flex items-center gap-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#cdbda1] transition-all duration-300 group-hover:scale-125 group-hover:bg-[#8e7a5d]" />
                          {link.label}
                        </span>
                        <Icon className="h-4 w-4 text-[#8e7a5d] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                      </LinkWrapper>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* DOCUMENT SECTIONS */}
          <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
            {block.sections.map((section, idx) => {
              const sectionId = `section-${idx}`;
              const isCopied = copiedId === sectionId;
              const isCritical = section.tone === "critical";

              return (
                <section
                  key={sectionId}
                  id={sectionId}
                  className="group relative scroll-mt-24 border-t border-[#eaddc5] pt-10 sm:pt-12"
                >
                  {/* 3. COPY ANCHOR LINK BUTTON */}
                  <button 
                    onClick={() => handleCopyLink(sectionId)}
                    className="absolute right-0 top-10 rounded-lg border border-[#eaddc5] bg-[#fffaf1] p-2 text-[#8e7a5d] opacity-70 transition-all duration-300 hover:bg-[#8e7a5d] hover:text-white hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#8e7a5d]/50 sm:top-12"
                    title="Salin tautan ke bagian ini"
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                  </button>

                  <div className="mb-8 flex items-start gap-5 pr-12 sm:pr-16">
                    <span className="min-w-14 font-mono text-3xl font-light tracking-[0.16em] text-[#c6b79b] sm:text-4xl">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 border-b border-[#f0e8d9] pb-5">
                      <div className="flex flex-wrap items-center gap-3">
                        {section.badge ? (
                          <span className="inline-flex items-center rounded-full border border-[#e6d2b4] bg-[#fffaf1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8e7a5d]">
                            {section.badge}
                          </span>
                        ) : isCritical ? (
                          <span className="inline-flex items-center rounded-full border border-[#d9b59f] bg-[#fff4ee] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a5534]">
                            Penting
                          </span>
                        ) : null}
                          <h2 className="font-serif text-2xl font-medium tracking-tight text-[#2a221b] md:text-3xl">
                            {getDisplaySectionTitle(section.title)}
                          </h2>
                        </div>
                    </div>
                  </div>

                  <div className={`space-y-6 text-[15px] sm:text-base leading-8 sm:leading-9 text-[#5f5348] ${isCritical ? "rounded-3xl border border-[#e8cfbe] bg-[#fffaf5] p-6 sm:p-7" : ""}`}>
                    <p>{section.body}</p>

                    {section.points && (
                      <ul className="mt-8 flex flex-col gap-5">
                        {section.points.map((point, pointIndex) => (
                          <li key={pointIndex} className="flex items-start gap-4 rounded-2xl border border-[#f0e8d9]/60 bg-white/60 p-4">
                            <div className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f7f1e6] border border-[#eaddc5]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#8e7a5d]" />
                            </div>
                            <span className="text-[#4f443b] leading-7">{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              );
            })}

            <div className="mt-10 rounded-[2rem] border border-[#eaddc5] bg-gradient-to-br from-[#fffaf1] to-[#f7f1e6] p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8e7a5d] font-semibold">
                Masih ada pertanyaan?
              </p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-xl font-medium tracking-tight text-[#2a221b]">
                    Hubungi tim kami kalau ada klausul yang perlu dijelaskan.
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5f5348]">
                    Untuk pertanyaan terkait dokumen legal, kami sarankan cek bagian yang relevan lalu lanjut ke kontak resmi.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eaddc5] bg-white px-5 py-3 text-sm font-medium text-[#1f1a17] transition-all duration-300 hover:border-[#d7c19d] hover:shadow-sm"
                >
                  Hubungi Kami
                  <ChevronRight className="h-4 w-4 text-[#8e7a5d]" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
        <button
          type="button"
          onClick={() => setMobileTocOpen(true)}
          className="flex w-full items-center justify-between rounded-full border border-[#eaddc5] bg-white/95 px-4 py-3 text-left shadow-lg backdrop-blur"
        >
          <span className="flex min-w-0 flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8e7a5d]">
              Daftar Isi · Bagian {Math.min(activeSectionIndex + 1, block.sections.length)}/{block.sections.length}
            </span>
            <span className="truncate text-sm font-medium text-[#1f1a17]">
              {activeSectionLabel || block.contentsLabel || "Buka navigasi"}
            </span>
          </span>
          <Menu className="h-5 w-5 shrink-0 text-[#8e7a5d]" />
        </button>
      </div>

      {mobileTocOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Tutup daftar isi"
            className="absolute inset-0 bg-[#1f1a17]/40"
            onClick={() => setMobileTocOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border-t border-[#eaddc5] bg-[#fffaf1] p-5 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#d8c7a9]" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8e7a5d] font-semibold">
                  {block.contentsLabel || "Daftar Isi"}
                </p>
                <p className="mt-1 text-sm text-[#5f5348]">
                  {Math.min(activeSectionIndex + 1, block.sections.length)} dari {block.sections.length} bagian · ± {readingMinutes} menit
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileTocOpen(false)}
                className="rounded-full border border-[#eaddc5] bg-white p-2 text-[#8e7a5d]"
                aria-label="Tutup daftar isi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 max-h-[50vh] overflow-y-auto pr-1">
              <nav className="flex flex-col gap-2">
                {block.sections.map((section, idx) => {
                  const sectionId = `section-${idx}`;
                  const isActive = activeSection === sectionId;

                  return (
                    <button
                      key={sectionId}
                      type="button"
                      onClick={() => {
                        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
                        setMobileTocOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-300 ${isActive ? "border-[#d7c19d] bg-white text-[#1f1a17]" : "border-[#eee1cb] bg-white/70 text-[#5f5348]"}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isActive ? "text-[#8e7a5d]" : "text-[#b19f7f]"}`}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-medium">{getDisplaySectionTitle(section.title)}</span>
                      </span>
                      {isActive ? <span className="h-2 w-2 rounded-full bg-[#8e7a5d]" /> : null}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-5 border-t border-[#eaddc5] pt-5">
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#8e7a5d] font-semibold">
                  {block.contentsLabel || "Quick Links"}
                </p>
                <div className="flex flex-col gap-2">
                  {block.links.map((link, idx) => {
                    const LinkWrapper = link.download ? "a" : Link;
                    const Icon = link.download ? Download : ArrowRight;

                    return (
                      <LinkWrapper
                        key={idx}
                        href={link.href}
                        {...(link.download ? { download: true } : {})}
                        className="flex items-center justify-between rounded-2xl border border-[#eee1cb] bg-white px-4 py-3 text-sm font-medium text-[#5f5348]"
                        onClick={() => setMobileTocOpen(false)}
                      >
                        <span>{link.label}</span>
                        <Icon className="h-4 w-4 text-[#8e7a5d]" />
                      </LinkWrapper>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}