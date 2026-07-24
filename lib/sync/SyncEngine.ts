import { ConflictResolver } from "./ConflictResolver";
import { IntegrityValidator } from "./IntegrityValidator";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import { NetworkDetector } from "./NetworkDetector";
import { RetryQueue } from "./RetryQueue";
import { applyNodeMutations } from "./applyMutations";
import type {
  ConflictInfo,
  ConflictResolution,
  ConflictResponse,
  FamilyNode,
  Mutation,
  SyncBatch,
  SyncEngineConfig,
  SyncResponse,
  SyncStatusInfo,
  WALEntry,
} from "./types";
import type { WriteAheadLog } from "./WriteAheadLog";

export type SyncEngineEvents = {
  authRequired?: () => void;
  conflict?: (conflict: SyncConflict) => void;
  corruption?: (errors: string[]) => void;
  rebased?: (treeId: string, nodes: FamilyNode[]) => void;
};

export type SyncConflict = {
  treeId: string;
  conflicts: ConflictInfo[];
};

type PendingSyncConflict = SyncConflict & {
  serverVersion: number;
  baseNodes: FamilyNode[];
  selectedSeqNos: number[];
};

export type SyncEngineOptions = {
  wal: WriteAheadLog;
  config?: Partial<SyncEngineConfig>;
  fetchImpl?: typeof fetch;
  getTreeNodes?: (treeId: string) => FamilyNode[] | null;
  networkDetector?: NetworkDetector;
  conflictResolver?: ConflictResolver;
  integrityValidator?: IntegrityValidator;
  events?: SyncEngineEvents;
};

const DEFAULT_CONFIG: SyncEngineConfig = {
  debounceMs: 150,
  maxRetries: 10,
  visibleErrorRetryThreshold: 3,
  baseRetryDelayMs: 1000,
  offlineRetryDelayMs: 5000,
  maxRetryDelayMs: 60000,
  jitterMs: 500,
  healthCheckIntervalMs: 30000,
  requestTimeoutMs: 30000,
  healthCheckUrl: "/api/health",
};
const MAX_SYNC_BATCH_SIZE = 250;
export const SYNC_REQUEST_BODY_LIMIT_BYTES = 8 * 1024 * 1024;
const SYNC_REQUEST_BODY_TARGET_BYTES = Math.floor(
  SYNC_REQUEST_BODY_LIMIT_BYTES * 0.9
);
const textEncoder = new TextEncoder();

type BatchSelection =
  | { entries: WALEntry[]; body: string; tooLarge: false }
  | { entries: WALEntry[]; body: string; tooLarge: true; sizeBytes: number };

export function formatPendingCount(count: number): string {
  return count > 99 ? "99+" : `${Math.max(0, count)}`;
}

function initialStatus(warningMessage?: string): SyncStatusInfo {
  return {
    status: "saved",
    pendingCount: 0,
    pendingDisplay: "0",
    warningMessage,
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error === "string") return body.error;
    if (Array.isArray(body?.details)) return body.details.join("; ");
  } catch {
    /* ignore */
  }
  return `HTTP ${response.status}`;
}

export class SyncEngine {
  private readonly config: SyncEngineConfig;
  private readonly fetchImpl: typeof fetch;
  private readonly retryQueue: RetryQueue;
  private readonly networkDetector: NetworkDetector;
  private readonly conflictResolver: ConflictResolver;
  private readonly integrityValidator: IntegrityValidator;
  private readonly getTreeNodes?: (treeId: string) => FamilyNode[] | null;
  private readonly events: SyncEngineEvents;
  private callbacks = new Set<(status: SyncStatusInfo) => void>();
  private status: SyncStatusInfo;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;
  private paused = false;
  private blockedError: string | undefined;
  private pendingConflict: PendingSyncConflict | null = null;

