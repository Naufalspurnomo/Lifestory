import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { computeRetryDelay } from "../../lib/sync/RetryQueue";

describe("data reliability retry delay", () => {
  it("keeps exponential backoff inside the jitter bounds", () => {
    // Feature: data-reliability-sync, Property 4: Exponential Backoff Bounds
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 16 }),
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 1, max: 60000 }),
        fc.integer({ min: 0, max: 1000 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
        (attempt, base, max, jitter, randomValue) => {
          const delay = computeRetryDelay(
            attempt,
            base,
            max,
            jitter,
            () => randomValue
          );
          const capped = Math.min(base * Math.pow(2, attempt), max);
          expect(delay).toBeGreaterThanOrEqual(Math.max(0, capped - jitter));
          expect(delay).toBeLessThanOrEqual(capped + jitter);
        }
      ),
      { numRuns: 100 }
    );
  });
});
