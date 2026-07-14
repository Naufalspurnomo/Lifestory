"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BookOpenText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Props = {
  isId: boolean;
  copy: {
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

export function HomeHero({ isId, copy, primaryCtaHref, secondaryCtaHref }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [canRunHeroScroll, setCanRunHeroScroll] = useState(false);
  const { shouldReduceScrollMotion } = useMotionGuard();
  const shouldAnimateHeroScroll = canRunHeroScroll && !shouldReduceScrollMotion;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const headlineFocus = copy.headlineRotators[0] ?? "";
  const archiveStageCopy = isId
    ? {
        label: "01 / Bahan keluarga",
        title: "Ruang keluarga berubah menjadi arsip.",
        body:
          "Foto pembuka tidak dibiarkan sendirian. Ia diberi nama, tahun, suara wawancara, dan arah visual sebelum menjadi buku serta film keluarga.",
        entries: ["Wawancara dibuka", "Album ditata", "Naskah mulai disusun"],
        caption: "Foto keluarga sebagai bahan pertama untuk naskah, galeri, dan film.",
      }
    : {
        label: "01 / Family material",
        title: "The living room becomes an archive.",
        body:
          "The opening photograph is not left as decoration. It is paired with names, years, interview notes, and a visual direction before becoming a book and family film.",
        entries: ["Interview opened", "Album organized", "Manuscript started"],
        caption: "A family photograph becomes the first material for the manuscript, gallery, and film.",
      };

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");

    function update() {
      setCanRunHeroScroll(media.matches);
    }

    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const photoFrameWidth = useTransform(scrollYProgress, [0, 0.72], [
    "65vw",
    shouldAnimateHeroScroll ? "46vw" : "65vw",
  ]);
  const photoFrameHeight = useTransform(scrollYProgress, [0, 0.72], [
    "100vh",
    shouldAnimateHeroScroll ? "60vh" : "100vh",
  ]);
  const photoFrameTop = useTransform(scrollYProgress, [0, 0.72], [
    "0vh",
    shouldAnimateHeroScroll ? "18vh" : "0vh",
  ]);
  const photoFrameRight = useTransform(scrollYProgress, [0, 0.72], [
    "0vw",
    shouldAnimateHeroScroll ? "6vw" : "0vw",
  ]);
  const photoFramePadding = useTransform(scrollYProgress, [0, 0.72], [
    "0px",
    shouldAnimateHeroScroll ? "16px" : "0px",
  ]);
  const photoFrameShadow = useTransform(scrollYProgress, [0, 0.72], [
    "0 0 0 rgba(34,24,15,0)",
    shouldAnimateHeroScroll ? "0 32px 80px rgba(34,24,15,0.22)" : "0 0 0 rgba(34,24,15,0)",
  ]);
  const imageY = useTransform(scrollYProgress, [0, 1], [0, shouldAnimateHeroScroll ? 30 : 0]);
  const imageScale = useTransform(scrollYProgress, [0, 0.72], [1, shouldAnimateHeroScroll ? 0.98 : 1]);
  const imageFadeOpacity = useTransform(scrollYProgress, [0, 0.72], [
    1,
    shouldAnimateHeroScroll ? 0.2 : 1,
  ]);
  const heroCopyOpacity = useTransform(scrollYProgress, [0, 0.26, 0.58], [
    1,
    shouldAnimateHeroScroll ? 0.75 : 1,
    shouldAnimateHeroScroll ? 0 : 1,
  ]);
  const heroCopyY = useTransform(scrollYProgress, [0, 0.58], [
    0,
    shouldAnimateHeroScroll ? -14 : 0,
  ]);
  const archiveBandOpacity = useTransform(scrollYProgress, [0.36, 0.72], [
    0,
    shouldAnimateHeroScroll ? 1 : 0,
  ]);
  const archiveStageOpacity = useTransform(scrollYProgress, [0.42, 0.72], [
    0,
    shouldAnimateHeroScroll ? 1 : 0,
  ]);
  const archiveStageY = useTransform(scrollYProgress, [0.42, 0.72], [
    shouldAnimateHeroScroll ? 24 : 0,
    0,
  ]);
  const photoCaptionOpacity = useTransform(scrollYProgress, [0.54, 0.72], [
    0,
    shouldAnimateHeroScroll ? 1 : 0,
  ]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.14], [1, 0]);

  return (
    <section
      ref={ref}
      data-hero-scroll-section
      className="relative w-full bg-cream-50 lg:h-[170svh] lg:min-h-[1080px]"
    >
      <div className="relative min-h-[100svh] w-full overflow-hidden bg-cream-50 lg:sticky lg:top-0 lg:h-[100svh] lg:min-h-[640px]">
        <motion.div
          data-hero-archive-band
          style={{ opacity: archiveBandOpacity }}
          className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden w-[48vw] bg-cream-100/[0.84] lg:block"
        />
        <motion.div
          data-hero-archive-field
          style={{ opacity: archiveBandOpacity }}
          className="pointer-events-none absolute inset-y-[8vh] right-0 z-0 hidden w-[52vw] border-l border-cream-300/[0.55] bg-cream-200/[0.38] lg:block"
        />

        {/* 1. BACKGROUND IMAGE WITH GRADIENT FADE */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* MOBILE IMAGE (Top Half) */}
          <div className="absolute top-0 inset-x-0 h-[55svh] lg:hidden">
            <Image 
              src="/image/home-cover.webp" 
              alt="Family sharing stories together" 
              fill 
              sizes="100vw" 
              className="object-cover object-top" 
              priority 
              quality={90} 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cream-50/40 to-cream-50" />
          </div>

          {/* DESKTOP IMAGE: full-bleed first, then scrolls into a photo frame */}
          <div className="hidden lg:block absolute inset-0 overflow-hidden">
            <motion.div
              data-hero-photo-frame
              style={{
                width: photoFrameWidth,
                height: photoFrameHeight,
                top: photoFrameTop,
                right: photoFrameRight,
                padding: photoFramePadding,
                boxShadow: photoFrameShadow,
              }}
              className="absolute overflow-hidden bg-cream-100"
            >
              <div className="relative h-full w-full overflow-hidden bg-cream-100">
                <motion.div
                  style={{ y: imageY, scale: imageScale }}
                  className="absolute -inset-y-12 inset-x-0"
                >
                  <Image
                    src="/image/home-cover.webp"
                    alt="Family sharing stories together"
                    fill
                    sizes="65vw"
                    className="object-cover object-[center_40%]"
                    priority
                    quality={90}
                  />
                </motion.div>
                <motion.div
                  style={{ opacity: imageFadeOpacity }}
                  className="absolute inset-0 bg-gradient-to-r from-cream-50 via-cream-50/10 to-transparent"
                />
                <motion.div
                  data-hero-photo-caption
                  style={{ opacity: photoCaptionOpacity }}
                  className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between gap-6 border-t border-cream-300/[0.6] bg-cream-100/[0.95] px-4 py-3 text-ink-700"
                >
                  <p className="max-w-[28rem] text-[0.72rem] leading-[1.55] text-ink-600">
                    {archiveStageCopy.caption}
                  </p>
                  <span className="shrink-0 font-serif text-[1.35rem] leading-none text-brand-700">
                    01
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          data-hero-archive-stage
          aria-hidden={!shouldAnimateHeroScroll}
          style={{ opacity: archiveStageOpacity, y: archiveStageY }}
          className="pointer-events-none absolute inset-0 z-10 hidden lg:block"
        >
          <div className="relative mx-auto h-full w-full max-w-[1440px] px-20 xl:px-24">
            <div className="absolute left-20 top-[22vh] max-w-[24rem] xl:left-24">
              <p className="text-[0.72rem] font-semibold uppercase text-brand-700">
                {archiveStageCopy.label}
              </p>
              <h2 className="mt-5 max-w-[22rem] font-serif text-[2.35rem] font-light leading-[1.05] text-ink-900 xl:text-[2.65rem]">
                {archiveStageCopy.title}
              </h2>
              <p className="mt-5 max-w-[22rem] text-[0.98rem] leading-[1.7] text-ink-600">
                {archiveStageCopy.body}
              </p>
              <ul className="mt-8 space-y-3 border-t border-cream-400/80 pt-5">
                {archiveStageCopy.entries.map((entry, index) => (
                  <li
                    key={entry}
                    className="grid grid-cols-[2.6rem_1fr] items-baseline gap-4 text-ink-700"
                  >
                    <span className="font-serif text-[1.15rem] text-ink-300">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[0.82rem] font-semibold uppercase text-ink-600">
                      {entry}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        <div className="relative z-20 mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col px-6 pt-[45svh] pb-12 md:px-12 lg:h-full lg:min-h-0 lg:flex-row lg:items-center lg:justify-start lg:px-20 lg:pt-8 lg:pb-10 xl:px-24 xl:pt-10 xl:pb-12">
          
          {/* 3. LEFT: ASYMMETRICAL TYPOGRAPHY */}
          <motion.div
            data-hero-copy
            style={{ opacity: heroCopyOpacity, y: heroCopyY }}
            className="relative flex w-full flex-col lg:w-[60%] xl:w-[55%] shrink-0 lg:pr-16 xl:pr-24"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full font-serif font-light leading-[1.04] tracking-normal text-ink-900 ${
                isId
                  ? "text-[2.25rem] sm:text-[3rem] md:text-[3.25rem] lg:text-[3.45rem] xl:text-[3.95rem] 2xl:text-[4.25rem]"
                  : "text-[2.1rem] sm:text-[2.75rem] md:text-[3rem] lg:text-[3.2rem] xl:text-[3.65rem] 2xl:text-[3.95rem]"
              }`}
            >
              <span className="block mb-2 md:mb-3">
                {copy.headlineLine1}{" "}
                <span
                  className={`inline-block align-bottom font-serif italic text-brand-700 font-light ${
                    isId
                      ? "text-[2.5rem] sm:text-[3.4rem] md:text-[3.75rem] lg:text-[3.9rem] xl:text-[4.35rem] 2xl:text-[4.6rem]"
                      : "text-[2.3rem] sm:text-[3.05rem] md:text-[3.35rem] lg:text-[3.55rem] xl:text-[4rem] 2xl:text-[4.25rem]"
                  }`}
                >
                  {headlineFocus}
                </span>
              </span>
              <span className="block mb-1 md:mb-2">
                {copy.headlineLine2}{" "}
                <span className="inline-block italic text-brand-700 font-medium whitespace-nowrap pr-[0.1em]">
                  {copy.headlineAccent}
                </span>
              </span>
              <span className="block">{copy.headlineLine3}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              className="mt-5 w-full max-w-[34rem] text-[1rem] leading-[1.65] text-ink-600 font-sans font-light md:mt-6 md:text-[1.08rem] lg:max-w-[32rem] xl:max-w-[34rem]"
            >
              {copy.subheading}
            </motion.p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row md:mt-9 lg:mt-8">
              <Link href={primaryCtaHref} className="w-full sm:w-auto">
                <Button
                  variant="dark"
                  size="lg"
                  block
                  iconRight={<ArrowRight className="h-4 w-4" />}
                  animateRightIcon
                  className="group relative overflow-hidden sm:w-auto !bg-brand-700 text-cream-50 hover:!bg-brand-800 transition-all duration-500 border-none px-10 py-6 rounded-none shadow-none"
                >
                  <span className="relative z-10 font-medium tracking-[0.15em] text-[11px] uppercase whitespace-nowrap">{copy.primaryCta}</span>
                </Button>
              </Link>
              <Link href={secondaryCtaHref} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  block
                  iconLeft={<BookOpenText className="h-4 w-4 text-brand-700 group-hover:text-cream-50 transition-colors" />}
                  className="group sm:w-auto !border-brand-700 bg-transparent hover:!bg-brand-700 !text-brand-700 hover:!text-cream-50 shadow-none px-10 py-6 font-medium tracking-[0.15em] text-[11px] uppercase whitespace-nowrap rounded-none transition-colors duration-500"
                >
                  {copy.secondaryCta}
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-10 flex w-full flex-col border-t border-ink-200/40 pt-5 lg:mt-9"
            >
              <ul className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-4">
                {[copy.badge1, copy.badge2, copy.badge3, copy.badge4].map((label, index) => (
                  <li key={label} className="flex items-center gap-4 text-[9px] font-bold italic uppercase tracking-[0.2em] text-ink-500">
                    {index > 0 && <span aria-hidden className="h-4 w-px flex-none bg-ink-300/50" />}
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

        </div>

        {/* Scroll hint */}
        <motion.div
          data-hero-scroll-hint
          style={{ opacity: shouldAnimateHeroScroll ? scrollHintOpacity : 1 }}
          className="absolute bottom-0 left-6 z-20 hidden flex-col items-center gap-4 pb-8 md:left-12 md:flex lg:left-16"
        >
          <div
            className="relative"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-ink-200/50">
              {copy.scrollHint}
            </span>
            <span className="hero-scroll-highlight absolute left-0 top-0 text-[9px] font-bold uppercase tracking-[0.25em] text-brand-700">
              {copy.scrollHint}
            </span>
          </div>

          <div className="relative h-16 w-px overflow-hidden bg-ink-200/40">
            <div className="hero-scroll-line absolute inset-0 h-full w-full bg-brand-700" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
