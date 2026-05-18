"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Quote } from "lucide-react";
import { Container } from "../ui/Container";
import { GoldRule } from "../ui/Ornament";

type Props = {
  quote: string;
  attribution: string;
  eyebrow: string;
};

/**
 * PullQuote — full-width dramatic statement.
 * Used to break monotony between text-heavy sections (Von Restorff effect).
 */
export function PullQuote({ quote, attribution, eyebrow }: Props) {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden bg-cream-50 section-y-md">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-brand-200/25 blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-accent-100/30 blur-3xl" />
      </div>

      <Container size="md">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduce ? 0.01 : 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-center"
        >
          <Quote
            aria-hidden
            className="mx-auto h-10 w-10 text-brand-300 md:h-14 md:w-14"
          />
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700">
            {eyebrow}
          </p>
          <blockquote className="mt-7 font-serif text-[clamp(1.65rem,4.4vw,3.4rem)] leading-[1.18] tracking-[-0.015em] text-ink-800">
            “{quote}”
          </blockquote>
          <div className="mx-auto mt-9 flex flex-col items-center gap-3">
            <GoldRule width="w-20" />
            <cite className="not-italic text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
              {attribution}
            </cite>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
