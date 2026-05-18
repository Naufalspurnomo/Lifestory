"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpenText,
  Camera,
  Clapperboard,
  TreePine,
  type LucideIcon,
} from "lucide-react";
import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal } from "../ui/Reveal";
import { TiltCard } from "../ui/TiltCard";
import { cn } from "../../lib/utils";

const ICONS: LucideIcon[] = [BookOpenText, Camera, Clapperboard, TreePine];

/* TODO: Ganti path gambar di bawah ini dengan foto khusus Deliverables section
   Taruh file di: public/image/home-deliverable-1.png, ...-2.png, ...-3.png, ...-4.png
   Urutan: 1=Buku, 2=Foto, 3=Video, 4=Pohon Silsilah */
const IMAGES = [
  "/image/home-deliverable-1.png",
  "/image/home-deliverable-2.png",
  "/image/home-deliverable-3.png",
  "/image/home-deliverable-4.png",
];

const ACCENTS = [
  // Item 0 — Book (warm amber)
  {
    bgFrom: "from-brand-200/55",
    bgVia: "via-cream-50",
    bgTo: "to-cream-100",
    glow: "rgba(228,171,47,0.45)",
    label: "Heirloom",
  },
  // Item 1 — Photo (soft teal)
  {
    bgFrom: "from-accent-100/60",
    bgVia: "via-cream-50",
    bgTo: "to-cream-100",
    glow: "rgba(31,111,98,0.30)",
    label: "Restored",
  },
  // Item 2 — Video (deep ink)
  {
    bgFrom: "from-ink-700/30",
    bgVia: "via-cream-50",
    bgTo: "to-cream-100",
    glow: "rgba(31,22,16,0.45)",
    label: "Cinematic",
  },
  // Item 3 — Tree (golden bronze)
  {
    bgFrom: "from-brand-300/55",
    bgVia: "via-cream-50",
    bgTo: "to-cream-200",
    glow: "rgba(168,116,30,0.42)",
    label: "Lineage",
  },
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
  const reduce = useReducedMotion();
  const items = copy.items.slice(0, 4);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const userInteractedRef = useRef(false);

  // Manual progress (0..1) drives both auto-advance and the visual ring.
  const progress = useMotionValue(0);
  const [progressTick, setProgressTick] = useState(0); // for re-render of ring stroke

  // Auto-progress engine using rAF — pauses cleanly, resets on active change.
  useEffect(() => {
    if (reduce || paused) return;
    let frame = 0;
    const start = performance.now();
    const total = AUTO_ROTATE_MS;

    function tick(now: number) {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / total);
      progress.set(p);
      setProgressTick(p);
      if (p < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setActive((a) => (a + 1) % items.length);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, reduce, paused, items.length, progress]);

  // Reset progress whenever active changes (both auto and manual)
  useEffect(() => {
    progress.set(0);
    setProgressTick(0);
  }, [active, progress]);

  const select = useCallback((i: number) => {
    userInteractedRef.current = true;
    setActive(i);
  }, []);

  const accent = ACCENTS[active] ?? ACCENTS[0];

  return (
    <section
      className="relative overflow-hidden bg-cream-100 section-y-md"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {/* Ambient color blob that morphs per active */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          <motion.div
            key={`amb-${active}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 1.2 }}
            className="absolute -left-32 top-1/4 h-[520px] w-[520px] rounded-full blur-[120px]"
            style={{ background: accent.glow }}
          />
        </AnimatePresence>
        <div className="absolute -right-32 bottom-0 h-[440px] w-[440px] rounded-full bg-cream-300/40 blur-3xl" />
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

        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 xl:gap-20">
          {/* ============= PREVIEW PANE ============= */}
          <Reveal className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card-lg border border-cream-300 bg-white shadow-deep">
              {/* Backdrop gradient morphs per item */}
              <AnimatePresence>
                <motion.div
                  key={`bg-${active}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0.01 : 0.7 }}
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br",
                    accent.bgFrom,
                    accent.bgVia,
                    accent.bgTo
                  )}
                />
              </AnimatePresence>

              {/* Decorative concentric rings */}
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
                <div className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
              </div>

              {/* Big floating numeral */}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-6 left-2 z-10 select-none font-serif font-medium leading-none text-white/65 mix-blend-overlay drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] sm:left-4"
                style={{ fontSize: "clamp(7rem, 18vw, 14rem)" }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`num-${active}`}
                    initial={{ opacity: 0, y: reduce ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -20 }}
                    transition={{ duration: reduce ? 0.01 : 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-block"
                  >
                    {String(active + 1).padStart(2, "0")}
                  </motion.span>
                </AnimatePresence>
              </span>

              {/* Top-right meta chip */}
              <div className="absolute right-5 top-5 z-30 flex items-center gap-2.5">
                <ProgressRing
                  active={active}
                  progress={progressTick}
                  paused={paused}
                />
                <span className="rounded-pill border border-cream-300 bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700 shadow-soft backdrop-blur-sm">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`label-${active}`}
                      initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduce ? 0 : -6 }}
                      transition={{ duration: reduce ? 0.01 : 0.35 }}
                      className="inline-block"
                    >
                      {accent.label}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </div>

              {/* Image stage */}
              <div className="absolute inset-0 flex items-center justify-center px-10 py-12 sm:px-14 lg:px-16">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`img-${active}`}
                    initial={{ opacity: 0, scale: reduce ? 1 : 1.06, y: reduce ? 0 : 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : -12 }}
                    transition={{ duration: reduce ? 0.01 : 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="relative h-full w-full max-w-[260px] sm:max-w-[300px] md:max-w-[340px]"
                  >
                    <TiltCard
                      max={10}
                      glare
                      className="relative h-full w-full"
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-[10px] border border-cream-400 bg-white shadow-deep ring-1 ring-black/5">
                        <Image
                          src={IMAGES[active]}
                          alt=""
                          fill
                          sizes="(max-width: 1024px) 70vw, 30vw"
                          className="object-cover"
                          priority={active === 0}
                        />
                        {/* Page-spread highlight to feel book-like */}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-black/15"
                        />
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10"
                        />
                      </div>
                      {/* Cast shadow underneath */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -bottom-4 left-[8%] right-[8%] h-6 rounded-[50%] bg-black/30 blur-xl"
                      />
                    </TiltCard>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Top progress hairline */}
              <span
                aria-hidden
                className="absolute left-0 top-0 z-20 block h-[3px] w-full origin-left bg-brand-gradient"
                style={{
                  transform: `scaleX(${progressTick})`,
                  transformOrigin: "left",
                  opacity: paused || reduce ? 0 : 0.95,
                  transition: "opacity 0.3s ease",
                }}
              />
            </div>

            {/* Pagination thumbs (mobile-first navigation) */}
            <div className="mt-5 flex items-center justify-center gap-3 lg:hidden">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(i)}
                  aria-label={`Show item ${i + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all duration-500 ease-smooth",
                    i === active
                      ? "w-10 bg-brand-gradient"
                      : "w-3 bg-cream-300 hover:bg-cream-400"
                  )}
                />
              ))}
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
                  reduce={reduce ?? false}
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
                : "border-cream-300 bg-white text-brand-700 group-hover:-translate-y-0.5 group-hover:border-brand-300 group-hover:shadow-soft"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
      </button>
    </li>
  );
}

// =====================================================================
// Auto-rotate progress ring (numeric badge inside)
// =====================================================================
function ProgressRing({
  active,
  progress,
  paused,
}: {
  active: number;
  progress: number;
  paused: boolean;
}) {
  const circumference = 2 * Math.PI * 15; // r=15
  const dashoffset = circumference * (1 - progress);

  return (
    <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-pill border border-cream-300 bg-white/95 shadow-soft backdrop-blur-sm">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden>
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="36" y2="36">
            <stop offset="0%" stopColor="#e6ab2f" />
            <stop offset="100%" stopColor="#cc8a12" />
          </linearGradient>
        </defs>
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="rgba(58,40,16,0.10)"
          strokeWidth="2"
        />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{
            transition: "stroke-dashoffset 80ms linear",
            opacity: paused ? 0.4 : 1,
          }}
        />
      </svg>
      <span className="relative font-serif text-[11px] font-bold leading-none text-ink-800">
        {String(active + 1).padStart(2, "0")}
      </span>
    </span>
  );
}
