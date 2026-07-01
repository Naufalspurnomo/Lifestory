"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";

type Step = {
  number: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  note?: string;
};

type Props = {
  copy: {
    eyebrow: string;
    title: string;
    lead: string;
    stepLabel?: string;
    steps: Array<{
      title: string;
      body: string;
      image?: string;
      alt?: string;
      note?: string;
    }>;
  };
};

export function HowItWorks({ copy }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [activeStep, setActiveStep] = useState(1);

  const reduced = useReducedMotion();

  const steps: Step[] = copy.steps.map((step, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: step.title,
    body: step.body,
    image: step.image || `/image/home-step-${index + 1}.webp`,
    alt: step.alt || step.title,
    note: step.note,
  }));

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const { scrollLeft, clientWidth } = track;
    setCanScrollPrev(scrollLeft > 8);

    const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-card]"));
    if (cards.length > 0) {
      const viewportCenter = scrollLeft + clientWidth / 2;
      const nearestIndex = cards.reduce((closestIndex, card, index) => {
        const closestCard = cards[closestIndex];
        const currentCenter = card.offsetLeft + card.offsetWidth / 2;
        const closestCenter = closestCard.offsetLeft + closestCard.offsetWidth / 2;
        const currentDistance = Math.abs(currentCenter - viewportCenter);
        const closestDistance = Math.abs(closestCenter - viewportCenter);
        return currentDistance < closestDistance ? index : closestIndex;
      }, 0);

      const nextStep = nearestIndex + 1;
      setCanScrollNext(nextStep < steps.length);
      setActiveStep((prev) => (prev === nextStep ? prev : nextStep));
    }
  }, [steps.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateScrollState();
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll<HTMLElement>("[data-card]");
    const card = cards[index];
    if (!card) return;

    const targetLeft =
      card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    track.scrollTo({
      left: Math.max(0, Math.min(targetLeft, maxScrollLeft)),
      behavior: "smooth",
    });
  }, []);

  const scrollByDirection = useCallback(
    (direction: 1 | -1) => {
      const clampedTarget = Math.min(
        Math.max(activeStep - 1 + direction, 0),
        steps.length - 1
      );
      scrollToIndex(clampedTarget);
    },
    [activeStep, scrollToIndex, steps.length]
  );

  if (steps.length === 0) return null;

  const progressPercentage =
    steps.length > 1 ? ((activeStep - 1) / (steps.length - 1)) * 100 : 100;

  return (
    <section className="relative overflow-hidden bg-cream-50 py-[clamp(4.5rem,7vw,7rem)]">
      {/* Soft ambient wash so the cards feel grounded, not floating on flat cream */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 h-[420px] -translate-y-1/2 bg-[radial-gradient(60%_80%_at_50%_50%,rgba(0,0,0,0.035),transparent_70%)]"
      />

      <Container size="xl" className="relative">
        <Reveal className="flex flex-col gap-6 pb-12 md:flex-row md:items-end md:justify-between md:gap-16">
          <div className="max-w-2xl">
            <p className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700">
              <span className="h-[2px] w-12 origin-left animate-[grow-line_0.9s_cubic-bezier(0.22,1,0.36,1)_forwards] rounded-full bg-brand-500" />
              {copy.eyebrow}
            </p>
            <h2 className="mt-6 font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-[1.05] tracking-tight text-ink-900">
              {copy.title}
            </h2>
          </div>
          <p className="max-w-md text-base font-normal leading-[1.8] text-ink-600 md:text-lg">
            {copy.lead}
          </p>
        </Reveal>
      </Container>

      {/* Carousel Track — native scroll + snap, no drag hijacking */}
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={copy.title}
        className="hide-scrollbar relative z-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-10 pt-4 md:gap-5"
        style={{
          paddingLeft: "max(1.5rem, calc((100vw - 1320px) / 2 + 1.5rem))",
          paddingRight: "max(1.5rem, calc((100vw - 1320px) / 2 + 1.5rem))",
          scrollPaddingLeft: "max(1.5rem, calc((100vw - 1320px) / 2 + 1.5rem))",
        }}
      >
        {steps.map((step, index) => {
          const isActive = activeStep === index + 1;

          return (
            <motion.article
              key={step.number}
              data-card
              aria-roledescription="slide"
              aria-label={`${step.number} — ${step.title}`}
              aria-current={isActive ? "true" : undefined}
              initial={reduced ? false : { opacity: 0, y: 40 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{
                duration: 0.65,
                delay: Math.min(index * 0.08, 0.32),
                ease: [0.22, 1, 0.36, 1],
              }}
              animate={{
                scale: isActive ? 1 : 0.94,
                opacity: 1,
              }}
              style={{ willChange: "transform, opacity" }}
              className="flex w-[clamp(340px,88vw,680px)] shrink-0 snap-start flex-col rounded-[2.5rem] bg-transparent p-4 md:p-6"

            >
              {/* Image Container */}
              <div className="relative -mx-4 aspect-[16/9] w-[calc(100%+2rem)] overflow-hidden rounded-[1.75rem] bg-cream-200 md:-mx-6 md:w-[calc(100%+3rem)]">
                <Image
                  src={step.image}
                  alt={step.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 640px) 88vw, 680px"
                  className={`object-cover transition-transform duration-[1200ms] ease-out will-change-transform ${
                    isActive ? "scale-100" : "scale-[1.08]"
                  }`}
                />

                {/* Floating Badges */}

                <div className="absolute left-4 top-4 flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-ink-900 shadow-sm backdrop-blur-md">
                    {step.number}
                  </span>
                  {step.note && (
                    <span className="rounded-full bg-ink-900/80 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
                      {step.note}
                    </span>
                  )}
                </div>
              </div>

              {/* Text Content */}
              <div className="mt-6 flex flex-col gap-3 px-2 pb-2">
                <h3 className="text-xl font-semibold tracking-tight text-ink-900 md:text-2xl">
                  {step.title}
                </h3>
                <p className="text-base font-normal leading-[1.7] text-ink-500">
                  {step.body}
                </p>
              </div>
            </motion.article>
          );
        })}
      </div>

      {/* Navigation & Progress */}
      <Container size="xl" className="relative z-10">
        <div className="mt-4 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Progress Indicator */}
          <div className="flex w-full max-w-xs items-center gap-4">
            <span className="w-12 text-sm font-medium tabular-nums text-ink-900">
              {String(activeStep).padStart(2, "0")}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-cream-300">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-brand-600"
                initial={false}
                animate={{ width: `${progressPercentage}%` }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 220, damping: 30 }
                }
              />
            </div>
            <span className="w-12 text-right text-sm font-medium tabular-nums text-ink-400">
              {String(steps.length).padStart(2, "0")}
            </span>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Previous step"
              onClick={() => scrollByDirection(-1)}
              disabled={!canScrollPrev}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-ink-700 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-transform duration-200 ease-out active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next step"
              onClick={() => scrollByDirection(1)}
              disabled={!canScrollNext}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-ink-700 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-transform duration-200 ease-out active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
