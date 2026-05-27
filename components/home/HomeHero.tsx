"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BookOpenText, Sparkles } from "lucide-react";
import { Fragment, useRef } from "react";
import { Button } from "../ui/Button";
import { Eyebrow } from "../ui/Eyebrow";
import { FrameCorner } from "../ui/Ornament";
import { WordRotator } from "../ui/WordRotator";
import { MagneticButton } from "../ui/MagneticButton";
import { StudioPulse } from "../ui/StudioPulse";
import { ParallaxLayer } from "../ui/ScrollAnimations";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Props = {
  status: "loading" | "authenticated" | "unauthenticated";
  isLoggedIn: boolean;
  firstName: string;
  copy: {
    welcomeBack: string;
    eyebrow: string;
    headlineLine1: string;
    headlineRotators: string[];
    headlineLine2: string;
    headlineAccent: string;
    headlineLine3: string;
    subheading: string;
    primaryCta: string;
    secondaryCta: string;
    badge1: string;
    badge2: string;
    badge3: string;
    badge4: string;
    scrollHint: string;
    studioCity: string;
    featuredLabel: string;
  };
  primaryCtaHref: string;
  secondaryCtaHref: string;
};

/**
 * Word-by-word mask reveal that PRESERVES spaces between words.
 * Each word lives in its own overflow-hidden frame; an actual whitespace
 * node sits between each frame so flow + line-wrapping work naturally.
 */
