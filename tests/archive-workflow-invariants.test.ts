import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("living archive workflow", () => {
  it("keeps public contributors text-only with optional identity context", () => {
    const schema = source("lib/validations.ts");
    const page = source("app/contribute/[token]/page.tsx");
    expect(schema).toContain('kind: z.literal("story")');
    expect(schema).toContain("contributorName");
    expect(schema).toContain("relationshipToFamily");
    expect(page).toContain("Tidak perlu membuat akun");
  });

  it("publishes a story, approves its proposal, and audits in one transaction", () => {
    const route = source("app/api/trees/[id]/proposals/[proposalId]/publish/route.ts");
    expect(route).toContain("canManageMembers");
    expect(route).toContain("prisma.$transaction");
    expect(route).toContain("tx.story.create");
    expect(route).toContain('status: "approved"');
    expect(route).toContain("contribution.published");
  });

  it("keeps archive curation owner-only in the workspace", () => {
    const app = source("app/app/page.tsx");
    expect(app).toContain("ArchiveDesk");
    expect(app).toContain("treeCapabilities.canManageMembers");
    expect(app).toContain("onRequestMemory");
    expect(source("app/api/trees/[id]/contribution-requests/route.ts")).toContain("canManageMembers");
  });
});
