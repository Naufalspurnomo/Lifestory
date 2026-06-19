"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenText } from "lucide-react";
import { Button } from "../ui/Button";
import { Container } from "../ui/Container";
import { MagneticButton } from "../ui/MagneticButton";

type Props = {
  copy: {
    aboutLabel: string;
    heroBody: string;
    heroFeatures: string[];
    heroPrimary: string;
    heroSecondary: string;
    heroNote: string;
  };
  isId: boolean;
  reduced: boolean;
  lightMotion: boolean;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const featureIcons = [
  <svg key="write" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
  <svg key="family" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  <svg key="heirloom" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
];

export function AboutHeroLead({ copy, isId, reduced, lightMotion }: Props) {
  const photoTags = ["1985", "1992", isId ? "Sekarang" : "Today"];

  return (
    <>
      <FabricBackground />

      <Container size="xl">
        <div className="relative grid min-w-0 grid-cols-1 gap-8 pb-0 pt-14 md:pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:pt-16 xl:gap-14">
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.8, ease: EASE }}
            className="relative z-10 min-w-0 pb-10 lg:pb-14 lg:pt-2"
          >
            <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
              <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500">
                <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 1 8-1 3.5-3.1 5-5 6.5" />
                <path d="M11 20A7 7 0 0 0 12.2 6.9C6.5 4.9 5 3.5 3 2 2 4 1 6.5 2 10c1 3.5 3.1 5 5 6.5" />
                <path d="M11 20V10" />
              </svg>
              {copy.aboutLabel}
            </p>

            <h1
              className={`mt-5 w-full max-w-[16ch] font-serif font-light leading-[1.04] tracking-normal text-ink-900 ${
                isId
                  ? "text-[2.25rem] sm:text-[3rem] md:text-[3.25rem] lg:text-[3.45rem] xl:text-[3.95rem] 2xl:text-[4.25rem]"
                  : "text-[2.1rem] sm:text-[2.75rem] md:text-[3rem] lg:text-[3.2rem] xl:text-[3.65rem] 2xl:text-[3.95rem]"
              }`}
            >
              {isId ? (
                <>
                  <span className="block mb-1 md:mb-2">Kami menulis</span>
                  <span className="block mb-1 md:mb-2">keluarga seperti ia</span>
                  <span className="block mb-1 md:mb-2">
                    <HeadlineAccent>benar-benar</HeadlineAccent>
                  </span>
                  <span className="block">hidup.</span>
                </>
              ) : (
                <>
                  <span className="block mb-1 md:mb-2">We write families</span>
                  <span className="block mb-1 md:mb-2">as they</span>
                  <span className="block mb-1 md:mb-2">
                    <HeadlineAccent>truly</HeadlineAccent>
                  </span>
                  <span className="block">lived.</span>
                </>
              )}
            </h1>

            <p className="mt-6 w-full max-w-[calc(100vw-3rem)] break-words text-[0.9rem] font-light leading-[1.75] text-ink-600 md:text-[0.95rem] lg:max-w-lg">
              {copy.heroBody}
            </p>

            <div className="mt-7 flex flex-wrap items-start gap-x-7 gap-y-4">
              {copy.heroFeatures.map((feature, index) => (
                <div key={feature} className="flex max-w-[160px] items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cream-300 bg-cream-50/80 text-brand-700 shadow-[0_5px_14px_rgba(82,61,37,0.1)]">
                    {featureIcons[index]}
                  </span>
                  <span className="text-[10px] font-medium leading-[1.5] text-ink-600">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:flex-nowrap">
              <Link href="/contact" className="w-full sm:w-auto">
                <MagneticButton strength={0.2} distance={100} className="w-full sm:w-auto">
                  <Button
                    variant="dark"
                    size="lg"
                    block
                    iconRight={<ArrowRight className="h-4 w-4" />}
                    animateRightIcon
                    className="group relative !w-auto overflow-hidden border-none !bg-brand-700 px-7 py-5 text-cream-50 shadow-[0_12px_26px_rgba(96,75,45,0.2)] transition-all duration-500 hover:!bg-brand-800 !rounded-pill"
                  >
                    <span className="relative z-10 whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.15em]">{copy.heroPrimary}</span>
                  </Button>
                </MagneticButton>
              </Link>
              <Link href="#process" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  block
                  iconLeft={<BookOpenText className="h-4 w-4 text-brand-700 transition-colors group-hover:text-cream-50" />}
                  className="group !w-auto whitespace-nowrap border-brand-500 bg-cream-50/50 px-7 py-5 text-[11px] font-medium uppercase tracking-[0.15em] !text-brand-700 shadow-none transition-colors duration-500 hover:!bg-brand-700 hover:!text-cream-50 !rounded-pill"
                >
                  {copy.heroSecondary}
                </Button>
              </Link>
            </div>
          </motion.div>

          <PhotoCollage note={copy.heroNote} photoTags={photoTags} reduced={reduced} lightMotion={lightMotion} />

          <MobilePhotoStrip photoTags={photoTags} />
        </div>
      </Container>
    </>
  );
}

function HeadlineAccent({ children }: { children: string }) {
  return (
    <span className="relative inline-block whitespace-nowrap pr-[0.1em] font-serif font-medium italic text-brand-700">
      {children}
      <motion.svg
        aria-hidden
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
        className="absolute -bottom-1 left-0 h-[6px] w-full text-brand-300 opacity-60 lg:-bottom-2 lg:h-[8px]"
        initial={{ strokeDasharray: 100, strokeDashoffset: 100 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 1.2, delay: 0.8, ease: EASE }}
      >
        <path d="M0,5 Q50,0 100,8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </motion.svg>
    </span>
  );
}

/** Gentle, endless float/sway. Renders a plain wrapper when motion is off. */
function Floating({
  children,
  still,
  y = 9,
  rotate = 1,
  duration = 7,
  delay = 0,
  className,
}: {
  children: ReactNode;
  still: boolean;
  y?: number;
  rotate?: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  if (still) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -y, 0], rotate: [0, rotate, 0] }}
      transition={{ duration, delay, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
    >
      {children}
    </motion.div>
  );
}

function FabricBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.96),rgba(248,245,238,0.74)_52%,rgba(235,228,216,0.5)_100%)]" />
      <div className="absolute inset-0 bg-grain bg-[length:24px_24px] opacity-[0.1]" />
      <div className="absolute -left-[8%] -top-[20%] h-[72%] w-[36%] rotate-[18deg] rounded-[50%] bg-[radial-gradient(ellipse,rgba(106,91,69,0.17),transparent_68%)] blur-2xl" />
      <div className="absolute -bottom-[42%] left-[22%] h-[55%] w-[48%] -rotate-[8deg] bg-[linear-gradient(165deg,transparent_15%,rgba(107,90,65,0.08)_48%,transparent_70%)] blur-xl" />
      <div className="absolute -right-[12%] -top-[28%] h-[65%] w-[36%] rotate-[-12deg] bg-[linear-gradient(120deg,transparent_22%,rgba(112,94,69,0.1)_48%,transparent_72%)] blur-2xl" />
      <svg viewBox="0 0 300 240" className="absolute -left-10 top-0 h-[240px] w-[300px] -rotate-[18deg] text-[#6d604d] opacity-[0.07] blur-[1px]">
        <path d="M28 20C90 73 113 123 135 218M65 47C96 53 119 43 135 22M91 79C120 83 150 69 170 43M111 115C148 119 176 105 197 76M128 151C164 157 199 144 226 112M63 49C51 81 52 105 61 130M91 80C76 108 76 138 88 165M111 116C101 146 104 175 119 204" stroke="currentColor" strokeWidth="17" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function PhotoCollage({
  note,
  photoTags,
  reduced,
  lightMotion,
}: {
  note: string;
  photoTags: string[];
  reduced: boolean;
  lightMotion: boolean;
}) {
  const still = reduced || lightMotion;
  const photos = [
    { src: "/image/about-hero-1.webp", className: "left-[4%] top-[14%] z-10 w-[38%] max-w-[220px]", ratio: "aspect-[3/4]", rotate: -1.5, float: { y: 9, rotate: 0.8, duration: 7, delay: 0 } },
    { src: "/image/about-hero-2.webp", className: "left-[27%] top-[7%] z-20 w-[42%] max-w-[250px]", ratio: "aspect-[4/5]", rotate: 1, float: { y: 12, rotate: -0.7, duration: 8.5, delay: 0.6 } },
    { src: "/image/about-hero-3.webp", className: "right-[3%] top-[18%] z-30 w-[39%] max-w-[230px]", ratio: "aspect-[3/4]", rotate: 2, float: { y: 8, rotate: 1.1, duration: 7.6, delay: 1.1 } },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0.01 : 1, delay: reduced ? 0 : 0.2 }}
      className="relative hidden min-h-[500px] lg:block"
    >
      <div aria-hidden className="absolute left-[23%] top-[3%] z-0 h-[430px] w-[48%] rotate-[7deg] border border-[#cbbda4]/40 bg-[repeating-linear-gradient(0deg,rgba(139,111,73,0.08)_0px,rgba(139,111,73,0.08)_1px,transparent_1px,transparent_4px),repeating-linear-gradient(90deg,rgba(139,111,73,0.06)_0px,rgba(139,111,73,0.06)_1px,transparent_1px,transparent_5px),#d6c4a5] shadow-[0_18px_40px_rgba(69,51,31,0.18)]" />

      <FlowerBranch still={still} />

      {photos.map((photo, index) => (
        <motion.figure
          key={photo.src}
          initial={{ opacity: 0, y: reduced ? 0 : lightMotion ? 12 : 34, rotate: lightMotion ? photo.rotate * 0.4 : photo.rotate }}
          animate={{ opacity: 1, y: 0, rotate: photo.rotate }}
          transition={{ duration: reduced ? 0.01 : 0.85, delay: reduced ? 0 : 0.38 + index * 0.14, ease: EASE }}
          className={`absolute ${photo.className}`}
        >
          <Floating
            still={still}
            y={photo.float.y}
            rotate={photo.float.rotate}
            duration={photo.float.duration}
            delay={photo.float.delay}
          >
            <div className="overflow-hidden rounded-[7px] border border-cream-300 bg-[#eee8db] p-[7px] shadow-deep">
              <div className={`relative overflow-hidden rounded-[4px] ${photo.ratio}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="mt-[-14px] flex justify-center pb-1">
                <span className="relative rounded-full bg-[#f1ebde] px-3 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-ink-500 shadow-sm">
                  {photoTags[index]}
                </span>
              </div>
            </div>
          </Floating>
          {index === 1 && <PaperClip />}
        </motion.figure>
      ))}

      <DryLeaf still={still} />

      <motion.div
        initial={{ opacity: 0, rotate: lightMotion ? 1 : 4, y: reduced ? 0 : lightMotion ? 8 : 16 }}
        animate={{ opacity: 1, rotate: 4, y: 0 }}
        transition={{ duration: reduced ? 0.01 : 0.8, delay: reduced ? 0 : 0.88, ease: EASE }}
        aria-hidden
        className="absolute bottom-[2%] right-[7%] z-40 max-w-[180px] bg-[#eee4d2] px-5 py-4 shadow-[0_14px_30px_rgba(70,51,31,0.18)] [clip-path:polygon(5%_0,100%_4%,96%_100%,0_94%)]"
      >
        <Floating still={still} y={6} rotate={0.8} duration={6.8} delay={0.4}>
          <p className="font-serif text-[0.85rem] italic leading-[1.5] text-ink-700">{note}</p>
        </Floating>
      </motion.div>
    </motion.div>
  );
}

function PaperClip() {
  return (
    <div aria-hidden className="absolute -right-2 -top-5 z-40 rotate-[7deg] text-brand-600">
      <svg width="25" height="50" viewBox="0 0 24 48" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2C6 2 2 6 2 12v24c0 6 4 10 10 10s10-4 10-10V14c0-6-4-10-10-10" />
      </svg>
    </div>
  );
}

function FlowerBranch({ still }: { still: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute -right-[7%] top-[20%] z-40 h-[300px] w-[170px] rotate-[7deg] text-[#b5965c]/55">
      <motion.svg
        viewBox="0 0 170 300"
        fill="none"
        className="h-full w-full"
        style={{ transformOrigin: "bottom center" }}
        animate={still ? undefined : { rotate: [0, 2.6, 0], y: [0, -4, 0] }}
        transition={still ? undefined : { duration: 9, ease: "easeInOut", repeat: Infinity }}
      >
        <path d="M28 286C61 215 78 148 104 42" stroke="currentColor" strokeWidth="1.4" />
        {[[39,255,26,10],[51,230,31,11],[62,202,28,10],[72,176,32,11],[81,150,26,10],[91,124,28,10],[101,96,24,9],[108,69,21,8]].map(([cx, cy, rx, ry], index) => (
          <g key={index}>
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${-28 + index * 3} ${cx} ${cy})`} stroke="currentColor" />
            <ellipse cx={cx + 45} cy={cy - 8} rx={rx - 3} ry={ry - 1} transform={`rotate(${24 - index * 2} ${cx + 45} ${cy - 8})`} stroke="currentColor" />
          </g>
        ))}
      </motion.svg>
    </div>
  );
}

