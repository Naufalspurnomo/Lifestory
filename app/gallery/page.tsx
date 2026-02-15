"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { galleryItems } from "../../lib/content/galleryItems";

export default function GalleryPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const activeItem = activeIndex !== null ? galleryItems[activeIndex] : null;

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((prev) => {
          if (prev === null) return prev;
          return (prev + 1) % galleryItems.length;
        });
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((prev) => {
          if (prev === null) return prev;
          return (prev - 1 + galleryItems.length) % galleryItems.length;
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex]);

  function openItem(index: number) {
    setActiveIndex(index);
  }

  function closeModal() {
    setActiveIndex(null);
  }

  function goNext() {
    setActiveIndex((prev) => {
      if (prev === null) return prev;
      return (prev + 1) % galleryItems.length;
    });
  }

  function goPrev() {
    setActiveIndex((prev) => {
      if (prev === null) return prev;
      return (prev - 1 + galleryItems.length) % galleryItems.length;
    });
  }

  return (
    <div className="bg-[#f7f5f1] text-[#40342c]">
      <section className="mx-auto max-w-[1320px] px-6 py-16 md:py-20">
        <div className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a68553]">
              Gallery
            </p>
            <h1 className="font-serif text-[clamp(2rem,4.8vw,3.8rem)] leading-[1.06] text-[#3f342d]">
              Featured Biography Collections
            </h1>
            <p className="text-base leading-relaxed text-[#72675f] md:text-lg">
              This page expands the featured section from homepage. Same
              collection, now with richer context, era notes, and visual
              identity detail for each biography cover.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 self-start rounded-full border border-[#dccfb7] bg-white/80 px-5 py-2 text-sm font-semibold text-[#6c5a49] transition hover:border-[#c7b289] hover:bg-white hover:text-[#4c3f34] md:self-auto"
          >
            Back to Home
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>

        <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
          {galleryItems.map((item, index) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-[22px] border border-[#d7cbb6] bg-white shadow-[0_14px_34px_rgba(88,67,37,0.12)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_42px_rgba(88,67,37,0.2)]"
            >
              <button
                type="button"
                onClick={() => openItem(index)}
                className="block w-full text-left"
                aria-label={`Open ${item.title} details`}
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    priority={index < 2}
                  />
                </div>

                <div className="space-y-3 p-5">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#aa8b5c]">
                      {item.subtitle}
                    </p>
                    <h2 className="font-serif text-2xl leading-tight text-[#3f342d]">
                      {item.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#705f4e]">
                    <span className="rounded-full border border-[#dfd2bb] bg-[#faf7f1] px-2.5 py-1">
                      Era: {item.era}
                    </span>
                    <span className="rounded-full border border-[#dfd2bb] bg-[#faf7f1] px-2.5 py-1">
                      {item.palette}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-[#6f6358]">
                    {item.summary}
                  </p>
                </div>
              </button>
            </article>
          ))}
        </div>
      </section>

      {activeItem && (
        <div
          className="fixed inset-0 z-[80] bg-[rgba(16,11,7,0.72)] backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div className="relative mx-auto flex h-full max-w-6xl items-center px-4 py-10 md:px-8">
            <div
              className="relative w-full overflow-hidden rounded-[26px] border border-[#bca783]/45 bg-[#f5efe4] shadow-[0_28px_60px_rgba(17,12,8,0.42)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeModal}
                className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d9ccb8] bg-white/90 text-[#5d4f42] shadow-sm transition hover:bg-white"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
                <div className="relative aspect-[2/3] md:aspect-auto md:min-h-[620px]">
                  <Image
                    src={activeItem.src}
                    alt={activeItem.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>

                <div className="space-y-5 p-6 md:p-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a68553]">
                    {activeItem.subtitle}
                  </p>
                  <h2 className="font-serif text-[clamp(2rem,4vw,3.2rem)] leading-tight text-[#3f342d]">
                    {activeItem.title}
                  </h2>

                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#705f4e]">
                    <span className="rounded-full border border-[#dfd2bb] bg-white/80 px-2.5 py-1">
                      Era: {activeItem.era}
                    </span>
                    <span className="rounded-full border border-[#dfd2bb] bg-white/80 px-2.5 py-1">
                      Palette: {activeItem.palette}
                    </span>
                  </div>

                  <p className="max-w-xl text-base leading-relaxed text-[#6f6358] md:text-lg">
                    {activeItem.summary}
                  </p>

                  <p className="text-sm text-[#7b6e61]">
                    Tips: use left/right arrow keys to browse covers quickly.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d9ccb8] bg-white/90 text-[#5d4f42] shadow-sm transition hover:bg-white"
                aria-label="Previous cover"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d9ccb8] bg-white/90 text-[#5d4f42] shadow-sm transition hover:bg-white"
                aria-label="Next cover"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
