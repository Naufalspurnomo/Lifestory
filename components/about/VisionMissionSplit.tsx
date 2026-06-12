"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useMotionGuard } from "../../lib/hooks/useMotionGuard";
import { cn } from "../../lib/utils";

type Props = {
  copy: {
    visionLabel: string;
    visionTitle: string;
    visionPoints: string[];
    missionLabel: string;
    missionTitle: string;
    missionPoints: string[];
  };
};

type PointListProps = {
  points: string[];
  tone: "dark" | "light";
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function VisionMissionSplit({ copy }: Props) {
  const { reduced, shouldReduceScrollMotion } = useMotionGuard();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.16 });

  return (
    <section
      id="vision-mission"
      ref={ref}
      className="relative overflow-hidden bg-[#fbf9f4] py-[clamp(5.5rem,8vw,7.75rem)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(224,211,188,0.27),transparent_53%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grain bg-[length:24px_24px] opacity-[0.08]"
      />

      <TopPaperOrnament />

      <div className="relative mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-visible shadow-[0_26px_70px_rgba(62,48,32,0.11)] lg:grid-cols-2">
          <motion.article
            initial={{ x: reduced || shouldReduceScrollMotion ? 0 : -18 }}
            animate={isInView || reduced ? { x: 0 } : {}}
            transition={{ duration: reduced ? 0.01 : 0.8, ease: EASE }}
            className="relative isolate flex min-h-[650px] overflow-hidden rounded-tl-[11px] bg-[#201711] px-7 pb-12 pt-16 text-[#f8f2e8] sm:min-h-[700px] sm:px-12 sm:pb-14 sm:pt-20 lg:min-h-[760px] lg:pb-[96px] lg:pl-[clamp(5.5rem,7.4vw,7.75rem)] lg:pr-[clamp(4rem,6vw,6.5rem)] lg:pt-[88px]"
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_52%_32%,rgba(101,75,52,0.18),transparent_54%),linear-gradient(140deg,#211811_0%,#1b130e_100%)]"
            />
            <div
              aria-hidden
              className="absolute inset-[14px] border border-[#a98448]/45 [clip-path:polygon(16px_0,100%_0,100%_100%,0_100%,0_16px)] sm:inset-[16px]"
            />

            <div className="relative z-10 flex w-full flex-col">
              <EditorialHeading
                label={copy.visionLabel}
                title={copy.visionTitle}
                tone="dark"
              />

              <EditorialDivider tone="dark" />

              <PointList points={copy.visionPoints} tone="dark" />
            </div>

            <BookPenOrnament />
          </motion.article>

          <motion.article
            initial={{ x: reduced || shouldReduceScrollMotion ? 0 : 18 }}
            animate={isInView || reduced ? { x: 0 } : {}}
            transition={{
              duration: reduced ? 0.01 : 0.8,
              delay: reduced ? 0 : 0.08,
              ease: EASE,
            }}
            className="relative isolate flex min-h-[650px] overflow-hidden rounded-tr-[54px] bg-[#fdfbf6] px-7 pb-12 pt-16 text-[#2b2018] sm:min-h-[700px] sm:px-12 sm:pb-14 sm:pt-20 lg:min-h-[760px] lg:px-[clamp(3.5rem,5vw,7.75rem)] lg:py-[clamp(5rem,6vw,6.5rem)]"
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-20 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(249,244,235,0.9))]"
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[url('/brand/parchment_bg.png')] bg-cover bg-center opacity-[0.025] mix-blend-multiply"
            />
            <div
              aria-hidden
              className="absolute inset-[14px] rounded-tr-[47px] border border-[#b99a61]/45 sm:inset-[16px]"
            />

            <div className="relative z-10 flex w-full flex-col">
              <EditorialHeading
                label={copy.missionLabel}
                title={copy.missionTitle}
                tone="light"
              />

              <EditorialDivider tone="light" />

              <PointList points={copy.missionPoints} tone="light" />
            </div>

            <EnvelopeOrnament />
          </motion.article>
        </div>
      </div>
    </section>
  );
}

function EditorialHeading({
  label,
  title,
  tone,
}: {
  label: string;
  title: string;
  tone: "dark" | "light";
}) {
  return (
    <div className="lg:min-h-[230px]">
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-[0.28em]",
          tone === "dark" ? "text-[#b8955a]" : "text-[#a87d3f]"
        )}
      >
        {label}
      </p>
      <span
        aria-hidden
        className={cn(
          "mt-4 block h-px w-9",
          tone === "dark" ? "bg-[#b8955a]/75" : "bg-[#b48b50]/70"
        )}
      />
      <h3
        className={cn(
          "mt-6 max-w-[18ch] font-serif text-[clamp(2.1rem,2.8vw,2.65rem)] font-light leading-[1.08] tracking-[-0.025em]",
          tone === "dark" ? "text-[#f7f0e6]" : "text-[#2b2018]"
        )}
      >
        {title}
      </h3>
    </div>
  );
}

function EditorialDivider({ tone }: { tone: "dark" | "light" }) {
  return (
    <div
      aria-hidden
      className={cn(
        "mt-9 flex items-center gap-3 sm:mt-10",
        tone === "dark" ? "text-[#a78449]/80" : "text-[#b8955a]/65"
      )}
    >
      <span className="h-px flex-1 bg-current" />
      <span className="relative block h-3 w-3">
        <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 rotate-45 bg-current" />
        <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 -rotate-45 bg-current" />
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-current" />
      </span>
      <span className="h-px flex-1 bg-current" />
    </div>
  );
}

