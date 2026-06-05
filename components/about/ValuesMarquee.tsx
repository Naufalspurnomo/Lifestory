"use client";

import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { Marquee } from "../ui/Marquee";
import { Reveal } from "../ui/Reveal";

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    fromForLabel: string;
    fromForPoints: string[];
  };
};

/**
 * ValuesMarquee — visual movement section.
 * Top: marquee of "From and For" tags.
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

    </section>
  );
}
