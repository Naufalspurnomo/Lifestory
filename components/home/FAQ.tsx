"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Accordion } from "../ui/Accordion";
import { Container } from "../ui/Container";
import { Eyebrow } from "../ui/Eyebrow";
import { Reveal } from "../ui/Reveal";
import { Button } from "../ui/Button";

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    items: Array<{ q: string; a: string }>;
    asideTitle: string;
    asideBody: string;
    asideCta: string;
  };
};

export function FAQ({ copy }: Props) {
  return (
    <section className="relative bg-cream-100 section-y-md">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal variant="left">
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <h2 className="mt-4 font-serif text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.05] tracking-[-0.02em] text-ink-800">
              {copy.title}
            </h2>
            <span aria-hidden className="mt-6 block h-px w-14 bg-cream-400" />

            <div className="mt-8 rounded-card border border-cream-300 bg-cream-50 p-6">
              <h3 className="mt-4 font-serif text-xl text-ink-800">
                {copy.asideTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                {copy.asideBody}
              </p>
              <Link href="/contact" className="mt-5 inline-block">
                <Button
                  variant="outline"
                  size="sm"
                  iconRight={<ArrowRight className="h-3.5 w-3.5" />}
                  animateRightIcon
                >
                  {copy.asideCta}
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.08} variant="right">
            <div className="rounded-card border border-cream-300 bg-cream-50 p-2 md:p-4">
              <Accordion
                items={copy.items.map((it) => ({ q: it.q, a: it.a }))}
                className="px-4 md:px-6"
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