function SplitWords({
  text,
  delay = 0,
  perWord = 0.06,
}: {
  text: string;
  delay?: number;
  perWord?: number;
}) {
  const { reduced } = useMotionGuard();
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="inline-flex overflow-hidden align-bottom pb-[0.08em]">
            <motion.span
              initial={{ y: reduced ? 0 : "110%" }}
              animate={{ y: 0 }}
              transition={{
                duration: reduced ? 0.01 : 0.75,
                delay: reduced ? 0 : delay + i * perWord,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-block will-change-transform"
            >
              {word}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

export function HomeHero({
  status,
  isLoggedIn,
  firstName,
  copy,
  primaryCtaHref,
  secondaryCtaHref,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const { reduced, shouldReduceScrollMotion } = useMotionGuard();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [
    0,
    shouldReduceScrollMotion ? 0 : 80,
  ]);
  const coverY = useTransform(scrollYProgress, [0, 1], [
    0,
    shouldReduceScrollMotion ? 0 : -40,
  ]);
  const coverScale = useTransform(scrollYProgress, [0, 1], [
    1,
    shouldReduceScrollMotion ? 1 : 0.99,
  ]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-b from-cream-50 via-cream-100 to-cream-200 pt-12 pb-24 md:pt-16 md:pb-32"
    >
      {/* Decorative ornaments */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <ParallaxLayer offset={25} className="absolute -left-32 top-20 h-[420px] w-[420px]">
          <div className="h-full w-full rounded-full bg-brand-200/35 blur-3xl" />
        </ParallaxLayer>
        <ParallaxLayer offset={-20} className="absolute -right-32 top-40 h-[360px] w-[360px]">
          <div className="h-full w-full rounded-full bg-accent-100/40 blur-3xl" />
        </ParallaxLayer>
        <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-50" />
      </div>

      {/* Subtle frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-6 hidden h-[calc(100%-3rem)] rounded-[36px] border border-cream-300/50 md:block"
      />
      <FrameCorner className="pointer-events-none absolute left-10 top-10 hidden md:block" size={36} />
      <FrameCorner className="pointer-events-none absolute right-10 top-10 hidden rotate-90 md:block" size={36} />
      <FrameCorner className="pointer-events-none absolute bottom-10 left-10 hidden -rotate-90 md:block" size={36} />
      <FrameCorner className="pointer-events-none absolute bottom-10 right-10 hidden rotate-180 md:block" size={36} />

      <motion.div
        style={{ y: heroY }}
        className="relative mx-auto grid w-full min-w-0 max-w-[1320px] grid-cols-1 gap-12 px-6 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-12"
      >
        {/* LEFT — Editorial copy */}
        <div className="relative z-10 flex min-w-0 w-full max-w-[calc(100vw-3rem)] flex-col justify-center lg:max-w-none">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.5 }}
            >
              <Eyebrow icon={<Sparkles className="h-3 w-3" />}>{copy.eyebrow}</Eyebrow>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.1 }}
            >
              <StudioPulse city={copy.studioCity} />
            </motion.div>
            {isLoggedIn && (
              <motion.span
                initial={{ opacity: 0, y: reduced ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduced ? 0.01 : 0.5, delay: reduced ? 0 : 0.2 }}
                className="inline-flex items-center gap-2 rounded-pill border border-cream-300 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase leading-none tracking-[0.18em] text-ink-500"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                {copy.welcomeBack} · {firstName}
              </motion.span>
            )}
          </div>

          <h1 className="w-full max-w-full font-serif font-medium text-[clamp(2.6rem,7vw,4.8rem)] leading-[0.98] tracking-[-0.025em] text-ink-800">
            {/* Line 1: prefix + word rotator */}
            <span className="block">
              <SplitWords text={copy.headlineLine1} delay={0.05} />
              <span className="mx-2 inline-block h-[0.7em] w-[0.04em] -translate-y-[0.06em] rounded-full bg-brand-400 align-middle" />
              <WordRotator
                words={copy.headlineRotators}
                outerClassName="align-baseline"
                className="font-serif italic text-brand-600"
                interval={2400}
                startDelay={1400}
              />
            </span>
            {/* Line 2 */}
            <span className="block">
              <SplitWords text={copy.headlineLine2} delay={0.22} />
            </span>
            {/* Accent */}
            <span className="relative inline-block">
              <SplitWords text={copy.headlineAccent} delay={0.4} />
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: reduced ? 0.01 : 0.9,
                  delay: reduced ? 0 : 1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute -bottom-1 left-0 h-[6px] w-full origin-left rounded-full bg-brand-gradient"
              />
            </span>
            {/* Line 3 */}
            <span className="block">
              <SplitWords text={copy.headlineLine3} delay={0.56} />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.7, delay: reduced ? 0 : 0.85 }}
            className="mt-7 w-full max-w-xl text-base leading-relaxed text-ink-500 md:text-lg"
          >
            {copy.subheading}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.6, delay: reduced ? 0 : 1 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
          >
            {status === "loading" ? (
              <>
                <div className="h-[52px] w-full animate-pulse rounded-pill border border-cream-300 bg-white/70 sm:w-56" />
                <div className="h-[52px] w-full animate-pulse rounded-pill border border-cream-300 bg-white/70 sm:w-44" />
              </>
            ) : (
              <>
                <Link href={primaryCtaHref} className="w-full sm:w-auto">
                  <MagneticButton strength={0.32} distance={140} className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      block
                      iconRight={<ArrowRight className="h-4 w-4" />}
                      animateRightIcon
                      className="sm:w-auto"
                    >
                      {copy.primaryCta}
                    </Button>
                  </MagneticButton>
                </Link>
                <Link href={secondaryCtaHref} className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="secondary"
                    block
                    iconLeft={<BookOpenText className="h-4 w-4" />}
                    className="sm:w-auto"
                  >
                    {copy.secondaryCta}
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0.01 : 0.6, delay: reduced ? 0 : 1.2 }}
            className="mt-9 flex flex-wrap gap-2"
          >
            {[copy.badge1, copy.badge2, copy.badge3, copy.badge4].map((b) => (
              <span
                key={b}
                className="rounded-pill border border-cream-300 bg-white/70 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500 backdrop-blur-sm"
              >
                {b}
              </span>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — Warm cover visual */}
        <motion.div
          style={{ y: coverY, scale: coverScale }}
          className="relative mx-auto flex min-h-[430px] w-full max-w-[calc(100vw-3rem)] items-center justify-center sm:min-h-[560px] sm:max-w-[31rem] lg:min-h-[640px] lg:max-w-none"
        >
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-[34px] bg-brand-200/30 blur-3xl"
          />

          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 34 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{
              duration: reduced ? 0.01 : 0.9,
              delay: reduced ? 0 : 0.48,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative z-20 w-full max-w-[335px] sm:max-w-[420px] lg:max-w-[470px]"
          >
            <div
              aria-hidden
              className="absolute -left-5 top-8 hidden h-[82%] w-6 rounded-l-[24px] border border-cream-300 bg-cream-200 sm:block"
            />
            <div
              aria-hidden
              className="absolute -right-4 bottom-10 hidden h-[70%] w-4 rounded-r-[18px] border border-cream-300 bg-cream-100 sm:block"
            />

            <div className="relative rounded-[30px] border border-cream-300 bg-white/80 p-3 shadow-[0_26px_70px_rgba(63,52,45,0.18)]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-cream-200">
                <Image
                  src="/image/home-cover.webp"
                  alt="Storytime warmth in rustic serenity"
                  fill
                  sizes="(max-width: 640px) 335px, (max-width: 1024px) 420px, 470px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,240,0.06),rgba(63,52,45,0.08))]" />
                <div className="absolute inset-0 ring-1 ring-inset ring-white/45" />
              </div>

              <div className="grid grid-cols-[1fr_auto] items-end gap-5 px-2 pb-1 pt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">
                    {copy.featuredLabel}
                  </p>
                  <p className="mt-1 font-serif text-[clamp(1.35rem,4.8vw,2.05rem)] leading-[1.02] text-ink-800">
                    Storytime warmth
                  </p>
                </div>
                <motion.span
                  aria-hidden
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: reduced ? 0.01 : 0.75,
                    delay: reduced ? 0 : 1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="mb-2 hidden h-px w-16 origin-left bg-brand-400 sm:block"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0.01 : 0.6, delay: reduced ? 0 : 1.5 }}
        className="relative mx-auto mt-16 flex w-fit flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-ink-300"
      >
        <span>{copy.scrollHint}</span>
        <motion.span
          aria-hidden
          animate={reduced ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="block h-8 w-[1px] bg-gradient-to-b from-transparent via-brand-400 to-transparent"
        />
      </motion.div>
    </section>
  );
}
