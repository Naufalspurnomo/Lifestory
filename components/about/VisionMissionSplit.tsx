"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Container } from "../ui/Container";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Props = {
  copy: {
    visionLabel: string;
    visionTitle: string;
    visionPoints: string[];
    missionLabel: string;
    missionTitle: string;
    missionPoints: string[];
  };
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * VisionMissionSplit — two facing panels. Vision dark, Mission light.
 * Sharp-edge editorial style matching Home's design language.
 */
export function VisionMissionSplit({ copy }: Props) {
  const { reduced } = useMotionGuard();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      className="relative bg-cream-50 py-[clamp(5rem,8vw,7.5rem)]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-15" />
      </div>

      <Container className="relative">
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-0">
          {/* VISION — Dark panel */}
          <motion.article
            initial={{ opacity: 0, x: reduced ? 0 : -16 }}
            animate={isInView || reduced ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, ease: EASE }}
            className="relative border border-ink-900 bg-ink-900 p-8 text-white md:p-10 lg:p-12 xl:p-14"
          >
            <div className="relative">
              <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300/70">
                <span className="h-px w-6 bg-brand-400/40" />
                {copy.visionLabel}
              </p>
              <h3 className="mt-6 max-w-md font-serif text-[clamp(1.75rem,3.2vw,2.5rem)] font-light leading-[1.1] tracking-normal">
                {copy.visionTitle}
              </h3>
              <ul className="mt-8 space-y-4">
                {copy.visionPoints.map((pt, i) => (
                  <li
                    key={pt}
                    className="flex items-start gap-4 text-[15px] font-light leading-[1.65] text-white/70"
                  >
                    <span className="mt-0.5 font-serif text-sm text-brand-400/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.article>

          {/* MISSION — Light panel */}
          <motion.article
            initial={{ opacity: 0, x: reduced ? 0 : 16 }}
            animate={isInView || reduced ? { opacity: 1, x: 0 } : {}}
            transition={{
              duration: 0.75,
              delay: reduced ? 0 : 0.1,
              ease: EASE,
            }}
            className="relative border border-cream-300 bg-cream-50 p-8 md:p-10 lg:p-12 xl:p-14"
          >
            <div className="relative">
              <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                <span className="h-px w-6 bg-brand-500" />
                {copy.missionLabel}
              </p>
              <h3 className="mt-6 max-w-md font-serif text-[clamp(1.75rem,3.2vw,2.5rem)] font-light leading-[1.1] tracking-normal text-ink-800">
                {copy.missionTitle}
              </h3>
              <ul className="mt-8 space-y-4">
                {copy.missionPoints.map((pt, i) => (
                  <li
                    key={pt}
                    className="flex items-start gap-4 text-[15px] font-light leading-[1.65] text-ink-600"
                  >
                    <span className="mt-0.5 font-serif text-sm text-brand-700/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.article>
        </div>
      </Container>
    </section>
  );
}
