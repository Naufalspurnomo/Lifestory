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
  backgroundIntervalMs?: number;
};

const ACTIVE_INTERVAL_MS = 1_250;
const BACKGROUND_INTERVAL_MS = 10_000;

export class RemoteTreePoller {
  private readonly activeIntervalMs: number;
  private readonly backgroundIntervalMs: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight: Promise<void> | null = null;
  private stopped = true;

  constructor(private readonly options: RemoteTreePollerOptions) {
    this.activeIntervalMs = options.activeIntervalMs ?? ACTIVE_INTERVAL_MS;
    this.backgroundIntervalMs =
      options.backgroundIntervalMs ?? BACKGROUND_INTERVAL_MS;
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

  refreshNow(): Promise<void> {
    if (this.stopped) return Promise.resolve();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.pullOnce()
      .catch((error) => this.options.onError?.(error))
      .finally(() => {
        this.inFlight = null;
        this.scheduleNext();
      });
    return this.inFlight;
  }

  private async pullOnce(): Promise<void> {
    if (this.stopped) return;
    const treeId = this.options.getActiveTreeId();
    if (!treeId) return;
    if (await this.options.hasUnresolvedChanges(treeId)) return;

    const localRevision = this.options.getLocalRevision(treeId);
    const sinceVersion = await this.options.getLastSyncedVersion(treeId);
    // A legacy browser cache may exist before its authoritative server
    // baseline has been hydrated. Wait for hydration instead of pulling a
    // graph that could replace that local recovery draft.
    if (sinceVersion < 1) return;
    if (
      this.stopped ||
      this.options.getActiveTreeId() !== treeId ||
      this.options.getLocalRevision(treeId) !== localRevision
    ) {
      return;
    }

    const result = await this.options.fetchRemoteChanges(treeId, sinceVersion);
    if (!result.changed) return;
    if (
      this.stopped ||
      this.options.getActiveTreeId() !== treeId ||
      this.options.getLocalRevision(treeId) !== localRevision ||
      (await this.options.hasUnresolvedChanges(treeId)) ||
      this.options.getLocalRevision(treeId) !== localRevision
    ) {
      return;
    }

    if (this.stopped) return;
    await this.options.applyRemoteTree(result.tree);
  }

  private scheduleNext(): void {
    if (this.stopped || this.timer) return;
    const visible = this.options.isVisible?.() ?? true;
    this.timer = setTimeout(
      () => void this.refreshNow(),
      visible ? this.activeIntervalMs : this.backgroundIntervalMs
    );
  }
}
