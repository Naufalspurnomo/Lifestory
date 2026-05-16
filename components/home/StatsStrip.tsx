"use client";

import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal } from "../ui/Reveal";
import { Stat } from "../ui/Stat";

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    stats: Array<{
      value: number;
      suffix?: string;
      prefix?: string;
      label: string;
      description?: string;
    }>;
  };
};

export function StatsStrip({ copy }: Props) {
  return (
    <section className="relative overflow-hidden bg-ink-900 text-white section-y-md">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-20" />
      </div>

      <Container>
        <div className="relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <Eyebrow tone="white">{copy.eyebrow}</Eyebrow>
            <h2 className="mt-5 font-serif text-[clamp(1.85rem,4.4vw,3.4rem)] leading-[1.05] tracking-[-0.02em]">
              {copy.title}
            </h2>
            <span aria-hidden className="mt-7 block h-px w-16 bg-brand-400" />
          </Reveal>

          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-3 md:gap-10">
            {copy.stats.map((s) => (
              <Stat
                key={s.label}
                value={s.value}
                suffix={s.suffix}
                prefix={s.prefix}
                label={s.label}
                description={s.description}
                className="text-white [&_.text-ink-800]:text-white [&_.text-ink-500]:text-white/65 [&_.text-brand-700]:text-brand-300"
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
