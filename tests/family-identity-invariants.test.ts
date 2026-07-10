import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import type { FamilyNode } from "../lib/types/tree";
import {
  buildDiscoveryMatchKeys,
  buildTreeMatchKeys,
  normalizeIdentityText,
  scoreMatchedFamilyKeys,
} from "../lib/family-identity";

process.env.FAMILY_MATCH_SECRET = "family-identity-test-secret";

function familyNode(id: string, overrides: Partial<FamilyNode> = {}): FamilyNode {
  return {
    id,
    label: id,
    year: null,
    deathYear: null,
    parentId: null,
    parentIds: [],
    adoptiveParentIds: [],
    partners: [],
    childrenIds: [],
    generation: 0,
    line: "default",
    imageUrl: null,
    content: { description: "", media: [] },
    works: [],
    ...overrides,
  };
}

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

describe("family identity normalization", () => {
  it("normalizes case, punctuation, spaces, and common honorifics", () => {
    expect(normalizeIdentityText("  Bapak H. RIDUAN   Santoso, ")).toBe(
      "riduan santoso"
    );
  });

  it("creates stable HMAC keys without leaking raw names", () => {
    const first = buildDiscoveryMatchKeys({
      personName: "Naufal Santoso",
      fatherName: "Riduan Santoso",
      motherName: "Suwahi",
      consentAccepted: true,
    });
    const second = buildDiscoveryMatchKeys({
      personName: " naufal santoso ",
      fatherName: "RIDUAN SANTOSO",
      motherName: "Ibu Suwahi",
      consentAccepted: true,
    });

    expect(first.map((key) => key.keyHash)).toEqual(
      second.map((key) => key.keyHash)
    );
    expect(JSON.stringify(first)).not.toContain("Riduan");
    expect(JSON.stringify(first)).not.toContain("Suwahi");
  });
});

describe("family matching score", () => {
  it("scores a parent pair plus the child identity as a high-confidence match", () => {
    const father = familyNode("father", {
      label: "Riduan Santoso",
      childrenIds: ["naufal"],
      partners: ["mother"],
    });
    const mother = familyNode("mother", {
      label: "Suwahi",
      childrenIds: ["naufal"],
      partners: ["father"],
    });
    const child = familyNode("naufal", {
      label: "Naufal Santoso",
      year: 1998,
      parentId: "father",
      parentIds: ["father", "mother"],
    });

    const score = scoreMatchedFamilyKeys(
      buildDiscoveryMatchKeys({
        personName: "Naufal Santoso",
        birthYear: 1998,
        fatherName: "Riduan Santoso",
        motherName: "Suwahi",
        consentAccepted: true,
      }),
      buildTreeMatchKeys([father, mother, child])
    );

    expect(score.score).toBeGreaterThanOrEqual(12);
    expect(score.reasons).toEqual(
      expect.arrayContaining([
        "Pasangan orang tua cocok",
        "Nama dan pasangan orang tua cocok",
      ])
    );
  });

  it("does not treat a single parent name as a displayable candidate", () => {
    const father = familyNode("father", {
      label: "Riduan Santoso",
      childrenIds: ["naufal"],
    });
    const child = familyNode("naufal", {
      label: "Naufal Santoso",
      parentId: "father",
      parentIds: ["father"],
    });

    const score = scoreMatchedFamilyKeys(
      buildDiscoveryMatchKeys({
        personName: "Naufal Santoso",
        fatherName: "Riduan Santoso",
        consentAccepted: true,
      }),
      buildTreeMatchKeys([father, child])
    );

    expect(score.score).toBeLessThan(6);
  });
});

