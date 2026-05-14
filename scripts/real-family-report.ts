// Run every real-family fixture through the production Sugiyama layout
// engine. For each: validate, measure, render an SVG "screenshot", and emit
// a Markdown report summarizing the results.
//
// Output directory: reports/real-families/

import * as fs from "fs";
import * as path from "path";
import { calculateSugiyamaLayout } from "../lib/tree/sugiyamaLayout";
import { validateFamilyLayout } from "../lib/tree/layoutValidation";
import {
  computeMetrics,
  type LayoutMetrics,
} from "../tests/real-families/helpers/metrics";
import { renderLayoutToSVG } from "../tests/real-families/helpers/render";
import type { FamilyNode } from "../lib/types/tree";

import { houseOfWindsor } from "../tests/real-families/fixtures/house-of-windsor";
import { victoriaDescendants } from "../tests/real-families/fixtures/queen-victoria";
import { tudorDynasty } from "../tests/real-families/fixtures/tudor-dynasty";
import { habsburgDynasty } from "../tests/real-families/fixtures/habsburg";
import { ottomanDynasty } from "../tests/real-families/fixtures/ottoman";
import { genghisKhanLineage } from "../tests/real-families/fixtures/genghis-khan";
import { asymmetricInLawsTree } from "../tests/real-families/fixtures/asymmetric-in-laws";

type Fixture = {
  slug: string;
  title: string;
  description: string;
  nodes: FamilyNode[];
  notes: string[];
};

const fixtures: Fixture[] = [
  {
    slug: "00-asymmetric-in-laws",
    title: "Asymmetric in-laws (regression)",
    description:
      "Skenario nyata user: orang tua dua sisi + satu kakek di sisi istri. Sebelum anchor-based layering, menambah satu kakek membuat orang tua user naik dan saudara user sejajar dengan mertua. Setelah fix, Admin (self) jadi anchor — saudara user selalu sejajar dengan istri, kakek istri tampil sendirian di layer teratas.",
    nodes: asymmetricInLawsTree(),
    notes: [
      "Admin (self) harus berada pada generasi yang sama dengan istri.",
      "Adek ku dan Kakak ku harus sejajar dengan Admin.",
      "Kakek istri harus di baris paling atas sendirian, 2 layer di atas Admin.",
      "Ayah/Ibu aku harus sejajar dengan Ayah/Ibu istri.",
    ],
  },
  {
    slug: "01-house-of-windsor",
    title: "House of Windsor",
    description:
      "4 generasi Keluarga Kerajaan Inggris modern (Elizabeth II → Charles III → William/Harry → cucu). Cover remarriage, divorce, banyak pasangan per orang, cucu dari 4 cabang berbeda.",
    nodes: houseOfWindsor(),
    notes: [
      "Charles III punya 2 pasangan (Diana †, Camilla) — cek apakah 2 union terpisah.",
      "Princess Anne dengan 2 pasangan (Mark Phillips → Timothy Laurence).",
      "Gen 4 berisi 11 cicit, harus tersebar proporsional di bawah masing-masing orang tua.",
    ],
  },
  {
    slug: "02-queen-victoria-descendants",
    title: "Descendants of Queen Victoria",
    description:
      "Victoria & Albert + 9 anak + pasangan & cucu pilihan. Stress-test untuk pohon yang sangat melebar di Gen 2-3.",
    nodes: victoriaDescendants(),
    notes: [
      "9 anak sekandung harus rapi tanpa tumpang tindih.",
      "Banyak pasangan antar-kerajaan Eropa; nama panjang.",
      "Cek apakah jarak horizontal Gen 2 cukup lebar untuk 9 pasangan.",
    ],
  },
  {
    slug: "03-tudor-dynasty",
    title: "House of Tudor",
    description:
      "Dinasti Tudor dari Henry VII sampai Elizabeth I. Cover banyak pernikahan (Henry VIII 6 pasangan), anak dari ibu berbeda, dan nama berulang (Henry, Edward, Elizabeth).",
    nodes: tudorDynasty(),
    notes: [
      "Henry VIII memiliki 6 union berbeda — paling berat untuk engine.",
      "3 anak Henry VIII (Mary, Elizabeth, Edward) dari 3 ibu berbeda = harus jelas di mana 'setengah-saudara' terlihat.",
    ],
  },
  {
    slug: "04-habsburg",
    title: "House of Habsburg",
    description:
      "Dinasti Habsburg pilihan: Maximilian I → Philip I → Charles V / Ferdinand I → Philip II → Philip III → Philip IV → Charles II. Fokus pada pernikahan antar-kerabat.",
    nodes: habsburgDynasty(),
    notes: [
      "Banyak pernikahan dengan sepupu dekat — cek visual garis spouse tidak kacau.",
      "7+ generasi dalam satu cabang utama.",
    ],
  },
  {
    slug: "05-ottoman-dynasty",
    title: "Ottoman Dynasty (selected)",
    description:
      "Dinasti Ottoman pilihan: Osman I → Orhan → Murad I → Bayezid I → Mehmed I → Murad II → Mehmed II. Plus consort dan anak-anak utama.",
    nodes: ottomanDynasty(),
    notes: [
      "Banyak anak dari consort berbeda = banyak half-sibling.",
      "Struktur linear (ayah-anak berantai) sampai 7 generasi.",
    ],
  },
  {
    slug: "06-genghis-khan",
    title: "Genghis Khan lineage",
    description:
      "Genghis Khan + 4 anak utama (Jochi, Chagatai, Ögedei, Tolui) + cucu-cucu kunci (Batu, Kublai, Möngke, Hulagu).",
    nodes: genghisKhanLineage(),
    notes: [
      "Banyak cabang kekaisaran: setiap anak founding dinasti Khanate sendiri.",
      "Tahun lahir/wafat kadang tidak eksak — cek tampilan ketika year = null.",
    ],
  },
];

