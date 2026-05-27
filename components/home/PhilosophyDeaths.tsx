"use client";

import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal } from "../ui/Reveal";
import { cn } from "../../lib/utils";

type DeathItem = {
  title: string;
  body: string;
  reflection: string;
};

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    items: DeathItem[];
    closing: string;
    badge: string;
  };
};

const STAGE_NUMBERS = ["01", "02", "03"] as const;

export function PhilosophyDeaths({ copy }: Props) {
  const items = copy.items.slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-cream-fade section-y-lg">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-500/20 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(31,111,98,0.07),transparent_38%,rgba(230,171,47,0.07))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(63,52,45,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(63,52,45,0.035)_1px,transparent_1px)] bg-[length:72px_72px]" />
      </div>

      <Container size="xl" className="relative">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow tone="ink">{copy.eyebrow}</Eyebrow>
            <h2 className="mt-5 max-w-xl font-serif text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.05] text-ink-800">
              {copy.title}
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-500 md:text-lg">
              {copy.lead}
            </p>

            <div
              aria-hidden
              className="mt-8 hidden overflow-hidden rounded-card border border-ink-800/10 bg-ink-800 text-cream-50 shadow-elev lg:block"
            >
              <div className="grid grid-cols-3 border-b border-white/10">
                {STAGE_NUMBERS.map((number, index) => (
                  <div
                    key={number}
                    className={cn(
                      "px-5 py-4 font-serif text-4xl leading-none",
                      index === 2
                        ? "bg-brand-400/10 text-brand-200"
                        : "text-cream-100/35"
                    )}
                  >
                    {number}
                  </div>
                ))}
              </div>
              <div className="p-5">
                <div className="h-2 overflow-hidden rounded-pill bg-white/10">
                  <div className="h-full w-full rounded-pill bg-gradient-to-r from-cream-300/30 via-brand-300/70 to-brand-400" />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <span className="h-16 rounded-card bg-white/[0.055]" />
                  <span className="h-16 rounded-card bg-white/[0.075]" />
                  <span className="h-16 rounded-card border border-brand-300/20 bg-brand-400/10" />
                </div>
              </div>
            </div>
          </Reveal>

          <div className="relative">
            <div
              aria-hidden
              className="absolute left-5 top-7 bottom-7 hidden w-px bg-gradient-to-b from-cream-400 via-brand-300 to-ink-800/30 sm:block"
            />

            <div className="space-y-4">
              {items.map((item, idx) => {
                const isLast = idx === items.length - 1;

                return (
                  <Reveal key={item.title} delay={idx * 0.05} amount={0.16}>
                    <article
                      className={cn(
                        "relative overflow-hidden rounded-card border p-5 shadow-soft sm:pl-16 md:p-7 md:pl-20",
                        isLast
                          ? "border-brand-300/70 bg-ink-800 text-cream-50 shadow-elev"
                          : "border-cream-300 bg-white text-ink-800"
                      )}
                    >
                      <span
                        className={cn(
                          "mb-4 inline-flex h-11 w-11 items-center justify-center rounded-pill border font-serif text-lg leading-none sm:absolute sm:left-0 sm:top-7 sm:-translate-x-1/2",
                          isLast
                            ? "border-brand-300/40 bg-brand-400/15 text-brand-200"
                            : "border-cream-300 bg-cream-50 text-brand-700"
                        )}
                      >
                        {STAGE_NUMBERS[idx]}
                      </span>

                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="max-w-2xl">
                          <h3
                            className={cn(
                              "font-serif text-[clamp(1.35rem,2.4vw,2rem)] font-medium leading-snug",
                              isLast ? "text-cream-50" : "text-ink-800"
                            )}
                          >
                            {item.title}
                          </h3>
                          <p
                            className={cn(
                              "mt-4 text-[15px] leading-relaxed",
                              isLast ? "text-cream-200/75" : "text-ink-500"
                            )}
                          >
                            {item.body}
                          </p>
                        </div>

                        {isLast && (
                          <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-pill border border-brand-300/25 bg-brand-400/10 px-3.5 py-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-200">
                              {copy.badge}
                            </span>
                          </span>
                        )}
                      </div>

                      <div
                        className={cn(
                          "mt-6 border-l-2 pl-4",
                          isLast ? "border-brand-300/70" : "border-cream-300"
                        )}
                      >
                        <p
                          className={cn(
                            "font-serif text-[15px] italic leading-relaxed",
                            isLast ? "text-brand-100" : "text-ink-600"
                          )}
                        >
                          &ldquo;{item.reflection}&rdquo;
                        </p>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>

        <Reveal delay={0.18} className="mt-12 md:mt-16">
          <div className="mx-auto max-w-4xl border-t border-cream-400 pt-8 text-center">
            <p className="font-serif text-[clamp(1.25rem,2.5vw,1.85rem)] font-medium leading-relaxed text-ink-800">
              {copy.closing}
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
