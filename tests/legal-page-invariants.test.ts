import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("legal document pages", () => {
  const legalView = source("components/legal/LegalDocumentView.tsx");
  const terms = source("app/terms/page.tsx");
  const privacy = source("app/privacy-policy/page.tsx");
  const consent = source("lib/legal/consent.ts");

  it("renders related legal links instead of keeping them as unused data", () => {
    expect(legalView).toContain("block.links.map");
    expect(legalView).toContain("download={link.download}");
    expect(legalView).toContain("relatedLabel");
  });

  it("keeps the legal layout restrained and avoids the old decorative hero treatment", () => {
    expect(legalView).not.toContain("bg-grain bg-grain");
    expect(legalView).not.toContain("6.8rem");
    expect(legalView).toContain("summaryItems");
    expect(legalView).toContain("font-serif text-[clamp(2.6rem,7vw,5.2rem)]");
  });

  it("keeps terms specific to family authority and publication permission", () => {
    expect(terms).toContain("Kewenangan Keluarga");
    expect(terms).toContain("tanpa persetujuan tertulis terpisah");
    expect(terms).toContain("Lifestory bukan penyedia nasihat hukum");
  });

  it("keeps privacy grounded in PDP rights and no data selling", () => {
    expect(privacy).toContain("Undang-Undang No. 27 Tahun 2022");
    expect(privacy).toContain("Kami tidak menjual data pribadi");
    expect(privacy).toContain("Hak Subjek Data");
  });

  it("bumps the consent version when legal copy changes materially", () => {
    expect(consent).toContain('CONSENT_POLICY_VERSION = "2026-07-05"');
    expect(consent).toContain('LEGAL_EFFECTIVE_DATE = "5 Juli 2026"');
  });
});
