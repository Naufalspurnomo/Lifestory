"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BookOpenText } from "lucide-react";
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

export function HomeHero({ status, isLoggedIn, firstName, copy, primaryCtaHref, secondaryCtaHref }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { shouldReduceScrollMotion } = useMotionGuard();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Subtle parallax for the portrait image
  const imageY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceScrollMotion ? 0 : 80]);

  return (
    <section
      ref={ref}
      className="relative w-full min-h-[100svh] overflow-hidden bg-cream-50 lg:h-[calc(100svh-78px)] lg:min-h-[640px] lg:max-h-[760px]"
    >
      
      {/* 1. PAPER TEXTURE */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-grain bg-[length:24px_24px] opacity-15" />

      {/* 2. BACKGROUND IMAGE WITH GRADIENT FADE */}
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

        {/* DESKTOP IMAGE (Right Half) */}
        <div className="hidden lg:flex absolute inset-0 justify-end overflow-hidden">
          <div className="relative w-[65%] h-full">
            <motion.div style={{ y: imageY }} className="absolute -inset-y-12 inset-x-0">
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
            <div className="absolute inset-0 bg-gradient-to-r from-cream-50 via-cream-50/10 to-transparent" />
          </div>
        </div>
      </div>

      <div className="relative z-20 mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col px-6 pt-[45svh] pb-12 md:px-12 lg:h-full lg:min-h-0 lg:flex-row lg:items-center lg:justify-start lg:px-20 lg:pt-8 lg:pb-10 xl:px-24 xl:pt-10 xl:pb-12">
        
        {/* 3. LEFT: ASYMMETRICAL TYPOGRAPHY */}
        <div className="relative flex w-full flex-col lg:w-[60%] xl:w-[55%] shrink-0 lg:pr-16 xl:pr-24">
          
          {isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8 inline-flex self-start items-center gap-3 rounded-full border border-ink-200/60 bg-cream-100/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-600"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
              {copy.welcomeBack} · <span className="text-ink-900">{firstName}</span>
            </motion.div>
          )}

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full font-serif font-light leading-[1.04] tracking-normal text-ink-900 text-[2.25rem] sm:text-[3rem] md:text-[3.25rem] lg:text-[3.45rem] xl:text-[3.95rem] 2xl:text-[4.25rem]"
          >
            <span className="block mb-2 md:mb-3">
              {copy.headlineLine1}{" "}
              <WordRotator
                words={copy.headlineRotators}
                className="font-serif italic text-brand-700 font-light text-[2.5rem] sm:text-[3.4rem] md:text-[3.75rem] lg:text-[3.9rem] xl:text-[4.35rem] 2xl:text-[4.6rem]"
                interval={3000}
                startDelay={800}
                outerClassName="inline-block align-bottom"
              />
            </span>
            <span className="block mb-1 md:mb-2">
              {copy.headlineLine2}{" "}
              <span className="relative inline-block italic text-brand-700 font-medium whitespace-nowrap pr-[0.1em]">
                {copy.headlineAccent}
                <motion.svg
                  aria-hidden
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 lg:-bottom-2 left-0 h-[6px] lg:h-[8px] w-full text-brand-300 opacity-60"
                  initial={{ strokeDasharray: 100, strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <path d="M0,5 Q50,0 100,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </motion.svg>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            className="mt-8 flex flex-col gap-4 sm:flex-row md:mt-9 lg:mt-8"
          >
            {status === "loading" ? (
               <div className="h-14 w-full sm:w-48 animate-pulse rounded-none bg-ink-100" />
            ) : (
              <>
                <Link href={primaryCtaHref} className="w-full sm:w-auto">
                  <MagneticButton strength={0.2} distance={100} className="w-full sm:w-auto">
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
                  </MagneticButton>
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
              </>
            )}
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-10 flex w-full flex-col border-t border-ink-200/40 pt-5 lg:mt-9"
          >
            <ul className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-4">
              {[copy.badge1, copy.badge2, copy.badge3].map((label, index) => (
                <Fragment key={label}>
                  {index > 0 && <span aria-hidden className="h-4 w-px flex-none bg-ink-300/50" />}
                  <li className="text-[9px] font-bold italic uppercase tracking-[0.2em] text-ink-500">
                     {label}
                  </li>
                </Fragment>
              ))}
            </ul>
          </motion.div>
        </div>

      </div>

      {/* Scroll hint */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 2.5 }}
        className="absolute bottom-0 left-6 md:left-12 lg:left-16 hidden md:flex flex-col items-center gap-4 z-20 pb-8"
      >
        <div className="relative" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          {/* Base faded text */}
          <span className="text-[9px] font-bold tracking-[0.25em] text-ink-200/50 uppercase">
            {copy.scrollHint}
          </span>
          {/* Animated Highlight Sweep */}
          <motion.span 
            className="absolute top-0 left-0 text-[9px] font-bold tracking-[0.25em] text-brand-700 uppercase"
            animate={{ clipPath: ["inset(100% 0 0 0)", "inset(0% 0 0 0)", "inset(0 0 100% 0)"] }}
            transition={{ duration: 3, repeat: Infinity, ease: [0.65, 0, 0.35, 1], times: [0, 0.5, 1] }}
          >
            {copy.scrollHint}
          </motion.span>
        </div>
        
        <div className="h-16 w-px bg-ink-200/40 relative overflow-hidden">
          <motion.div 
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
            className="absolute inset-0 w-full h-full bg-brand-700"
          />
        </div>
      </motion.div>

    </section>
  );
}
