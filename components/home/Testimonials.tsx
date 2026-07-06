"use client";

import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";

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
    <section className="relative overflow-visible border-y border-cream-300 bg-cream-100 py-[clamp(5rem,8vw,8rem)]">
      <Container size="xl">
        <div className="relative flex flex-col items-start gap-14 lg:flex-row lg:gap-24">
          <div className="z-10 w-full shrink-0 lg:sticky lg:top-32 lg:w-[31%]">
            <Reveal>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                <span className="h-px w-10 bg-brand-500" />
                {copy.eyebrow}
              </div>
              <h2 className="mt-7 max-w-[11ch] font-serif text-[clamp(2.25rem,3.8vw,3.65rem)] font-light leading-[1.07] tracking-normal text-ink-900">
                {copy.title}
              </h2>
              <p className="mt-6 max-w-sm text-base font-light leading-[1.75] text-ink-600 md:text-lg">
                {copy.lead}
              </p>
            </Reveal>
          </div>

          <div
            data-voice-folio
            className="relative w-full overflow-visible lg:w-[69%]"
          >
            <div
              aria-hidden
              className="absolute left-0 top-2 hidden h-[calc(100%-1rem)] w-px bg-ink-900/15 sm:block"
            />
            {copy.items.map((testimonial, index) => (
              <article
                key={testimonial.author}
                data-voice-entry
                className={`relative grid gap-5 border-t border-ink-900/15 pt-7 sm:grid-cols-[4.5rem_1fr] sm:gap-8 sm:border-t-0 sm:pl-8 ${
                  index === 0
                    ? "pb-12 sm:pb-16 lg:pb-20"
                    : "pb-10 sm:ml-10 sm:pb-12 lg:ml-[clamp(2rem,5vw,5.5rem)]"
                }`}
              >
                <div className="flex items-start gap-4 sm:block">
                  <span
                    aria-hidden
                    className={`mt-1 block h-2 w-2 shrink-0 rounded-full ${
                      index === 0 ? "bg-brand-700" : "bg-ink-900/25"
                    } sm:absolute sm:left-[-3px] sm:top-8`}
                  />
                  <div
                    className={`font-serif italic tracking-normal ${
                      index === 0
                        ? "text-4xl text-brand-700 sm:text-5xl"
                        : "text-2xl text-ink-300 sm:text-3xl"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>

                <div
                  className={`min-w-0 ${
                    index === 0 ? "max-w-4xl" : "max-w-3xl"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">
                    {testimonial.role}
                  </p>

                  <blockquote
                    className={`mt-5 font-serif font-light tracking-normal text-ink-900 ${
                      index === 0
                        ? "max-w-[26ch] text-[1.85rem] leading-[1.16] sm:text-[2.35rem] sm:leading-[1.12] lg:text-[2.8rem]"
                        : "max-w-[34ch] text-[1.35rem] leading-[1.32] sm:text-[1.55rem] lg:text-[1.75rem]"
                    }`}
                  >
                    {testimonial.quote}
                  </blockquote>

                  <footer className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-900/12 pt-4">
                    <p className="text-sm font-semibold text-ink-900">
                      {testimonial.author}
                    </p>
                    <span
                      aria-hidden
                      className="hidden h-px w-8 bg-ink-900/20 sm:block"
                    />
                    <span className="font-serif text-sm italic tracking-normal text-ink-500">
                      Lifestory
                    </span>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        </div>

        <Reveal
          delay={0.2}
          className="mt-10 border-t border-cream-300 pt-9 md:mt-16 md:pt-11 flex flex-col items-center overflow-hidden"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-500 text-center mb-8">
            {copy.pressLabel}
          </p>
          <ul className="flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {copy.pressLogos.map((city) => (
              <li
                key={city}
                className="font-serif text-2xl italic tracking-normal text-ink-600 md:text-3xl"
              >
                {city}
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
