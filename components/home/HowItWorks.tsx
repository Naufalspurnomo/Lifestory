"use client";

import Image from "next/image";
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useRef, useState } from "react";
import {
  Camera,
  Feather,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { galleryItems } from "../../lib/content/galleryItems";

type Step = {
  n: string;
  icon: LucideIcon;
  title: string;
  body: string;
  image: string;
  alt: string;
};

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: Array<{ title: string; body: string }>;
  };
};

const ICONS = [Feather, Camera, HeartHandshake];

/**
 * HowItWorks — responsive storytelling section.
 *
 * Mobile / tablet (<lg): each step shows its OWN image inline above the text.
 *   No sticky, no scroll-bound transitions. Reads as a vertical magazine layout.
 *
 * Desktop (lg+): left column has a sticky image that swaps based on scroll
 *   progress; right column is the long-form story copy.
 */
export function HowItWorks({ copy }: Props) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const steps: Step[] = copy.steps.map((s, i) => ({
    n: `0${i + 1}`,
    icon: ICONS[i] ?? Feather,
    title: s.title,
    body: s.body,
    image: galleryItems[(i + 1) % galleryItems.length].src,
    alt: galleryItems[(i + 1) % galleryItems.length].alt,
  }));

  // Treat the section as 3 vertical "steps" → desktop image swaps based on progress.
  const activeIndex = useTransform(scrollYProgress, (v): number => {
    if (v < 0.33) return 0;
    if (v < 0.66) return 1;
    return 2;
  });

  return (
    <section ref={sectionRef} className="relative bg-cream-50 section-y-md">
      <Container>
        <div className="mb-12 max-w-3xl md:mb-14">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-serif text-[clamp(1.85rem,4.6vw,3.6rem)] leading-[1.05] tracking-[-0.02em] text-ink-800">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 md:text-lg">
            {copy.lead}
          </p>
        </div>

        {/* === MOBILE / TABLET layout (<lg) === */}
        <div className="space-y-12 lg:hidden">
          {steps.map((step, idx) => (
            <MobileStep key={step.n} step={step} index={idx} total={steps.length} />
          ))}
        </div>

        {/* === DESKTOP layout (lg+) === */}
        <div className="hidden gap-16 lg:grid lg:grid-cols-[1fr_1.05fr]">
          {/* LEFT — Sticky image stack */}
          <div className="relative">
            <div className="sticky top-24">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-card-lg border border-cream-300 bg-white shadow-elev">
                {steps.map((step, idx) => (
                  <StickyImage
                    key={step.n}
                    image={step.image}
                    alt={step.alt}
                    index={idx}
                    activeIndex={activeIndex}
                    reduce={reduce ?? false}
                  />
                ))}

                <div className="absolute left-5 top-5 z-30 inline-flex items-center gap-2 rounded-pill bg-white/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 shadow-soft backdrop-blur-sm">
                  <ActiveStepLabel activeIndex={activeIndex} steps={steps} />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                {steps.map((_, i) => (
                  <ProgressDot key={i} index={i} activeIndex={activeIndex} />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Steps copy */}
          <div className="space-y-28">
            {steps.map((step, idx) => (
              <DesktopStepBlock key={step.n} step={step} index={idx} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

// =============================================================
// Mobile / tablet step — image lives inline above text, no scroll trickery.
// =============================================================
function MobileStep({
  step,
  index,
  total,
}: {
  step: Step;
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.25, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const Icon = step.icon;

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: reduce ? 0 : 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: reduce ? 0.01 : 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative"
    >
      {/* Image card */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card-lg border border-cream-300 bg-white shadow-elev sm:aspect-[5/6]">
        <Image
          src={step.image}
          alt={step.alt}
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/40 via-transparent to-transparent"
        />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-pill bg-white/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-700 shadow-soft backdrop-blur-sm">
          <span>
            {step.n} · {step.title.replace(/\.$/, "")}
          </span>
        </div>
      </div>

      {/* Text block */}
      <div className="mt-6 flex gap-4">
        <span
          className={`mt-1 inline-flex h-12 w-12 flex-none items-center justify-center rounded-pill border transition-colors duration-500 ${
            inView
              ? "border-transparent bg-brand-gradient text-white shadow-cta"
              : "border-cream-300 bg-white text-brand-700 shadow-soft"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
            Step {step.n}
          </p>
          <h3 className="mt-2 font-serif text-2xl leading-tight text-ink-800 sm:text-3xl">
            {step.title}
          </h3>
          <p className="mt-3 text-base leading-relaxed text-ink-500">
            {step.body}
          </p>
        </div>
      </div>

      {index < total - 1 && (
        <span
          aria-hidden
          className="mt-10 block h-px w-20 bg-gradient-to-r from-cream-300 via-brand-300 to-transparent"
        />
      )}
    </motion.article>
  );
}

// =============================================================
// Desktop sticky-image swap helpers
// =============================================================
function StickyImage({
  image,
  alt,
  index,
  activeIndex,
  reduce,
}: {
  image: string;
  alt: string;
  index: number;
  activeIndex: MotionValue<number>;
  reduce: boolean;
}) {
  const opacity = useTransform(activeIndex, (v) =>
    Math.round(v) === index ? 1 : 0
  );
  const scale = useTransform(activeIndex, (v) =>
    Math.round(v) === index ? 1 : 1.04
  );

  return (
    <motion.div
      style={{
        opacity: reduce ? (index === 0 ? 1 : 0) : opacity,
        scale: reduce ? 1 : scale,
      }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0"
    >
      <Image
        src={image}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 0px, 40vw"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/30 via-transparent to-transparent" />
    </motion.div>
  );
}

function ActiveStepLabel({
  activeIndex,
  steps,
}: {
  activeIndex: MotionValue<number>;
  steps: Step[];
}) {
  const [cur, setCur] = useState(0);
  useMotionValueEvent(activeIndex, "change", (v) => {
    const next = Math.max(0, Math.min(steps.length - 1, Math.round(v)));
    setCur(next);
  });
  return (
    <span>
      {steps[cur].n} · {steps[cur].title}
    </span>
  );
}

function ProgressDot({
  index,
  activeIndex,
}: {
  index: number;
  activeIndex: MotionValue<number>;
}) {
  const w = useTransform(activeIndex, (v) =>
    Math.round(v) === index ? 28 : 8
  );
  const bg = useTransform(activeIndex, (v) =>
    Math.round(v) === index ? "#cc8a12" : "#dccfb3"
  );
  return (
    <motion.span
      style={{ width: w, backgroundColor: bg }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="inline-block h-2 rounded-full"
    />
  );
}

function DesktopStepBlock({ step, index }: { step: Step; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4, margin: "0px 0px -20% 0px" });
  const reduce = useReducedMotion();
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: reduce ? 0 : 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: reduce ? 0.01 : 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative pl-20"
    >
      <span
        className={`absolute left-0 top-0 inline-flex h-14 w-14 items-center justify-center rounded-pill border transition-colors duration-500 ${
          inView
            ? "border-transparent bg-brand-gradient text-white shadow-cta"
            : "border-cream-300 bg-white text-brand-700 shadow-soft"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">
        Step {step.n}
      </p>
      <h3 className="mt-2 font-serif text-3xl leading-tight text-ink-800">
        {step.title}
      </h3>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-500">
        {step.body}
      </p>
      {index < 2 && (
        <span
          aria-hidden
          className="mt-10 block h-px w-16 bg-gradient-to-r from-cream-300 via-brand-300 to-transparent"
        />
      )}
    </motion.div>
  );
}
