import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("studio journey", () => {
  it("limits project information to tree members", () => {
    const route = source("app/api/trees/[id]/studio/route.ts");

    expect(route).toContain("requireUser");
    expect(route).toContain("getTreeAccessContext(id, auth.session.user.id)");
    expect(route).toContain("prisma.studioLead.findFirst");
    expect(route).toContain("prisma.studioDeliverable.findMany");
    expect(route).toContain("storageKeyBelongsToTree(storageKey, id)");
    expect(route).toContain('"Cache-Control": "private, no-store, max-age=0"');
  });

  it("keeps the studio journey grounded in delivery and archive trust", () => {
    const panel = source("components/tree/StudioJourney.tsx");
    const app = source("app/app/page.tsx");

    expect(panel).toContain("Perjalanan keluarga");
    expect(panel).toContain("Kontribusi keluarga menunggu persetujuan");
    expect(panel).toContain("Akses keluarga dikelola per peran");
    expect(app).toContain("StudioJourney");
    expect(app).toContain("setIsStudioJourneyOpen(true)");
    expect(panel).toContain('href={item.readUrl}');
    expect(panel).toContain('event.key === "Escape"');
  });

  it("defaults new personal archive content to private visibility", () => {
    const validations = source("lib/validations.ts");
    const storySection = validations.slice(
      validations.indexOf("export const storyCreateSchema"),
      validations.indexOf("export const contributionRequestSchema")
    );
    const mediaSection = validations.slice(
      validations.indexOf("export const mediaAssetCreateSchema"),
      validations.indexOf("export const studioLeadSchema")
    );

    expect(storySection).toContain('.default("private")');
    expect(mediaSection).toContain('.default("private")');
  });
});
