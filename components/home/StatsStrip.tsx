"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
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

const transition = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function StatsStrip({ copy }: Props) {
  const reducedMotion = useReducedMotion();
  const items = copy.items.slice(0, 6);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];

  if (!activeItem) return null;

  function selectPrevious() {
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  }

  function selectNext() {
    setActiveIndex((current) => (current + 1) % items.length);
  }

  return (
    <section className="relative overflow-hidden bg-ink-900 py-20 text-cream-50 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_14%,rgba(170,141,92,0.16),transparent_33%),linear-gradient(145deg,rgba(255,255,255,0.025),transparent_48%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/45 to-transparent" />
        <div className="absolute left-[8%] top-0 h-full w-px bg-white/[0.035]" />
        <div className="absolute right-[8%] top-0 h-full w-px bg-white/[0.035]" />
      </div>

      <Container size="xl" className="relative">
        <Reveal className="mb-12 grid gap-8 md:mb-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-300">
              <span className="h-px w-10 bg-brand-400" />
              {copy.eyebrow}
            </p>
            <h2 className="mt-6 max-w-[12ch] font-serif text-[clamp(2.8rem,5.6vw,6.25rem)] font-light leading-[0.94] tracking-[-0.025em] text-cream-50">
              {copy.title}
            </h2>
          </div>

          <div className="flex items-center gap-5 lg:pb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">
              {String(activeIndex + 1).padStart(2, "0")}
              <span className="mx-2 text-white/25">/</span>
              {String(items.length).padStart(2, "0")}
            </p>
            <div className="flex gap-2">
              <ControlButton label={copy.previousLabel} onClick={selectPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </ControlButton>
              <ControlButton label={copy.nextLabel} onClick={selectNext}>
                <ChevronRight className="h-4 w-4" />
              </ControlButton>
            </div>
          </div>
        </Reveal>

        <div
          className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.62fr)] lg:gap-14"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") selectPrevious();
            if (event.key === "ArrowRight") selectNext();
          }}
        >
          <Reveal className="min-w-0">
            <div className="group relative aspect-[4/5] overflow-hidden bg-ink-800 sm:aspect-[16/11] lg:aspect-[16/10]">
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={activeItem.src}
                  className="absolute inset-0"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.035 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.99 }}
                  transition={reducedMotion ? { duration: 0.01 } : transition}
                >
                  <Image
                    src={activeItem.src}
                    alt={activeItem.alt}
                    fill
                    priority={activeIndex === 0}
                    sizes="(max-width: 1024px) calc(100vw - 3rem), 64vw"
                    quality={82}
                    className="object-cover transition-transform duration-[1400ms] ease-smooth lg:group-hover:scale-[1.025]"
                  />
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,22,16,0.02)_18%,rgba(29,22,16,0.2)_58%,rgba(29,22,16,0.92)_100%)]" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/15" />

              <div className="absolute left-5 top-5 flex items-center gap-3 sm:left-7 sm:top-7">
                <span className="h-px w-8 bg-cream-50/70" />
                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-cream-50">
                  {activeItem.type === "video" ? copy.videoLabel : copy.photoLabel}
                </span>
              </div>

              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={activeItem.title}
                  className="absolute inset-x-0 bottom-0 p-6 sm:p-9 lg:p-11"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  transition={reducedMotion ? { duration: 0.01 } : transition}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-200">
                    {activeItem.subtitle}
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-6">
                    <h3
                      aria-live="polite"
                      className="max-w-[12ch] font-serif text-[clamp(2.5rem,5.2vw,5.8rem)] font-light leading-[0.92] tracking-[-0.025em] text-white"
                    >
                      {activeItem.title}
                    </h3>
                    <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition-colors duration-300 group-hover:border-brand-300 group-hover:bg-brand-700 sm:flex">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="flex min-w-0 flex-col justify-between">
            <div className="border-t border-white/15">
              {items.map((item, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={`${item.title}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    aria-pressed={isActive}
                    className="group relative grid w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/15 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300"
                  >
                    <span
                      className={`text-[9px] font-bold tracking-[0.18em] transition-colors duration-300 ${
                        isActive ? "text-brand-300" : "text-white/30"
                      }`}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block truncate font-serif text-xl leading-tight transition-all duration-500 md:text-2xl ${
                          isActive ? "translate-x-1 text-cream-50" : "text-white/45 group-hover:text-white/75"
                        }`}
                      >
                        {item.title}
                      </span>
                    </span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                        isActive ? "scale-100 bg-brand-300" : "scale-0 bg-white/30 group-hover:scale-100"
                      }`}
                    />
                    <motion.span
                      aria-hidden
                      className="absolute bottom-[-1px] left-0 h-px bg-brand-300"
                      animate={{ width: isActive ? "100%" : "0%" }}
                      transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </button>
                );
              })}
            </div>

            <p className="mt-8 max-w-sm text-sm font-light leading-relaxed text-white/40">
              {copy.interactionHint}
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function ControlButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-cream-50 transition-all duration-300 hover:border-brand-300 hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
    >
      {children}
    </button>
  );
}
