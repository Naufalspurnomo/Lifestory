// Thin fetch wrappers for the Tree API. Lives in its own file so it can be
// unit-tested with a mocked fetch without having to boot a server.

import type { FamilyNode, TreeData } from "../types/tree";

export type TreeSummary = {
  id: string;
  name: string;
  ownerId: string;
  version?: number;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
};

export class TreeApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "TreeApiError";
  }
}

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
): Promise<TreeSummary[]> {
  const res = await fetchImpl("/api/trees", { cache: "no-store" });
  await expectOk(res);
  const body = (await res.json()) as { trees: TreeSummary[] };
  return body.trees ?? [];
}

export async function loadTree(
  id: string,
  fetchImpl: typeof fetch = fetch
): Promise<TreeData> {
  const res = await fetchImpl(`/api/trees/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  await expectOk(res);
  const body = (await res.json()) as { tree: TreeData };
  return body.tree;
}

export async function createTreeApi(
  name: string,
  optionsOrFetch: { id?: string; nodes?: FamilyNode[] } | typeof fetch = {},
  fetchImpl: typeof fetch = fetch
): Promise<TreeData> {
  const options =
    typeof optionsOrFetch === "function" ? {} : optionsOrFetch;
  const request = typeof optionsOrFetch === "function" ? optionsOrFetch : fetchImpl;
  const res = await request("/api/trees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ...options }),
  });
  await expectOk(res);
  const body = (await res.json()) as { tree: TreeData };
  return body.tree;
}

export async function saveTreeNodes(
  id: string,
  expectedVersion: number,
  nodes: FamilyNode[],
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const res = await fetchImpl(`/api/trees/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expectedVersion, nodes }),
  });
  await expectOk(res);
}

export async function deleteTreeApi(
  id: string,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const res = await fetchImpl(`/api/trees/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  await expectOk(res);
}