const REPORT_DIR = path.resolve(process.cwd(), "reports", "real-families");

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatMetrics(m: LayoutMetrics): string {
  return [
    `| Metric | Value |`,
    `| --- | --- |`,
    `| **Quality grade** | **${m.qualityGrade}** (score ${m.qualityScore}/100) |`,
    `| Nodes | ${m.nodeCount} |`,
    `| Edges | ${m.edgeCount} |`,
    `| Unions | ${m.unionCount} |`,
    `| Generations | ${m.generations} |`,
    `| Canvas size | ${m.width} × ${m.height} px (aspect ${m.aspectRatio}:1) |`,
    `| Overlap pairs | ${m.overlapPairs} |`,
    `| Min same-layer spacing | ${m.sameLayerMinSpacing} px |`,
    `| Longest edge | ${m.longestEdgeLength} px |`,
    `| Average edge | ${m.averageEdgeLength} px |`,
    `| P95 edge length | ${m.edgeLengthP95} px |`,
    `| Outlier ratio (longest/avg) | ${m.edgeOutlierRatio}× |`,
    `| Max union-child skew | ${m.maxUnionChildSkew} px |`,
    `| Density (nodes per 10k px²) | ${m.density} |`,
  ].join("\n");
}

type Result = {
  slug: string;
  title: string;
  metrics: LayoutMetrics;
  issues: Array<{ severity: string; code: string; message: string }>;
  valid: boolean;
  svgPath: string;
};

function runFixture(fixture: Fixture): Result {
  const layout = calculateSugiyamaLayout(fixture.nodes);
  const validation = validateFamilyLayout(layout);
  const metrics = computeMetrics(layout);

  const svg = renderLayoutToSVG(layout, fixture.title);
  const svgPath = path.join(REPORT_DIR, `${fixture.slug}.svg`);
  fs.writeFileSync(svgPath, svg, "utf8");

  return {
    slug: fixture.slug,
    title: fixture.title,
    metrics,
    issues: validation.issues,
    valid: validation.valid,
    svgPath,
  };
}

