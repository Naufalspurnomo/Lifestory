// Thin fetch wrappers for the Tree API. Lives in its own file so it can be
// unit-tested with a mocked fetch without having to boot a server.

import type { FamilyNode, TreeData } from "../types/tree";

export type TreeSummary = {
  id: string;
  name: string;
  ownerId: string;
  version?: number;
  createdAt: string;
  updatedAt: string;
};

export class TreeApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "TreeApiError";
  }
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
  fetchImpl: typeof fetch = fetch
): Promise<TreeData> {
  const res = await fetchImpl("/api/trees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  await expectOk(res);
  const body = (await res.json()) as { tree: TreeData };
  return body.tree;
}

export async function saveTreeNodes(
  id: string,
  nodes: FamilyNode[],
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const res = await fetchImpl(`/api/trees/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodes }),
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
