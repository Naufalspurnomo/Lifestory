"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BookOpenText, Sparkles } from "lucide-react";
import { useRef } from "react";
import { Button } from "../ui/Button";
import { Eyebrow } from "../ui/Eyebrow";
import { FrameCorner } from "../ui/Ornament";
import { galleryItems } from "../../lib/content/galleryItems";

type Props = {
  status: "loading" | "authenticated" | "unauthenticated";
  isLoggedIn: boolean;
  firstName: string;
  copy: {
    welcomeBack: string;
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
    headlineAccent: string;
    headlineLine3: string;
    subheading: string;
    primaryCta: string;
    secondaryCta: string;
    badge1: string;
    badge2: string;
    badge3: string;
    scrollHint: string;
  };
  primaryCtaHref: string;
  secondaryCtaHref: string;
};

const SplitWords = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const reduce = useReducedMotion();
  return (
    <span className="inline-block">
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-1">
          <motion.span
            initial={{ y: reduce ? 0 : "100%" }}
            animate={{ y: 0 }}
            transition={{
              duration: reduce ? 0.01 : 0.7,
              delay: reduce ? 0 : delay + i * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="inline-block pr-[0.22em]"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

export function HomeHero({
  status,
  isLoggedIn,
  firstName,
  copy,
  primaryCtaHref,
  secondaryCtaHref,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);
  const stackRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -8]);
  const stackY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-b from-cream-50 via-cream-100 to-cream-200 pt-12 pb-24 md:pt-16 md:pb-32"
    >
      {/* Decorative ornaments */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-20 h-[420px] w-[420px] rounded-full bg-brand-200/35 blur-3xl" />
        <div className="absolute -right-32 top-40 h-[360px] w-[360px] rounded-full bg-accent-100/40 blur-3xl" />
        <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-50" />
      </div>

      {/* Subtle frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-6 hidden h-[calc(100%-3rem)] rounded-[36px] border border-cream-300/50 md:block"
      />

      {/* Frame corners */}
      <FrameCorner
        className="pointer-events-none absolute left-10 top-10 hidden md:block"
        size={36}
      />
      <FrameCorner
        className="pointer-events-none absolute right-10 top-10 hidden rotate-90 md:block"
        size={36}
      />
      <FrameCorner
        className="pointer-events-none absolute bottom-10 left-10 hidden -rotate-90 md:block"
        size={36}
      />
      <FrameCorner
        className="pointer-events-none absolute bottom-10 right-10 hidden rotate-180 md:block"
        size={36}
      />

      <motion.div
        style={{ y: heroY }}
        className="relative mx-auto grid max-w-[1320px] grid-cols-1 gap-12 px-6 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-12"
      >
        {/* LEFT — Editorial copy */}
        <div className="relative z-10 flex flex-col justify-center">
          {isLoggedIn && (
            <motion.p
              initial={{ opacity: 0, y: reduce ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0.01 : 0.5 }}
              className="mb-5 inline-flex w-fit items-center gap-2 rounded-pill border border-cream-300 bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-success" />
              {copy.welcomeBack}, {firstName}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Eyebrow icon={<Sparkles className="h-3 w-3" />}>{copy.eyebrow}</Eyebrow>
          </motion.div>

          <h1 className="mt-6 font-serif font-medium text-[clamp(2.6rem,7vw,5.6rem)] leading-[0.96] tracking-[-0.025em] text-ink-800">
            <span className="block">
              <SplitWords text={copy.headlineLine1} delay={0.05} />
            </span>
            <span className="block">
              <SplitWords text={copy.headlineLine2} delay={0.18} />
            </span>
            <span className="relative inline-block">
              <SplitWords text={copy.headlineAccent} delay={0.32} />
              <motion.span
                aria-hidden
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: reduce ? 0.01 : 0.9,
                  delay: reduce ? 0 : 0.85,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute -bottom-1 left-0 h-[6px] w-full origin-left rounded-full bg-brand-gradient"
              />
            </span>
            <span className="block">
              <SplitWords text={copy.headlineLine3} delay={0.48} />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.7, delay: reduce ? 0 : 0.7 }}
            className="mt-7 max-w-xl text-base leading-relaxed text-ink-500 md:text-lg"
          >
            {copy.subheading}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.6, delay: reduce ? 0 : 0.85 }}
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
                  <Button
                    size="lg"
                    block
                    iconRight={<ArrowRight className="h-4 w-4" />}
                    animateRightIcon
                    className="sm:w-auto"
                  >
                    {copy.primaryCta}
                  </Button>
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
            transition={{ duration: 0.6, delay: 1.05 }}
            className="mt-9 flex flex-wrap gap-2"
          >
            {[copy.badge1, copy.badge2, copy.badge3].map((b) => (
              <span
                key={b}
                className="rounded-pill border border-cream-300 bg-white/70 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500 backdrop-blur-sm"
              >
                {b}
              </span>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — Stacked covers visual */}
        <motion.div
          style={{ y: stackY, rotate: stackRotate }}
          className="relative mx-auto flex h-[420px] w-full max-w-md items-center justify-center sm:h-[520px] lg:h-auto lg:max-w-none"
        >
          {/* Glow ring behind the stack */}
          <div
            aria-hidden
            className="absolute inset-x-8 inset-y-8 rounded-full bg-brand-200/40 blur-3xl"
          />

          {galleryItems.slice(0, 3).map((book, i) => {
            const offsets = [
              "left-[6%] top-[6%] -rotate-[8deg] z-10",
              "left-1/2 top-[14%] -translate-x-1/2 rotate-[1deg] z-20",
              "right-[4%] top-[10%] rotate-[7deg] z-10",
            ];
            const sizes = [
              "h-[220px] w-[150px] sm:h-[300px] sm:w-[210px] lg:h-[320px] lg:w-[220px]",
              "h-[280px] w-[200px] sm:h-[380px] sm:w-[260px] lg:h-[400px] lg:w-[270px]",
              "h-[220px] w-[150px] sm:h-[300px] sm:w-[210px] lg:h-[320px] lg:w-[220px]",
            ];
            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: reduce ? 0 : 60, rotate: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduce ? 0.01 : 0.9,
                  delay: reduce ? 0 : 0.5 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`absolute ${offsets[i]} ${sizes[i]} overflow-hidden rounded-[14px] border border-cream-400 bg-white shadow-deep`}
              >
                <Image
                  src={book.src}
                  alt={book.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 30vw"
                  className="object-cover"
                  priority={i === 1}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10" />
              </motion.div>
            );
          })}

          {/* Floating quote chip */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.7, delay: reduce ? 0 : 1.1 }}
            className="absolute -bottom-2 left-1/2 z-30 hidden max-w-[260px] -translate-x-1/2 rounded-card border border-cream-300 bg-white/95 p-4 shadow-elev backdrop-blur-sm sm:bottom-2 sm:left-2 sm:block sm:translate-x-0 lg:left-6"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-pill bg-brand-gradient text-white">
                <BookOpenText className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">
                  Featured
                </p>
                <p className="font-serif text-sm leading-tight text-ink-800">
                  {galleryItems[1].title}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="relative mx-auto mt-16 flex w-fit flex-col items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-ink-300"
      >
        <span>{copy.scrollHint}</span>
        <motion.span
          aria-hidden
          animate={
            reduce
              ? {}
              : {
                  y: [0, 8, 0],
                }
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="block h-8 w-[1px] bg-gradient-to-b from-transparent via-brand-400 to-transparent"
        />
      </motion.div>
    </section>
  );
}
