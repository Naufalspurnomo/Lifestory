"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";
import { Container } from "../ui/Container";
import { AmbientGlow } from "../ui/AmbientGlow";
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
    <section className="relative border-t border-cream-300 bg-cream-50 py-16 md:py-20 lg:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduced ? 0.01 : 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[28px] border border-cream-300 bg-cream-100 px-6 py-10 shadow-[0_18px_42px_rgba(59,43,24,0.08)] sm:px-8 md:px-10 md:py-12 lg:px-12 lg:py-14"
        >
          <AmbientGlow className="-right-16 -top-24" size={420} duration={16} />
          <AmbientGlow
            className="-bottom-24 left-[8%]"
            color="rgba(176,141,87,0.1)"
            size={380}
            duration={20}
            delay={1.5}
          />
          <span
            aria-hidden
            className="absolute left-6 top-0 h-[3px] w-24 bg-brand-700 sm:left-8 md:left-10 lg:left-12"
          />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700">
                {copy.eyebrow}
              </p>
              <h2 className="mt-4 font-serif text-[clamp(2rem,4.4vw,4rem)] font-light leading-[1.02] tracking-[-0.02em] text-ink-900">
                {copy.title}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-600 md:text-lg">
                {copy.lead}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href={primaryHref} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="dark"
                  block
                  iconRight={<ArrowRight className="h-4 w-4" />}
                  animateRightIcon
                  className="shadow-none hover:shadow-soft"
                >
                  {copy.primaryCta}
                </Button>
              </Link>
              <Link href={secondaryHref} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  block
                  className="border-cream-400 bg-cream-50 text-ink-700 hover:border-brand-400 hover:bg-cream-100"
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