  constructor(options: SyncEngineOptions) {
    this.config = { ...DEFAULT_CONFIG, ...(options.config ?? {}) };
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.retryQueue = new RetryQueue({
      maxRetries: this.config.maxRetries,
      baseDelay: this.config.baseRetryDelayMs,
      maxDelay: this.config.maxRetryDelayMs,
      jitter: this.config.jitterMs,
    });
    this.networkDetector =
      options.networkDetector ??
      new NetworkDetector(
        this.config.healthCheckUrl,
        this.config.healthCheckIntervalMs,
        this.fetchImpl
      );
    this.conflictResolver = options.conflictResolver ?? new ConflictResolver();
    this.integrityValidator =
      options.integrityValidator ?? new IntegrityValidator();
    this.getTreeNodes = options.getTreeNodes;
    this.events = options.events ?? {};
    this.wal = options.wal;
    this.status = initialStatus(this.wal.warningMessage);
  }

  readonly wal: WriteAheadLog;

  async initialize(): Promise<void> {
    this.networkDetector.onStatusChange((online) => {
      if (online) {
        this.scheduleFlush(0);
      }
      void this.refreshStatus(
        undefined,
        online ? undefined : this.networkDetector.getLastError()
      );
    });
    this.networkDetector.start();
    await this.refreshStatus();
    const pendingCount = await this.wal.getCount();
    if (pendingCount > 0) this.scheduleFlush(0);
  }

  destroy(): void {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.networkDetector.stop();
    this.callbacks.clear();
  }

  async enqueue(treeId: string, mutation: Mutation): Promise<WALEntry> {
    const entry = await this.wal.appendMutation(treeId, mutation);
    await this.refreshStatus("pending");
    if (!this.paused) this.scheduleFlush(this.config.debounceMs);
    return entry;
  }

  async enqueueMany(treeId: string, mutations: Mutation[]): Promise<WALEntry[]> {
    const entries = await this.wal.appendMutations(treeId, mutations);
    await this.refreshStatus("pending");
    if (!this.paused) this.scheduleFlush(this.config.debounceMs);
    return entries;
  }

