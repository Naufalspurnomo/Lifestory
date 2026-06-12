"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
} from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  BookOpenText,
  Camera,
  Clapperboard,
  TreePine,
  UtensilsCrossed,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal } from "../ui/Reveal";
import { cn } from "../../lib/utils";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

const ICONS: LucideIcon[] = [BookOpenText, Camera, Clapperboard, TreePine, UtensilsCrossed, Palette];

const IMAGES = [
  "/image/home-deliverable-1.webp",
  "/image/home-deliverable-2.webp",
  "/image/home-deliverable-3.webp",
  "/image/home-deliverable-4.webp",
  "/image/home-deliverable-5.webp",
  "/image/home-deliverable-6.webp",
];

const AUTO_ROTATE_MS = 6000;

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    items: Array<{ title: string; body: string }>;
  };
};

export function Deliverables({ copy }: Props) {
  const { reduced, isCoarsePointer } = useMotionGuard();
  const items = copy.items.slice(0, 6);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Manual progress (0..1) drives both auto-advance and the visual ring.
  const progress = useMotionValue(0);

  // Auto-progress engine using rAF — pauses cleanly, resets on active change.
  useEffect(() => {
    if (reduced || isCoarsePointer || paused) return;
    let frame = 0;
    const start = performance.now();
    const total = AUTO_ROTATE_MS;

    function tick(now: number) {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / total);
      progress.set(p);
      if (p < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setActive((a) => (a + 1) % items.length);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reduced, isCoarsePointer, paused, items.length, progress]);

  // Reset progress whenever active changes (both auto and manual)
  useEffect(() => {
    progress.set(0);
  }, [active, progress]);

  const select = useCallback((i: number) => {
    setActive(i);
  }, []);

  const activeItem = items[active] ?? items[0];

  return (
    <section
      className="relative overflow-hidden bg-cream-100 section-y-md"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {/* Ambient color blob that morphs per active */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cream-400/70 to-transparent" />
        <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-30" />
      </div>

      <Container>
        <Reveal className="relative mb-12 max-w-3xl md:mb-16">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-serif text-[clamp(1.85rem,4.6vw,3.6rem)] leading-[1.05] tracking-[-0.02em] text-ink-800">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 md:text-lg">
            {copy.lead}
          </p>
        </Reveal>

        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-16 xl:gap-20">
          {/* ============= PREVIEW PANE ============= */}
          <Reveal className="relative">
            <div className="lg:sticky lg:top-24">
              <div className="group relative aspect-[4/5] w-full overflow-hidden bg-ink-900 shadow-[0_30px_70px_rgba(29,22,16,0.22)] lg:max-h-[calc(100svh-8rem)]">
                <AnimatePresence initial={false} mode="sync">
                  <motion.div
                    key={`img-${active}`}
                    initial={{ opacity: 0, scale: reduced ? 1 : 1.035 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: reduced ? 1 : 0.985 }}
                    transition={{ duration: reduced ? 0.01 : 0.75, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={IMAGES[active]}
                      alt={activeItem?.title ?? ""}
                      fill
                      sizes="(max-width: 1024px) calc(100vw - 3rem), 48vw"
                      className="object-cover transition-transform duration-[1600ms] ease-smooth lg:group-hover:scale-[1.025]"
                      priority={active === 0}
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(29,22,16,0.08)_0%,rgba(29,22,16,0)_42%,rgba(29,22,16,0.82)_100%)]" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />

                <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-5 sm:p-7">
                  <span className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.22em] text-cream-50">
                    <span className="h-px w-8 bg-cream-50/70" />
                    Lifestory
                  </span>
                  <span className="font-serif text-sm text-cream-50">
                    {String(active + 1).padStart(2, "0")}
                    <span className="mx-2 text-cream-50/35">/</span>
                    {String(items.length).padStart(2, "0")}
                  </span>
                </div>

                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={`caption-${active}`}
                    initial={{ opacity: 0, y: reduced ? 0 : 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduced ? 0 : -12 }}
                    transition={{ duration: reduced ? 0.01 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-x-0 bottom-0 z-20 p-6 sm:p-8 lg:p-10"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-200">
                      {String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 max-w-[12ch] font-serif text-[clamp(2rem,4.4vw,4.5rem)] font-light leading-[0.94] tracking-[-0.025em] text-white">
                      {activeItem?.title}
                    </h3>
                  </motion.div>
                </AnimatePresence>

                <motion.span
                  aria-hidden
                  className="absolute left-0 top-0 z-30 block h-[3px] w-full origin-left bg-brand-300"
                  style={{ scaleX: progress, transformOrigin: "left" }}
                  animate={{ opacity: paused || reduced || isCoarsePointer ? 0 : 0.95 }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="mt-4 grid grid-cols-6 gap-2">
                {items.map((item, i) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => select(i)}
                    onMouseEnter={() => select(i)}
                    aria-label={`Show item ${i + 1}`}
                    aria-current={i === active || undefined}
                    className={cn(
                      "group/thumb relative aspect-[4/3] overflow-hidden bg-cream-300 transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
                      i === active ? "opacity-100" : "opacity-35 hover:opacity-75"
                    )}
                  >
                    <Image
                      src={IMAGES[i]}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 16vw, 8vw"
                      className="object-cover transition-transform duration-500 lg:group-hover/thumb:scale-105"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-0 bottom-0 h-0.5 origin-left bg-brand-500 transition-transform duration-500",
                        i === active ? "scale-x-100" : "scale-x-0"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ============= LIST / SELECTOR ============= */}
          <Reveal delay={0.1}>
            <ol className="relative">
              {items.map((item, idx) => (
                <DeliverableRow
                  key={item.title}
                  index={idx}
                  total={items.length}
                  isActive={idx === active}
                  item={item}
                  Icon={ICONS[idx] ?? BookOpenText}
                  onSelect={() => select(idx)}
                  reduce={reduced}
                />
              ))}
            </ol>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
// =====================================================================
// Single deliverable row in the right-hand selector
// =====================================================================
function DeliverableRow({
  index,
  total,
  isActive,
  item,
  Icon,
  onSelect,
  reduce,
}: {
  index: number;
  total: number;
  isActive: boolean;
  item: { title: string; body: string };
  Icon: LucideIcon;
  onSelect: () => void;
  reduce: boolean;
}) {
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onSelect}
        onFocus={onSelect}
        aria-current={isActive || undefined}
        className={cn(
          "group relative block w-full border-t border-cream-300 py-6 text-left transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
          index === total - 1 && "border-b"
        )}
      >
        {/* Active top accent line */}
        <span
          aria-hidden
          className={cn(
            "absolute left-0 top-0 block h-[2px] origin-left bg-brand-gradient transition-transform duration-700 ease-smooth",
            isActive ? "w-full scale-x-100" : "w-full scale-x-0"
          )}
        />

        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-5">
          <span
            className={cn(
              "font-serif text-[clamp(2rem,3.6vw,2.8rem)] font-medium leading-none transition-colors duration-500",
              isActive ? "text-brand-700" : "text-ink-300 group-hover:text-ink-500"
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="min-w-0">
            <h3
              className={cn(
                "font-serif text-[clamp(1.35rem,2.4vw,1.85rem)] leading-tight transition-colors duration-500",
                isActive
                  ? "text-ink-800"
                  : "text-ink-500/70 group-hover:text-ink-700"
              )}
            >
              {item.title}
            </h3>

            <AnimatePresence initial={false}>
              {isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: reduce ? 0.01 : 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500 md:text-[15px]">
                    {item.body}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span
            className={cn(
              "inline-flex h-11 w-11 flex-none items-center justify-center rounded-pill border transition-all duration-500",
              isActive
                ? "border-transparent bg-brand-gradient text-white shadow-cta scale-100"
                : "border-cream-300 bg-cream-50 text-brand-700 group-hover:-translate-y-0.5 group-hover:border-brand-300 group-hover:shadow-soft"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
      </button>
    </li>
  );
}
