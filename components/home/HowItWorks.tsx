"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";

type Step = {
  number: string;
  title: string;
  body: string;
  image: string;
  alt: string;
};

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: Array<{ title: string; body: string; image?: string; alt?: string }>;
  };
};

export function HowItWorks({ copy }: Props) {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);

  const steps: Step[] = copy.steps.map((step, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: step.title,
    body: step.body,
    image: step.image || `/image/home-step-${index + 1}.webp`,
    alt: step.alt || step.title,
  }));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        const nextIndex = Number(
          (visibleEntry.target as HTMLElement).dataset.stepIndex,
        );
        if (!Number.isNaN(nextIndex)) setActiveIndex(nextIndex);
      },
      {
        rootMargin: "-28% 0px -42% 0px",
        threshold: [0.1, 0.35, 0.6, 0.85],
      },
    );

    stepRefs.current.forEach((step) => {
      if (step) observer.observe(step);
    });

    return () => observer.disconnect();
  }, []);

  const activeStep = steps[activeIndex] || steps[0];
  if (!activeStep) return null;

  return (
    <section className="relative border-y border-cream-300 bg-cream-50 py-[clamp(5rem,8vw,8rem)]">
      <Container size="xl">
        <Reveal className="grid gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)] lg:items-end lg:gap-20 lg:pb-24">
          <div>
            <p className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
              <span className="h-px w-8 bg-brand-500" />
              {copy.eyebrow}
            </p>
            <h2 className="mt-7 max-w-[13ch] font-serif text-[clamp(2.9rem,5.4vw,5.75rem)] font-light leading-[0.98] tracking-normal text-ink-900">
              {copy.title}
            </h2>
          </div>
          <p className="max-w-xl text-base font-light leading-[1.8] text-ink-600 md:text-lg lg:pb-1">
            {copy.lead}
          </p>
        </Reveal>

        <div className="lg:grid lg:grid-cols-[minmax(0,0.82fr)_minmax(430px,1.18fr)] lg:gap-16 xl:gap-24">
          <div className="relative lg:pb-[45vh]">
            {steps.map((step, index) => {
              const isActive = activeIndex === index;

              return (
                <article
                  key={step.number}
                  ref={(node) => {
                    stepRefs.current[index] = node;
                  }}
                  data-step-index={index}
                  className="flex min-h-[auto] flex-col justify-center border-t border-cream-300 py-12 first:border-t-brand-400 md:py-16 lg:min-h-[68vh] lg:border-t-0 lg:py-20"
                >
                  <div
                    className={`max-w-xl transition-[opacity,transform] duration-500 ease-smooth ${
                      isActive
                        ? "lg:translate-x-0 lg:opacity-100"
                        : "lg:-translate-x-2 lg:opacity-[0.58]"
                    } ${reducedMotion ? "lg:transition-none" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-serif text-xl text-brand-700">
                        {step.number}
                      </span>
                      <span
                        className={`h-px transition-[width,background-color] duration-500 ${
                          isActive
                            ? "w-16 bg-brand-500"
                            : "w-8 bg-cream-400"
                        }`}
                      />
                    </div>

                    <h3 className="mt-7 max-w-[14ch] font-serif text-[clamp(2.25rem,4vw,4.5rem)] font-light leading-[1.02] tracking-normal text-ink-900">
                      {step.title}
                    </h3>
                    <p className="mt-6 max-w-lg text-base font-light leading-[1.8] text-ink-600 md:text-lg">
                      {step.body}
                    </p>
                  </div>

                  <Reveal variant="image" duration={0.65} className="lg:hidden">
                    <figure className="mx-auto mt-10 w-full max-w-[620px]">
                      <div className="relative aspect-[4/5] overflow-hidden bg-cream-200 shadow-[0_20px_45px_rgba(63,52,45,0.14)]">
                        <PosterImage
                          step={step}
                          sizes="(max-width: 640px) calc(100vw - 3rem), 620px"
                        />
                      </div>
                    </figure>
                  </Reveal>
                </article>
              );
            })}
          </div>

          <aside className="relative hidden lg:block">
            <div className="sticky top-20 flex h-[calc(100svh-6rem)] min-h-[480px] max-h-[760px] flex-col items-end justify-center py-3">
              <div className="mb-4 flex w-full items-center justify-end gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-ink-400">
                <span>{copy.eyebrow}</span>
                <span className="h-px w-10 bg-brand-400" />
                <span>{activeStep.number}</span>
              </div>

              <div
                className="relative aspect-[4/5] max-w-[610px] overflow-hidden bg-cream-200 shadow-[0_32px_70px_rgba(63,52,45,0.18)]"
                style={{
                  width:
                    "min(100%, calc((100svh - 12rem) * 0.8), 610px)",
                }}
              >
                <AnimatePresence initial={false}>
                  <motion.figure
                    key={activeStep.number}
                    initial={
                      reducedMotion
                        ? false
                        : { opacity: 0, scale: 1.025, y: 18 }
                    }
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.985, y: -12 }
                    }
                    transition={{
                      duration: reducedMotion ? 0 : 0.65,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute inset-0"
                  >
                    <PosterImage
                      step={activeStep}
                      priority={activeIndex === 0}
                      sizes="(max-width: 1024px) 1px, 55vw"
                    />
                  </motion.figure>
                </AnimatePresence>
              </div>

              <div
                className="mt-5 flex max-w-[610px] gap-2"
                style={{
                  width:
                    "min(100%, calc((100svh - 12rem) * 0.8), 610px)",
                }}
              >
                {steps.map((step, index) => (
                  <span
                    key={step.number}
                    className={`h-px flex-1 transition-colors duration-500 ${
                      index <= activeIndex ? "bg-brand-600" : "bg-cream-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}

function PosterImage({
  step,
  sizes,
  priority = false,
}: {
  step: Step;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <>
      <Image
        aria-hidden
        src={step.image}
        alt=""
        fill
        sizes={sizes}
        className="hidden scale-110 object-cover opacity-45 blur-2xl sm:block"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-cream-100/20"
      />
      <Image
        src={step.image}
        alt={step.alt}
        fill
        priority={priority}
        sizes={sizes}
        className="relative object-contain"
      />
    </>
  );
}