  async flush(options: { allowOfflineAttempt?: boolean } = {}): Promise<void> {
    if (this.flushing || this.paused) return;
    if (
      !this.networkDetector.isOnline() &&
      !this.networkDetector.canAttemptRequests() &&
      !options.allowOfflineAttempt
    ) {
      await this.refreshStatus(
        "offline",
        this.networkDetector.getLastError()
      );
      this.scheduleRetry(this.config.offlineRetryDelayMs, true);
      return;
    }

    const allPending = await this.wal.getAllPending();
    if (allPending.length === 0) {
      await this.refreshStatus("saved");
      return;
    }

    this.flushing = true;
    await this.refreshStatus("syncing");

    try {
      const treeIds = Array.from(new Set(allPending.map((entry) => entry.treeId)));
      for (const treeId of treeIds) {
        const entries = await this.wal.getPending(treeId);
        if (entries.length === 0) continue;
        await this.flushTree(treeId, entries);
      }
    } finally {
      this.flushing = false;
      await this.refreshStatus();
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    this.scheduleFlush(0);
  }

  getStatus(): SyncStatusInfo {
    return this.status;
  }

  onStatusChange(callback: (status: SyncStatusInfo) => void): () => void {
    this.callbacks.add(callback);
    callback(this.status);
    return () => this.callbacks.delete(callback);
  }

  async retryFailed(): Promise<void> {
    this.retryQueue.cancelAll();
    await this.wal.resetFailed();
    this.paused = false;
    this.blockedError = undefined;
    await this.ensureOnline();
    await this.refreshStatus("syncing");
    await this.flush({ allowOfflineAttempt: true });
  }

  async forceSync(): Promise<void> {
    this.retryQueue.cancelAll();
    this.paused = false;
    this.blockedError = undefined;
    await this.ensureOnline();
    await this.flush({ allowOfflineAttempt: true });
  }

  async setLastSyncedVersion(treeId: string, version: number): Promise<void> {
    await this.wal.setLastSyncedVersion(treeId, version);
  }

  async getLastSyncedVersion(treeId: string): Promise<number> {
    return this.wal.getLastSyncedVersion(treeId);
  }

  async hasUnresolvedChanges(treeId: string): Promise<boolean> {
    return this.wal.hasUnresolved(treeId);
  }

  async resolveConflict(resolutions: ConflictResolution[]): Promise<void> {
    const pending = this.pendingConflict;
    if (!pending) throw new Error("No sync conflict is waiting for resolution");
    const selectedSeqNos = new Set(pending.selectedSeqNos);
    const currentEntries = await this.wal.getPending(pending.treeId);
    const remainingEntries = currentEntries.filter(
      (entry) => !selectedSeqNos.has(entry.seqNo)
    );

    const resolvedNodes = this.applyMutations(
      this.conflictResolver.resolve(
        pending.conflicts,
        resolutions,
        pending.baseNodes
      ),
      remainingEntries
    );
    const validation = this.integrityValidator.validate(resolvedNodes);
    if (!validation.valid) {
      const message = validation.errors.map((error) => error.details).join("; ");
      this.updateStatus("error", message);
      throw new Error(message);
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(
        this.fetchImpl,
        `/api/trees/${encodeURIComponent(pending.treeId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expectedVersion: pending.serverVersion,
            nodes: resolvedNodes,
          }),
        },
        this.config.requestTimeoutMs
      );
      this.networkDetector.reportOnline();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error";
      this.networkDetector.reportOffline(message);
      this.updateStatus("offline", message);
      throw error;
    }

    if (!response.ok) {
      const message =
        response.status === 409
          ? "The server changed again while the conflict was being resolved. Review the refreshed conflict."
          : await readErrorMessage(response);
      this.updateStatus("error", message);
      if (response.status === 409) {
        this.pendingConflict = null;
        this.paused = false;
        this.blockedError = undefined;
        this.scheduleFlush(0);
      }
      throw new Error(message);
    }

    const body = (await response.json()) as { newVersion: number };
    await this.wal.setLastSyncedVersion(pending.treeId, body.newVersion);
    for (const entry of currentEntries) {
      await this.wal.acknowledge(entry.seqNo);
      this.retryQueue.cancel(entry.seqNo);
    }
    const remainingAfterWrite = await this.wal.getPending(pending.treeId);
    const rebasedNodes = this.applyMutations(resolvedNodes, remainingAfterWrite);
    this.pendingConflict = null;
    this.paused = false;
    this.blockedError = undefined;
    this.events.rebased?.(pending.treeId, rebasedNodes);
    await this.refreshStatus(
      remainingAfterWrite.length > 0 ? "pending" : "saved"
    );
    this.scheduleFlush(0);
  }

  private async persistAutoMergedGraph(
    treeId: string,
    expectedVersion: number,
    nodes: FamilyNode[],
    acknowledgedEntries: WALEntry[]
  ): Promise<boolean> {
    const validation = this.integrityValidator.validate(nodes);
    if (!validation.valid) {
      const message = validation.errors.map((error) => error.details).join("; ");
      this.updateStatus("error", message);
      throw new Error(message);
    }

    const response = await fetchWithTimeout(
      this.fetchImpl,
      `/api/trees/${encodeURIComponent(treeId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersion, nodes }),
      },
      this.config.requestTimeoutMs
    );
    this.networkDetector.reportOnline();

    if (!response.ok) {
      if (response.status === 409) {
        this.updateStatus(
          "pending",
          "The shared tree changed again while merging. Retrying automatically."
        );
        this.scheduleFlush(0);
        return false;
      }
      throw new Error(await readErrorMessage(response));
    }

    const body = (await response.json()) as { newVersion: number };
    await this.wal.setLastSyncedVersion(treeId, body.newVersion);
    for (const entry of acknowledgedEntries) {
      await this.wal.acknowledge(entry.seqNo);
      this.retryQueue.cancel(entry.seqNo);
    }
    const remainingEntries = await this.wal.getPending(treeId);
    this.events.rebased?.(
      treeId,
      this.applyMutations(nodes, remainingEntries)
    );
    await this.refreshStatus(remainingEntries.length > 0 ? "pending" : "saved");
    this.scheduleFlush(0);
    return true;
  }

  private async flushTree(treeId: string, entries: WALEntry[]): Promise<void> {
    const ordered = entries.sort((a, b) => a.seqNo - b.seqNo);
    const clientVersion = await this.wal.getLastSyncedVersion(treeId);
    const selection = this.selectBatchEntries(treeId, clientVersion, ordered);
    const selected = selection.entries;
    const seqNos = selected.map((entry) => entry.seqNo);

    if (selection.tooLarge) {
      const message =
        "Perubahan foto terlalu besar untuk disinkronkan. Hapus foto inline lama atau upload ulang lewat penyimpanan media, lalu simpan lagi.";
      for (const seqNo of seqNos) {
        await this.wal.markPermanentlyFailed(seqNo, message);
      }
      this.updateStatus("error", message);
      return;
    }

    await this.wal.markSending(seqNos);

    const validation = this.validateTree(treeId);
    if (validation.length > 0) {
      const message = validation.join("; ");
      await this.wal.markPending(seqNos);
      this.paused = true;
      this.blockedError = message;
      this.events.corruption?.(validation);
      this.updateStatus("error", message);
      return;
    }

    const batch: SyncBatch = {
      batchId: this.createBatchId(selected),
      treeId,
      clientVersion,
      mutations: selected.map((entry) => ({
        seqNo: entry.seqNo,
        type: entry.type,
        nodeId: entry.nodeId,
        payload: entry.payload,
        previousPayload: entry.previousPayload,
      })),
    };

    try {
      const response = await this.postBatch(batch, selection.body);
      // Any HTTP response proves the route is reachable. Distinguish server
      // rejection from an actual transport outage.
      this.networkDetector.reportOnline();
      if (response.ok) {
        const body = (await response.json()) as SyncResponse;
        // Persist the accepted server version before deleting WAL rows. If the
        // tab closes during cleanup, remaining rows replay safely on that base.
        await this.wal.setLastSyncedVersion(treeId, body.newVersion);
        for (const seqNo of body.acknowledgedSeqNos) {
          await this.wal.acknowledge(seqNo);
          this.retryQueue.cancel(seqNo);
        }
        this.updateStatus("saved");
        if (ordered.length > selected.length) {
          await this.flushTree(treeId, ordered.slice(selected.length));
        }
        return;
      }

      if (response.status === 409) {
        const conflict = (await response.json()) as ConflictResponse;
        await this.wal.markPending(seqNos);
        const pendingEntries = await this.wal.getPending(treeId);
        const resolution = this.conflictResolver.detect(
          pendingEntries,
          conflict.serverState,
          conflict.currentVersion,
          conflict.conflictingNodeIds
        );
        if (resolution.type === "auto-merged") {
          await this.persistAutoMergedGraph(
            treeId,
            conflict.currentVersion,
            resolution.mergedNodes,
            pendingEntries
          );
          return;
        }
        this.paused = true;
        this.blockedError =
          "This tree was changed from another device. Resolve the conflict before syncing.";
        this.pendingConflict = {
          treeId,
          conflicts: resolution.conflicts,
          serverVersion: conflict.currentVersion,
          baseNodes: resolution.nonConflictingMerge,
          selectedSeqNos: pendingEntries.map((entry) => entry.seqNo),
        };
        this.events.conflict?.({
          treeId,
          conflicts: resolution.conflicts,
        });
        this.updateStatus(
          "error",
          this.blockedError
        );
        return;
      }

      if (response.status === 401) {
        await this.wal.markPending(seqNos);
        this.paused = true;
        this.events.authRequired?.();
        this.blockedError =
          "Your session expired. Sign in again, then retry to save these local changes.";
        this.updateStatus(
          "error",
          this.blockedError
        );
        return;
      }

      if (response.status === 400 || response.status === 413) {
        const message = await readErrorMessage(response);
        for (const seqNo of seqNos) {
          await this.wal.markPermanentlyFailed(seqNo, message);
        }
        this.updateStatus("error", message);
        return;
      }

      if (response.status === 403 || response.status === 404) {
        const message =
          response.status === 404
            ? "The original family tree no longer exists. Local edits remain stored in this browser. Reset local site data only if the deletion was intentional."
            : "You no longer have permission to save this family tree. Local edits remain stored in this browser.";
        for (const seqNo of seqNos) {
          await this.wal.markPermanentlyFailed(seqNo, message);
        }
        this.updateStatus("error", message);
        return;
      }

      if (response.status >= 500) {
        await this.handleRetryableFailure(ordered, await readErrorMessage(response));
        return;
      }

      await this.handleRetryableFailure(ordered, await readErrorMessage(response));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error";
      this.networkDetector.reportFailure(message);
      await this.handleRetryableFailure(
        ordered,
        message,
        {
          exhaustible: false,
          offline: !this.networkDetector.isOnline(),
        }
      );
    }
  }

  private async postBatch(batch: SyncBatch, body: string): Promise<Response> {
    return fetchWithTimeout(
      this.fetchImpl,
      `/api/trees/${encodeURIComponent(batch.treeId)}/sync`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      },
      this.config.requestTimeoutMs
    );
  }

