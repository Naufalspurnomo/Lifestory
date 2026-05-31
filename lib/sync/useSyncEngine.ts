"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createWriteAheadLog } from "./WriteAheadLog";
import type { WriteAheadLog } from "./WriteAheadLog";
import { formatPendingCount, SyncEngine } from "./SyncEngine";
import type { FamilyNode, Mutation, SyncStatusInfo } from "./types";

type UseSyncEngineOptions = {
  getTreeNodes?: (treeId: string) => FamilyNode[] | null;
  onAuthRequired?: () => void;
  onConflict?: () => void;
  onCorruption?: (errors: string[]) => void;
  onRebased?: (treeId: string, nodes: FamilyNode[]) => void;
};

const INITIAL_STATUS: SyncStatusInfo = {
  status: "saved",
  pendingCount: 0,
  pendingDisplay: formatPendingCount(0),
};

export function useSyncEngine(
  userId: string,
  options: UseSyncEngineOptions = {}
) {
  const engineRef = useRef<SyncEngine | null>(null);
  const readyRef = useRef<Promise<SyncEngine> | null>(null);
  const optionsRef = useRef(options);
  const [status, setStatus] = useState<SyncStatusInfo>(INITIAL_STATUS);

  optionsRef.current = options;

  const buildEngine = useCallback(
    (wal: WriteAheadLog) =>
      new SyncEngine({
        wal,
        getTreeNodes: (treeId) =>
          optionsRef.current.getTreeNodes?.(treeId) ?? null,
        events: {
          authRequired: () => optionsRef.current.onAuthRequired?.(),
          conflict: () => optionsRef.current.onConflict?.(),
          corruption: (errors) => optionsRef.current.onCorruption?.(errors),
          rebased: (treeId, nodes) =>
            optionsRef.current.onRebased?.(treeId, nodes),
        },
      }),
    []
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const ready = createWriteAheadLog().then(async (wal) => {
      const engine = buildEngine(wal);
      if (cancelled) {
        engine.destroy();
        return engine;
      }
      engineRef.current = engine;
      engine.onStatusChange(setStatus);
      await engine.initialize();
      return engine;
    });

    readyRef.current = ready;

    return () => {
      cancelled = true;
      ready.then((engine) => engine.destroy()).catch(() => undefined);
      engineRef.current = null;
      readyRef.current = null;
    };
  }, [buildEngine, userId]);

  useEffect(() => {
    const pending = status.pendingCount;
    const needsWarning = status.status !== "saved";
    if (!needsWarning || pending === 0) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = `You have ${pending} unsynced changes.`;
      return event.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status.pendingCount, status.status]);

  const getReadyEngine = useCallback(async () => {
    if (!readyRef.current) {
      const wal = await createWriteAheadLog();
      const engine = buildEngine(wal);
      engineRef.current = engine;
      readyRef.current = Promise.resolve(engine);
      engine.onStatusChange(setStatus);
      await engine.initialize();
    }
    return readyRef.current;
  }, [buildEngine]);

  const enqueue = useCallback(
    async (treeId: string, mutation: Mutation) => {
      const engine = await getReadyEngine();
      return engine.enqueue(treeId, mutation);
    },
    [getReadyEngine]
  );

  const enqueueMany = useCallback(
    async (treeId: string, mutations: Mutation[]) => {
      if (mutations.length === 0) return [];
      const engine = await getReadyEngine();
      return engine.enqueueMany(treeId, mutations);
    },
    [getReadyEngine]
  );

  const retryFailed = useCallback(async () => {
    const engine = await getReadyEngine();
    await engine.retryFailed();
  }, [getReadyEngine]);

  const forceSync = useCallback(async () => {
    const engine = await getReadyEngine();
    await engine.forceSync();
  }, [getReadyEngine]);

  const setLastSyncedVersion = useCallback(
    async (treeId: string, version: number) => {
      const engine = await getReadyEngine();
      await engine.setLastSyncedVersion(treeId, version);
    },
    [getReadyEngine]
  );

  return {
    status,
    enqueue,
    enqueueMany,
    retryFailed,
    forceSync,
    setLastSyncedVersion,
  };
}
