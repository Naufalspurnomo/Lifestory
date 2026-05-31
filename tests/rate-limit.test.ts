import { describe, expect, it } from "vitest";
import { getClientIdentifier } from "../lib/rate-limit";

describe("rate limit client identifier", () => {
  it("prefers Vercel's stable forwarded IP header", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "203.0.113.10",
      "x-forwarded-for": "198.51.100.20",
      "x-real-ip": "192.0.2.30",
    });

    expect(getClientIdentifier({ headers })).toBe("203.0.113.10");
  });

  it("falls back to the first forwarded IP outside Vercel", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.20, 192.0.2.30",
    });

    expect(getClientIdentifier({ headers })).toBe("198.51.100.20");
  });
});
