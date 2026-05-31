import type { Mutation, WALEntry, WALStatus } from "./types";

export type WALBackend = "indexeddb" | "localstorage" | "memory";

export type WALCapacity = {
  used: number;
  max: number;
  backend: WALBackend;
};

export interface WriteAheadLog {
  readonly backend: WALBackend;
  readonly warningMessage?: string;
  append(
    entry: Omit<
      WALEntry,
      "id" | "seqNo" | "status" | "retryCount" | "lastAttempt" | "errorMessage"
    >
  ): Promise<WALEntry>;
  appendMutation(treeId: string, mutation: Mutation): Promise<WALEntry>;
  acknowledge(seqNo: number): Promise<void>;
  markSending(seqNos: number[]): Promise<void>;
  markPending(seqNos: number[]): Promise<void>;
  markFailed(seqNo: number, error: string): Promise<void>;
  markPermanentlyFailed(seqNo: number, error?: string): Promise<void>;
  resetFailed(): Promise<void>;
  getPending(treeId: string): Promise<WALEntry[]>;
  getAllPending(): Promise<WALEntry[]>;
  getCount(): Promise<number>;
  getPermanentlyFailedCount(): Promise<number>;
  clear(treeId: string): Promise<void>;
  prune(olderThanDays: number): Promise<void>;
  isFull(): Promise<boolean>;
  getCapacity(): Promise<WALCapacity>;
  getLastSyncedVersion(treeId: string): Promise<number>;
  setLastSyncedVersion(treeId: string, version: number): Promise<void>;
}

type PersistedWAL = {
  entries: WALEntry[];
  meta: Record<string, number | string>;
};

type WriteAheadLogOptions = {
  dbName?: string;
  storageKey?: string;
  maxIndexedDbEntries?: number;
  maxLocalStorageEntries?: number;
  storage?: Storage;
};

const DEFAULT_DB_NAME = "lifestory-sync";
const DEFAULT_STORAGE_KEY = "lifestory-sync-wal";
const DEFAULT_INDEXEDDB_LIMIT = 1000;
const DEFAULT_LOCALSTORAGE_LIMIT = 50;
const ACTIVE_STATUSES: WALStatus[] = ["pending", "sending", "failed"];
const UNRESOLVED_STATUSES: WALStatus[] = [
  ...ACTIVE_STATUSES,
  "permanently-failed",
];

function isActive(entry: WALEntry): boolean {
  return ACTIVE_STATUSES.includes(entry.status);
}

function isUnresolved(entry: WALEntry): boolean {
  return UNRESOLVED_STATUSES.includes(entry.status);
}

function sortBySeq(entries: WALEntry[]): WALEntry[] {
  return [...entries].sort((a, b) => a.seqNo - b.seqNo);
}

