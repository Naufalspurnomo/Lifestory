import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

const landingFiles = [
  "app/page.tsx",
  "app/about/page.tsx",
  "app/globals.css",
  "tailwind.config.js",
];

const landingDirs = [
  "components/home",
  "components/about",
  "components/site",
  "components/ui",
];

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(path.join(projectRoot, dir), {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile() && /\.(tsx|ts|css|js)$/.test(entry.name))
    .map((entry) => path.join(dir, entry.name).replace(/\\/g, "/"));
}

async function readSources(files: string[]) {
  const pairs = await Promise.all(
    files.map(async (file) => {
      const source = await readFile(path.join(projectRoot, file), "utf8");
      return [file, source] as const;
    })
  );

  return pairs;
}

describe("landing design integrity", () => {
  it("keeps public landing surfaces on the logo palette", async () => {
    const files = [
      ...landingFiles,
      ...(await Promise.all(landingDirs.map(collectFiles))).flat(),
    ];
    const deprecatedPalette = [
      "#e6ab2f",
      "#cc8a12",
      "#a8741e",
      "#d4af37",
      "#aa8323",
      "#c48b24",
      "#b07f2f",
      "#9b845f",
      "rgba(230,171,47",
      "rgba(204,138,18",
      "rgba(212,175,55",
    ];

    const offenders = (await readSources(files)).flatMap(([file, source]) =>
      deprecatedPalette
        .filter((token) => source.includes(token))
        .map((token) => `${file}: ${token}`)
    );

    expect(offenders).toEqual([]);
  });

  it("does not use generic blurred blob decoration on home/about landing sections", async () => {
    const files = [
      "app/page.tsx",
      "app/about/page.tsx",
      ...(await collectFiles("components/home")),
      ...(await collectFiles("components/about")),
    ];

    const offenders = (await readSources(files)).flatMap(([file, source]) => {
      const matches = source.match(/blur-(?:2xl|3xl|\[120px\])/g) ?? [];
      return matches.map((match) => `${file}: ${match}`);
    });

    expect(offenders).toEqual([]);
  });

  it("keeps marketing pages on stable section layout instead of scroll-scale wrappers", async () => {
    const files = ["app/page.tsx", "app/about/page.tsx"];
    const unstableWrappers = ["ScrollScale", "SectionZoom", "ParallaxLayer"];

    const offenders = (await readSources(files)).flatMap(([file, source]) =>
      unstableWrappers
        .filter((token) => source.includes(token))
        .map((token) => `${file}: ${token}`)
    );

    expect(offenders).toEqual([]);
  });

  it("keeps primary landing CTAs mobile-first", async () => {
    const files = ["components/home/HomeHero.tsx", "app/about/page.tsx"];
    const offenders = (await readSources(files)).flatMap(([file, source]) => {
      const hasStackedCta = source.includes("flex-col") && source.includes("sm:flex-row");
      const hasFullWidthMobile = source.includes("w-full sm:w-auto");
      return hasStackedCta && hasFullWidthMobile ? [] : [file];
    });

    expect(offenders).toEqual([]);
  });

  it("keeps the home hero copy static while scrolling", async () => {
    const source = await readFile(
      path.join(projectRoot, "components/home/HomeHero.tsx"),
      "utf8"
    );

    expect(source).not.toContain("heroY");
    expect(source).not.toContain("style={{ y: heroY }}");
  });

  it("keeps the home trust badges textual and responsive", async () => {
    const source = await readFile(
      path.join(projectRoot, "components/home/HomeHero.tsx"),
      "utf8"
    );
    const badgeBlock = source.slice(
      source.indexOf("{/* Trust badges */}"),
      source.indexOf("{/* Scroll hint */}")
    );

    expect(badgeBlock).toContain("flex max-w-full flex-wrap items-center");
    expect(badgeBlock).toContain("h-4 w-px flex-none bg-ink-300/50");
    expect(badgeBlock).toContain("italic");
    expect(badgeBlock).not.toContain("basis-[calc(50%-0.375rem)]");
    expect(badgeBlock).not.toContain("rounded-card");
    expect(badgeBlock).not.toContain("bg-cream-50/95");
    expect(badgeBlock).not.toContain("md:grid md:grid-cols-4");
    expect(badgeBlock).not.toContain("whitespace-nowrap");
    expect(badgeBlock).not.toContain("border-t border-cream-300");
  });

  it("does not use long dash separators in public landing copy", async () => {
    const source = [
      await readFile(path.join(projectRoot, "app/page.tsx"), "utf8"),
      await readFile(path.join(projectRoot, "app/about/page.tsx"), "utf8"),
    ].join("\n");

    expect(source).not.toContain("—");
    expect(source).not.toContain("–");
    expect(source).not.toContain("â€”");
    expect(source).not.toContain("Ã¢â‚¬â€");
  });
});
