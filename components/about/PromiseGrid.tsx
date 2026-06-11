"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Container } from "../ui/Container";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Item = {
  title: string;
  body: string;
};

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    items: Item[];
  };
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function PromiseGrid({ copy }: Props) {
  const { reduced } = useMotionGuard();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section
      ref={ref}
      className="relative bg-cream-100 py-[clamp(5rem,8vw,7.5rem)]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-20" />
      </div>

      <Container size="xl" className="relative">
        {/* Header — asymmetric split like Home HowItWorks */}
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 24 }}
          animate={isInView || reduced ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
          className="grid gap-6 pb-14 md:pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.65fr)] lg:items-end lg:gap-20"
        >
          <div>
            <p className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
              <span className="h-px w-8 bg-brand-500" />
              {copy.eyebrow}
            </p>
            <h2 className="mt-6 max-w-[16ch] font-serif text-[clamp(2.25rem,4.8vw,3.75rem)] font-light leading-[1.02] tracking-normal text-ink-900">
              {copy.title}
            </h2>
          </div>
          <p className="max-w-xl text-base font-light leading-[1.8] text-ink-600 md:text-lg lg:pb-1">
            {copy.lead}
          </p>
        </motion.div>

        {/* Items — editorial indexed rows with hover accent */}
        <div className="border-t border-cream-300">
          {copy.items.map((item, idx) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: reduced ? 0 : 16 }}
              animate={isInView || reduced ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.55,
                delay: reduced ? 0 : 0.15 + idx * 0.08,
                ease: EASE,
              }}
              className="group relative grid gap-4 border-b border-cream-300 py-8 transition-colors duration-300 md:grid-cols-[5rem_0.85fr_1fr] md:gap-8 md:py-10 lg:grid-cols-[6rem_0.9fr_1fr] lg:py-12"
            >
              {/* Hover accent bar */}
              <span
                aria-hidden
                className="absolute bottom-0 left-0 top-0 w-[3px] origin-top scale-y-0 bg-brand-500 transition-transform duration-500 ease-smooth group-hover:scale-y-100"
              />

              {/* Number */}
              <p className="font-serif text-xl text-brand-700 transition-colors duration-300 group-hover:text-brand-600">
                {String(idx + 1).padStart(2, "0")}
              </p>

              {/* Title */}
              <h3 className="max-w-md font-serif text-[1.45rem] font-light leading-[1.15] text-ink-900 md:text-[1.75rem]">
                {item.title}
              </h3>

              {/* Body */}
              <p className="max-w-xl text-[15px] font-light leading-[1.75] text-ink-600">
                {item.body}
              </p>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}