function uuid(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && "randomUUID" in cryptoApi) {
    return cryptoApi.randomUUID();
  }
  return `wal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function versionKey(treeId: string): string {
  return `lastSyncedVersion:${treeId}`;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

export class LocalStorageWriteAheadLog implements WriteAheadLog {
  readonly backend: WALBackend;
  readonly warningMessage?: string;
  private readonly storage: Storage;
  private readonly storageKey: string;
  private readonly maxEntries: number;

  constructor(options: WriteAheadLogOptions & { memory?: boolean } = {}) {
    this.backend = options.memory ? "memory" : "localstorage";
    this.warningMessage = options.memory
      ? "Persistent browser storage is unavailable. Changes are only protected while this tab stays open."
      : "IndexedDB is unavailable. Local save capacity is limited to 50 pending changes.";
    this.storage =
      options.storage ??
      (typeof window !== "undefined" && window.localStorage
        ? window.localStorage
        : new MemoryStorage());
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    this.maxEntries = options.maxLocalStorageEntries ?? DEFAULT_LOCALSTORAGE_LIMIT;
  }

  async append(
    entry: Omit<
      WALEntry,
      "id" | "seqNo" | "status" | "retryCount" | "lastAttempt" | "errorMessage"
    >
  ): Promise<WALEntry> {
    const state = this.read();
    if (state.entries.filter(isUnresolved).length >= this.maxEntries) {
      throw new Error("Offline save capacity has been reached");
    }
    const lastSeqNo = Number(state.meta.lastSeqNo ?? 0);
    const walEntry: WALEntry = {
      ...entry,
      id: uuid(),
      seqNo: lastSeqNo + 1,
      status: "pending",
      retryCount: 0,
      lastAttempt: null,
      errorMessage: null,
    };
    state.meta.lastSeqNo = walEntry.seqNo;
    state.entries.push(walEntry);
    this.write(state);
    return walEntry;
  }

  appendMutation(treeId: string, mutation: Mutation): Promise<WALEntry> {
    return this.append({
      treeId,
      timestamp: mutation.timestamp ?? Date.now(),
      type: mutation.type,
      nodeId: mutation.nodeId,
      payload: mutation.payload,
    });
  }

  async acknowledge(seqNo: number): Promise<void> {
    const state = this.read();
    state.entries = state.entries.filter((entry) => entry.seqNo !== seqNo);
    this.write(state);
  }

  async markSending(seqNos: number[]): Promise<void> {
    await this.updateMany(seqNos, { status: "sending", lastAttempt: Date.now() });
  }

  async markPending(seqNos: number[]): Promise<void> {
    await this.updateMany(seqNos, { status: "pending" });
  }

  async markFailed(seqNo: number, error: string): Promise<void> {
    const state = this.read();
    state.entries = state.entries.map((entry) =>
      entry.seqNo === seqNo
        ? {
            ...entry,
            status: "failed",
            retryCount: entry.retryCount + 1,
            lastAttempt: Date.now(),
            errorMessage: error,
          }
        : entry
    );
    this.write(state);
  }

  async markPermanentlyFailed(seqNo: number, error?: string): Promise<void> {
    await this.updateMany([seqNo], {
      status: "permanently-failed",
      errorMessage: error ?? "Save could not be completed",
      lastAttempt: Date.now(),
    });
  }

  async resetFailed(): Promise<void> {
    const state = this.read();
    state.entries = state.entries.map((entry) =>
      entry.status === "failed" || entry.status === "permanently-failed"
        ? { ...entry, status: "pending" }
        : entry
    );
    this.write(state);
  }

  async getPending(treeId: string): Promise<WALEntry[]> {
    return sortBySeq(this.read().entries.filter((entry) => entry.treeId === treeId && isActive(entry)));
  }

  async getAllPending(): Promise<WALEntry[]> {
    return sortBySeq(this.read().entries.filter(isActive));
  }

  async getCount(): Promise<number> {
    return this.read().entries.filter(isUnresolved).length;
  }

  async getPermanentlyFailedCount(): Promise<number> {
    return this.read().entries.filter(
      (entry) => entry.status === "permanently-failed"
    ).length;
  }

  async clear(treeId: string): Promise<void> {
    const state = this.read();
    state.entries = state.entries.filter((entry) => entry.treeId !== treeId);
    this.write(state);
  }

  async prune(olderThanDays: number): Promise<void> {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const state = this.read();
    state.entries = state.entries.filter(
      (entry) => entry.timestamp >= cutoff || entry.status !== "permanently-failed"
    );
    this.write(state);
  }

  async isFull(): Promise<boolean> {
    return (await this.getCount()) >= this.maxEntries;
  }

  async getCapacity(): Promise<WALCapacity> {
    return {
      used: await this.getCount(),
      max: this.maxEntries,
      backend: this.backend,
    };
  }

  async getLastSyncedVersion(treeId: string): Promise<number> {
    const raw = this.read().meta[versionKey(treeId)];
    return typeof raw === "number" ? raw : Number(raw ?? 1) || 1;
  }

  async setLastSyncedVersion(treeId: string, version: number): Promise<void> {
    const state = this.read();
    state.meta[versionKey(treeId)] = version;
    this.write(state);
  }

  private async updateMany(
    seqNos: number[],
    patch: Partial<WALEntry>
  ): Promise<void> {
    const seqSet = new Set(seqNos);
    const state = this.read();
    state.entries = state.entries.map((entry) =>
      seqSet.has(entry.seqNo) ? { ...entry, ...patch } : entry
    );
    this.write(state);
  }

  private read(): PersistedWAL {
    const raw = this.storage.getItem(this.storageKey);
    if (!raw) return { entries: [], meta: {} };
    try {
      const parsed = JSON.parse(raw) as PersistedWAL;
      return {
        entries: Array.isArray(parsed.entries) ? parsed.entries : [],
        meta: parsed.meta && typeof parsed.meta === "object" ? parsed.meta : {},
      };
    } catch {
      return { entries: [], meta: {} };
    }
  }

  private write(state: PersistedWAL): void {
    this.storage.setItem(this.storageKey, JSON.stringify(state));
  }
}

export class IndexedDbWriteAheadLog implements WriteAheadLog {
  readonly backend = "indexeddb" as const;
  readonly warningMessage?: string;
  private readonly db: IDBDatabase;
  private readonly maxEntries: number;
  private appendQueue: Promise<void> = Promise.resolve();

  private constructor(db: IDBDatabase, maxEntries: number) {
    this.db = db;
    this.maxEntries = maxEntries;
  }

  static async create(options: WriteAheadLogOptions = {}): Promise<IndexedDbWriteAheadLog> {
    if (typeof indexedDB === "undefined") {
      throw new Error("IndexedDB is unavailable");
    }

    const dbName = options.dbName ?? DEFAULT_DB_NAME;
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("wal")) {
          const wal = database.createObjectStore("wal", { keyPath: "id" });
          wal.createIndex("seqNo", "seqNo", { unique: true });
          wal.createIndex("treeId", "treeId", { unique: false });
          wal.createIndex("status", "status", { unique: false });
          wal.createIndex("timestamp", "timestamp", { unique: false });
        }
        if (!database.objectStoreNames.contains("meta")) {
          database.createObjectStore("meta", { keyPath: "key" });
        }
        if (!database.objectStoreNames.contains("conflicts")) {
          database.createObjectStore("conflicts", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB"));
      request.onblocked = () => reject(new Error("IndexedDB upgrade is blocked"));
    });

    return new IndexedDbWriteAheadLog(
      db,
      options.maxIndexedDbEntries ?? DEFAULT_INDEXEDDB_LIMIT
    );
  }

  async append(
    entry: Omit<
      WALEntry,
      "id" | "seqNo" | "status" | "retryCount" | "lastAttempt" | "errorMessage"
    >
  ): Promise<WALEntry> {
    const operation = this.appendQueue.then(() => this.appendExclusive(entry));
    this.appendQueue = operation.then(
      () => undefined,
      () => undefined
    );
    return operation;
  }

  private async appendExclusive(
    entry: Omit<
      WALEntry,
      "id" | "seqNo" | "status" | "retryCount" | "lastAttempt" | "errorMessage"
    >
  ): Promise<WALEntry> {
    if (await this.isFull()) {
      throw new Error("Offline save capacity has been reached");
    }

    const transaction = this.db.transaction(["wal", "meta"], "readwrite");
    const meta = transaction.objectStore("meta");
    const lastSeq = await requestToPromise<{ key: string; value: number } | undefined>(
      meta.get("lastSeqNo")
    );
    const lastSeqNo = Number(lastSeq?.value ?? 0);
    const walEntry: WALEntry = {
      ...entry,
      id: uuid(),
      seqNo: lastSeqNo + 1,
      status: "pending",
      retryCount: 0,
      lastAttempt: null,
      errorMessage: null,
    };

    meta.put({ key: "lastSeqNo", value: walEntry.seqNo });
    transaction.objectStore("wal").put(walEntry);
    await transactionDone(transaction);
    return walEntry;
  }

  appendMutation(treeId: string, mutation: Mutation): Promise<WALEntry> {
    return this.append({
      treeId,
      timestamp: mutation.timestamp ?? Date.now(),
      type: mutation.type,
      nodeId: mutation.nodeId,
      payload: mutation.payload,
    });
  }

  async acknowledge(seqNo: number): Promise<void> {
    const entries = await this.getAllEntries();
    const match = entries.find((entry) => entry.seqNo === seqNo);
    if (!match) return;
    const transaction = this.db.transaction("wal", "readwrite");
    transaction.objectStore("wal").delete(match.id);
    await transactionDone(transaction);
  }

  async markSending(seqNos: number[]): Promise<void> {
    await this.updateMany(seqNos, { status: "sending", lastAttempt: Date.now() });
  }

  async markPending(seqNos: number[]): Promise<void> {
    await this.updateMany(seqNos, { status: "pending" });
  }

  async markFailed(seqNo: number, error: string): Promise<void> {
    const entries = await this.getAllEntries();
    const match = entries.find((entry) => entry.seqNo === seqNo);
    if (!match) return;
    await this.updateEntry({
      ...match,
      status: "failed",
      retryCount: match.retryCount + 1,
      lastAttempt: Date.now(),
      errorMessage: error,
    });
  }

  async markPermanentlyFailed(seqNo: number, error?: string): Promise<void> {
    await this.updateMany([seqNo], {
      status: "permanently-failed",
      errorMessage: error ?? "Save could not be completed",
      lastAttempt: Date.now(),
    });
  }

  async resetFailed(): Promise<void> {
    const entries = await this.getAllEntries();
    const failed = entries.filter(
      (entry) =>
        entry.status === "failed" || entry.status === "permanently-failed"
    );
    await Promise.all(
      failed.map((entry) => this.updateEntry({ ...entry, status: "pending" }))
    );
  }

  async getPending(treeId: string): Promise<WALEntry[]> {
    return sortBySeq(
      (await this.getAllEntries()).filter(
        (entry) => entry.treeId === treeId && isActive(entry)
      )
    );
  }

  async getAllPending(): Promise<WALEntry[]> {
    return sortBySeq((await this.getAllEntries()).filter(isActive));
  }

  async getCount(): Promise<number> {
    return (await this.getAllEntries()).filter(isUnresolved).length;
  }

  async getPermanentlyFailedCount(): Promise<number> {
    return (await this.getAllEntries()).filter(
      (entry) => entry.status === "permanently-failed"
    ).length;
  }

  async clear(treeId: string): Promise<void> {
    const entries = (await this.getAllEntries()).filter(
      (entry) => entry.treeId === treeId
    );
    const transaction = this.db.transaction("wal", "readwrite");
    const store = transaction.objectStore("wal");
    entries.forEach((entry) => store.delete(entry.id));
    await transactionDone(transaction);
  }

  async prune(olderThanDays: number): Promise<void> {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const entries = (await this.getAllEntries()).filter(
      (entry) => entry.timestamp < cutoff && entry.status === "permanently-failed"
    );
    const transaction = this.db.transaction("wal", "readwrite");
    const store = transaction.objectStore("wal");
    entries.forEach((entry) => store.delete(entry.id));
    await transactionDone(transaction);
  }

  async isFull(): Promise<boolean> {
    return (await this.getCount()) >= this.maxEntries;
  }

  async getCapacity(): Promise<WALCapacity> {
    return {
      used: await this.getCount(),
      max: this.maxEntries,
      backend: this.backend,
    };
  }

  async getLastSyncedVersion(treeId: string): Promise<number> {
    return this.getMetaNumber(versionKey(treeId), 1);
  }

  async setLastSyncedVersion(treeId: string, version: number): Promise<void> {
    await this.setMetaNumber(versionKey(treeId), version);
  }

  private async getAllEntries(): Promise<WALEntry[]> {
    const transaction = this.db.transaction("wal", "readonly");
    const entries = await requestToPromise<WALEntry[]>(
      transaction.objectStore("wal").getAll()
    );
    await transactionDone(transaction);
    return entries;
  }

  private async updateEntry(entry: WALEntry): Promise<void> {
    const transaction = this.db.transaction("wal", "readwrite");
    transaction.objectStore("wal").put(entry);
    await transactionDone(transaction);
  }

  private async updateMany(
    seqNos: number[],
    patch: Partial<WALEntry>
  ): Promise<void> {
    const seqSet = new Set(seqNos);
    const entries = (await this.getAllEntries()).filter((entry) =>
      seqSet.has(entry.seqNo)
    );
    const transaction = this.db.transaction("wal", "readwrite");
    const store = transaction.objectStore("wal");
    entries.forEach((entry) => store.put({ ...entry, ...patch }));
    await transactionDone(transaction);
  }

  private async getMetaNumber(key: string, fallback: number): Promise<number> {
    const transaction = this.db.transaction("meta", "readonly");
    const result = await requestToPromise<{ key: string; value: number } | undefined>(
      transaction.objectStore("meta").get(key)
    );
    await transactionDone(transaction);
    return Number(result?.value ?? fallback);
  }

  private async setMetaNumber(key: string, value: number): Promise<void> {
    const transaction = this.db.transaction("meta", "readwrite");
    transaction.objectStore("meta").put({ key, value });
    await transactionDone(transaction);
  }
}

export async function createWriteAheadLog(
  options: WriteAheadLogOptions = {}
): Promise<WriteAheadLog> {
  try {
    return await IndexedDbWriteAheadLog.create(options);
  } catch {
    try {
      const fallback = new LocalStorageWriteAheadLog(options);
      await fallback.getCapacity();
      return fallback;
    } catch {
      return new LocalStorageWriteAheadLog({ ...options, memory: true });
    }
  }
}
