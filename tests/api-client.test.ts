import { describe, it, expect, vi } from "vitest";
import {
  listTrees,
  loadTree,
  createTreeApi,
  saveTreeNodes,
  deleteTreeApi,
  TreeApiError,
} from "../lib/tree/apiClient";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiClient - happy paths", () => {
  it("listTrees returns array from JSON envelope", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        trees: [
          {
            id: "t1",
            name: "Keluarga Naufal",
            ownerId: "u1",
            createdAt: "x",
            updatedAt: "y",
          },
        ],
      })
    );
    const trees = await listTrees(fetchMock as unknown as typeof fetch);
    expect(trees).toHaveLength(1);
    expect(trees[0].id).toBe("t1");
    expect(fetchMock).toHaveBeenCalledWith("/api/trees", { cache: "no-store" });
  });

  it("loadTree targets the right URL", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        tree: {
          id: "abc",
          name: "Keluarga",
          ownerId: "u1",
          nodes: [],
          createdAt: "x",
          updatedAt: "y",
        },
      })
    );
    const tree = await loadTree("abc", fetchMock as unknown as typeof fetch);
    expect(tree.id).toBe("abc");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trees/abc",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("createTreeApi sends name in JSON body", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          tree: {
            id: "new",
            name: "Keluarga Asep",
            ownerId: "u",
            nodes: [],
            createdAt: "x",
            updatedAt: "y",
          },
        },
        201
      )
    );
    const tree = await createTreeApi(
      "Keluarga Asep",
      fetchMock as unknown as typeof fetch
    );
    expect(tree.id).toBe("new");
    const callArgs = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(callArgs[0]).toBe("/api/trees");
    const body = JSON.parse(callArgs[1].body as string);
    expect(body).toEqual({ name: "Keluarga Asep" });
  });

  it("saveTreeNodes encodes id and resolves on 200", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    await saveTreeNodes(
      "tree id with space",
      [],
      fetchMock as unknown as typeof fetch
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trees/tree%20id%20with%20space",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("deleteTreeApi sends DELETE", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    await deleteTreeApi("abc", fetchMock as unknown as typeof fetch);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trees/abc",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("apiClient - error surfaces", () => {
  it("throws TreeApiError with status on 404", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: "Tree not found" }, 404)
    );
    await expect(
      loadTree("ghost", fetchMock as unknown as typeof fetch)
    ).rejects.toMatchObject({
      name: "TreeApiError",
      status: 404,
      message: "Tree not found",
    });
  });

  it("throws TreeApiError with 401 for unauthorized", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
    );
    const err = await listTrees(fetchMock as unknown as typeof fetch).catch(
      (error: unknown) => error
    );
    expect(err).toBeInstanceOf(TreeApiError);
    expect((err as TreeApiError).status).toBe(401);
  });

  it("falls back to generic HTTP message if body is not JSON", async () => {
    const fetchMock = vi.fn(
      async () => new Response("not json", { status: 500 })
    );
    const err = await listTrees(fetchMock as unknown as typeof fetch).catch(
      (error: unknown) => error
    );
    expect(err).toBeInstanceOf(TreeApiError);
    expect((err as TreeApiError).status).toBe(500);
    expect((err as TreeApiError).message).toBe("HTTP 500");
  });
});