  private async ensureOnline(): Promise<void> {
    if (this.networkDetector.isOnline()) return;

    const online = await this.networkDetector.check();
    if (!online) {
      await this.refreshStatus(
        "offline",
        this.networkDetector.getLastError()
      );
    }
  }

  private createBatchId(entries: WALEntry[]): string {
    const first = entries[0];
    const last = entries[entries.length - 1];
    if (!first || !last) throw new Error("Cannot sync an empty batch");
    return `wal:${first.id}:${last.id}:${entries.length}`;
  }

  private createBatch(
    treeId: string,
    clientVersion: number,
    entries: WALEntry[]
  ): SyncBatch {
    return {
      batchId: this.createBatchId(entries),
      treeId,
      clientVersion,
      mutations: entries.map((entry) => ({
        seqNo: entry.seqNo,
        type: entry.type,
        nodeId: entry.nodeId,
        payload: entry.payload,
        previousPayload: entry.previousPayload,
      })),
    };
  }

  private stringifyBatchBody(batch: SyncBatch): string {
    return JSON.stringify({
      batchId: batch.batchId,
      clientVersion: batch.clientVersion,
      mutations: batch.mutations,
    });
  }

  private bodySizeBytes(body: string): number {
    return textEncoder.encode(body).byteLength;
  }

