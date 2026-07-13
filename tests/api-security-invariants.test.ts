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
      before: "requireUser",
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

describe("invite API invariants", () => {
  it("does not let the tree owner consume their own invite link", () => {
    const source = readSource("lib/invites.ts");
    const section = source.slice(
      source.indexOf("export async function acceptTreeInvite"),
      source.indexOf("export async function deleteExpiredTreeInvites")
    );

    expect(section).toContain("invite.tree.ownerId === userId");
    expect(section).toContain('role: "owner"');
    expectBefore(
      section,
      "invite.tree.ownerId === userId",
      "tx.treeMember.upsert"
    );
    expectBefore(
      section,
      "invite.tree.ownerId === userId",
      "tx.treeInvite.updateMany"
    );
  });

  it("checks an invite token before deleting expired invite rows", () => {
    const section = handlerSection(
      readSource("app/api/invites/[token]/route.ts"),
      "export async function GET"
    );

    expect(section).toContain("getTreeInviteByToken(token)");
    expect(section).toContain("deleteExpiredTreeInvites");
    expect(section).toContain("Invite has expired");
    expect(section).toContain("{ status: 410 }");
    expectBefore(
      section,
      "getTreeInviteByToken(token)",
      "deleteExpiredTreeInvites"
    );
    expectBefore(
      section,
      "invite.expiresAt.getTime() < Date.now()",
      "deleteExpiredTreeInvites"
    );
  });

  it("builds family access request email links through login to the request inbox", () => {
    const source = readSource("lib/email.ts");
    const section = source.slice(
      source.indexOf("export async function sendFamilyAccessRequestEmail"),
      source.indexOf("export async function sendContactInquiryEmail")
    );

    expect(section).toContain("new URL(\"/auth/login\", appUrl)");
    expect(section).toContain(
      "loginUrl.searchParams.set(\"next\", \"/app?panel=requests\")"
    );
    expect(section).toContain("Request akses baru ke pohon Lifestory Anda");
    expect(section).toContain("Review request");
    expect(section).toContain("escapeHtml(reviewUrl)");
    expect(section).toContain("replyTo: requesterEmail");
  });

  it("opens the family access inbox from /app?panel=requests", () => {
    const source = readSource("app/app/page.tsx");

    expect(source).toContain('url.searchParams.get("panel") !== "requests"');
    expect(source).toContain("setShowAccessInbox(true)");
    expect(source).toContain('url.searchParams.delete("panel")');
    expect(source).toContain("window.history.replaceState");
    expectBefore(
      source,
      'url.searchParams.get("panel") !== "requests"',
      "setShowAccessInbox(true)"
    );
  });
});

describe("tree action menu invariants", () => {
  it("keeps the tree action menus controlled and click-outside closable", () => {
    const source = readSource("app/app/page.tsx");

    expect(source).toContain(
      'const [openActionMenu, setOpenActionMenu] = useState<ActionMenuKey | null>(null);'
    );
    expect(source).toContain("mobileActionMenuRef");
    expect(source).toContain("desktopActionMenuRef");
    expect(source).toContain('document.addEventListener("pointerdown", handlePointerDown, true)');
    expect(source).toContain("toggleActionMenu(group.key)");
    expect(source).toContain("aria-expanded={isOpen}");
    expect(source).toContain("setOpenActionMenu(null);");
    expect(source).not.toContain('closest("details")');
    expect(source).not.toContain('removeAttribute("open")');
  });
});

describe("public auth and gallery hardening invariants", () => {
  it("blocks unverified accounts at login, middleware, and API authorization", () => {
    const authOptions = readSource("lib/auth/options.ts");
    const middleware = readSource("middleware.ts");
    const authHelpers = readSource("lib/auth-helpers.ts");

    expect(authOptions).toContain('user.status === "pending_email"');
    expect(authOptions).toContain('throw new Error("EMAIL_UNVERIFIED")');
    expect(middleware).toContain('accountStatus === "pending_email"');
    expect(authHelpers).toContain('session.user.status === "pending_email"');
  });

  it("requires an admin and matching target email before deleting a test account", () => {
    const source = readSource("app/api/users/[id]/route.ts");

    expect(source).toContain("export async function DELETE");
    expect(source).toContain("requireAdmin()");
    expect(source).toContain("deleteUserSchema");
    expect(source).toContain('target.role === "admin"');
    expect(source).toContain("target._count.trees > 0");
    expect(source).toContain("confirmationEmail.toLowerCase()");
  });

  it("keeps registration throttled to five attempts per IP per hour", () => {
    const source = readSource("lib/rate-limit.ts");

    expect(source).toContain(
      "register: { windowMs: 60 * 60 * 1000, maxRequests: 5 }"
    );
  });

  it("checks duplicate registration emails before hashing and inserting verification records", () => {
    const section = handlerSection(
      readSource("app/api/auth/register/route.ts"),
      "export async function POST"
    );

    expect(section).toContain("prisma.user.findUnique");
    expect(section).toContain("where: { email }");
    expect(section).toContain('message: "Registration received"');
    expect(section).toContain("tx.user.create");
    expect(section).toContain("tx.emailVerificationToken.create");
    expectBefore(section, "prisma.user.findUnique", "hash(password");
    expectBefore(section, "prisma.user.findUnique", "tx.user.create");
    expectBefore(section, "tx.user.create", "tx.emailVerificationToken.create");
  });

  it("keeps an existing verification link valid when a resend cannot be delivered", () => {
    const source = readSource("app/api/auth/resend-verification/route.ts");

    expect(source).toContain("const replacement = await prisma.emailVerificationToken.create");
    expect(source).toContain("if (emailResult.ok)");
    expect(source).toContain("id: { not: replacement.id }");
    expect(source).toContain("await prisma.emailVerificationToken.delete({ where: { id: replacement.id } })");
  });

  it("redirects after successful credential login without extra session refresh work", () => {
    const source = readSource("components/auth/AuthCurtain.tsx");
    const section = source.slice(
      source.indexOf("async function handleLogin"),
      source.indexOf("async function handleRegister")
    );

    expect(section).toContain("callbackUrl: safeNext");
    expect(section).toContain("redirectToSafeNext()");
    expect(section).not.toContain("await update");
    expect(section).not.toContain("router.refresh");
  });

  it("uses the same public PDF error for missing and unavailable catalog entries", () => {
    const source = readSource("app/api/gallery-pdf/[slug]/route.ts");

    expect(source).toContain('const genericPdfError = { error: "PDF unavailable." }');
    expect(source).not.toContain("PDF not found.");
    expect(source).not.toContain("Unable to load PDF file.");
  });
});
