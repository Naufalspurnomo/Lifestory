import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("family discovery gate", () => {
  it("waits for an authoritative empty inventory before showing new-family setup", () => {
    const page = source("app/app/page.tsx");
    const treeState = source("lib/hooks/useTreeState.ts");

    expect(treeState).toContain('useState<TreeInventoryState>("loading")');
    expect(treeState).toContain('setTreeInventoryState("empty")');
    expect(treeState).toContain('setTreeInventoryState("unavailable")');
    expect(page).toContain('treeInventoryState === "empty"');
    expect(page).toContain("{canShowFamilyDiscovery && (");
    expect(page).toContain('treeInventoryState === "unavailable"');
  });

  it("does not carry the prior account's created-tree state into a new session", () => {
    const page = source("app/app/page.tsx");
    const resetStart = page.indexOf("setHasCreatedTree(false);");

    expect(resetStart).toBeGreaterThanOrEqual(0);
    const resetEffect = page.slice(Math.max(0, resetStart - 80), resetStart + 80);
    expect(resetEffect).toContain("useEffect(() => {");
    expect(resetEffect).toContain("}, [userId]);");
  });
});
