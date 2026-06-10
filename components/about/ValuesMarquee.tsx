"use client";

import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
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
 * ValuesMarquee - static editorial tag grid.
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

        <Reveal>
          <div className="grid gap-x-6 gap-y-4 border-y border-cream-300 py-8 sm:grid-cols-2 lg:grid-cols-3">
            {copy.fromForPoints.map((pt, i) => (
              <p
                key={i}
                className="flex items-center justify-between gap-4 font-serif text-[1.35rem] leading-tight text-ink-700 md:text-[1.65rem]"
              >
                <span>{pt}</span>
                <span aria-hidden className="h-px min-w-8 flex-1 bg-brand-300/45" />
              </p>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
