"use client";

import { motion } from "framer-motion";
import { Compass, Flame } from "lucide-react";
import { Eyebrow } from "../ui/Eyebrow";
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

/**
 * VisionMissionSplit — two facing cards. Vision dark, Mission light.
 * Inspired by editorial split-spreads. Uses big serif headers, minimal body.
 */
export function VisionMissionSplit({ copy }: Props) {
  const { reduced } = useMotionGuard();
  return (
    <section className="relative bg-cream-50 section-y-md">
      <Container>
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-7">
          {/* VISION — Dark */}
          <motion.article
            initial={{ opacity: 0, x: reduced ? 0 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduced ? 0.01 : 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-card-lg border border-ink-900/40 bg-gradient-to-br from-ink-900 via-ink-800 to-brand-900 p-8 text-white shadow-deep md:p-10 lg:p-12"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-400/25 blur-3xl" />
              <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-25" />
            </div>

            <div className="relative">
              <Eyebrow tone="white" icon={<Compass className="h-3 w-3" />}>
                {copy.visionLabel}
              </Eyebrow>
              <h3 className="mt-5 font-serif text-[clamp(1.85rem,3.4vw,2.6rem)] leading-[1.1] tracking-[-0.02em]">
                {copy.visionTitle}
              </h3>
              <ul className="mt-7 space-y-3.5">
                {copy.visionPoints.map((pt, i) => (
                  <li
                    key={pt}
                    className="flex items-start gap-3 text-sm leading-relaxed text-white/80 md:text-base"
                  >
                    <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border border-brand-400/50 bg-brand-400/15 text-[10px] font-bold text-brand-300">
                      {i + 1}
                    </span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.article>

          {/* MISSION — Light */}
          <motion.article
            initial={{ opacity: 0, x: reduced ? 0 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: reduced ? 0.01 : 0.8,
              delay: reduced ? 0 : 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative overflow-hidden rounded-card-lg border border-cream-300 bg-[linear-gradient(140deg,#fff8ea_0%,#fffdf6_55%,#ffffff_100%)] p-8 shadow-elev md:p-10 lg:p-12"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-200/40 blur-3xl" />
            </div>

            <div className="relative">
              <Eyebrow icon={<Flame className="h-3 w-3" />}>
                {copy.missionLabel}
              </Eyebrow>
              <h3 className="mt-5 font-serif text-[clamp(1.85rem,3.4vw,2.6rem)] leading-[1.1] tracking-[-0.02em] text-ink-800">
                {copy.missionTitle}
              </h3>
              <ul className="mt-7 space-y-3.5">
                {copy.missionPoints.map((pt, i) => (
                  <li
                    key={pt}
                    className="flex items-start gap-3 text-sm leading-relaxed text-ink-600 md:text-base"
                  >
                    <span className="mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border border-brand-300 bg-brand-50 text-[10px] font-bold text-brand-700">
                      {i + 1}
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
