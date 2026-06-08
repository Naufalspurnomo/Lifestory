import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";

type HeaderEntry = { key: string; value: string };
type HeaderRule = { source: string; headers: HeaderEntry[] };

const projectRoot = process.cwd();
const requireConfig = createRequire(import.meta.url);

async function listRouteFiles(dir = path.join(projectRoot, "app", "api")) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listRouteFiles(fullPath);
      return entry.isFile() && entry.name === "route.ts" ? [fullPath] : [];
    })
  );
  return files.flat();
}

function relativePath(filePath: string) {
  return path.relative(projectRoot, filePath).replace(/\\/g, "/");
}

describe("security architecture invariants", () => {
  it("keeps the global HTTP security headers enabled", async () => {
    const nextConfig = requireConfig("../next.config.js") as {
      headers: () => Promise<HeaderRule[]>;
    };
    const rules = await nextConfig.headers();
    const globalRule = rules.find((rule) => rule.source === "/:path*");

    expect(globalRule, "global header rule").toBeDefined();
    const headers = new Map(
      globalRule?.headers.map((header) => [header.key, header.value])
    );

    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(headers.get("Strict-Transport-Security")).toContain("max-age=31536000");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");

    const csp = headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("does not parse API JSON bodies without the shared size guard", async () => {
    const routeFiles = await listRouteFiles();
    const unsafeRoutes: string[] = [];

    for (const filePath of routeFiles) {
      const source = await readFile(filePath, "utf8");
      if (source.includes(".json()")) {
        unsafeRoutes.push(relativePath(filePath));
      }
    }

    expect(unsafeRoutes).toEqual([]);
  });

  it("rate-limits storage and recovery write routes", async () => {
    const guardedRoutes = [
      "app/api/media/delete/route.ts",
      "app/api/media/presign/route.ts",
      "app/api/trees/[id]/recover/route.ts",
      "app/api/trees/[id]/snapshots/route.ts",
      "app/api/trees/[id]/snapshots/[snapshotId]/restore/route.ts",
    ];
    const missingRateLimit: string[] = [];

    for (const route of guardedRoutes) {
      const source = await readFile(path.join(projectRoot, route), "utf8");
      if (!source.includes("applyRateLimit(")) {
        missingRateLimit.push(route);
      }
    }

    expect(missingRateLimit).toEqual([]);
  });

  it("keeps user-owned tree and media routes behind session auth", async () => {
    const routeFiles = (await listRouteFiles()).filter((filePath) => {
      const route = relativePath(filePath);
      return route.startsWith("app/api/trees/") || route.startsWith("app/api/media/");
    });
    const unauthenticatedRoutes: string[] = [];

    for (const filePath of routeFiles) {
      const source = await readFile(filePath, "utf8");
      const hasAuthGuard =
        source.includes("requireUser(") ||
        source.includes("requireActiveSubscriber(") ||
        source.includes("requireAdmin(");
      if (!hasAuthGuard) {
        unauthenticatedRoutes.push(relativePath(filePath));
      }
    }

    expect(unauthenticatedRoutes).toEqual([]);
  });
});
