import type { TreePullResult } from "../tree/apiClient";
import type { TreeData } from "../types/tree";

type RemoteTreePollerOptions = {
  getActiveTreeId: () => string | null;
  getLastSyncedVersion: (treeId: string) => Promise<number>;
  getLocalRevision: (treeId: string) => number;
  hasUnresolvedChanges: (treeId: string) => Promise<boolean>;
  fetchRemoteChanges: (
    treeId: string,
    sinceVersion: number
  ) => Promise<TreePullResult>;
  applyRemoteTree: (tree: TreeData) => Promise<void> | void;
  onError?: (error: unknown) => void;
  isVisible?: () => boolean;
  activeIntervalMs?: number;
  idleIntervalMs?: number;
  backgroundIntervalMs?: number;
  activeWindowMs?: number;
  errorBaseIntervalMs?: number;
  errorMaxIntervalMs?: number;
};

const ACTIVE_INTERVAL_MS = 2_500;
const IDLE_INTERVAL_MS = 10_000;
const BACKGROUND_INTERVAL_MS = 30_000;
const ACTIVE_WINDOW_MS = 20_000;
const ERROR_BASE_INTERVAL_MS = 10_000;
const ERROR_MAX_INTERVAL_MS = 60_000;

type PollOutcome = "changed" | "unchanged" | "skipped";

export class RemoteTreePoller {
  private readonly activeIntervalMs: number;
  private readonly idleIntervalMs: number;
  private readonly backgroundIntervalMs: number;
  private readonly activeWindowMs: number;
  private readonly errorBaseIntervalMs: number;
  private readonly errorMaxIntervalMs: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight: Promise<PollOutcome> | null = null;
  private stopped = true;
  private lastChangedAt = 0;
  private consecutiveErrors = 0;

  constructor(private readonly options: RemoteTreePollerOptions) {
    this.activeIntervalMs = options.activeIntervalMs ?? ACTIVE_INTERVAL_MS;
    this.idleIntervalMs = options.idleIntervalMs ?? IDLE_INTERVAL_MS;
    this.backgroundIntervalMs =
      options.backgroundIntervalMs ?? BACKGROUND_INTERVAL_MS;
    this.activeWindowMs = options.activeWindowMs ?? ACTIVE_WINDOW_MS;
    this.errorBaseIntervalMs =
      options.errorBaseIntervalMs ?? ERROR_BASE_INTERVAL_MS;
    this.errorMaxIntervalMs =
      options.errorMaxIntervalMs ?? ERROR_MAX_INTERVAL_MS;
  }

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    void this.refreshNow();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  refreshNow(): Promise<PollOutcome | void> {
    if (this.stopped) return Promise.resolve();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.pullOnce()
      .then((outcome) => {
        this.consecutiveErrors = 0;
        if (outcome === "changed") this.lastChangedAt = Date.now();
        return outcome;
      })
      .catch((error) => {
        this.consecutiveErrors += 1;
        this.options.onError?.(error);
        return "skipped" as const;
      })
      .finally(() => {
        this.inFlight = null;
        this.scheduleNext();
      });
    return this.inFlight;
  }

  private async pullOnce(): Promise<PollOutcome> {
    if (this.stopped) return "skipped";
    const treeId = this.options.getActiveTreeId();
    if (!treeId) return "skipped";
    if (await this.options.hasUnresolvedChanges(treeId)) return "skipped";

    const localRevision = this.options.getLocalRevision(treeId);
    const sinceVersion = await this.options.getLastSyncedVersion(treeId);
    // A legacy browser cache may exist before its authoritative server
    // baseline has been hydrated. Wait for hydration instead of pulling a
    // graph that could replace that local recovery draft.
    if (sinceVersion < 1) return "skipped";
    if (
      this.stopped ||
      this.options.getActiveTreeId() !== treeId ||
      this.options.getLocalRevision(treeId) !== localRevision
    ) {
      return "skipped";
    }

    const result = await this.options.fetchRemoteChanges(treeId, sinceVersion);
    if (!result.changed) return "unchanged";
    if (
      this.stopped ||
      this.options.getActiveTreeId() !== treeId ||
      this.options.getLocalRevision(treeId) !== localRevision ||
      (await this.options.hasUnresolvedChanges(treeId)) ||
      this.options.getLocalRevision(treeId) !== localRevision
    ) {
      return "skipped";
    }

    if (this.stopped) return "skipped";
    await this.options.applyRemoteTree(result.tree);
    return "changed";
  }

  private scheduleNext(): void {
    if (this.stopped || this.timer) return;
    const delay = this.nextDelay();
    this.timer = setTimeout(() => void this.refreshNow(), delay);
  }

  private nextDelay(): number {
    const visible = this.options.isVisible?.() ?? true;
    if (!visible) return this.backgroundIntervalMs;

    if (this.consecutiveErrors > 0) {
      return Math.min(
        this.errorBaseIntervalMs * Math.pow(2, this.consecutiveErrors - 1),
        this.errorMaxIntervalMs
      );
    }

    return Date.now() - this.lastChangedAt < this.activeWindowMs
      ? this.activeIntervalMs
      : this.idleIntervalMs;
  }
}