function PointList({ points, tone }: PointListProps) {
  return (
    <ol className="relative mt-3">
      {tone === "dark" && (
        <span
          aria-hidden
          className="absolute bottom-[1.1rem] left-[2.65rem] top-[1.1rem] w-px bg-[#aa874d]/35 sm:left-[3rem]"
        />
      )}

      {points.map((point, index) => (
        <li
          key={point}
          className={cn(
            "relative grid grid-cols-[2.65rem_minmax(0,1fr)] gap-4 py-3 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-5",
            tone === "light" && index > 0 && "border-t border-[#b99a61]/20"
          )}
        >
          <span
            className={cn(
              "font-serif text-[1.08rem] leading-[1.65]",
              tone === "dark" ? "text-[#bd985c]" : "text-[#b18b50]"
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          <span
            aria-hidden
            className={cn(
              "absolute left-[2.65rem] top-1/2 -translate-x-1/2 -translate-y-1/2",
              tone === "dark"
                ? "h-1 w-1 rounded-full bg-[#bd985c]"
                : "h-7 w-px bg-[#b99a61]/38",
              "sm:left-[3rem]"
            )}
          />

          <span
            className={cn(
              "text-[13px] font-light leading-[1.75] sm:text-[14px]",
              tone === "dark" ? "text-[#f4ede4]/82" : "text-[#463a31]/85"
            )}
          >
            {point}
          </span>
        </li>
      ))}
    </ol>
  );
}

function TopPaperOrnament() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-0 hidden h-[92px] w-[440px] -translate-x-1/2 -translate-y-[36%] rotate-[4deg] bg-[#f8f4ec]/75 shadow-[0_16px_36px_rgba(77,59,38,0.05)] lg:block"
    >
      <div className="absolute bottom-7 left-1/2 flex w-[255px] -translate-x-1/2 -rotate-[4deg] items-center gap-4 text-[#b59560]/50">
        <span className="h-px flex-1 bg-current" />
        <span className="block h-3 w-2 rotate-45 rounded-[45%_15%] bg-current" />
        <span className="h-px flex-1 bg-current" />
      </div>
    </div>
  );
}

function BookPenOrnament() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -bottom-14 -left-16 z-0 h-[245px] w-[270px] opacity-[0.42] sm:-bottom-16 sm:-left-14 sm:h-[280px] sm:w-[310px]"
    >
      <span className="absolute bottom-0 left-4 h-[210px] w-[142px] rotate-[-12deg] rounded-tr-[8px] border border-[#9a7742]/30 bg-[linear-gradient(125deg,#160f0b,#2b1b11_65%,#18100b)] shadow-[12px_12px_25px_rgba(0,0,0,0.34)]">
        <span className="absolute inset-[10px] rounded-tr-[5px] border border-[#9a7742]/25" />
        <span className="absolute left-5 top-7 h-[105px] w-[85px] rounded-[50%] border border-[#9a7742]/15" />
      </span>
      <span className="absolute bottom-[92px] left-[77px] h-[10px] w-[190px] rotate-[18deg] rounded-full bg-[linear-gradient(180deg,#15110e,#33271d_52%,#0d0a08)] shadow-[0_5px_9px_rgba(0,0,0,0.35)]">
        <span className="absolute left-5 top-0 h-full w-[5px] bg-[#b18a4c]/70" />
        <span className="absolute right-5 top-0 h-full w-[4px] bg-[#b18a4c]/70" />
        <span className="absolute -right-3 top-[2px] h-0 w-0 border-b-[3px] border-l-[14px] border-t-[3px] border-b-transparent border-l-[#b18a4c]/80 border-t-transparent" />
      </span>
    </div>
  );
}

function EnvelopeOrnament() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -bottom-12 right-0 z-0 h-[220px] w-[280px] opacity-[0.55] sm:-bottom-10 sm:right-2 sm:h-[250px] sm:w-[330px]"
    >
      <svg
        viewBox="0 0 330 250"
        fill="none"
        className="absolute -right-2 -top-8 h-[210px] w-[160px] text-[#bca577]/35"
      >
        <path d="M78 229C81 180 86 135 100 86C107 61 117 38 132 17" stroke="currentColor" strokeWidth="1.2" />
        <path d="M99 93C73 83 56 65 49 43C75 49 94 67 99 93Z" stroke="currentColor" strokeWidth="1" />
        <path d="M111 63C111 37 124 19 144 8C146 33 135 52 111 63Z" stroke="currentColor" strokeWidth="1" />
        <path d="M88 137C63 128 44 111 35 88C61 93 80 111 88 137Z" stroke="currentColor" strokeWidth="1" />
        <path d="M85 176C61 170 42 156 31 136C57 138 76 152 85 176Z" stroke="currentColor" strokeWidth="1" />
      </svg>

      <span className="absolute bottom-11 right-3 h-[118px] w-[222px] rotate-[-8deg] border border-[#c3ae88]/30 bg-[#faf6ee] shadow-[0_11px_26px_rgba(88,65,39,0.07)]" />
      <span className="absolute bottom-2 right-7 h-[118px] w-[218px] rotate-[3deg] border border-[#c3ae88]/25 bg-[#f8f3e8] shadow-[0_13px_30px_rgba(88,65,39,0.08)]" />
      <span className="absolute bottom-[42px] right-[78px] h-[54px] w-[54px] rounded-full border border-[#80612f]/60 bg-[radial-gradient(circle_at_36%_30%,#c3a25f,#8f6a31_68%,#725021)] shadow-[0_5px_12px_rgba(72,49,25,0.25)]">
        <span className="absolute inset-[7px] rounded-full border border-[#ead5a3]/35" />
        <span className="absolute left-1/2 top-1/2 h-4 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[45%_15%] bg-[#ead5a3]/50" />
      </span>
    </div>
  );
}
