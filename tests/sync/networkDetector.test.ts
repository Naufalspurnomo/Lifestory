import { afterEach, describe, expect, it, vi } from "vitest";
import { NetworkDetector } from "../../lib/sync/NetworkDetector";

const originalNavigator = globalThis.navigator;

afterEach(() => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: originalNavigator,
  });
});

describe("NetworkDetector", () => {
  it("probes health even when navigator.onLine is stale false", async () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { onLine: false },
    });
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    const detector = new NetworkDetector(
      "/api/health",
      30_000,
      fetchMock as unknown as typeof fetch
    );

    expect(detector.isOnline()).toBe(false);
    await expect(detector.check()).resolves.toBe(true);
    expect(detector.isOnline()).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("retains the health failure reason for the sync status surface", async () => {
    const detector = new NetworkDetector(
      "/api/health",
      30_000,
      vi.fn(async () => new Response("{}", { status: 503 })) as unknown as typeof fetch
    );

    await expect(detector.check()).resolves.toBe(false);
    expect(detector.getLastError()).toBe("Health check failed with HTTP 503");
  });
});
