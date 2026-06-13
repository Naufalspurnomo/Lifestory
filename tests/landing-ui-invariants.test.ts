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
