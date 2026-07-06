"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";

type ShowcaseItem = {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  type: "photo" | "video";
};

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    items: ShowcaseItem[];
    previousLabel: string;
    nextLabel: string;
    photoLabel: string;
    videoLabel: string;
    interactionHint: string;
  };
};

export function StatsStrip({ copy }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = copy.items.length;

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      setActiveIndex(((index % total) + total) % total);
    },
    [total]
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  const activeItem = copy.items[activeIndex];
  if (!activeItem) return null;

  const activeTypeLabel =
    activeItem.type === "video" ? copy.videoLabel : copy.photoLabel;

  return (
    <section
      data-archive-landing
      className="relative overflow-hidden border-y border-cream-50/14 bg-ink-900 py-[clamp(4rem,7vw,7rem)] text-cream-50"
    >
      <Container size="xl" className="relative">
        <Reveal>
          <div className="flex flex-col gap-6 border-b border-cream-50/14 pb-6 sm:gap-8 sm:pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
                <span className="h-px w-10 bg-brand-400" />
                {copy.eyebrow}
              </div>
              <h2 className="mt-5 max-w-[16ch] font-serif text-[clamp(2rem,3.4vw,3.5rem)] font-light leading-[1.07] tracking-normal text-cream-50 sm:mt-6">
                {copy.title}
              </h2>
              <p className="mt-4 max-w-lg text-sm font-light leading-[1.7] text-cream-50/55 sm:mt-5 sm:text-[0.95rem]">
                {copy.interactionHint}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={goPrev}
                aria-label={copy.previousLabel}
                className="inline-flex h-10 w-10 items-center justify-center border border-cream-50/18 text-cream-50/60 transition duration-300 hover:border-brand-300 hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={copy.nextLabel}
                className="inline-flex h-10 w-10 items-center justify-center border border-cream-50/18 text-cream-50/60 transition duration-300 hover:border-brand-300 hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cream-50/35">
                <span className="font-serif text-base tracking-normal text-brand-300 sm:text-lg">
                  {String(activeIndex + 1).padStart(2, "0")}
                </span>
                <span className="mx-2 text-cream-50/20">/</span>
                {String(total).padStart(2, "0")}
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid grid-cols-[minmax(5.75rem,6.75rem)_minmax(0,1fr)] items-start gap-4 sm:mt-8 sm:grid-cols-[minmax(7.5rem,9.5rem)_minmax(0,1fr)] sm:gap-6 md:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)] md:gap-8 lg:mt-10 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] lg:gap-[clamp(2rem,4vw,4.5rem)]">
          <Reveal variant="image" delay={0.06} duration={0.65}>
            <div
              data-archive-feature
              className="lg:sticky lg:top-28 xl:top-32"
            >
              <div className="relative border border-cream-50/16 bg-ink-800">
                <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[3/4] lg:aspect-[4/5] lg:max-h-[min(52vh,26rem)]">
                  {copy.items.map((item, index) => (
                    <Image
                      key={item.src}
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 640px) 27vw, (max-width: 1024px) 22vw, 18vw"
                      priority={index === 0}
                      className={`object-cover transition-opacity duration-700 ease-smooth ${
                        index === activeIndex ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-cream-50/14 px-3 py-2.5 sm:px-4 sm:py-3">
                  <span className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-cream-50/45 sm:text-[10px] sm:tracking-[0.2em]">
                    {activeTypeLabel}
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 font-serif text-lg leading-none text-brand-300 sm:text-[1.35rem]"
                  >
                    {String(activeIndex + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>

              <div className="mt-3 hidden sm:block lg:mt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
                  {activeTypeLabel}
                </p>
                <p className="mt-2 break-words font-serif text-lg leading-[1.08] text-cream-50 lg:text-xl">
                  {activeItem.title}
                </p>
                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cream-50/45">
                  {activeItem.subtitle}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div data-archive-proof className="min-w-0 border-t border-cream-50/14 sm:border-t-0">
              {copy.items.map((item, index) => {
                const isActive = index === activeIndex;
                const itemTypeLabel =
                  item.type === "video" ? copy.videoLabel : copy.photoLabel;

                return (
                  <button
                    key={`${item.title}-${index}`}
                    type="button"
                    data-archive-record
                    aria-pressed={isActive}
                    onClick={() => goTo(index)}
                    className={`group grid w-full grid-cols-[2.2rem_minmax(0,1fr)] items-start gap-3 border-b border-cream-50/12 py-4 text-left transition duration-300 last:border-b-0 sm:grid-cols-[2.6rem_minmax(0,1fr)_minmax(6.5rem,auto)] sm:gap-4 sm:py-5 md:grid-cols-[3rem_minmax(0,1fr)_minmax(8rem,auto)] md:py-6 lg:py-7 ${
                      isActive ? "bg-cream-50/[0.035]" : "hover:bg-cream-50/[0.02]"
                    }`}
                  >
                    <span
                      className={`pt-0.5 font-serif text-lg italic tracking-normal transition-colors duration-300 sm:text-xl md:text-2xl ${
                        isActive
                          ? "text-brand-300"
                          : "text-cream-50/25 group-hover:text-cream-50/45"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="min-w-0">
                      <span
                        className={`block break-words font-serif leading-[1.08] tracking-normal transition-colors duration-300 ${
                          isActive
                            ? "text-[clamp(1.2rem,2.2vw,2.35rem)] text-cream-50"
                            : "text-[clamp(1.05rem,1.8vw,1.85rem)] text-cream-50/78 group-hover:text-cream-50"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span
                        className={`mt-2 block text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-300 sm:mt-2.5 sm:text-[11px] md:text-xs ${
                          isActive
                            ? "text-cream-50/65"
                            : "text-cream-50/38 group-hover:text-cream-50/55"
                        }`}
                      >
                        {item.subtitle}
                      </span>
                    </span>

                    <span
                      className={`hidden pt-1 text-right text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-300 sm:block sm:text-[11px] md:text-xs ${
                        isActive
                          ? "text-brand-300"
                          : "text-cream-50/28 group-hover:text-cream-50/45"
                      }`}
                    >
                      {itemTypeLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}