"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Container } from "../ui/Container";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Item = {
  number: string;
  title: string;
  body: string;
};

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    items: Item[];
  };
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function WhyNowDark({ copy }: Props) {
  const { reduced } = useMotionGuard();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-ink-900 py-[clamp(5rem,8vw,7.5rem)] text-cream-50"
    >
      {/* Subtle decorative lines — same pattern as Home PhilosophyDeaths */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-300/20 to-transparent" />
        <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-15" />
      </div>

      <Container size="xl" className="relative">
        {/* Header — asymmetric editorial layout */}
        <div className="grid gap-6 pb-14 md:pb-16 lg:grid-cols-[0.48fr_1fr] lg:items-end lg:gap-20">
          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : 12 }}
            animate={isInView || reduced ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-300/80"
          >
            <span className="h-px w-8 bg-brand-400/50" />
            {copy.eyebrow}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: reduced ? 0 : 20 }}
            animate={isInView || reduced ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, delay: reduced ? 0 : 0.1, ease: EASE }}
            className="max-w-3xl font-serif text-[clamp(2rem,4.8vw,3.75rem)] font-light leading-[1.05] tracking-normal text-cream-50"
          >
            {copy.title}
          </motion.h2>
        </div>

        {/* Items — editorial numbered rows */}
        <div className="border-t border-white/10">
          {copy.items.map((item, idx) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: reduced ? 0 : 18 }}
              animate={isInView || reduced ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.65,
                delay: reduced ? 0 : 0.2 + idx * 0.12,
                ease: EASE,
              }}
              className="grid gap-4 border-b border-white/10 py-10 md:grid-cols-[5rem_1fr_1fr] md:gap-8 md:py-12 lg:grid-cols-[6rem_0.85fr_1fr] lg:py-14"
            >
              {/* Number */}
              <span className="font-serif text-[2.5rem] font-light leading-none text-brand-400/60 md:text-[3rem]">
                {item.number}
              </span>

              {/* Title */}
              <h3 className="max-w-md font-serif text-[1.55rem] font-light leading-[1.15] text-cream-50 md:text-[1.85rem]">
                {item.title}
              </h3>

              {/* Body */}
              <p className="max-w-lg text-[15px] font-light leading-[1.75] text-cream-50/60">
                {item.body}
              </p>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}