  private selectBatchEntries(
    treeId: string,
    clientVersion: number,
    ordered: WALEntry[]
  ): BatchSelection {
    let selected: WALEntry[] = [];
    let selectedBody = "";

    for (const entry of ordered.slice(0, MAX_SYNC_BATCH_SIZE)) {
      const candidate = [...selected, entry];
      const candidateBody = this.stringifyBatchBody(
        this.createBatch(treeId, clientVersion, candidate)
      );
      const candidateSize = this.bodySizeBytes(candidateBody);

      if (candidateSize > SYNC_REQUEST_BODY_LIMIT_BYTES) {
        if (selected.length === 0) {
          return {
            entries: candidate,
            body: candidateBody,
            tooLarge: true,
            sizeBytes: candidateSize,
          };
        }
        break;
      }

      if (
        selected.length > 0 &&
        candidateSize > SYNC_REQUEST_BODY_TARGET_BYTES
      ) {
        break;
      }

      selected = candidate;
      selectedBody = candidateBody;
    }

    if (selected.length === 0) {
      const fallback = ordered.slice(0, 1);
      const body = this.stringifyBatchBody(
        this.createBatch(treeId, clientVersion, fallback)
      );
      const sizeBytes = this.bodySizeBytes(body);
      if (sizeBytes > SYNC_REQUEST_BODY_LIMIT_BYTES) {
        return {
          entries: fallback,
          body,
          tooLarge: true,
          sizeBytes,
        };
      }
      return {
        entries: fallback,
        body,
        tooLarge: false,
      };
    }

    return { entries: selected, body: selectedBody, tooLarge: false };
  }

