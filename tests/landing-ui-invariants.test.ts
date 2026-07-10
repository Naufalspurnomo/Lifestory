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
    expect(homeHero).toContain("data-hero-photo-caption");
    expect(homeHero).toContain("data-hero-copy");
    expect(homeHero).toContain('offset: ["start start", "end end"]');
    expect(homeHero).toContain("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
    expect(homeHero).toContain("lg:h-[170svh]");
    expect(homeHero).toContain('shouldAnimateHeroScroll ? "46vw" : "65vw"');
    expect(homeHero).toContain('shouldAnimateHeroScroll ? "60vh" : "100vh"');
    expect(homeHero).toContain('shouldAnimateHeroScroll ? "16px" : "0px"');
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
