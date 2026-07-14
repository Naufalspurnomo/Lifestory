import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function sourceFilesUnder(relativePath: string): string[] {
  const root = join(process.cwd(), relativePath);
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = join(relativePath, entry.name);
    if (entry.isDirectory()) return sourceFilesUnder(nextPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [nextPath] : [];
  });
}

describe("landing hero interaction invariants", () => {
  const homeHero = source("components/home/HomeHero.tsx");
  const globals = source("app/globals.css");

  it("keeps the scroll hint visible and animated without a delayed Framer mount", () => {
    expect(homeHero).toContain("hero-scroll-highlight");
    expect(homeHero).toContain("hero-scroll-line");
    expect(homeHero).not.toContain("delay: 2.5");
    expect(globals).toContain("@keyframes hero-scroll-sweep");
    expect(globals).toContain("@keyframes hero-scroll-line");
  });

  it("does not hide the hero CTAs behind an auth-loading skeleton", () => {
    expect(homeHero).not.toContain('status === "loading"');
    expect(homeHero).not.toContain("h-14 w-full sm:w-48");
  });

  it("zooms the opening hero photo into a desktop photo frame on scroll", () => {
    expect(homeHero).toContain("data-hero-scroll-section");
    expect(homeHero).toContain("data-hero-photo-frame");
    expect(homeHero).toContain("data-hero-archive-stage");
    expect(homeHero).toContain("data-hero-archive-band");
    expect(homeHero).toContain("data-hero-archive-field");
    expect(homeHero).toContain("data-hero-photo-caption");
    expect(homeHero).toContain("data-hero-copy");
    expect(homeHero).toContain('offset: ["start start", "end end"]');
    expect(homeHero).toContain("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
    expect(homeHero).toContain("lg:h-[170svh]");
    expect(homeHero).toContain('shouldAnimateHeroScroll ? "46vw" : "65vw"');
    expect(homeHero).toContain('shouldAnimateHeroScroll ? "60vh" : "100vh"');
    expect(homeHero).toContain('shouldAnimateHeroScroll ? "16px" : "0px"');
    expect(homeHero).toContain('hidden w-[48vw] bg-cream-100/[0.84]');
    expect(homeHero).toContain('hidden w-[52vw] border-l border-cream-300/[0.55]');
    expect(homeHero).toContain("const scrollHintOpacity = useTransform");
    expect(homeHero).toContain("data-hero-scroll-hint");
    expect(homeHero).toContain(
      "opacity: shouldAnimateHeroScroll ? scrollHintOpacity : 1"
    );
    expect(homeHero).not.toContain('hidden w-[52vw] border-r');
    expect(homeHero).not.toContain("data-hero-memory-frame");
    expect(homeHero).not.toContain("data-hero-scrollytelling-copy");
    expect(homeHero).not.toMatch(/phone|iphone|device mockup/i);
  });
});

describe("home archive continuation direction", () => {
  const statsStrip = source("components/home/StatsStrip.tsx");

  it("turns the post-hero showcase into an archive landing sequence", () => {
    expect(statsStrip).toContain("data-archive-landing");
    expect(statsStrip).toContain("data-archive-proof");
    expect(statsStrip).toContain("data-archive-record");
    expect(statsStrip).toContain("border-y border-cream-50/14");
    expect(statsStrip).toContain("aspect-[2/3]");
    expect(statsStrip).toContain("AnimatePresence");
    expect(statsStrip).toContain('layoutId="archive-active-mark"');
    expect(statsStrip).not.toContain("radial-gradient");
    expect(statsStrip).not.toContain("rounded-full border border-white/20");
    expect(statsStrip).not.toContain("lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.62fr)]");
    expect(statsStrip).not.toContain('window.addEventListener("keydown"');
    expect(statsStrip).not.toContain("grid-cols-[minmax(5.75rem,6.75rem)");
  });
});

describe("home biography gallery direction", () => {
  const featuredCollections = source("components/home/FeaturedCollections.tsx");

  it("uses an editorial archive layout instead of a repeated card grid", () => {
    expect(featuredCollections).toContain("const leadBook = galleryItems[0]");
    expect(featuredCollections).toContain("const archiveBooks = galleryItems.slice(1)");
    expect(featuredCollections).toContain("01 / 04");
    expect(featuredCollections).not.toContain("renderBookCard");
    expect(featuredCollections).not.toContain("DividerMotif");
  });
});

describe("home testimonial archive folio treatment", () => {
  const testimonials = source("components/home/Testimonials.tsx");

  it("uses an archive folio instead of stacked paper cards", () => {
    expect(testimonials).toContain("data-voice-folio");
    expect(testimonials).toContain("data-voice-entry");
    expect(testimonials).not.toContain("function paperStyle");
    expect(testimonials).not.toContain("backgroundImage:");
    expect(testimonials).not.toContain("before:[clip-path:polygon");
    expect(testimonials).not.toContain("Marquee");
  });
});

describe("footer brand invariant", () => {
  it("renders the requested tagline below the logo", () => {
    expect(source("components/site/Footer.tsx")).toContain(
      "Preserve Your Legacy"
    );
  });
});

describe("site header nav active state", () => {
  const navBar = source("components/site/NavBar.tsx");

  it("uses color only to distinguish active nav links and removes the dot marker", () => {
    expect(navBar).toMatch(/active\s*\?\s*"text-ink-900"/);
    expect(navBar).toMatch(/active\s*\?\s*"text-brand-700"/);
    expect(navBar).not.toContain("italic font-medium");
    expect(navBar).not.toContain("text-brand-700 italic");
    expect(navBar).not.toContain("group-hover:opacity-100 group-hover:scale-100");
    expect(navBar).not.toContain("h-[3px] w-[3px]");
  });
});

describe("site header scroll stability", () => {
  const navBar = source("components/site/NavBar.tsx");

  it("uses hysteresis and avoids scroll-driven layout transitions", () => {
    expect(navBar).toContain("const COMPACT_SCROLL_Y = 64;");
    expect(navBar).toContain("const EXPAND_SCROLL_Y = 8;");
    expect(navBar).toContain('useMotionValueEvent(scrollY, "change"');
    expect(navBar).toContain(
      "transition-[background-color,border-color,box-shadow] duration-300"
    );
    expect(navBar).not.toContain('window.addEventListener("scroll"');
    expect(navBar).not.toContain(
      "max-w-[1320px] items-center justify-between px-4 transition-all duration-300"
    );
  });
});

describe("about process image budget", () => {
  const images = [
    "public/image/about-mendengar.webp",
    "public/image/about-merangkai.webp",
    "public/image/about-waris.webp",
  ];

  it.each(images)("%s stays below 500 KB", (imagePath) => {
    expect(statSync(join(process.cwd(), imagePath)).size).toBeLessThanOrEqual(
      500 * 1024
    );
  });
});

describe("visible UI text encoding", () => {
  const userFacingFiles = [
    ...sourceFilesUnder("app"),
    ...sourceFilesUnder("components"),
  ];

  it.each(userFacingFiles)("%s does not contain mojibake characters", (file) => {
    expect(source(file)).not.toMatch(/[\u00c3\u00c2\u00e2\ufffd]/);
  });
});
