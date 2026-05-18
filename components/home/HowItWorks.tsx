"use client";

import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import {
  Camera,
  Feather,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";
import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { CornerFlourish } from "../ui/Ornament";
import { cn } from "../../lib/utils";

type Step = {
  n: string;
  numeral: string;
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
    steps: Array<{ title: string; body: string; image?: string; alt?: string }>;
  };
};

const ICONS = [Feather, Camera, HeartHandshake];

/**
 * HowItWorks — editorial alternating step rows.
 *
 * One layout for every device: each step has its own image, image and text
 * alternate sides at lg+ for Z-pattern reading, stacked vertical on mobile.
 *
 * No scroll-bound transitions. No sticky tricks. The visual interest comes
 * from rhythm, big serif numerals, image entrance scale, and ornament accents.
 */
export function HowItWorks({ copy }: Props) {
  const steps: Step[] = copy.steps.map((s, i) => ({
    n: `0${i + 1}`,
    numeral: String(i + 1).padStart(2, "0"),
    icon: ICONS[i] ?? Feather,
    title: s.title,
    body: s.body,
    image: s.image || "/image/home-step-" + (i + 1) + ".png",
    alt: s.alt || s.title,
  }));

  return (
    <section className="relative bg-cream-50 section-y-md">
      <Container>
        <div className="mb-16 max-w-3xl md:mb-20">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-serif text-[clamp(1.85rem,4.6vw,3.6rem)] leading-[1.05] tracking-[-0.02em] text-ink-800">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 md:text-lg">
            {copy.lead}
          </p>
        </div>

        <div className="space-y-20 md:space-y-24 lg:space-y-32">
          {steps.map((step, idx) => (
            <StepRow key={step.n} step={step} index={idx} total={steps.length} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function StepRow({
  step,
  index,
  total,
}: {
  step: Step;
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.25, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const Icon = step.icon;
  const reversed = index % 2 === 1;

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: reduce ? 0 : 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: reduce ? 0.01 : 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16",
        reversed && "lg:[&>*:first-child]:order-2"
      )}
    >
      {/* === Image column === */}
      <motion.div
        initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: reduce ? 0.01 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-card-lg border border-cream-300 bg-white shadow-elev sm:aspect-[5/6] lg:aspect-[4/5]">
          <Image
            src={step.image}
            alt={step.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/40 via-transparent to-transparent"
          />
          {/* Big floating numeral overlay */}
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-3 left-2 font-serif text-[clamp(6rem,13vw,10rem)] leading-none text-white/80 mix-blend-overlay drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] sm:-bottom-5 sm:left-4"
          >
            {step.numeral}
          </span>
          {/* Phase chip */}
          <span
            className={cn(
              "absolute left-5 top-5 inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] shadow-soft backdrop-blur-sm transition-colors duration-500",
              inView
                ? "bg-brand-gradient text-white shadow-cta"
                : "bg-white/95 text-brand-700"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            Step {step.n}
          </span>
        </div>
      </motion.div>

      {/* === Text column === */}
      <div className="relative">
        <CornerFlourish
          aria-hidden
          className="pointer-events-none absolute -left-4 -top-4 hidden lg:block"
        />
        <p
          aria-hidden
          className="font-serif text-7xl leading-none text-brand-200/80 md:text-8xl"
        >
          {step.numeral}.
        </p>
        <h3 className="mt-2 font-serif text-[clamp(1.85rem,3.4vw,2.6rem)] leading-[1.1] tracking-[-0.02em] text-ink-800">
          {step.title}
        </h3>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-500 md:text-lg">
          {step.body}
        </p>

        {/* Step indicator rail */}
        <div className="mt-7 flex items-center gap-3">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                "h-[3px] rounded-full transition-all duration-500 ease-smooth",
                i === index ? "w-10 bg-brand-gradient" : "w-3 bg-cream-300"
              )}
            />
          ))}
          <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-300">
            {step.n} / {String(total).padStart(2, "0")}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
