"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { Eyebrow } from "../ui/Eyebrow";
import { Container } from "../ui/Container";
import { Monogram } from "../ui/Ornament";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    primaryCta: string;
    secondaryCta: string;
  };
  primaryHref: string;
  secondaryHref: string;
};

export function FinalCTA({ copy, primaryHref, secondaryHref }: Props) {
  const { reduced } = useMotionGuard();

  return (
    <section className="relative bg-cream-50 section-y-md">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduced ? 0.01 : 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[36px] border border-ink-800/30 bg-gradient-to-br from-ink-900 via-ink-800 to-brand-800 px-8 py-14 text-white shadow-deep md:px-12 md:py-16 lg:px-16 lg:py-20"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />
            <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-20" />
            <Monogram
              className="absolute right-8 top-8 text-white/30"
              size="lg"
            />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <Eyebrow tone="white" icon={<Sparkles className="h-3 w-3" />}>
                {copy.eyebrow}
              </Eyebrow>
              <h2 className="mt-5 font-serif text-[clamp(1.85rem,4.6vw,3.6rem)] leading-[1.04] tracking-[-0.02em]">
                {copy.title}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
                {copy.lead}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <Link href={primaryHref} className="w-full lg:w-auto">
                <Button
                  size="lg"
                  block
                  iconRight={<ArrowRight className="h-4 w-4" />}
                  animateRightIcon
                >
                  {copy.primaryCta}
                </Button>
              </Link>
              <Link href={secondaryHref} className="w-full lg:w-auto">
                <Button
                  size="lg"
                  variant="ghost"
                  block
                  className="text-white/80 hover:bg-white/10 hover:text-white"
                >
                  {copy.secondaryCta}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
