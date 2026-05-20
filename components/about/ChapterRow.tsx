"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { CornerFlourish } from "../ui/Ornament";
import { cn } from "../../lib/utils";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Props = {
  index: number;
  phase: string;
  title: string;
  body: string;
  note: string;
  image: string;
  imageAlt: string;
  icon: LucideIcon;
  /** When true, image goes on the right (desktop). Defaults to alternating. */
  reversed?: boolean;
};

/**
 * ChapterRow — alternating image+text editorial row (Z-pattern reading).
 * Use 3 of these stacked for 3-act structure.
 */
export function ChapterRow({
  index,
  phase,
  title,
  body,
  note,
  image,
  imageAlt,
  icon: Icon,
  reversed,
}: Props) {
  const { reduced } = useMotionGuard();
  const number = String(index + 1).padStart(2, "0");

  return (
    <motion.article
      initial={{ opacity: 0, y: reduced ? 0 : 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduced ? 0.01 : 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16",
        reversed && "lg:[&>*:first-child]:order-2"
      )}
    >
      {/* Image column */}
      <motion.div
        initial={{ opacity: 0, scale: reduced ? 1 : 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: reduced ? 0.01 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-card-lg border border-cream-300 bg-white shadow-elev sm:aspect-[5/6] lg:aspect-[4/5]">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/40 via-transparent to-transparent"
          />
          {/* Big chapter numeral */}
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-4 -left-2 font-serif text-[clamp(7rem,15vw,12rem)] leading-none text-white/85 mix-blend-overlay drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] sm:-bottom-6 sm:-left-4"
          >
            {number}
          </span>
          {/* Phase chip */}
          <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-pill bg-white/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700 shadow-soft backdrop-blur-sm">
            <Icon className="h-3.5 w-3.5" />
            {phase}
          </span>
        </div>
      </motion.div>

      {/* Text column */}
      <div className="relative">
        <CornerFlourish
          aria-hidden
          className="pointer-events-none absolute -left-4 -top-4 hidden lg:block"
        />
        <p className="font-serif text-7xl leading-none text-brand-200/80 md:text-8xl">
          {number}.
        </p>
        <h3 className="mt-2 font-serif text-[clamp(1.85rem,3.4vw,2.6rem)] leading-[1.1] tracking-[-0.02em] text-ink-800">
          {title}
        </h3>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-500 md:text-lg">
          {body}
        </p>
        <div className="mt-6 flex items-start gap-3 rounded-card border-l-2 border-brand-400 bg-cream-50 px-5 py-4">
          <span className="font-serif text-2xl leading-none text-brand-400">
            “
          </span>
          <p className="text-sm italic leading-relaxed text-ink-600 md:text-base">
            {note}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
