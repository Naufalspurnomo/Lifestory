"use client";

import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { Marquee } from "../ui/Marquee";
import { Reveal } from "../ui/Reveal";
import { Stat } from "../ui/Stat";

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    fromForLabel: string;
    fromForPoints: string[];
    stats: Array<{
      value: number;
      suffix?: string;
      label: string;
    }>;
  };
};

/**
 * ValuesMarquee — visual movement section.
 * Top: marquee of "From and For" tags.
 * Bottom: 4-stat strip in cream.
 */
export function ValuesMarquee({ copy }: Props) {
  return (
    <section className="relative bg-cream-100 section-y-sm">
      <Container size="xl">
        <Reveal className="mb-10 max-w-2xl">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-serif text-[clamp(1.65rem,3.8vw,2.6rem)] leading-[1.1] tracking-[-0.02em] text-ink-800">
            {copy.title}
          </h2>
        </Reveal>
      </Container>

      {/* Marquee FULL-WIDTH */}
      <div className="relative">
        <Reveal>
          <Marquee className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            {copy.fromForPoints.map((pt, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-3 font-serif text-2xl italic text-ink-300 md:text-3xl lg:text-4xl"
              >
                {pt}
                <span aria-hidden className="text-brand-400">
                  ✦
                </span>
              </span>
            ))}
          </Marquee>
        </Reveal>
      </div>

      <Container>
        <Reveal delay={0.15}>
          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-cream-300 pt-10 md:grid-cols-4 md:gap-x-10">
            {copy.stats.map((s) => (
              <Stat
                key={s.label}
                value={s.value}
                suffix={s.suffix}
                label={s.label}
              />
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
