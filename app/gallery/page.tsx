"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ExternalLink, FileDown } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { galleryItems } from "../../lib/content/galleryItems";
import { getGalleryLocalizedMeta, type LocalizedGalleryMeta } from "../../lib/content/galleryLocalizedMeta";
import { useLanguage } from "../../components/providers/LanguageProvider";

export default function GalleryPage() {
  return <Suspense fallback={<GalleryPageSkeleton />}><GalleryPageContent /></Suspense>;
}

function GalleryPageContent() {
  const { locale } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const activeItem = galleryItems[activeIndex] ?? galleryItems[0];
  const activePdf = activeItem?.pdf ?? null;
  const copy = locale === "id" ? {
    sectionLabel: "Galeri", backHome: "Kembali ke Beranda", era: "Era",
    openInNewTab: "Buka naskah", downloadPdf: "Unduh PDF", prev: "Sebelumnya", next: "Berikutnya",
    ariaPrevCover: "Kisah sebelumnya", ariaNextCover: "Kisah berikutnya", ariaOpenPdfNewTab: "Buka PDF di tab baru", ariaDownloadPdf: "Unduh PDF",
  } : {
    sectionLabel: "Gallery", backHome: "Back to Home", era: "Era",
    openInNewTab: "Open manuscript", downloadPdf: "Download PDF", prev: "Previous", next: "Next",
    ariaPrevCover: "Previous story", ariaNextCover: "Next story", ariaOpenPdfNewTab: "Open PDF in new tab", ariaDownloadPdf: "Download PDF",
  };

  const getLocalizedMeta = useCallback((itemId: string): LocalizedGalleryMeta | null => getGalleryLocalizedMeta(itemId, locale) ?? null, [locale]);
  const activeMeta = activeItem ? getLocalizedMeta(activeItem.id) : null;
  const replaceItemQuery = useCallback((itemId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("item", itemId);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);
  const selectItem = useCallback((index: number) => {
    setActiveIndex(index);
    replaceItemQuery(galleryItems[index].id);
  }, [replaceItemQuery]);
  const goNext = useCallback(() => selectItem((activeIndex + 1) % galleryItems.length), [activeIndex, selectItem]);
  const goPrev = useCallback(() => selectItem((activeIndex - 1 + galleryItems.length) % galleryItems.length), [activeIndex, selectItem]);

  useEffect(() => {
    const itemId = searchParams.get("item");
    const index = galleryItems.findIndex((item) => item.id === itemId);
    if (index >= 0) setActiveIndex(index);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#1d1610] text-[#faf6ed]">
      <section className="mx-auto max-w-[1540px] px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
        <header className="mb-8 flex items-center justify-between gap-6 lg:mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#c5a66f]">{copy.sectionLabel} <span className="text-[#84776a]">/ 01—0{galleryItems.length}</span></p>
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#ded4c3] transition hover:text-[#c5a66f]"><span aria-hidden>←</span>{copy.backHome}</Link>
        </header>

        <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12">
          <aside className="min-w-0 border-t border-[#4a3a2a] pt-4 lg:border-t-0 lg:pt-6">
            <div className="mb-4 flex items-center justify-between lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#c5a66f]">{locale === "id" ? "Koleksi" : "Collection"}</p>
              <span className="text-[10px] tracking-[0.14em] text-[#84776a]">0{activeIndex + 1} / 0{galleryItems.length}</span>
            </div>
            <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible">
              {galleryItems.map((item, index) => {
                const isActive = index === activeIndex;
                return <button key={item.id} type="button" onClick={() => selectItem(index)} aria-pressed={isActive} className={`min-w-max border-l-2 py-2 pl-3 pr-2 text-left transition lg:min-w-0 lg:py-3 ${isActive ? "border-[#c5a66f] text-[#faf6ed]" : "border-transparent text-[#84776a] hover:border-[#66523c] hover:text-[#ded4c3]"}`}>
                  <span className={`mr-2 text-[10px] font-bold tracking-[0.1em] ${isActive ? "text-[#c5a66f]" : ""}`}>0{index + 1}</span>
                  <span className="font-serif text-lg leading-none">{item.title}</span>
                </button>;
              })}
            </div>
          </aside>

          <article className="grid overflow-hidden border border-[#3b2d20] bg-[#2a2018] lg:grid-cols-[minmax(0,1.12fr)_minmax(300px,.88fr)]" onTouchStart={(event) => { touchStartXRef.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
            const startX = touchStartXRef.current; const endX = event.changedTouches[0]?.clientX ?? null;
            if (startX !== null && endX !== null && Math.abs(endX - startX) >= 48) endX < startX ? goNext() : goPrev();
            touchStartXRef.current = null;
          }} onTouchCancel={() => { touchStartXRef.current = null; }}>
            <div className="relative min-h-[420px] bg-[#31261c] sm:min-h-[560px] lg:min-h-[680px]">
              <Image src={activeItem.src} alt={activeItem.alt} fill priority className="object-cover grayscale" sizes="(max-width: 1024px) 100vw, 60vw" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(20,14,9,.62),rgba(20,14,9,0)_42%)]" />
              <p className="absolute bottom-5 left-5 max-w-[15rem] text-[10px] font-bold uppercase tracking-[0.16em] text-[#f5ebdc]/75">{activeMeta?.subtitle || activeItem.subtitle}</p>
            </div>
            <div className="flex flex-col justify-between px-6 py-8 sm:px-9 lg:px-11 lg:py-12">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#c5a66f]">{copy.era} {activeMeta?.era || activeItem.era}</p>
                <h1 className="mt-5 font-serif text-[clamp(3.2rem,5vw,5.5rem)] leading-[.84] tracking-[-0.04em] text-[#faf6ed]">{activeItem.title}</h1>
                <p className="mt-8 max-w-sm text-base leading-relaxed text-[#c4b8a8] md:text-lg">{activeMeta?.summary || activeItem.summary}</p>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                {activePdf ? <>
                  <a href={activePdf.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-[#c5a66f] bg-[#c5a66f] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1d1610] transition hover:bg-[#e4c994]" aria-label={copy.ariaOpenPdfNewTab}><ExternalLink className="h-3.5 w-3.5" />{copy.openInNewTab}</a>
                  <a href={activePdf.url} download={activePdf.fileName} className="inline-flex items-center gap-2 px-2 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ded4c3] transition hover:text-[#c5a66f]" aria-label={copy.ariaDownloadPdf}><FileDown className="h-3.5 w-3.5" />{copy.downloadPdf}</a>
                </> : null}
                <div className="ml-auto flex items-center gap-4 text-[#ded4c3]">
                  <button type="button" onClick={goPrev} className="transition hover:text-[#c5a66f]" aria-label={copy.ariaPrevCover}><ChevronLeft className="h-5 w-5" /></button>
                  <span className="text-[10px] font-bold tracking-[0.16em]">0{activeIndex + 1} — 0{galleryItems.length}</span>
                  <button type="button" onClick={goNext} className="transition hover:text-[#c5a66f]" aria-label={copy.ariaNextCover}><ChevronRight className="h-5 w-5" /></button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function GalleryPageSkeleton() {
  return <div className="min-h-screen bg-[#1d1610] px-6 py-16"><div className="mx-auto h-[72vh] max-w-[1320px] animate-pulse bg-[#2a2018]" /></div>;
}
