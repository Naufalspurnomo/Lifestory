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
  expect(firstIndex, `${first} must come before ${second}`).toBeLessThan(
    secondIndex
  );
}

describe("first-tree welcome persistence", () => {
  it("stores a single durable welcome marker on the user", () => {
    const schema = readSource("prisma/schema.prisma");
    const migration = readSource(
      "prisma/migrations/20260710090000_add_first_tree_welcome/migration.sql"
    );

    expect(schema).toContain("firstTreeWelcomeTreeId");
    expect(schema).toContain("firstTreeWelcomeDismissedAt");
    expect(migration).toContain('ADD COLUMN "firstTreeWelcomeTreeId"');
    expect(migration).toContain('ADD COLUMN "firstTreeWelcomeDismissedAt"');
  });

  it("only qualifies a first owner tree with one node and no collaborators", () => {
    const source = readSource("lib/tree/repository.ts");
    const createSection = source.slice(
      source.indexOf("export async function createTreeForUser"),
      source.indexOf("export async function replaceTreeNodes")
    );
    const statusSection = source.slice(
      source.indexOf("export async function getFirstTreeWelcomeTreeIdForUser"),
      source.indexOf("export async function getTreeForUser")
    );

    expect(createSection).toContain("ownedTreeHistoryCount === 0");
    expect(createSection).toContain("membershipHistoryCount === 0");
    expect(createSection).toContain("firstTreeWelcomeTreeId: null");
    expect(createSection).toContain("tx.user.updateMany");
    expect(statusSection).toContain("tree._count.nodes !== 1");
    expect(statusSection).toContain("tree._count.memberships !== 0");
  });

  it("queues one WhatsApp message with the first self node and dispatches after commit", () => {
    const repository = readSource("lib/tree/repository.ts");
    const route = readSource("app/api/trees/route.ts");
    const createSection = repository.slice(
      repository.indexOf("export async function createTreeForUser"),
      repository.indexOf("export async function replaceTreeNodes")
    );

    expect(createSection).toContain("nodes.length === 1");
    expect(createSection).toContain('nodes[0]?.line === "self"');
    expect(createSection).toContain("enqueueFirstTreeWelcome(tx");
    expect(createSection).toContain("firstTreeWhatsAppJobId: null");
    expect(route).toContain("result.firstTreeWhatsAppJobId");
    expect(route).toContain("processWhatsAppWelcomeJob");
    expect(route).toContain("First tree WhatsApp welcome dispatch failed");
  });

  it("makes dismiss owner-only and idempotent", () => {
    const source = readSource("lib/tree/repository.ts");
    const section = source.slice(
      source.indexOf("export async function dismissFirstTreeWelcome"),
      source.indexOf("export async function createTreeForUser")
    );

    expect(section).toContain("tree.ownerId !== userId");
    expect(section).toContain("firstTreeWelcomeTreeId: treeId");
    expect(section).toContain("firstTreeWelcomeDismissedAt: null");
    expect(section).toContain("firstTreeWelcomeDismissedAt: new Date()");
  });
});

describe("first-tree welcome API", () => {
  it("returns only the pending tree id with tree listings and creation", () => {
    const route = readSource("app/api/trees/route.ts");

    expect(route).toContain("getFirstTreeWelcomeTreeIdForUser");
    expect(route).toContain("onboarding: { firstTreeWelcomeTreeId }");
    expect(route).toContain(
      "onboarding: { firstTreeWelcomeTreeId: result.firstTreeWelcomeTreeId }"
    );
  });

  it("rate-limits and authenticates the owner dismissal endpoint", () => {
    const route = readSource("app/api/trees/[id]/first-tree-welcome/route.ts");
    const section = handlerSection(route, "export async function POST");

    expect(section).toContain("tree-first-welcome-dismiss");
    expect(section).toContain("requireUser");
    expect(section).toContain("dismissFirstTreeWelcome");
    expectBefore(section, "applyRateLimit", "requireUser");
    expectBefore(section, "requireUser", "dismissFirstTreeWelcome");
  });
});

describe("first-tree welcome workspace UX", () => {
  it("uses an explicit first-member form instead of creating a default root", () => {
    const discovery = readSource("components/tree/FamilyDiscoveryGate.tsx");
    const treeState = readSource("lib/hooks/useTreeState.ts");

    expect(discovery).toContain('stage === "first-member"');
    expect(discovery).toContain("Simpan dan buat pohon");
    expect(treeState).toContain("async (initialMember: InitialMemberInput)");
    expect(treeState).toContain('line: "self"');
    expect(treeState).toContain("year: initialMember.year");
  });

  it("keeps the welcome inside the canvas and hides mobile controls beneath it", () => {
    const welcome = readSource("components/tree/FirstTreeWelcome.tsx");
    const page = readSource("app/app/page.tsx");
    const canvas = readSource("components/tree/FamilyTreeCanvas.tsx");

    expect(welcome).toContain("Selamat datang di Lifestory");
    expect(welcome).toContain("Tambahkan anggota");
    expect(welcome).toContain('id: "parent"');
    expect(welcome).toContain('id: "partner"');
    expect(welcome).toContain('id: "child"');
    expect(welcome).toContain('id: "sibling"');
    expect(page).toContain("suppressBottomControls={isFirstTreeWelcomeOpen}");
    expect(canvas).toContain("suppressBottomControls = false");
    expect(canvas).toContain('hidden sm:flex');
  });
});
