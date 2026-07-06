"use client";

import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";

type ShowcaseItem = {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  type: "photo" | "video";
};

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    items: ShowcaseItem[];
    previousLabel: string;
    nextLabel: string;
    photoLabel: string;
    videoLabel: string;
    interactionHint: string;
  };
};

export function StatsStrip({ copy }: Props) {
  return (
    <section
      data-archive-landing
      className="relative overflow-hidden border-t border-cream-50/10 bg-ink-900 py-[clamp(5rem,8vw,8rem)] text-cream-50"
    >
      <Container size="md" className="relative">
        <Reveal>
          <div className="mb-12 md:mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-300">
              {copy.eyebrow}
            </p>
            <h2 className="mt-5 max-w-xl font-serif text-[clamp(2.5rem,4vw,4rem)] font-light leading-[1.05] tracking-normal text-cream-50">
              {copy.title}
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="border-t border-cream-50/14">
            {copy.items.map((item, index) => {
              const itemTypeLabel =
                item.type === "video" ? copy.videoLabel : copy.photoLabel;

              return (
                <div
                  key={`${item.title}-${index}`}
                  className="group relative grid w-full grid-cols-[2.4rem_minmax(0,1fr)] items-start gap-4 border-b border-cream-50/12 py-6 text-left last:border-b-0 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(8rem,auto)] md:py-8"
                >
                  <span className="pt-2 text-xs font-bold tracking-[0.18em] text-cream-50/30 transition-colors duration-300 group-hover:text-brand-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  
                  <span className="min-w-0">
                    <span className="block break-words font-serif text-3xl leading-tight tracking-normal text-cream-50 transition-colors duration-300 md:text-5xl">
                      {item.title}
                    </span>
                    <span className="mt-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-cream-50/50 transition-colors duration-300 group-hover:text-cream-50/80 md:mt-4 md:text-xs">
                      {item.subtitle}
                    </span>
                  </span>
                  
                  <span className="hidden pt-3 text-right text-[11px] font-bold uppercase tracking-[0.2em] text-cream-50/30 transition-colors duration-300 group-hover:text-brand-300 sm:block md:text-xs">
                    {itemTypeLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