  private async handleRetryableFailure(
    ordered: WALEntry[],
    message: string,
    options: { exhaustible?: boolean; offline?: boolean } = {}
  ): Promise<void> {
    const [first, ...rest] = ordered;
    if (!first) return;

    await this.wal.markFailed(first.seqNo, message);
    if (rest.length > 0) {
      await this.wal.markPending(rest.map((entry) => entry.seqNo));
    }

    const updatedFirst = (await this.wal.getAllPending()).find(
      (entry) => entry.seqNo === first.seqNo
    );
    const retryCount = updatedFirst?.retryCount ?? first.retryCount + 1;

    if (options.exhaustible !== false && retryCount >= this.config.maxRetries) {
      await this.wal.markPermanentlyFailed(first.seqNo, message);
      this.updateStatus("error", "A save could not be completed after repeated retries.");
      return;
    }

    const schedule = this.retryQueue.schedule(first.seqNo);
    const retryDelay = schedule.nextAttemptAt - Date.now();
    this.scheduleRetry(
      options.offline
        ? Math.max(retryDelay, this.config.offlineRetryDelayMs)
        : retryDelay,
      true
    );

    if (options.offline) {
      await this.refreshStatus("offline", message);
    } else if (retryCount >= this.config.visibleErrorRetryThreshold) {
      this.updateStatus("error", message);
    } else {
      await this.refreshStatus("pending");
    }
  }

  private validateTree(treeId: string): string[] {
    const nodes = this.getTreeNodes?.(treeId);
    if (!nodes) return [];
    const validation = this.integrityValidator.validate(nodes);
    return validation.errors.map((error) => error.details);
  }

  private applyMutations(
    nodes: FamilyNode[],
    mutations: Array<
      Pick<WALEntry, "type" | "nodeId" | "payload" | "previousPayload">
    >
  ): FamilyNode[] {
    return applyNodeMutations(nodes, mutations);
  }

  private scheduleFlush(delayMs: number): void {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => {
      void this.flush();
    }, Math.max(0, delayMs));
  }

  private scheduleRetry(delayMs: number, allowOfflineAttempt = false): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.flush({ allowOfflineAttempt });
    }, Math.max(0, delayMs));
  }

  private async refreshStatus(
    forced?: SyncStatusInfo["status"],
    errorMessage?: string
  ): Promise<void> {
    const activeEntries = await this.wal.getAllPending();
    const pendingCount = await this.wal.getCount();
    const permanentlyFailedCount = await this.wal.getPermanentlyFailedCount();
    const retriableError = activeEntries.find(
      (entry) =>
        entry.status === "failed" &&
        entry.retryCount >= this.config.visibleErrorRetryThreshold
    );
    const status =
      this.blockedError || permanentlyFailedCount > 0 || retriableError
        ? "error"
        : forced ??
          (pendingCount === 0
            ? "saved"
            : this.networkDetector.isOnline()
            ? "pending"
            : "offline");
    const visibleErrorMessage =
      status === "offline" || status === "error"
        ? errorMessage ??
          (status === "offline"
            ? this.networkDetector.getLastError()
            : this.blockedError ?? retriableError?.errorMessage ?? undefined)
        : undefined;
    this.updateStatus(
      status,
      visibleErrorMessage,
      pendingCount
    );
  }

  private updateStatus(
    status: SyncStatusInfo["status"],
    errorMessage?: string,
    knownPendingCount?: number
  ): void {
    const pendingCount = knownPendingCount ?? this.status.pendingCount;
    this.status = {
      status,
      pendingCount,
      pendingDisplay: formatPendingCount(pendingCount),
      warningMessage: this.wal.warningMessage,
      errorMessage:
        errorMessage ??
        (status === "error" ? this.status.errorMessage : undefined),
      lastSyncedAt:
        status === "saved" ? Date.now() : this.status.lastSyncedAt,
    };
    this.callbacks.forEach((callback) => callback(this.status));
  }
}