function DryLeaf({ still }: { still: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute bottom-[8%] left-[22%] z-30 h-[150px] w-[105px] rotate-[-24deg] text-[#8d7754]/55">
      <motion.svg
        viewBox="0 0 105 150"
        fill="none"
        className="h-full w-full drop-shadow-[0_8px_8px_rgba(65,47,29,0.16)]"
        style={{ transformOrigin: "top center" }}
        animate={still ? undefined : { rotate: [0, -3.2, 0], y: [0, 4, 0] }}
        transition={still ? undefined : { duration: 10, ease: "easeInOut", repeat: Infinity, delay: 1.2 }}
      >
        <path d="M54 144C54 105 53 67 51 16" stroke="currentColor" strokeWidth="2" />
        <path d="M51 18C13 41 14 82 53 106C90 76 88 38 51 18Z" fill="currentColor" fillOpacity="0.32" stroke="currentColor" />
        <path d="M51 23C51 61 52 82 53 103M51 51L29 42M52 70L76 56M52 88L34 78" stroke="currentColor" strokeWidth="1" opacity="0.65" />
      </motion.svg>
    </div>
  );
}

function MobilePhotoStrip({ photoTags }: { photoTags: string[] }) {
  return (
    <div aria-hidden className="relative flex min-w-0 items-end justify-center gap-2 pb-8 lg:hidden">
      {["/image/about-hero-1.webp", "/image/about-hero-2.webp", "/image/about-hero-3.webp"].map((src, index) => {
        const sizes = ["h-36 w-[5.25rem] sm:h-44 sm:w-32", "h-44 w-[6.5rem] sm:h-56 sm:w-36", "h-36 w-[5.25rem] sm:h-48 sm:w-32"];
        const rotations = ["-rotate-2", "rotate-1", "rotate-2"];
        return (
          <figure key={src} className={`relative shrink-0 overflow-hidden rounded-[6px] border border-cream-300 bg-[#eee8db] p-1.5 shadow-elev ${sizes[index]} ${rotations[index]}`}>
            <div className="relative h-[calc(100%-12px)] w-full overflow-hidden rounded-[3px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="-mt-2 flex justify-center">
              <span className="relative rounded-full bg-[#f1ebde] px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-ink-500">{photoTags[index]}</span>
            </div>
          </figure>
        );
      })}
    </div>
  );
}
