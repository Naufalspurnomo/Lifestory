import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("app header account menu", () => {
  it("replaces the passive account label with an accessible account menu", () => {
    const page = source("app/app/page.tsx");

    expect(page).toContain('import { signOut, useSession } from "next-auth/react";');
    expect(page).toContain('const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);');
    expect(page).toContain('aria-haspopup="menu"');
    expect(page).toContain('role="menu"');
    expect(page).not.toContain("accountRoleLabel");
  });

  it("keeps account actions useful and closes the menu safely", () => {
    const page = source("app/app/page.tsx");

    expect(page).toContain('href: "/dashboard"');
    expect(page).toContain('href: "/subscribe"');
    expect(page).toContain('href: "/gallery"');
    expect(page).toContain('void signOut({ callbackUrl: "/" });');
    expect(page).toContain('document.addEventListener("pointerdown", handlePointerDown, true);');
    expect(page).toContain('setIsAccountMenuOpen(false);');
  });
});