describe("family identity API invariants", () => {
  const guardedRoutes = [
    {
      file: "app/api/family-discovery/profile/route.ts",
      signature: "export async function POST",
      endpoint: "family-discovery-profile",
      before: "requireUser",
      hasJsonBody: true,
    },
    {
      file: "app/api/family-discovery/candidates/route.ts",
      signature: "export async function GET",
      endpoint: "family-discovery-candidates",
      before: "requireUser",
      hasJsonBody: false,
    },
    {
      file: "app/api/family-access-requests/route.ts",
      signature: "export async function POST",
      endpoint: "family-access-request-create",
      before: "requireUser",
      hasJsonBody: true,
    },
    {
      file: "app/api/family-access-requests/[id]/route.ts",
      signature: "export async function PATCH",
      endpoint: "family-access-request-review",
      before: "requireUser",
      hasJsonBody: true,
    },
    {
      file: "app/api/family-evidence/route.ts",
      signature: "export async function POST",
      endpoint: "family-evidence-create",
      before: "requireUser",
      hasJsonBody: true,
    },
  ];

  it.each(guardedRoutes)(
    "$endpoint rate-limits before auth, body parsing, and persistence",
    ({ file, signature, endpoint, before, hasJsonBody }) => {
      const section = handlerSection(readSource(file), signature);

      expect(section).toContain("applyRateLimit");
      expect(section).toContain(endpoint);
      expectBefore(section, "applyRateLimit", before);
      if (hasJsonBody) {
        expectBefore(section, "applyRateLimit", "parseJsonBody");
      }
    }
  );

  it("does not expose family node lists from discovery candidates", () => {
    const source = readSource("lib/family-identity.ts");
    const candidateSection = source.slice(
      source.indexOf("return visible.map"),
      source.indexOf("export async function getFamilyCandidatesForUser")
    );

    expect(source).toContain("SafeFamilyCandidate");
    expect(candidateSection).not.toContain("nodes:");
    expect(candidateSection).toContain("memberCount");
    expect(candidateSection).toContain("maskedOwnerName");
  });

  it("notifies the tree owner only after a new access request is persisted", () => {
    const domainSource = readSource("lib/family-identity.ts");
    const requestSection = domainSource.slice(
      domainSource.indexOf("export async function requestFamilyAccess"),
      domainSource.indexOf("export async function listFamilyAccessRequests")
    );
    const routeSection = handlerSection(
      readSource("app/api/family-access-requests/route.ts"),
      "export async function POST"
    );

    expect(requestSection).toContain("prisma.familyAccessRequest.create");
    expect(requestSection).toContain("notification:");
    expect(requestSection).toContain("ownerEmail");
    expect(requestSection).toContain("existingPending");
    expectBefore(
      requestSection,
      "const existingPending",
      "prisma.familyAccessRequest.create"
    );
    expect(routeSection).toContain("sendFamilyAccessRequestEmail");
    expect(routeSection).toContain(
      "[family-access] Request notification email was not sent"
    );
    expect(routeSection).toContain("const { notification, ...response } = result");
    expectBefore(
      routeSection,
      "const result = await requestFamilyAccess",
      "sendFamilyAccessRequestEmail"
    );
    expectBefore(
      routeSection,
      "sendFamilyAccessRequestEmail",
      "const { notification, ...response } = result"
    );
  });

  it("claims a pending access request before granting tree membership", () => {
    const source = readSource("lib/family-identity.ts");
    const reviewSection = source.slice(
      source.indexOf("export async function reviewFamilyAccessRequest"),
      source.indexOf("export async function createFamilyEvidence")
    );

    expect(reviewSection).toContain("tx.familyAccessRequest.updateMany");
    expect(reviewSection).toContain('where: { id: request.id, status: "pending" }');
    expect(reviewSection).toContain("claimed.count !== 1");
    expectBefore(
      reviewSection,
      "tx.familyAccessRequest.updateMany",
      "tx.treeMember.upsert"
    );
  });

  it("hashes document evidence before persistence", () => {
    const source = readSource("lib/family-identity.ts");
    const evidenceSection = source.slice(source.indexOf("export async function createFamilyEvidence"));

    expect(evidenceSection).toContain("hashSensitiveIdentifier(input.documentValue)");
    expectBefore(evidenceSection, "hashSensitiveIdentifier", "prisma.familyEvidence.create");
    expect(evidenceSection).not.toContain("documentValue:");
  });
});
