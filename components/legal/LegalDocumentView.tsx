"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  Scale,
  ShieldCheck,
} from "lucide-react";
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
  summaryItems?: Array<{ label: string; value: string }>;
  effectiveLabel: string;
  versionLabel: string;
  contentsLabel: string;
  reviewedLabel: string;
  noticeTitle?: string;
  noticeBody?: string;
  relatedLabel?: string;
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

export default function LegalDocumentView({
  content,
  effectiveDate,
  policyVersion,
}: Props) {
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
        .map(
          (section) =>
            `${section.title} ${section.body} ${(section.points ?? []).join(" ")}`
        )
        .join(" ")}`
        .split(/\s+/)
        .filter(Boolean).length / 180
    )
  );

  useEffect(() => {
    setActiveSection(block.sections[0] ? "section-0" : "");

    const handleScroll = () => {
      const scrollableHeight =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const nextProgress =
        (document.documentElement.scrollTop / Math.max(scrollableHeight, 1)) *
        100;
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
    <main className="min-h-screen bg-cream-100 text-ink-900 selection:bg-brand-200 selection:text-ink-900">
      <div
        className="fixed left-0 top-0 z-50 h-1 bg-brand-700 transition-[width] duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      <header className="relative isolate border-b border-cream-300 px-5 pb-12 pt-24 sm:px-8 sm:pb-16 sm:pt-28 lg:px-10">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#fdfbf6_0%,#faf6ed_72%,#f5efe1_100%)]"
        />

        <div className="mx-auto max-w-page">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end">
            <div className="relative max-w-4xl">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-brand-700">
                {block.label}
              </span>
              <h1 className="mt-6 max-w-4xl font-serif text-[clamp(2.6rem,7vw,5.2rem)] font-medium leading-[0.98] tracking-[-0.025em] text-ink-900">
                {block.title}
              </h1>
              <p className="mt-7 max-w-3xl text-base leading-8 text-ink-600 sm:text-lg sm:leading-9">
                {block.intro}
              </p>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-ink-500">
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5 text-brand-700" />
                  {readingMinutes} min read
                </span>
                <span className="inline-flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-brand-700" />
                  {Math.min(activeSectionIndex + 1, block.sections.length)} /{" "}
                  {block.sections.length}
                </span>
                {activeSectionLabel ? (
                  <span className="inline-flex max-w-full items-center gap-2 text-ink-600">
                    <span className="truncate">{activeSectionLabel}</span>
                  </span>
                ) : null}
              </div>
            </div>

            {block.summaryItems?.length ? (
              <dl className="grid gap-4 border-y border-cream-400 py-5 text-sm sm:grid-cols-2 lg:grid-cols-1">
                {block.summaryItems.map((item) => (
                  <div key={item.label} className="min-w-0">
                    <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-300">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold leading-6 text-ink-800">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          {block.noticeTitle && block.noticeBody ? (
            <div className="mt-10 max-w-4xl border-l-2 border-brand-500 py-1 pl-5">
              <p className="inline-flex items-center gap-2 text-sm font-bold text-ink-900">
                <Scale className="h-4 w-4 text-brand-700" />
                {block.noticeTitle}
              </p>
              <p className="mt-2 text-sm leading-7 text-ink-600">
                {block.noticeBody}
              </p>
            </div>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-page grid-cols-1 gap-10 px-5 py-10 sm:px-8 sm:py-12 lg:grid-cols-[19rem_minmax(0,1fr)] lg:px-10 lg:py-16">
        <aside className="min-w-0 lg:sticky lg:top-8 lg:self-start">
          <div className="space-y-9 text-sm">
            <div className="grid gap-5 border-l border-brand-300/55 pl-5 sm:grid-cols-3 lg:grid-cols-1">
              <div className="flex items-start gap-3 text-ink-700">
                <CalendarDays className="mt-1 h-4 w-4 shrink-0 text-brand-600" />
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-300">
                    {block.effectiveLabel}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">
                    {effectiveDate}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-ink-700">
                <FileText className="mt-1 h-4 w-4 shrink-0 text-brand-600" />
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-300">
                    {block.versionLabel}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink-900">
                    {policyVersion}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-ink-500">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <p className="text-xs font-medium leading-6 text-ink-500">
                  {block.reviewedLabel}
                </p>
              </div>
            </div>

            <nav aria-label={block.contentsLabel} className="min-w-0">
              <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink-300">
                {block.contentsLabel}
              </p>
              <div className="flex max-w-full snap-x gap-4 overflow-x-auto pb-1 lg:flex-col lg:gap-3 lg:overflow-visible lg:pb-0">
                {block.sections.map((section, index) => {
                  const sectionId = `section-${index}`;
                  const isActive = activeSection === sectionId;

                  return (
                    <a
                      key={sectionId}
                      href={`#${sectionId}`}
                      className={`focus-ring group relative snap-start whitespace-nowrap text-sm font-semibold transition lg:whitespace-normal lg:pl-4 ${
                        isActive
                          ? "text-ink-900"
                          : "text-ink-400 hover:text-ink-800"
                      }`}
                    >
                      <span
                        className={`absolute left-2 top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full lg:block ${
                          isActive
                            ? "bg-brand-700"
                            : "bg-transparent group-hover:bg-brand-300"
                        }`}
                      />
                      {getDisplaySectionTitle(section.title)}
                    </a>
                  );
                })}
              </div>
            </nav>

            {block.links?.length ? (
              <div>
                <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink-300">
                  {block.relatedLabel ?? "Dokumen terkait"}
                </p>
                <div className="grid gap-2">
                  {block.links.map((link) => {
                    const Icon = link.download ? Download : ArrowUpRight;

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        download={link.download}
                        className="focus-ring group inline-flex min-h-11 items-center justify-between gap-3 border-b border-cream-300 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-400 hover:text-ink-900"
                      >
                        <span>{link.label}</span>
                        <Icon className="h-4 w-4 shrink-0 text-brand-600 transition group-hover:translate-x-0.5" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <article className="min-w-0 space-y-10 lg:space-y-14">
          {block.sections.map((section, index) => {
            const isCritical = section.tone === "critical";

            return (
              <section
                key={section.title}
                id={`section-${index}`}
                className="scroll-mt-24 border-t border-cream-300 pt-9 sm:pt-12"
              >
                <div className="mb-6 flex min-w-0 items-start gap-4 sm:gap-6">
                  <span className="mt-1 shrink-0 font-mono text-xs font-bold leading-none tracking-[0.18em] text-brand-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1 border-b border-cream-300 pb-5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                      {section.badge ? (
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">
                          {section.badge}
                        </span>
                      ) : isCritical ? (
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-brand-800">
                          Penting
                        </span>
                      ) : null}
                      <h2 className="min-w-0 font-serif text-[clamp(1.65rem,3vw,2.45rem)] font-medium leading-tight tracking-[-0.02em] text-ink-900">
                        {getDisplaySectionTitle(section.title)}
                      </h2>
                    </div>
                  </div>
                </div>

                <div
                  className={`max-w-[78ch] space-y-5 text-[15px] leading-8 text-ink-600 sm:text-base sm:leading-9 ${
                    isCritical ? "border-l-2 border-brand-500 pl-5 sm:pl-7" : ""
                  }`}
                >
                  <p>{section.body}</p>
                  {section.points ? (
                    <ul className="grid gap-3">
                      {section.points.map((point) => (
                        <li key={point} className="group flex items-start gap-3">
                          <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-brand-600" />
                          <span className="min-w-0 leading-7 text-ink-700">
                            {point}
                          </span>
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
