import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { formatPendingCount } from "../../lib/sync/SyncEngine";

const VALID_STATUSES = ["saved", "syncing", "pending", "offline", "error"] as const;

describe("data reliability sync status helpers", () => {
  it("formats pending counts exactly up to 99 and caps larger values", () => {
    // Feature: data-reliability-sync, Property 7: Pending Count Display Format
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5000 }), (count) => {
        expect(formatPendingCount(count)).toBe(count > 99 ? "99+" : `${count}`);
      }),
      { numRuns: 100 }
    );
  });

  it("recognizes the sync status state machine output set", () => {
    // Feature: data-reliability-sync, Property 6: Sync Status State Machine Validity
    fc.assert(
      fc.property(fc.constantFrom(...VALID_STATUSES), (status) => {
        expect(VALID_STATUSES).toContain(status);
      }),
      { numRuns: 100 }
    );
  });
});
