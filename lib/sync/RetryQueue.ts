export type RetrySchedule = {
  seqNo: number;
  nextAttemptAt: number;
  attemptCount: number;
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  jitter: number;
};

export type RetryQueueConfig = {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitter: number;
  now?: () => number;
  random?: () => number;
};

const defaultNow = () => Date.now();
const defaultRandom = () => Math.random();

export function computeRetryDelay(
  attemptCount: number,
  baseDelay = 1000,
  maxDelay = 60000,
  jitter = 500,
  random: () => number = defaultRandom
): number {
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(2, Math.max(0, attemptCount)),
    maxDelay
  );
  const jitterOffset = (random() * 2 - 1) * jitter;
  return Math.max(0, exponentialDelay + jitterOffset);
}

export class RetryQueue {
  private schedules = new Map<number, RetrySchedule>();
  private readonly now: () => number;
  private readonly random: () => number;

  constructor(private readonly config: RetryQueueConfig) {
    this.now = config.now ?? defaultNow;
    this.random = config.random ?? defaultRandom;
  }

  schedule(seqNo: number): RetrySchedule {
    const previous = this.schedules.get(seqNo);
    const attemptCount = previous ? previous.attemptCount + 1 : 0;
    const delay = this.computeDelay(attemptCount);
    const schedule: RetrySchedule = {
      seqNo,
      nextAttemptAt: this.now() + delay,
      attemptCount,
      maxAttempts: this.config.maxRetries,
      baseDelay: this.config.baseDelay,
      maxDelay: this.config.maxDelay,
      jitter: this.config.jitter,
    };
    this.schedules.set(seqNo, schedule);
    return schedule;
  }

  getNextDue(): RetrySchedule | null {
    const now = this.now();
    const due = Array.from(this.schedules.values())
      .filter((schedule) => schedule.nextAttemptAt <= now)
      .sort((a, b) => a.nextAttemptAt - b.nextAttemptAt || a.seqNo - b.seqNo);
    return due[0] ?? null;
  }

  getSoonest(): RetrySchedule | null {
    const schedules = Array.from(this.schedules.values()).sort(
      (a, b) => a.nextAttemptAt - b.nextAttemptAt || a.seqNo - b.seqNo
    );
    return schedules[0] ?? null;
  }

  cancel(seqNo: number): void {
    this.schedules.delete(seqNo);
  }

  cancelAll(): void {
    this.schedules.clear();
  }

  isExhausted(seqNo: number): boolean {
    const schedule = this.schedules.get(seqNo);
    return Boolean(schedule && schedule.attemptCount >= this.config.maxRetries);
  }

  computeDelay(attemptCount: number): number {
    return computeRetryDelay(
      attemptCount,
      this.config.baseDelay,
      this.config.maxDelay,
      this.config.jitter,
      this.random
    );
  }
}