function buildHtmlViewer(results: Result[], fixtures: Fixture[]): string {
  const cards = results
    .map((result) => {
      const fixture = fixtures.find((f) => f.slug === result.slug)!;
      const m = result.metrics;
      const gradeColor =
        m.qualityGrade === "A"
          ? "#22c55e"
          : m.qualityGrade === "B"
          ? "#84cc16"
          : m.qualityGrade === "C"
          ? "#eab308"
          : m.qualityGrade === "D"
          ? "#f97316"
          : "#ef4444";
      const reasons = m.qualityReasons
        .map((r) => `<li>${r.replaceAll("<", "&lt;")}</li>`)
        .join("");
      return `
  <section class="card">
    <header>
      <h2>${fixture.title}</h2>
      <span class="grade" style="background:${gradeColor}">${m.qualityGrade} · ${m.qualityScore}</span>
    </header>
    <p class="desc">${fixture.description.replaceAll("<", "&lt;")}</p>
    <div class="metrics">
      <span>${m.nodeCount} nodes</span>
      <span>${m.generations} gens</span>
      <span>${m.unionCount} unions</span>
      <span>${m.width}×${m.height}px (aspect ${m.aspectRatio}:1)</span>
      <span>outlier ${m.edgeOutlierRatio}×</span>
      <span>union skew ${m.maxUnionChildSkew}px</span>
    </div>
    ${reasons ? `<ul class="issues">${reasons}</ul>` : `<p class="ok">No quality concerns.</p>`}
    <div class="svg-wrap">
      <object type="image/svg+xml" data="${result.slug}.svg"></object>
    </div>
  </section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Lifestory — Real Family Layout Preview</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      font-family: Inter, system-ui, sans-serif;
      background: #f2ece1;
      margin: 0;
      color: #1d1a14;
    }
    header.page {
      padding: 24px 32px;
      background: linear-gradient(135deg, #1d1a14, #3f372b);
      color: #f9f6f1;
    }
    header.page h1 { margin: 0 0 4px 0; font-size: 22px; }
    header.page p { margin: 0; opacity: 0.8; font-size: 14px; }
    main { padding: 24px; display: grid; gap: 24px; }
    .card {
      background: #fffaf2;
      border-radius: 14px;
      box-shadow: 0 6px 24px rgba(29,26,20,0.08);
      padding: 18px 20px 22px;
    }
    .card > header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; margin-bottom: 6px;
    }
    .card h2 { font-size: 18px; margin: 0; }
    .grade {
      color: white; font-weight: 700; padding: 4px 10px;
      border-radius: 999px; font-size: 12px; letter-spacing: 0.3px;
    }
    .desc { margin: 0 0 10px; color: #5b5346; font-size: 13px; }
    .metrics {
      display: flex; flex-wrap: wrap; gap: 8px 14px;
      font-size: 11px; color: #5b5346; margin-bottom: 8px;
    }
    .metrics span {
      background: #f2ece1; padding: 3px 8px; border-radius: 6px;
    }
    .issues {
      margin: 4px 0 12px; padding-left: 18px;
      font-size: 12px; color: #b45309;
    }
    .ok { margin: 0 0 10px; color: #15803d; font-size: 12px; }
    .svg-wrap {
      border: 1px solid #e6dbc7;
      border-radius: 10px;
      overflow: auto;
      background: #f9f6f1;
      max-height: 640px;
    }
    .svg-wrap object {
      display: block; width: 100%;
    }
  </style>
</head>
<body>
  <header class="page">
    <h1>Lifestory — Real Family Layout Preview</h1>
    <p>Visual screenshot generated from the same Sugiyama layout engine used in production. Generated ${new Date().toISOString()}.</p>
  </header>
  <main>
    ${cards}
  </main>
</body>
</html>`;
}

function buildMarkdown(
  fixtures: Fixture[],
  results: Result[]
): string {
  const lines: string[] = [];
  lines.push(`# Lifestory Family Tree — Real Family Layout Report\n`);
  lines.push(
    `Generated at ${new Date().toISOString()} by \`scripts/real-family-report.ts\`.\n`
  );
  lines.push(
    `Every fixture below is fed through the *same* \`calculateSugiyamaLayout\` used by the production Canvas renderer. The inline SVGs reflect actual coordinates, not a mockup.\n`
  );

  // Summary table
  lines.push(`## Summary\n`);
  lines.push(
    `| Fixture | Nodes | Gens | Grade | Score | Overlaps | Aspect | Outlier× |`
  );
  lines.push(
    `| --- | ---: | ---: | :---: | ---: | ---: | ---: | ---: |`
  );
  for (const result of results) {
    const m = result.metrics;
    lines.push(
      `| [${result.title}](#${result.slug}) | ${m.nodeCount} | ${m.generations} | ${m.qualityGrade} | ${m.qualityScore} | ${m.overlapPairs} | ${m.aspectRatio}:1 | ${m.edgeOutlierRatio}× |`
    );
  }
  lines.push("");

  for (const fixture of fixtures) {
    const result = results.find((r) => r.slug === fixture.slug);
    if (!result) continue;

    lines.push(`\n## ${fixture.title} <a id="${result.slug}"></a>\n`);
    lines.push(fixture.description);
    lines.push("");
    lines.push(`![${fixture.title}](${result.slug}.svg)\n`);

    lines.push(`### Metrics\n`);
    lines.push(formatMetrics(result.metrics));
    lines.push("");

    const errors = result.issues.filter((i) => i.severity === "error");
    const warnings = result.issues.filter((i) => i.severity === "warning");
    lines.push(`### Validation\n`);
    lines.push(
      `- Errors: **${errors.length}**, Warnings: **${warnings.length}**`
    );
    if (errors.length > 0) {
      lines.push(`\n**Errors:**`);
      for (const e of errors.slice(0, 10)) {
        lines.push(`- \`${e.code}\`: ${e.message}`);
      }
    }
    if (warnings.length > 0) {
      lines.push(`\n**Warnings:**`);
      for (const w of warnings.slice(0, 10)) {
        lines.push(`- \`${w.code}\`: ${w.message}`);
      }
    }
    lines.push("");

    if (fixture.notes.length > 0) {
      lines.push(`### Test scenario notes\n`);
      for (const note of fixture.notes) {
        lines.push(`- ${note}`);
      }
      lines.push("");
    }

    if (result.metrics.qualityReasons.length > 0) {
      lines.push(`### Quality concerns\n`);
      for (const reason of result.metrics.qualityReasons) {
        lines.push(`- ⚠️ ${reason}`);
      }
      lines.push("");
    }
  }

  lines.push(
    `\n---\n*Sumber data: Wikipedia, Britannica, Royal.uk, historical genealogical tables. Konten diparafrase untuk kepatuhan lisensi.*`
  );
  return lines.join("\n");
}

function main() {
  ensureDir(REPORT_DIR);
  const results: Result[] = [];
  for (const fixture of fixtures) {
    process.stdout.write(`→ ${fixture.title} ... `);
    const result = runFixture(fixture);
    const status = result.valid ? "OK" : "INVALID";
    console.log(
      `${status} (${result.metrics.nodeCount} nodes, ${result.metrics.overlapPairs} overlaps)`
    );
    results.push(result);
  }

  const md = buildMarkdown(fixtures, results);
  fs.writeFileSync(path.join(REPORT_DIR, "README.md"), md, "utf8");

  const html = buildHtmlViewer(results, fixtures);
  fs.writeFileSync(path.join(REPORT_DIR, "index.html"), html, "utf8");

  console.log(
    `\nReport written to ${path.relative(process.cwd(), REPORT_DIR)}`
  );
  console.log(
    `Open reports/real-families/index.html in a browser for a visual preview.`
  );

  // Non-zero exit if any fixture was invalid.
  const anyInvalid = results.some((r) => !r.valid);
  if (anyInvalid) {
    process.exitCode = 1;
  }
}

main();
