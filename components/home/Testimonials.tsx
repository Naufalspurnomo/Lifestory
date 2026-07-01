"use client";

import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";
import { Marquee } from "../ui/Marquee";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

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

const paperTones = ["#fdfbf6", "#faf6ed", "#f5efe1"];

function getStackGapClass(index: number, total: number) {
  if (index >= total - 1) return "";

  return index === total - 2
    ? "mb-[5vh] sm:mb-[6vh] lg:mb-[5vh] xl:mb-[6vh]"
    : "mb-[7vh] sm:mb-[8vh] lg:mb-[7vh] xl:mb-[8vh]";
}

export function Testimonials({ copy }: Props) {
  const { isCoarsePointer } = useMotionGuard();

  return (
    <section className="relative overflow-visible border-y border-cream-300 bg-cream-100 py-[clamp(5rem,8vw,8rem)]">
      <Container size="xl">
        <div className="relative flex flex-col items-start gap-12 lg:flex-row lg:gap-24">
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
            className="isolate flex w-full flex-col gap-0 overflow-visible pb-16 sm:pb-20 lg:w-[69%] lg:pb-20"
          >
            {copy.items.map((testimonial, index) => (
              <article
                key={testimonial.author}
                className="relative overflow-visible lg:sticky"
                style={{
                  top: `calc(5rem + ${index * 0.45}rem)`,
                  zIndex: 20 + index,
                }}
              >
                <div
                  className={`relative min-h-[340px] w-full border border-brand-200/80 px-6 py-7 text-ink-900 shadow-[0_16px_34px_rgba(63,52,45,0.12)] sm:min-h-[360px] sm:px-10 sm:py-10 md:min-h-[400px] md:px-14 md:py-12 ${
                    isCoarsePointer
                      ? index < copy.items.length - 1
                        ? "mb-5"
                        : ""
                      : getStackGapClass(index, copy.items.length)
                  }`}
                  style={{
                    backgroundColor: paperTones[index % paperTones.length],
                    transform: isCoarsePointer
                      ? "none"
                      : `translateY(${index * 3}px) scale(${1 - index * 0.008})`,
                    transformOrigin: "top center",
                  }}
                >
                  <div className="flex h-full min-h-[260px] flex-col justify-between border-t border-ink-900/70 pt-7 sm:min-h-[280px] sm:pt-8 md:min-h-[305px] md:pt-10">
                    <blockquote className="max-w-[23ch] font-serif text-[1.45rem] font-light leading-[1.28] tracking-normal text-ink-900 sm:text-[1.8rem] md:text-[2.25rem]">
                      {testimonial.quote}
                    </blockquote>

                    <footer className="mt-12 flex items-end justify-between gap-6 border-t border-ink-900/15 pt-5">
                      <div>
                        <p className="text-sm font-semibold text-ink-900">
                          {testimonial.author}
                        </p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">
                          {testimonial.role}
                        </p>
                      </div>
                      <span className="font-serif text-sm italic text-ink-400">
                        Lifestory
                      </span>
                    </footer>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <Reveal delay={0.2} className="mt-16 border-t border-cream-300 pt-10 md:mt-24 md:pt-12">
          <p className="mb-7 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-ink-500">
            {copy.pressLabel}
          </p>
          <Marquee className="[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            {copy.pressLogos.map((logo, index) => (
              <span
                key={`${logo}-${index}`}
                className="px-8 font-serif text-xl italic tracking-normal text-ink-500 md:text-2xl"
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
