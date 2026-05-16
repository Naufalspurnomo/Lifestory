"use client";

import {
  BookOpenText,
  Camera,
  Clapperboard,
  TreePine,
  type LucideIcon,
} from "lucide-react";
import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal } from "../ui/Reveal";
import { cn } from "../../lib/utils";

type Item = {
  icon: LucideIcon;
  title: string;
  body: string;
  size: string;
  accent: string;
};

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    items: Array<{ title: string; body: string }>;
  };
};

const ICONS = [BookOpenText, Camera, Clapperboard, TreePine];

const TILE_STYLES = [
  // 0 — book (large left)
  {
    size: "lg:col-span-2 lg:row-span-2",
    accent:
      "bg-[linear-gradient(140deg,#fff5dd_0%,#fffaf0_55%,#ffffff_100%)]",
  },
  // 1 — photos
  {
    size: "lg:col-span-1 lg:row-span-1",
    accent:
      "bg-[linear-gradient(140deg,#fffdf6_0%,#fbf3e0_100%)]",
  },
  // 2 — film
  {
    size: "lg:col-span-1 lg:row-span-1",
    accent:
      "bg-[linear-gradient(140deg,#1d1610_0%,#3f342d_100%)] text-white border-ink-800",
  },
  // 3 — tree (wide bottom right)
  {
    size: "lg:col-span-2 lg:row-span-1",
    accent:
      "bg-[linear-gradient(140deg,#f0fbf6_0%,#fffefb_100%)]",
  },
];

export function Deliverables({ copy }: Props) {
  const items: Item[] = copy.items.map((it, i) => ({
    icon: ICONS[i] ?? BookOpenText,
    title: it.title,
    body: it.body,
    size: TILE_STYLES[i]?.size ?? "lg:col-span-1",
    accent: TILE_STYLES[i]?.accent ?? "",
  }));

  return (
    <section className="relative bg-cream-100 section-y-md">
      <Container>
        <Reveal className="mb-12 max-w-3xl">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-serif text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.05] tracking-[-0.02em] text-ink-800">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 md:text-lg">
            {copy.lead}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[260px]">
          {items.map((item, i) => {
            const Icon = item.icon;
            const isDark = i === 2;
            return (
              <Reveal key={item.title} delay={i * 0.06} className={cn("h-full", item.size)}>
                <article
                  className={cn(
                    "group relative h-full overflow-hidden rounded-card-lg border border-cream-300 p-7 shadow-soft transition duration-500 ease-smooth hover:-translate-y-1 hover:shadow-lift",
                    item.accent
                  )}
                >
                  {/* Decorative glow */}
                  <div
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-2xl transition duration-700 group-hover:scale-110",
                      isDark ? "bg-brand-400/20" : "bg-brand-200/40"
                    )}
                  />
                  <div className="relative flex h-full flex-col">
                    <span
                      className={cn(
                        "inline-flex h-12 w-12 items-center justify-center rounded-card border",
                        isDark
                          ? "border-white/15 bg-white/10 text-brand-300"
                          : "border-cream-300 bg-white text-brand-700"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3
                      className={cn(
                        "mt-5 font-serif text-2xl leading-tight md:text-3xl",
                        isDark ? "text-white" : "text-ink-800"
                      )}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={cn(
                        "mt-3 max-w-md text-sm leading-relaxed",
                        isDark ? "text-white/75" : "text-ink-500"
                      )}
                    >
                      {item.body}
                    </p>

                    <span
                      className={cn(
                        "mt-auto pt-6 text-[11px] font-bold uppercase tracking-[0.18em]",
                        isDark ? "text-brand-300" : "text-brand-700"
                      )}
                    >
                      {`${i + 1}`.padStart(2, "0")} · Lifestory deliverable
                    </span>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
