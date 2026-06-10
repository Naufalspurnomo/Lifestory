import { afterEach, describe, expect, it, vi } from "vitest";
import { RemoteTreePoller } from "../../lib/sync/RemoteTreePoller";
import type { TreePullResult } from "../../lib/tree/apiClient";
import type { TreeData } from "../../lib/types/tree";

function tree(version: number): TreeData {
  return {
    id: "tree-1",
    name: "Keluarga",
    ownerId: "user-1",
    version,
    nodes: [],
    createdAt: "2026-06-02T00:00:00.000Z",
    updatedAt: "2026-06-02T00:00:00.000Z",
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("RemoteTreePoller", () => {
  it("applies a collaborator version when the local canvas is clean", async () => {
    const applied: TreeData[] = [];
    const fetchRemoteChanges = vi.fn(async (): Promise<TreePullResult> => ({
      changed: true,
      currentVersion: 2,
      tree: tree(2),
      changedNodeIds: ["node-2"],
      complete: true,
    }));
    const poller = new RemoteTreePoller({
      getActiveTreeId: () => "tree-1",
      getLastSyncedVersion: async () => 1,
      getLocalRevision: () => 0,
      hasUnresolvedChanges: async () => false,
      fetchRemoteChanges,
      applyRemoteTree: (remoteTree) => {
        applied.push(remoteTree);
      },
      activeIntervalMs: 60_000,
    });

    poller.start();
    await poller.refreshNow();
    poller.stop();

    expect(fetchRemoteChanges).toHaveBeenCalledWith("tree-1", 1);
    expect(applied.map((item) => item.version)).toEqual([2]);
  });

  it("does not request remote state while local edits are waiting to sync", async () => {
    const fetchRemoteChanges = vi.fn();
    const poller = new RemoteTreePoller({
      getActiveTreeId: () => "tree-1",
      getLastSyncedVersion: async () => 1,
      getLocalRevision: () => 0,
      hasUnresolvedChanges: async () => true,
      fetchRemoteChanges,
      applyRemoteTree: vi.fn(),
      activeIntervalMs: 60_000,
    });

    poller.start();
    await poller.refreshNow();
    poller.stop();

    expect(fetchRemoteChanges).not.toHaveBeenCalled();
  });

  it("waits for server hydration when a legacy cache has no sync version", async () => {
    const fetchRemoteChanges = vi.fn();
    const poller = new RemoteTreePoller({
      getActiveTreeId: () => "tree-1",
      getLastSyncedVersion: async () => 0,
      getLocalRevision: () => 0,
      hasUnresolvedChanges: async () => false,
      fetchRemoteChanges,
      applyRemoteTree: vi.fn(),
      activeIntervalMs: 60_000,
    });

    poller.start();
    await poller.refreshNow();
    poller.stop();

    expect(fetchRemoteChanges).not.toHaveBeenCalled();
  });

  it("does not overwrite an edit made while a remote response is in flight", async () => {
    let resolvePull: ((result: TreePullResult) => void) | undefined;
    let localRevision = 0;
    const applyRemoteTree = vi.fn();
    const fetchRemoteChanges = vi.fn(
      () =>
        new Promise<TreePullResult>((resolve) => {
          resolvePull = resolve;
        })
    );
    const poller = new RemoteTreePoller({
      getActiveTreeId: () => "tree-1",
      getLastSyncedVersion: async () => 1,
      getLocalRevision: () => localRevision,
      hasUnresolvedChanges: async () => false,
      fetchRemoteChanges,
      applyRemoteTree,
      activeIntervalMs: 60_000,
    });

    poller.start();
    await vi.waitFor(() => expect(fetchRemoteChanges).toHaveBeenCalledOnce());
    localRevision += 1;
    resolvePull?.({
      changed: true,
      currentVersion: 2,
      tree: tree(2),
      changedNodeIds: ["node-2"],
      complete: true,
    });
    await poller.refreshNow();
    poller.stop();

    expect(applyRemoteTree).not.toHaveBeenCalled();
  });

  it("stops background polling after teardown", async () => {
    vi.useFakeTimers();
    const fetchRemoteChanges = vi.fn(async (): Promise<TreePullResult> => ({
      changed: false,
      currentVersion: 1,
    }));
    const poller = new RemoteTreePoller({
      getActiveTreeId: () => "tree-1",
      getLastSyncedVersion: async () => 1,
      getLocalRevision: () => 0,
      hasUnresolvedChanges: async () => false,
      fetchRemoteChanges,
      applyRemoteTree: vi.fn(),
      activeIntervalMs: 10,
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchRemoteChanges).toHaveBeenCalledOnce();
    poller.stop();
    await vi.advanceTimersByTimeAsync(100);

    expect(fetchRemoteChanges).toHaveBeenCalledOnce();
  });

  it("uses the idle interval when no collaborator changes are found", async () => {
    vi.useFakeTimers();
    const fetchRemoteChanges = vi.fn(async (): Promise<TreePullResult> => ({
      changed: false,
      currentVersion: 1,
    }));
    const poller = new RemoteTreePoller({
      getActiveTreeId: () => "tree-1",
      getLastSyncedVersion: async () => 1,
      getLocalRevision: () => 0,
      hasUnresolvedChanges: async () => false,
      fetchRemoteChanges,
      applyRemoteTree: vi.fn(),
      activeIntervalMs: 10,
      idleIntervalMs: 50,
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchRemoteChanges).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(49);
    expect(fetchRemoteChanges).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(1);
    expect(fetchRemoteChanges).toHaveBeenCalledTimes(2);
    poller.stop();
  });

  it("polls briefly at the active interval after a remote change", async () => {
    vi.useFakeTimers();
    const fetchRemoteChanges = vi.fn(async (): Promise<TreePullResult> => ({
      changed: true,
      currentVersion: 2,
      tree: tree(2),
      changedNodeIds: ["node-2"],
      complete: true,
    }));
    const poller = new RemoteTreePoller({
      getActiveTreeId: () => "tree-1",
      getLastSyncedVersion: async () => 1,
      getLocalRevision: () => 0,
      hasUnresolvedChanges: async () => false,
      fetchRemoteChanges,
      applyRemoteTree: vi.fn(),
      activeIntervalMs: 10,
      idleIntervalMs: 50,
      activeWindowMs: 100,
    });

    poller.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchRemoteChanges).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(10);
    expect(fetchRemoteChanges).toHaveBeenCalledTimes(2);
    poller.stop();
  });

  it("does not apply an in-flight response after teardown", async () => {
    let resolvePull: ((result: TreePullResult) => void) | undefined;
    const applyRemoteTree = vi.fn();
    const fetchRemoteChanges = vi.fn(
      () =>
        new Promise<TreePullResult>((resolve) => {
          resolvePull = resolve;
        })
    );
    const poller = new RemoteTreePoller({
      getActiveTreeId: () => "tree-1",
      getLastSyncedVersion: async () => 1,
      getLocalRevision: () => 0,
      hasUnresolvedChanges: async () => false,
      fetchRemoteChanges,
      applyRemoteTree,
      activeIntervalMs: 60_000,
    });

    poller.start();
    const pending = poller.refreshNow();
    await vi.waitFor(() => expect(fetchRemoteChanges).toHaveBeenCalledOnce());
    poller.stop();
    resolvePull?.({
      changed: true,
      currentVersion: 2,
      tree: tree(2),
      changedNodeIds: ["node-2"],
      complete: true,
    });
    await pending;

    expect(applyRemoteTree).not.toHaveBeenCalled();
  });
});
