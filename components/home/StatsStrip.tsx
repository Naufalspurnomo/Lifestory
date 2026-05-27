"use client";

import Image from "next/image";
import { BookOpenText, Film, Sparkles } from "lucide-react";
import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
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
  };
};

function TypeBadge({ type }: { type: ShowcaseItem["type"] }) {
  const isVideo = type === "video";
  const Icon = isVideo ? Film : BookOpenText;

  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-pill border border-white/15 bg-ink-900/55 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cream-50">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {isVideo ? "Film" : "Story"}
    </span>
  );
}

export function StatsStrip({ copy }: Props) {
  const visibleItems = copy.items.slice(0, 4);
  const [featured, ...supporting] = visibleItems;

  if (!featured) return null;

  return (
    <section className="relative overflow-hidden bg-ink-900 py-16 text-white md:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(31,111,98,0.18),rgba(29,22,16,0)_42%),linear-gradient(180deg,rgba(250,237,202,0.08),rgba(29,22,16,0)_34%)]" />
        {/* Soft top edge — eases the transition from the bright hero above */}
        <div className="absolute inset-x-0 -top-px h-24 bg-gradient-to-b from-cream-100/12 via-ink-900/0 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cream-100/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-300/30 to-transparent" />
      </div>

      <Container size="xl">
        <div className="relative">
          <div className="mb-9 grid gap-6 lg:mb-11 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end">
            <Reveal>
              <div className="max-w-3xl">
                <Eyebrow tone="white" icon={<Sparkles className="h-3 w-3" />}>
                  {copy.eyebrow}
                </Eyebrow>
                <h2 className="mt-5 font-serif text-[clamp(2rem,4.4vw,3.6rem)] leading-[1.04] text-cream-50">
                  {copy.title}
                </h2>
              </div>
            </Reveal>

            <Reveal delay={0.04} className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-1">
              {visibleItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-card border border-white/10 bg-white/[0.055] px-4 py-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-200">
                    {item.subtitle}
                  </p>
                  <p className="mt-1 truncate font-serif text-base leading-tight text-cream-50">
                    {item.title}
                  </p>
                </div>
              ))}
            </Reveal>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-5">
            <article className="relative min-h-[360px] overflow-hidden rounded-card-lg border border-white/10 bg-ink-800 shadow-[0_18px_44px_rgba(17,12,8,0.24)] sm:min-h-[430px] lg:min-h-[500px]">
              <Image
                src={featured.src}
                alt={featured.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 46vw"
                quality={76}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,22,16,0.02)_0%,rgba(29,22,16,0.26)_46%,rgba(29,22,16,0.94)_100%)]" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

              <div className="absolute left-5 top-5 sm:left-7 sm:top-7">
                <TypeBadge type={featured.type} />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-200">
                  {featured.subtitle}
                </p>
                <h3 className="mt-2 max-w-xl font-serif text-[clamp(2rem,4vw,3.55rem)] leading-[0.98] text-white">
                  {featured.title}
                </h3>
              </div>
            </article>

            <div className="grid gap-4 sm:grid-cols-3">
              {supporting.map((item, i) => (
                <article
                  key={item.title + i}
                  className="group relative min-h-[240px] overflow-hidden rounded-card border border-white/10 bg-white/[0.055] sm:aspect-[4/5] sm:min-h-0"
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 31vw, 18vw"
                    quality={70}
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,22,16,0)_0%,rgba(29,22,16,0.30)_44%,rgba(29,22,16,0.94)_100%)]" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

                  <div className="absolute left-4 top-4">
                    <TypeBadge type={item.type} />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-200">
                      {item.subtitle}
                    </p>
                    <h3 className="mt-1 font-serif text-lg leading-tight text-white sm:text-xl">
                      {item.title}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
