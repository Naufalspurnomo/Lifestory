"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";
import { cn } from "../../lib/utils";

type Chapter = {
  phase: string;
  title: string;
  body: string;
  note: string;
  image: string;
  icon: LucideIcon;
};

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    chapters: Chapter[];
    previousLabel: string;
    nextLabel: string;
    interactionHint: string;
  };
};

const transition = {
  duration: 0.65,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function ProcessActs({ copy }: Props) {
  const { reduced, isCoarsePointer } = useMotionGuard();
  const chapters = copy.chapters.slice(0, 3);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeChapter = chapters[active];

  useEffect(() => {
    const tab = tabRefs.current[active];
    const list = tabListRef.current;
    if (!tab || !list) return;

    list.scrollTo({
      behavior: reduced ? "auto" : "smooth",
      left: tab.offsetLeft - (list.clientWidth - tab.clientWidth) / 2,
    });
  }, [active, reduced]);

  if (!activeChapter) return null;

  function select(index: number) {
    if (index === active) return;
    setDirection(index > active ? 1 : -1);
    setActive(index);
  }

  function previous() {
    setDirection(-1);
    setActive((current) => (current - 1 + chapters.length) % chapters.length);
  }

  function next() {
    setDirection(1);
    setActive((current) => (current + 1) % chapters.length);
  }

  return (
    <section id="process" className="relative overflow-hidden bg-cream-100 py-[clamp(5rem,8vw,8rem)]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-20" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cream-400/70 to-transparent" />
      </div>

      <Container size="xl" className="relative">
        <Reveal className="mb-12 grid gap-7 lg:mb-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.55fr)] lg:items-end lg:gap-20">
          <div>
            <p className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-700">
              <span className="h-px w-8 bg-brand-500" />
              {copy.eyebrow}
            </p>
            <h2 className="mt-6 max-w-[12ch] font-serif text-[clamp(2.8rem,5.5vw,5.8rem)] font-light leading-[0.94] tracking-[-0.025em] text-ink-900">
              {copy.title}
            </h2>
          </div>
          <p className="max-w-xl text-base font-light leading-[1.8] text-ink-600 md:text-lg lg:pb-1">
            {copy.lead}
          </p>
        </Reveal>

        <Reveal
          variant="scale"
          duration={0.75}
        >
          <div
            className="overflow-hidden border border-cream-300 bg-cream-50 shadow-[0_28px_70px_rgba(63,52,45,0.12)]"
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") previous();
              if (event.key === "ArrowRight") next();
            }}
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (touchStartX.current === null) return;
              const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
              const delta = endX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(delta) < 48) return;
              if (delta < 0) next();
              else previous();
            }}
          >
          <div
            ref={tabListRef}
            className="flex overflow-x-auto border-b border-cream-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {chapters.map((chapter, index) => {
              const Icon = chapter.icon;
              const isActive = index === active;

              return (
                <button
                  key={chapter.title}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  onClick={() => select(index)}
                  onMouseEnter={() => select(index)}
                  aria-pressed={isActive}
                  className={cn(
                    "group relative flex min-w-[74%] flex-1 items-center gap-3 px-5 py-5 text-left transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400 sm:min-w-[42%] lg:min-w-0 lg:px-7",
                    index > 0 && "border-l border-cream-300",
                    isActive ? "bg-ink-900 text-cream-50" : "bg-cream-50 text-ink-500 hover:bg-cream-100"
                  )}
                >
                  <span
                    className={cn(
                      "font-serif text-xl leading-none transition-colors duration-500",
                      isActive ? "text-brand-300" : "text-brand-700"
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9px] font-bold uppercase tracking-[0.18em] opacity-60">
                      {chapter.phase}
                    </span>
                    <span className="mt-1 hidden truncate font-serif text-base leading-tight md:block">
                      {chapter.title}
                    </span>
                  </span>
                  <Icon className="ml-auto h-4 w-4 shrink-0 opacity-55" />
                  <motion.span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-[3px] bg-brand-400"
                    animate={{ scaleX: isActive ? 1 : 0 }}
                    transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </button>
              );
            })}
          </div>

          <div className="grid lg:h-[620px] lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
            <div className="group relative h-[430px] overflow-hidden bg-ink-900 sm:h-[540px] lg:h-full">
              <AnimatePresence initial={false} custom={direction} mode="sync">
                <motion.div
                  key={activeChapter.image}
                  custom={direction}
                  className="absolute inset-0"
                  initial={
                    reduced
                      ? { opacity: 0 }
                      : { opacity: 0, x: isCoarsePointer ? 0 : direction * 38, scale: isCoarsePointer ? 1.01 : 1.025 }
                  }
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={
                    reduced
                      ? { opacity: 0 }
                      : { opacity: 0, x: isCoarsePointer ? 0 : direction * -28, scale: 0.99 }
                  }
                  transition={reduced ? { duration: 0.01 } : transition}
                >
                  <Image
                    src={activeChapter.image}
                    alt={activeChapter.title}
                    fill
                    priority={active === 0}
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover transition-transform duration-[1500ms] ease-smooth lg:group-hover:scale-[1.025]"
                  />
                </motion.div>
              </AnimatePresence>

              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(29,22,16,0.02)_20%,rgba(29,22,16,0.12)_58%,rgba(29,22,16,0.78)_100%)]" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/15" />
              <span className="absolute bottom-5 left-6 font-serif text-[clamp(5rem,12vw,10rem)] leading-none text-white/20 mix-blend-overlay sm:bottom-7 sm:left-8">
                {String(active + 1).padStart(2, "0")}
              </span>
              <p className="absolute bottom-6 right-6 text-[9px] font-bold uppercase tracking-[0.2em] text-cream-50 sm:bottom-8 sm:right-8">
                {copy.interactionHint}
              </p>
            </div>

            <div className="relative flex h-[620px] flex-col justify-between overflow-hidden bg-cream-50 px-6 py-8 sm:px-9 sm:py-10 lg:h-full lg:px-12 lg:py-12">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={activeChapter.title}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={reduced ? { duration: 0.01 } : transition}
                >
                  <div className="flex items-center justify-between gap-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                      {activeChapter.phase}
                    </p>
                    <p className="font-serif text-sm text-ink-300">
                      {String(active + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
                    </p>
                  </div>

                  <h3 className="mt-8 max-w-[12ch] font-serif text-[clamp(2.4rem,4vw,4.4rem)] font-light leading-[0.96] tracking-[-0.025em] text-ink-900">
                    {activeChapter.title}
                  </h3>
                  <p className="mt-7 max-w-xl text-base font-light leading-[1.8] text-ink-600 md:text-lg">
                    {activeChapter.body}
                  </p>

                  <div className="mt-8 border-t border-cream-300 pt-6">
                    <Quote className="h-5 w-5 text-brand-400" strokeWidth={1.5} />
                    <p className="mt-4 max-w-lg font-serif text-lg italic leading-relaxed text-ink-700 md:text-xl">
                      {activeChapter.note}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 flex items-center justify-between border-t border-cream-300 pt-6">
                <button
                  type="button"
                  onClick={previous}
                  aria-label={copy.previousLabel}
                  className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {copy.previousLabel}
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label={copy.nextLabel}
                  className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                >
                  {copy.nextLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
