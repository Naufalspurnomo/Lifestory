import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function handlerSection(source: string, signature: string): string {
  const start = source.indexOf(signature);
  expect(start, `${signature} not found`).toBeGreaterThanOrEqual(0);

  const nextHandler = source.indexOf("\nexport async function ", start + 1);
  return nextHandler === -1 ? source.slice(start) : source.slice(start, nextHandler);
}

function expectBefore(source: string, first: string, second: string) {
  const firstIndex = source.indexOf(first);
  const secondIndex = source.indexOf(second);

  expect(firstIndex, `${first} not found`).toBeGreaterThanOrEqual(0);
  expect(secondIndex, `${second} not found`).toBeGreaterThanOrEqual(0);
  expect(firstIndex, `${first} should appear before ${second}`).toBeLessThan(
    secondIndex
  );
}

describe("tree mutation API security invariants", () => {
  const guardedMutations = [
    {
      file: "app/api/trees/route.ts",
      signature: "export async function POST",
      endpoint: "tree-create",
      before: "requireActiveSubscriber",
    },
    {
      file: "app/api/trees/[id]/route.ts",
      signature: "export async function PUT",
      endpoint: "tree-replace",
      before: "requireUser",
    },
    {
      file: "app/api/trees/[id]/route.ts",
      signature: "export async function DELETE",
      endpoint: "tree-delete",
      before: "requireUser",
      hasJsonBody: false,
    },
    {
      file: "app/api/trees/[id]/sync/route.ts",
      signature: "export async function POST",
      endpoint: "tree-sync",
      before: "requireUser",
    },
  ];

  it.each(guardedMutations)(
    "$endpoint applies rate limiting before auth and persistence work",
    ({ file, signature, endpoint, before, hasJsonBody = true }) => {
      const section = handlerSection(readSource(file), signature);

      expect(section).toContain("applyRateLimit");
      expect(section).toContain(endpoint);
      expectBefore(section, "applyRateLimit", before);
      if (hasJsonBody) {
        expectBefore(section, "applyRateLimit", "parseJsonBody");
      }
    }
  );
});

describe("public auth and gallery hardening invariants", () => {
  it("keeps registration throttled to five attempts per IP per hour", () => {
    const source = readSource("lib/rate-limit.ts");

    expect(source).toContain(
      "register: { windowMs: 60 * 60 * 1000, maxRequests: 5 }"
    );
  });

  it("checks duplicate registration emails before hashing and inserting", () => {
    const section = handlerSection(
      readSource("app/api/auth/register/route.ts"),
      "export async function POST"
    );

    expect(section).toContain("prisma.user.findUnique");
    expect(section).toContain("where: { email }");
    expect(section).toContain('message: "Registration received"');
    expectBefore(section, "prisma.user.findUnique", "hash(password");
    expectBefore(section, "prisma.user.findUnique", "prisma.user.create");
  });

  it("uses the same public PDF error for missing and unavailable catalog entries", () => {
    const source = readSource("app/api/gallery-pdf/[slug]/route.ts");

    expect(source).toContain('const genericPdfError = { error: "PDF unavailable." }');
    expect(source).not.toContain("PDF not found.");
    expect(source).not.toContain("Unable to load PDF file.");
  });
});
