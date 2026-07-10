"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";
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
  const { reduced } = useMotionGuard();
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

  const activeItem = copy.items[activeIndex];
  if (!activeItem) return null;

  const activeTypeLabel =
    activeItem.type === "video" ? copy.videoLabel : copy.photoLabel;

  return (
    <section
      data-archive-landing
      className="relative overflow-hidden border-y border-cream-50/14 bg-ink-900 py-[clamp(3.75rem,7vw,7rem)] text-cream-50"
    >
      <Container size="xl" className="relative">
        <Reveal>
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.48fr)] lg:items-end lg:gap-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rotate-45 bg-brand-400"
                />
                {copy.eyebrow}
              </div>
              <h2 className="mt-5 max-w-[15ch] font-serif text-[clamp(2.35rem,4.1vw,4rem)] font-light leading-[1.03] tracking-[-0.02em] text-cream-50 sm:mt-6">
                {copy.title}
              </h2>
            </div>

            <div className="lg:pb-1">
              <p className="max-w-md text-sm font-light leading-[1.75] text-cream-50/58 sm:text-[0.95rem]">
                {copy.interactionHint}
              </p>

              <div className="mt-6 flex items-center gap-3 sm:mt-7">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label={copy.previousLabel}
                  className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream-50/18 text-cream-50/65 transition duration-300 hover:border-brand-300/70 hover:bg-cream-50/[0.04] hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                >
                  <ChevronLeft
                    className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
                    aria-hidden
                  />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label={copy.nextLabel}
                  className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-cream-50/18 text-cream-50/65 transition duration-300 hover:border-brand-300/70 hover:bg-cream-50/[0.04] hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
                >
                  <ChevronRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </button>
                <p className="ml-1 flex items-baseline text-[10px] font-bold uppercase tracking-[0.22em] text-cream-50/35">
                  <span className="font-serif text-lg font-normal tracking-normal text-brand-300">
                    {String(activeIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="mx-2 text-cream-50/20">/</span>
                  {String(total).padStart(2, "0")}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-[clamp(2.75rem,5.5vw,5.5rem)] grid items-start gap-12 lg:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.18fr)] lg:gap-[clamp(3.5rem,7vw,8rem)]">
          <Reveal variant="image" delay={0.05} duration={0.7}>
            <div
              data-archive-feature
              className="relative mx-auto w-full max-w-[27rem] lg:sticky lg:top-28 lg:mx-0"
            >
              <div className="group relative mx-auto w-[min(78vw,19rem)] sm:w-[min(60vw,22rem)] lg:w-full">
                <span
                  aria-hidden
                  className="absolute -right-[5px] bottom-2 top-2 bg-cream-200/45 shadow-[4px_8px_18px_rgba(0,0,0,0.18)] transition-colors duration-500 group-hover:bg-cream-100/65"
                />
                <div className="relative aspect-[2/3] overflow-hidden border border-cream-50/16 bg-ink-800 shadow-[0_30px_70px_rgba(0,0,0,0.38)]">
                  {copy.items.map((item, index) => {
                    const isActive = index === activeIndex;

                    return (
                      <motion.div
                        key={item.src}
                        aria-hidden={!isActive}
                        initial={false}
                        animate={{
                          opacity: isActive ? 1 : 0,
                          scale: isActive ? 1 : 0.985,
                        }}
                        transition={{
                          duration: reduced ? 0 : 0.58,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={item.src}
                          alt={isActive ? item.alt : ""}
                          fill
                          sizes="(max-width: 640px) 78vw, (max-width: 1024px) 60vw, 32vw"
                          priority={index === 0}
                          className="object-cover"
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div
                aria-live="polite"
                className="mx-auto mt-6 w-[min(78vw,19rem)] sm:w-[min(60vw,22rem)] lg:mx-0 lg:mt-7 lg:w-full"
              >
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={`${activeItem.title}-${activeIndex}`}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -5 }}
                    transition={{
                      duration: reduced ? 0 : 0.32,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5"
                  >
                    <span className="pt-0.5 font-serif text-xl italic leading-none text-brand-300">
                      {String(activeIndex + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
                        {activeTypeLabel}
                      </span>
                      <span className="mt-2 block break-words font-serif text-[clamp(1.4rem,2.2vw,2rem)] leading-[1.08] text-cream-50">
                        {activeItem.title}
                      </span>
                      <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-cream-50/42 sm:text-[11px]">
                        {activeItem.subtitle}
                      </span>
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div data-archive-proof className="min-w-0 lg:pt-3">
              <ol className="border-t border-cream-50/12">
                {copy.items.map((item, index) => {
                  const isActive = index === activeIndex;
                  const itemTypeLabel =
                    item.type === "video" ? copy.videoLabel : copy.photoLabel;

                  return (
                    <li key={`${item.title}-${index}`}>
                      <button
                        type="button"
                        data-archive-record
                        aria-pressed={isActive}
                        onClick={() => goTo(index)}
                        className={`group relative grid w-full grid-cols-[2.4rem_minmax(0,1fr)] items-start gap-3 border-b border-cream-50/12 px-1 py-5 text-left transition-colors duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-brand-300/70 sm:grid-cols-[2.8rem_minmax(0,1fr)_minmax(7.5rem,auto)] sm:gap-5 sm:px-2 sm:py-6 lg:py-8 ${
                          isActive
                            ? "bg-cream-50/[0.035]"
                            : "hover:bg-cream-50/[0.018]"
                        }`}
                      >
                        {isActive ? (
                          <motion.span
                            layoutId="archive-active-mark"
                            aria-hidden
                            transition={{
                              duration: reduced ? 0 : 0.36,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="absolute bottom-5 left-0 top-5 w-px bg-brand-300 sm:bottom-6 sm:top-6 lg:bottom-8 lg:top-8"
                          />
                        ) : null}

                        <span
                          className={`pt-0.5 font-serif text-xl italic tracking-normal transition-colors duration-300 sm:text-2xl ${
                            isActive
                              ? "text-brand-300"
                              : "text-cream-50/24 group-hover:text-cream-50/48"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span
                          className={`min-w-0 transition-transform duration-300 ${
                            isActive ? "translate-x-1" : "group-hover:translate-x-1"
                          }`}
                        >
                          <span
                            className={`block break-words font-serif leading-[1.08] tracking-[-0.01em] transition-all duration-300 ${
                              isActive
                                ? "text-[clamp(1.55rem,2.7vw,2.7rem)] text-cream-50"
                                : "text-[clamp(1.3rem,2vw,1.85rem)] text-cream-50/72 group-hover:text-cream-50"
                            }`}
                          >
                            {item.title}
                          </span>
                          <span
                            className={`mt-2.5 block text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-300 sm:text-[11px] ${
                              isActive
                                ? "text-cream-50/62"
                                : "text-cream-50/34 group-hover:text-cream-50/54"
                            }`}
                          >
                            {item.subtitle}
                          </span>
                        </span>

                        <span
                          className={`hidden pt-1 text-right text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-300 sm:block sm:text-[11px] ${
                            isActive
                              ? "text-brand-300"
                              : "text-cream-50/26 group-hover:text-cream-50/46"
                          }`}
                        >
                          {itemTypeLabel}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
