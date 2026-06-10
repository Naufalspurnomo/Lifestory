"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Container } from "../ui/Container";

type PhilosophyBeat = {
  kicker: string;
  title: string;
  body: string;
};

type Props = {
  copy: {
    quote: string;
    attribution?: string;
    intro?: string;
    beats?: PhilosophyBeat[];
    closing?: string;
    highlight?: string;
    quoteLines?: string[];
  };
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function buildQuoteLines(copy: Props["copy"]) {
  if (copy.quoteLines?.length) {
    return copy.quoteLines;
  }

  if (copy.intro && copy.beats?.length && copy.closing) {
    return [
      copy.intro,
      copy.beats.map((beat) => beat.title.toLowerCase()).join(", "),
      copy.closing,
    ];
  }

  return [copy.quote];
}

function HighlightedText({
  text,
  highlight,
  active,
  reduced,
}: {
  text: string;
  highlight?: string;
  active: boolean;
  reduced: boolean;
}) {
  if (!highlight) {
    return <>{text}</>;
  }

  const matchIndex = text.toLowerCase().indexOf(highlight.toLowerCase());

  if (matchIndex === -1) {
    return <>{text}</>;
  }

  const before = text.slice(0, matchIndex);
  const marked = text.slice(matchIndex, matchIndex + highlight.length);
  const after = text.slice(matchIndex + highlight.length);

  return (
    <>
      {before}
      <span className="relative inline-block text-brand-200">
        {marked}
        <motion.span
          aria-hidden
          className="absolute inset-x-0 bottom-1 h-px origin-left bg-brand-300"
          initial={{ scaleX: reduced ? 1 : 0 }}
          animate={active || reduced ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.85, delay: 1.05, ease: EASE }}
        />
      </span>
      {after}
    </>
  );
}

export function PhilosophyDeaths({ copy }: Props) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.42 });
  const reduced = Boolean(useReducedMotion());
  const lines = buildQuoteLines(copy);
  const spokenQuote = lines.join(" ");

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-ink-900 py-[clamp(4.75rem,7vw,6.75rem)] text-cream-50"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-300/20 to-transparent" />
        <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-15" />
      </div>

      <Container size="lg" className="relative">
        <motion.figure
          className="mx-auto max-w-5xl text-center"
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={isInView || reduced ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: EASE }}
        >
          <motion.span
            aria-hidden
            className="mx-auto block font-serif text-[clamp(3rem,7vw,5.2rem)] leading-none text-brand-300/25"
            initial={reduced ? { opacity: 0.25 } : { opacity: 0, y: 14 }}
            animate={isInView || reduced ? { opacity: 0.25, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE }}
          >
            &ldquo;
          </motion.span>

          <blockquote className="-mt-5">
            <span className="sr-only">{spokenQuote}</span>

            <div
              aria-hidden
              className="space-y-3 font-serif text-lg font-medium leading-[1.55] tracking-normal text-cream-50 md:space-y-3 md:text-[1.32rem]"
            >
              {lines.map((line, index) => (
                <motion.p
                  key={`${line}-${index}`}
                  initial={
                    reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }
                  }
                  animate={isInView || reduced ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.72,
                    delay: reduced ? 0 : 0.12 + index * 0.2,
                    ease: EASE,
                  }}
                >
                  <HighlightedText
                    text={line}
                    highlight={copy.highlight}
                    active={isInView}
                    reduced={reduced}
                  />
                </motion.p>
              ))}
            </div>
          </blockquote>

          <motion.div
            aria-hidden
            className="mx-auto mt-8 h-px w-20 origin-center bg-gradient-to-r from-transparent via-brand-300/80 to-transparent"
            initial={{ scaleX: reduced ? 1 : 0, opacity: reduced ? 1 : 0 }}
            animate={
              isInView || reduced
                ? { scaleX: 1, opacity: 1 }
                : { scaleX: 0, opacity: 0 }
            }
            transition={{ duration: 0.85, delay: reduced ? 0 : 0.85, ease: EASE }}
          />

          {copy.attribution && (
            <motion.figcaption
              className="mt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-200/70"
              initial={reduced ? { opacity: 1 } : { opacity: 0 }}
              animate={isInView || reduced ? { opacity: 1 } : {}}
              transition={{ duration: 0.55, delay: reduced ? 0 : 1, ease: EASE }}
            >
              {copy.attribution}
            </motion.figcaption>
          )}
        </motion.figure>
      </Container>
    </section>
  );
}
