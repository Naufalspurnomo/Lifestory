"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  HeartHandshake,
  Library,
  TreePine,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal } from "../ui/Reveal";
import { cn } from "../../lib/utils";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Item = {
  title: string;
  body: string;
};

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    items: Item[];
  };
};

const ICONS: LucideIcon[] = [BookOpen, HeartHandshake, Library, Users, TreePine];

/**
 * PromiseGrid — 5 small icon-based promise cards.
 * Replaces the bullet-list "Apa Tujuan Lifestory" section so it scans visually, not as prose.
 */
export function PromiseGrid({ copy }: Props) {
  const { reduced } = useMotionGuard();
  return (
    <section className="relative bg-cream-100 section-y-md">
      <Container>
        <Reveal className="mb-12 max-w-3xl md:mb-14">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-serif text-[clamp(1.85rem,4.4vw,3.2rem)] leading-[1.05] tracking-[-0.02em] text-ink-800">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-500 md:text-lg">
            {copy.lead}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {copy.items.map((item, idx) => {
            const Icon = ICONS[idx] ?? BookOpen;
            const isFeatured = idx === 0;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: reduced ? 0 : 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: reduced ? 0.01 : 0.6,
                  delay: reduced ? 0 : idx * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-card-lg border border-cream-300 p-6 shadow-soft transition duration-500 ease-smooth hover:-translate-y-1 hover:shadow-elev",
                  isFeatured
                    ? "bg-[linear-gradient(140deg,#fff5dd_0%,#fffaf0_60%,#fff_100%)] sm:col-span-2 lg:col-span-1"
                    : "bg-white"
                )}
              >
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-brand-200/70" />
                <span
                  className={cn(
                    "relative inline-flex h-12 w-12 items-center justify-center rounded-card border transition-colors duration-500",
                    isFeatured
                      ? "border-brand-300 bg-white text-brand-700 group-hover:bg-brand-gradient group-hover:text-white group-hover:border-transparent"
                      : "border-cream-300 bg-cream-100 text-brand-700 group-hover:border-brand-300 group-hover:bg-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="relative mt-5 font-serif text-xl leading-snug text-ink-800 md:text-2xl">
                  {item.title}
                </h3>
                <p className="relative mt-3 text-sm leading-relaxed text-ink-500 md:text-[15px]">
                  {item.body}
                </p>
              </motion.article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
