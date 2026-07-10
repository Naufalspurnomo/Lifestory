// Thin fetch wrappers for the Tree API. Lives in its own file so it can be
// unit-tested with a mocked fetch without having to boot a server.

import type { FamilyNode, TreeData } from "../types/tree";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";

export type TreeSummary = {
  id: string;
  name: string;
  ownerId: string;
  version?: number;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
};

export type TreeOnboardingStatus = {
  firstTreeWelcomeTreeId: string | null;
};

export type TreeListResult = {
  trees: TreeSummary[];
  onboarding: TreeOnboardingStatus;
};

export type TreeCreateApiResult = {
  tree: TreeData;
  onboarding: TreeOnboardingStatus;
};

export class TreeApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "TreeApiError";
  }
}

export type TreePullResult =
  | { changed: false; currentVersion: number }
  | {
      changed: true;
      currentVersion: number;
      tree: TreeData;
      changedNodeIds: string[];
      complete: boolean;
    };

export function choosePrimaryTree(
  summaries: TreeSummary[],
  preferredTreeId: string | null
): TreeSummary | null {
  const preferred = summaries.find((tree) => tree.id === preferredTreeId);
  if (preferred) return preferred;

  return (
    [...summaries].sort(
      (a, b) =>
        b.nodeCount - a.nodeCount ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0] ?? null
  );
}

export function collapseLegacyDuplicateTrees(
  summaries: TreeSummary[]
): TreeSummary[] {
  const byFamily = new Map<string, TreeSummary>();

  for (const tree of summaries) {
    const key = `${tree.ownerId}:${tree.name.trim().toLocaleLowerCase("id")}`;
    const current = byFamily.get(key);
    const isBetterCandidate =
      !current ||
      tree.nodeCount > current.nodeCount ||
      (tree.nodeCount === current.nodeCount &&
        new Date(tree.updatedAt).getTime() >
          new Date(current.updatedAt).getTime());
    if (isBetterCandidate) byFamily.set(key, tree);
  }

  return Array.from(byFamily.values()).sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

async function expectOk(response: Response): Promise<void> {
  if (response.ok) return;
  let message = `HTTP ${response.status}`;
  try {
    const body = await response.json();
    if (body?.error) message = body.error;
  } catch {
    /* ignore */
  }
  throw new TreeApiError(message, response.status);
}

export async function listTrees(
  fetchImpl: typeof fetch = fetch
): Promise<TreeListResult> {
  const res = await fetchWithTimeout(
    fetchImpl,
    "/api/trees",
    { cache: "no-store" },
    15_000
  );
  await expectOk(res);
  const body = (await res.json()) as Partial<TreeListResult>;
  return {
    trees: body.trees ?? [],
    onboarding: {
      firstTreeWelcomeTreeId:
        body.onboarding?.firstTreeWelcomeTreeId ?? null,
    },
  };
}

export async function loadTree(
  id: string,
  fetchImpl: typeof fetch = fetch
): Promise<TreeData> {
  const res = await fetchWithTimeout(
    fetchImpl,
    `/api/trees/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
    },
    20_000
  );
  await expectOk(res);
  const body = (await res.json()) as { tree: TreeData };
  return body.tree;
}

export async function pullTreeChanges(
  id: string,
  sinceVersion: number,
  fetchImpl: typeof fetch = fetch
): Promise<TreePullResult> {
  const params = new URLSearchParams({ sinceVersion: String(sinceVersion) });
  const res = await fetchWithTimeout(
    fetchImpl,
    `/api/trees/${encodeURIComponent(id)}/sync?${params}`,
    { cache: "no-store" },
    12_000
  );
  await expectOk(res);
  return (await res.json()) as TreePullResult;
}

export async function createTreeApi(
  name: string,
  optionsOrFetch: { id?: string; nodes?: FamilyNode[] } | typeof fetch = {},
  fetchImpl: typeof fetch = fetch
): Promise<TreeCreateApiResult> {
  const options =
    typeof optionsOrFetch === "function" ? {} : optionsOrFetch;
  const request = typeof optionsOrFetch === "function" ? optionsOrFetch : fetchImpl;
  const res = await fetchWithTimeout(
    request,
    "/api/trees",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ...options }),
    },
    30_000
  );
  await expectOk(res);
  const body = (await res.json()) as Partial<TreeCreateApiResult>;
  if (!body.tree) {
    throw new TreeApiError("Invalid tree creation response", 500);
  }
  return {
    tree: body.tree,
    onboarding: {
      firstTreeWelcomeTreeId:
        body.onboarding?.firstTreeWelcomeTreeId ?? null,
    },
  };
}

export async function dismissFirstTreeWelcomeApi(
  treeId: string,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const res = await fetchWithTimeout(
    fetchImpl,
    `/api/trees/${encodeURIComponent(treeId)}/first-tree-welcome`,
    { method: "POST" },
    15_000
  );
  await expectOk(res);
}

export async function saveTreeNodes(
  id: string,
  expectedVersion: number,
  nodes: FamilyNode[],
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const res = await fetchWithTimeout(
    fetchImpl,
    `/api/trees/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedVersion, nodes }),
    },
    30_000
  );
  await expectOk(res);
}

export async function deleteTreeApi(
  id: string,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const res = await fetchWithTimeout(
    fetchImpl,
    `/api/trees/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
    15_000
  );
  await expectOk(res);
}
