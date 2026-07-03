"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CalendarDays, Clock3, FileText } from "lucide-react";
import { useLanguage, type Locale } from "../providers/LanguageProvider";

export type LegalSection = {
  title: string;
  body: string;
  points?: string[];
  tone?: "default" | "critical" | string;
  badge?: string;
};

export type LegalBlock = {
  title: string;
  label: string;
  intro: string;
  effectiveLabel: string;
  versionLabel: string;
  contentsLabel: string;
  reviewedLabel: string;
  changesLabel?: string;
  changesSummary?: string;
  links?: Array<{ href: string; label: string; download?: boolean }>;
  sections: LegalSection[];
};

type Props = {
  content: Record<Locale, LegalBlock>;
  effectiveDate: string;
  policyVersion: string;
};

function getDisplaySectionTitle(title: string) {
  return title.replace(/^\s*\d+\s*[.:)\-]?\s*/, "");
}

export default function LegalDocumentView({ content, effectiveDate, policyVersion }: Props) {
  const { locale } = useLanguage();
  const block = content[locale] ?? content.id;
  const [activeSection, setActiveSection] = useState("section-0");
  const [scrollProgress, setScrollProgress] = useState(0);

  const activeSectionIndex = Math.max(
    block.sections.findIndex((_, index) => `section-${index}` === activeSection),
    0
  );
  const activeSectionLabel = getDisplaySectionTitle(
    block.sections[activeSectionIndex]?.title ?? block.sections[0]?.title ?? ""
  );
  const readingMinutes = Math.max(
    3,
    Math.ceil(
      `${block.title} ${block.intro} ${block.sections
        .map((section) => `${section.title} ${section.body} ${(section.points ?? []).join(" ")}`)
        .join(" ")}`
        .split(/\s+/)
        .filter(Boolean).length / 180
    )
  );

  useEffect(() => {
    setActiveSection(block.sections[0] ? "section-0" : "");

    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const nextProgress = (document.documentElement.scrollTop / Math.max(scrollableHeight, 1)) * 100;
      setScrollProgress(nextProgress);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-24% 0px -62% 0px" }
    );

    const sectionElements = document.querySelectorAll("section[id^='section-']");
    sectionElements.forEach((element) => observer.observe(element));
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [block.sections]);

  return (
    <main className="min-h-screen bg-[#f7f1e6] text-[#1f1a17] selection:bg-[#d8c7a9] selection:text-[#1b1714]">
      <div
        className="fixed left-0 top-0 z-50 h-1 bg-[#8e7a5d] transition-[width] duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      <header className="border-b border-[#eaddc5] bg-gradient-to-b from-[#fffaf1] to-[#f7f1e6] px-5 pb-10 pt-24 sm:px-8 sm:pb-14 sm:pt-28 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[#8e7a5d]/55" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8e7a5d]">
                {block.label}
              </span>
            </div>
            <h1 className="mt-5 max-w-4xl font-serif text-[clamp(2.6rem,9vw,5.35rem)] font-light leading-[0.98] tracking-tight text-[#2a221b]">
              {block.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#5f5348] sm:text-lg sm:leading-9">
              {block.intro}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5 text-xs font-medium text-[#6f6256]">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#eaddc5] bg-white/70 px-3 py-1.5">
                <Clock3 className="h-3.5 w-3.5 text-[#8e7a5d]" />
                {readingMinutes} min read
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#eaddc5] bg-white/70 px-3 py-1.5">
                {Math.min(activeSectionIndex + 1, block.sections.length)} / {block.sections.length}
              </span>
              {activeSectionLabel ? (
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#eaddc5] bg-white/70 px-3 py-1.5">
                  <span className="truncate">{activeSectionLabel}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:px-10 lg:py-14">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[1.5rem] border border-[#eaddc5] bg-[#fffaf1] p-4 shadow-[0_20px_50px_-42px_rgba(31,26,23,0.65)] sm:p-5 lg:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-1 h-4 w-4 shrink-0 text-[#8e7a5d]" />
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8e7a5d]">
                      {block.effectiveLabel}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#241d18]">{effectiveDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="mt-1 h-4 w-4 shrink-0 text-[#8e7a5d]" />
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8e7a5d]">
                      {block.versionLabel}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#241d18]">{policyVersion}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-[#eaddc5] bg-white/55 px-4 py-3">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8e7a5d]" />
                  <p className="text-xs font-medium leading-6 text-[#6f6256]">{block.reviewedLabel}</p>
                </div>
              </div>

              <nav aria-label={block.contentsLabel} className="min-w-0">
                <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8e7a5d]">
                  {block.contentsLabel}
                </p>
                <div className="flex snap-x gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                  {block.sections.map((section, index) => {
                    const sectionId = `section-${index}`;
                    const isActive = activeSection === sectionId;

                    return (
                      <a
                        key={sectionId}
                        href={`#${sectionId}`}
                        className={`snap-start whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium transition lg:whitespace-normal lg:rounded-xl ${
                          isActive
                            ? "border-[#d7c19d] bg-white text-[#1f1a17]"
                            : "border-[#eee1cb] bg-white/45 text-[#6f6256] hover:border-[#d7c19d] hover:bg-white"
                        }`}
                      >
                        {getDisplaySectionTitle(section.title)}
                      </a>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>
        </aside>

        <article className="min-w-0 space-y-8 lg:space-y-10">
          {block.sections.map((section, index) => {
            const isCritical = section.tone === "critical";

            return (
              <section
                key={section.title}
                id={`section-${index}`}
                className="scroll-mt-24 border-t border-[#eaddc5] pt-8 sm:pt-10"
              >
                <div className="mb-5 flex min-w-0 items-start gap-4 sm:gap-5">
                  <span className="shrink-0 font-mono text-2xl font-light tracking-[0.16em] text-[#c6b79b] sm:text-4xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1 border-b border-[#f0e8d9] pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {section.badge ? (
                        <span className="inline-flex rounded-full border border-[#e6d2b4] bg-[#fffaf1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8e7a5d]">
                          {section.badge}
                        </span>
                      ) : isCritical ? (
                        <span className="inline-flex rounded-full border border-[#d9b59f] bg-[#fff4ee] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a5534]">
                          Penting
                        </span>
                      ) : null}
                      <h2 className="min-w-0 font-serif text-2xl font-medium tracking-tight text-[#2a221b] sm:text-3xl">
                        {getDisplaySectionTitle(section.title)}
                      </h2>
                    </div>
                  </div>
                </div>

                <div
                  className={`space-y-5 text-[15px] leading-8 text-[#5f5348] sm:text-base sm:leading-9 ${
                    isCritical ? "rounded-[1.5rem] border border-[#e8cfbe] bg-[#fffaf5] p-5 sm:p-7" : ""
                  }`}
                >
                  <p>{section.body}</p>
                  {section.points ? (
                    <ul className="space-y-3">
                      {section.points.map((point) => (
                        <li key={point} className="flex items-start gap-3 rounded-2xl border border-[#f0e8d9]/70 bg-white/55 p-4">
                          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8e7a5d]" />
                          <span className="min-w-0 leading-7 text-[#4f443b]">{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            );
          })}
        </article>
      </div>
    </main>
  );
}
