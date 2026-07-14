import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("global toast notification invariants", () => {
  it("mounts one quiet-archive Sonner toaster at the application root", () => {
    const layout = readSource("app/layout.tsx");
    const toaster = readSource("components/ui/AppToaster.tsx");
    const packageJson = JSON.parse(readSource("package.json"));

    expect(packageJson.dependencies.sonner).toBe("2.0.7");
    expect(layout.match(/<AppToaster \/>/g)).toHaveLength(1);
    expect(toaster).toContain('position="top-center"');
    expect(toaster).toContain("visibleToasts={3}");
    expect(toaster).toContain("closeButton");
    expect(toaster).toContain("containerAriaLabel");
    expect(toaster).toContain("!bg-cream-50");
    expect(toaster).toContain("lifestory-toaster--workspace");
  });

  it("keeps responsive workspace offsets and reduced motion", () => {
    const css = readSource("app/globals.css");

    expect(css).toContain("--mobile-offset-top: 172px");
    expect(css).toContain("--offset-top: 120px");
    expect(css).toContain("--offset-top: 80px");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("replaces the legacy workspace notification with typed toasts and undo", () => {
    const workspace = readSource("app/app/page.tsx");

    expect(workspace).not.toContain("setNotification");
    expect(workspace).not.toContain("showNotification");
    expect(workspace).toContain("toast.success");
    expect(workspace).toContain("toast.warning");
    expect(workspace).toContain("toast.error");
    expect(workspace).toContain("duration: 6000");
    expect(workspace).toContain("label: copy.undo");
    expect(workspace).toContain("undo();");
  });

  it("removes browser alerts and reports operational clipboard failures", () => {
    const dashboard = readSource("app/dashboard/page.tsx");
    const invite = readSource("components/tree/InviteModal.tsx");
    const archive = readSource("components/tree/ArchiveDesk.tsx");

    expect(dashboard).not.toMatch(/\balert\s*\(/);
    expect(dashboard).toContain("toast.success");
    expect(dashboard).toContain("toast.error");
    expect(invite).toContain("await navigator.clipboard.writeText");
    expect(invite).toContain("toast.error");
    expect(archive).toContain("toast.success");
    expect(archive).toContain("toast.error");
  });
});
