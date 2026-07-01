import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { contactInquirySchema, registerSchema } from "../lib/validations";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("consent validation invariants", () => {
  it("rejects registration without explicit consent", () => {
    const result = registerSchema.safeParse({
      name: "Naufal",
      email: "naufal@example.com",
      phone: "+628889977771",
      password: "Password1",
      consentAccepted: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toContain(
        "consentAccepted"
      );
    }
  });

  it("rejects contact inquiries without explicit consent", () => {
    const result = contactInquirySchema.safeParse({
      name: "Naufal",
      email: "naufal@example.com",
      message: "Saya ingin konsultasi tentang arsip keluarga.",
      consentAccepted: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toContain(
        "consentAccepted"
      );
    }
  });
});

describe("contact consent audit invariants", () => {
  it("keeps the contact route fail-closed when consent logging fails", () => {
    const route = source("app/api/contact/route.ts");

    expect(route).toContain("Contact consent could not be recorded");
    expect(route).toContain("prisma.contactConsentLog.create");
    expect(route).not.toContain("A logging failure must not block the user");
    expect(route.indexOf("prisma.contactConsentLog.create")).toBeLessThan(
      route.indexOf("const result = await sendContactInquiryEmail")
    );
  });

  it("requires RLS and no direct Supabase API grants for ContactConsentLog", () => {
    const migration = source(
      "prisma/migrations/20260701143000_harden_contact_consent_log/migration.sql"
    );
    const audit = source("scripts/audit-database.mjs");

    expect(migration).toContain(
      'ALTER TABLE "ContactConsentLog" ENABLE ROW LEVEL SECURITY'
    );
    expect(migration).toContain('REVOKE ALL ON TABLE "ContactConsentLog"');
    expect(audit).toContain('"ContactConsentLog"');
    expect(audit).toContain("exposedContactConsentLogPrivileges");
  });
});
