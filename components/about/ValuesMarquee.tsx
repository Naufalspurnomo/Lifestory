"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Container } from "../ui/Container";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    fromForLabel: string;
    fromForPoints: string[];
  };
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function ValuesMarquee({ copy }: Props) {
  const { reduced, isCoarsePointer } = useMotionGuard();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section
      ref={ref}
      className="relative border-y border-cream-300 bg-cream-50 py-[clamp(5rem,8vw,7.5rem)]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-15" />
      </div>

      <Container size="xl" className="relative">
        <div className="grid gap-12 lg:grid-cols-[0.42fr_1fr] lg:gap-20">
          {/* Left — Sticky heading */}
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : isCoarsePointer ? 9 : 20 }}
            animate={isInView || reduced ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: reduced ? 0.01 : isCoarsePointer ? 0.45 : 0.7, ease: EASE }}
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <p className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
              <span className="h-px w-8 bg-brand-500" />
              {copy.eyebrow}
            </p>
            <h2 className="mt-6 max-w-sm font-serif text-[clamp(2rem,4.3vw,3.25rem)] font-light leading-[1.06] tracking-normal text-ink-900">
              {copy.title}
            </h2>
          </motion.div>

          {/* Right — Clean editorial list */}
          <div className="border-t border-cream-300 lg:border-t-0">
            {copy.fromForPoints.map((point, index) => (
              <motion.article
                key={point}
                initial={{ opacity: 0, y: reduced ? 0 : isCoarsePointer ? 7 : 14 }}
                animate={isInView || reduced ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: reduced ? 0.01 : isCoarsePointer ? 0.38 : 0.55,
                  delay: reduced ? 0 : isCoarsePointer ? 0.04 + index * 0.035 : 0.15 + index * 0.08,
                  ease: EASE,
                }}
                className="group grid grid-cols-[3.5rem_1fr] items-baseline gap-4 border-b border-cream-300 py-7 transition-colors duration-300 md:grid-cols-[4.5rem_1fr] md:py-9"
              >
                {/* Number */}
                <span className="font-serif text-lg text-brand-700/50 transition-colors duration-300 group-hover:text-brand-700">
                  {String(index + 1).padStart(2, "0")}
                </span>

                {/* Text */}
                <p className="max-w-lg font-serif text-[1.35rem] font-light leading-[1.3] text-ink-800 transition-colors duration-300 group-hover:text-ink-900 md:text-[1.55rem]">
                  {point}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
