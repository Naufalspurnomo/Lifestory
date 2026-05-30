"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  Film,
  Printer,
  ShieldCheck,
  TreePine,
} from "lucide-react";
import { Fragment, useRef } from "react";
import { Button } from "../ui/Button";
import { WordRotator } from "../ui/WordRotator";
import { MagneticButton } from "../ui/MagneticButton";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Props = {
  status: "loading" | "authenticated" | "unauthenticated";
  isLoggedIn: boolean;
  firstName: string;
  copy: {
    welcomeBack: string;
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
  // Image gets a subtle counter-parallax + zoom for depth as the hero exits
  const imageY = useTransform(scrollYProgress, [0, 1], [
    0,
    shouldReduceScrollMotion ? 0 : -40,
  ]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [
    1,
    shouldReduceScrollMotion ? 1 : 1.08,
  ]);
  // Scroll hint fades quickly as soon as user starts scrolling
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] overflow-hidden bg-white lg:min-h-[760px]"
    >
      {/* MOBILE — full-bleed background image */}
      <motion.div
        style={{ y: imageY, scale: imageScale }}
        className="absolute inset-0 will-change-transform md:hidden"
      >
        <Image
          src="/image/home-cover.webp"
          alt="Family sharing stories together"
          fill
          sizes="100vw"
          className="object-cover object-[35%_center]"
          priority
          quality={85}
        />
        {/* Soft warm wash so cream UI panels read clearly on top */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,253,247,0.55) 0%, rgba(255,253,247,0.35) 30%, rgba(31,22,16,0.18) 70%, rgba(31,22,16,0.32) 100%)",
          }}
        />
      </motion.div>

      {/* TABLET+ — Photo panel takes the right portion */}
      <motion.div
        style={{ y: imageY, scale: imageScale }}
        className="absolute right-0 top-0 hidden h-full will-change-transform md:block md:min-h-[640px] md:w-[55%] lg:min-h-[760px] lg:w-[70%]"
      >
        <Image
          src="/image/home-cover.webp"
          alt="Family sharing stories together"
          fill
          sizes="(max-width: 768px) 0px, (max-width: 1024px) 55vw, 70vw"
          className="object-cover object-[20%_center]"
          priority
          quality={90}
        />
      </motion.div>

      {/*
        Side gradient blend (tablet+): wide multi-layered fade from white →
        warm cream → transparent so the absolute image meets the text without
        a hard cut.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          background: `linear-gradient(
            to right,
            #ffffff 0%,
            #ffffff 35%,
            #fdfaf6 40%,
            #f8f2eb 44%,
            rgba(245,239,232,0.88) 48%,
            rgba(245,239,232,0.7) 52%,
            rgba(245,239,232,0.45) 57%,
            rgba(245,239,232,0.2) 63%,
            rgba(245,239,232,0.08) 70%,
            transparent 78%
          )`,
        }}
      />
      {/* Extra gradient layer for tablet only — stronger coverage */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden md:block lg:hidden"
        style={{
          background: `linear-gradient(
            to right,
            #ffffff 0%,
            #ffffff 42%,
            rgba(255,255,255,0.9) 50%,
            rgba(255,255,255,0.6) 58%,
            rgba(255,255,255,0.2) 68%,
            transparent 80%
          )`,
        }}
      />

      {/* Grain texture — soft on mobile so the image stays readable */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grain bg-[length:24px_24px] opacity-[0.06] md:opacity-15"
      />

      <motion.div
        style={{ y: heroY }}
        className="relative mx-auto flex w-full min-w-0 max-w-[1320px] flex-col justify-center px-4 pt-24 pb-16 sm:px-6 md:pt-32 md:pb-36 lg:h-full lg:min-h-[760px] lg:pt-32 lg:pb-32 xl:pt-36 xl:pb-36"
      >
        {/* LEFT — Editorial copy. On mobile this becomes a translucent card so the photo behind it stays visible. */}
        <div className="relative z-10 flex min-w-0 w-full max-w-full flex-col justify-center rounded-card-lg border border-white/70 bg-white/80 p-5 shadow-elev backdrop-blur-md sm:p-6 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none md:max-w-[56%] lg:max-w-[46%] xl:max-w-[43%]">
          <div className="mb-4 flex flex-wrap items-center gap-2.5 md:mb-5 md:gap-3">
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

          <h1 className="w-full max-w-full font-serif font-medium leading-[1.02] tracking-normal text-ink-800 text-[2.1rem] sm:text-[2.6rem] md:text-[2.75rem] lg:text-[3.55rem] xl:text-[4rem] 2xl:text-[4.2rem]">
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
            className="mt-4 w-full max-w-md text-[14px] leading-relaxed text-ink-700 md:mt-5 md:text-[0.94rem] md:text-ink-500"
          >
            {copy.subheading}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.6, delay: reduced ? 0 : 1 }}
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:mt-9"
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

          {/* Trust badges — 2x2 icon grid on mobile (readable + premium), pill row on tablet+ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0.01 : 0.6, delay: reduced ? 0 : 1.2 }}
            className="mt-7 md:mt-9"
          >
            {/* Mobile: structured 2x2 icon grid */}
            <ul className="grid grid-cols-2 gap-2 md:hidden">
              {[
                { icon: ShieldCheck, label: copy.badge1 },
                { icon: TreePine, label: copy.badge2 },
                { icon: Printer, label: copy.badge3 },
                { icon: Film, label: copy.badge4 },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2.5 rounded-card border border-cream-300 bg-white px-3 py-2.5 shadow-soft"
                >
                  <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-pill bg-cream-100 text-brand-700">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="text-[12px] font-semibold leading-tight text-ink-800">
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            {/* Tablet+: original pill row */}
            <div className="hidden flex-wrap gap-2 md:flex">
              {[copy.badge1, copy.badge2, copy.badge3, copy.badge4].map((b) => (
                <span
                  key={b}
                  className="rounded-pill border border-cream-300 bg-white/70 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500 backdrop-blur-sm"
                >
                  {b}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0.01 : 0.6, delay: reduced ? 0 : 1.5 }}
        style={{ opacity: shouldReduceScrollMotion ? undefined : scrollHintOpacity }}
        className="pointer-events-none absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-1.5 lg:flex"
      >
        <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-ink-400/80">
          {copy.scrollHint}
        </span>
        <motion.div
          aria-hidden
          animate={reduced ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-7 w-4 items-start justify-center rounded-full border border-ink-300/40 p-1"
        >
          <motion.span
            animate={reduced ? {} : { opacity: [1, 0.3, 1], scaleY: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="block h-1.5 w-0.5 rounded-full bg-brand-500"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
