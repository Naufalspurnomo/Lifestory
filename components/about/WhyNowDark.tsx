"use client";

import { motion } from "framer-motion";
import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal } from "../ui/Reveal";
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

/**
 * WhyNowDark â€” dark section with big numerals.
 * Designed as a "tonal break" between cream sections (Von Restorff isolation effect).
 */
export function WhyNowDark({ copy }: Props) {
  const { reduced } = useMotionGuard();
  return (
    <section className="relative overflow-hidden bg-ink-900 text-cream-50 section-y-md">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-300/25 to-transparent" />
        <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-25" />
      </div>

      <Container>
        <Reveal className="mb-14 max-w-3xl md:mb-16">
          <Eyebrow tone="white">{copy.eyebrow}</Eyebrow>
          <h2 className="mt-5 font-serif text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.05] tracking-[-0.02em]">
            {copy.title}
          </h2>
        </Reveal>

        <div className="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-12">
          {copy.items.map((item, idx) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: reduced ? 0 : 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: reduced ? 0.01 : 0.7,
                delay: reduced ? 0 : idx * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative"
            >
              <div className="relative">
                <span
                  aria-hidden
                  className="font-serif text-[clamp(4rem,9vw,7rem)] leading-none text-brand-400/90"
                >
                  {item.number}
                </span>
                <span
                  aria-hidden
                  className="absolute left-0 top-0 font-serif text-[clamp(4rem,9vw,7rem)] leading-none text-white/0 [text-shadow:0_0_30px_rgba(130,105,60,0.5)]"
                >
                  {item.number}
                </span>
              </div>
              <span aria-hidden className="mt-4 block h-px w-12 bg-brand-400/60" />
              <h3 className="mt-5 font-serif text-2xl leading-tight text-white md:text-[26px]">
                {item.title}
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70 md:text-base">
                {item.body}
              </p>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}
