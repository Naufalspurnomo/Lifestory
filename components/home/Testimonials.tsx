"use client";

import { Quote } from "lucide-react";
import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal } from "../ui/Reveal";
import { Marquee } from "../ui/Marquee";
import { CornerFlourish } from "../ui/Ornament";

type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    items: Testimonial[];
    pressLabel: string;
    pressLogos: string[];
  };
};

export function Testimonials({ copy }: Props) {
  return (
    <section className="relative bg-cream-50 section-y-md">
      <Container>
        <Reveal className="mb-14 max-w-3xl">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-serif text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.05] tracking-[-0.02em] text-ink-800">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 md:text-lg">
            {copy.lead}
          </p>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {copy.items.map((t, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <figure className="group relative h-full overflow-hidden rounded-card-lg border border-cream-300 bg-white p-7 shadow-soft transition duration-500 ease-smooth hover:-translate-y-1 hover:shadow-elev">
                <CornerFlourish className="pointer-events-none absolute left-0 top-0" />
                <CornerFlourish className="pointer-events-none absolute bottom-0 right-0 rotate-180" />
                <Quote
                  className="absolute right-6 top-6 h-9 w-9 text-brand-200"
                  aria-hidden
                />
                <blockquote className="relative font-serif text-lg leading-relaxed text-ink-700 md:text-xl">
                  “{t.quote}”
                </blockquote>
                <figcaption className="relative mt-6 flex items-center gap-3 border-t border-cream-300 pt-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-pill bg-cream-200 text-sm font-bold text-brand-700">
                    {t.author.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-800">{t.author}</p>
                    <p className="text-xs text-ink-500">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-16">
          <p className="mb-5 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-ink-300">
            {copy.pressLabel}
          </p>
          <Marquee className="[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            {copy.pressLogos.map((logo, i) => (
              <span
                key={i}
                className="font-serif text-2xl italic text-ink-300 md:text-3xl"
              >
                {logo}
              </span>
            ))}
          </Marquee>
        </Reveal>
      </Container>
    </section>
  );
}
