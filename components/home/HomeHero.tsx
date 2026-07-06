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
    shouldAnimateHeroScroll ? "42vw" : "65vw",
  ]);
  const photoFrameHeight = useTransform(scrollYProgress, [0, 0.72], [
    "100vh",
    shouldAnimateHeroScroll ? "58vh" : "100vh",
  ]);
  const photoFrameTop = useTransform(scrollYProgress, [0, 0.72], [
    "0vh",
    shouldAnimateHeroScroll ? "20vh" : "0vh",
  ]);
  const photoFrameRight = useTransform(scrollYProgress, [0, 0.72], [
    "0vw",
    shouldAnimateHeroScroll ? "7vw" : "0vw",
  ]);
  const photoFramePadding = useTransform(scrollYProgress, [0, 0.72], [
    "0px",
    shouldAnimateHeroScroll ? "14px" : "0px",
  ]);
  const photoFrameShadow = useTransform(scrollYProgress, [0, 0.72], [
    "0 0 0 rgba(34,24,15,0)",
    shouldAnimateHeroScroll ? "0 28px 70px rgba(34,24,15,0.24)" : "0 0 0 rgba(34,24,15,0)",
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


  return (
    <section
      ref={ref}
      data-hero-scroll-section
      className="relative w-full bg-cream-50 lg:h-[170svh] lg:min-h-[1080px]"
    >
      <div className="relative min-h-[100svh] w-full overflow-hidden bg-cream-50 lg:sticky lg:top-0 lg:h-[100svh] lg:min-h-[640px]">
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
              className="absolute overflow-hidden bg-cream-50"
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
              </div>
            </motion.div>
          </div>
        </div>

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
        <div className="absolute bottom-0 left-6 z-20 hidden flex-col items-center gap-4 pb-8 md:left-12 md:flex lg:left-16">
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
        </div>
      </div>
    </section>
  );
}
