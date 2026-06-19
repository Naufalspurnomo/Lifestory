import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { RetryQueue, computeRetryDelay } from "../lib/sync/RetryQueue";

const baseConfig = {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 60000,
  jitter: 500,
};

// A deterministic clock + RNG so backoff math is fully reproducible.
function deterministicQueue(startTime = 0, randomValue = 0.5) {
  let clock = startTime;
  return {
    advance(ms: number) {
      clock += ms;
    },
    set(ms: number) {
      clock = ms;
    },
    queue: new RetryQueue({
      ...baseConfig,
      now: () => clock,
      // random() => 0.5 maps the jitter offset to exactly 0, isolating the
      // exponential component for assertions.
      random: () => randomValue,
    }),
  };
}

describe("computeRetryDelay", () => {
  it("grows exponentially from the base delay with zero jitter", () => {
    const noJitter = () => 0.5; // (0.5 * 2 - 1) * jitter === 0
    expect(computeRetryDelay(0, 1000, 60000, 500, noJitter)).toBe(1000);
    expect(computeRetryDelay(1, 1000, 60000, 500, noJitter)).toBe(2000);
    expect(computeRetryDelay(2, 1000, 60000, 500, noJitter)).toBe(4000);
    expect(computeRetryDelay(3, 1000, 60000, 500, noJitter)).toBe(8000);
  });

  it("caps the exponential component at maxDelay", () => {
    const noJitter = () => 0.5;
    // 2^20 * 1000 vastly exceeds the cap; result must be clamped to maxDelay.
    expect(computeRetryDelay(20, 1000, 60000, 500, noJitter)).toBe(60000);
  });

  it("never returns a negative delay even when jitter is fully negative", () => {
    const minJitter = () => 0; // (0*2 - 1) * jitter === -jitter
    expect(computeRetryDelay(0, 100, 60000, 500, minJitter)).toBe(0);
  });

  it("treats negative attempt counts as the first attempt", () => {
    const noJitter = () => 0.5;
    expect(computeRetryDelay(-3, 1000, 60000, 500, noJitter)).toBe(1000);
  });

  it("keeps the delay within [exp - jitter, exp + jitter], clamped at 0 (property)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 30 }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (attempt, r) => {
          const baseDelay = 1000;
          const maxDelay = 60000;
          const jitter = 500;
          const exp = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          const delay = computeRetryDelay(
            attempt,
            baseDelay,
            maxDelay,
            jitter,
            () => r
          );
          expect(delay).toBeGreaterThanOrEqual(0);
          expect(delay).toBeGreaterThanOrEqual(Math.max(0, exp - jitter));
          expect(delay).toBeLessThanOrEqual(exp + jitter);
        }
      )
    );
  });
});

describe("RetryQueue scheduling", () => {
  it("schedules the first attempt one base delay into the future", () => {
    const { queue } = deterministicQueue(10_000);
    const schedule = queue.schedule(1);
    expect(schedule.attemptCount).toBe(0);
    expect(schedule.nextAttemptAt).toBe(10_000 + 1000);
  });

  it("increments the attempt count and backs off further on re-schedule", () => {
    const { queue } = deterministicQueue(0);
    expect(queue.schedule(1).attemptCount).toBe(0);
    expect(queue.schedule(1).attemptCount).toBe(1);
    const third = queue.schedule(1);
    expect(third.attemptCount).toBe(2);
    expect(third.nextAttemptAt).toBe(4000); // 2^2 * base, jitter neutralised
  });

  it("only returns schedules whose time is due via getNextDue", () => {
    const harness = deterministicQueue(0);
    harness.queue.schedule(1); // due at 1000
    expect(harness.queue.getNextDue()).toBeNull();
    harness.set(1000);
    expect(harness.queue.getNextDue()?.seqNo).toBe(1);
  });

  it("orders due work by soonest time, breaking ties by seqNo", () => {
    const harness = deterministicQueue(0);
    harness.queue.schedule(2);
    harness.queue.schedule(1);
    harness.set(5000);
    // Both due; equal delay so the lower seqNo wins the tie-break.
    expect(harness.queue.getNextDue()?.seqNo).toBe(1);
  });

  it("getSoonest returns the earliest pending schedule regardless of due time", () => {
    const harness = deterministicQueue(0);
    harness.queue.schedule(7);
    expect(harness.queue.getSoonest()?.seqNo).toBe(7);
  });

  it("cancel removes a single schedule and cancelAll clears everything", () => {
    const { queue } = deterministicQueue(0);
    queue.schedule(1);
    queue.schedule(2);
    queue.cancel(1);
    expect(queue.getSoonest()?.seqNo).toBe(2);
    queue.cancelAll();
    expect(queue.getSoonest()).toBeNull();
  });

  it("reports exhaustion once attempts reach the configured maxRetries", () => {
    const { queue } = deterministicQueue(0);
    expect(queue.isExhausted(1)).toBe(false); // unknown seqNo is not exhausted
    for (let i = 0; i < baseConfig.maxRetries; i++) queue.schedule(1);
    // attemptCount is now maxRetries - 1 after maxRetries schedules.
    expect(queue.isExhausted(1)).toBe(false);
    queue.schedule(1); // attemptCount === maxRetries
    expect(queue.isExhausted(1)).toBe(true);
  });
});
