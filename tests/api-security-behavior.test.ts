import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applyRateLimit: vi.fn(),
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
  assertTreeWritable: vi.fn(),
  getTreeForUser: vi.fn(),
  deleteMediaObject: vi.fn(),
  requireMediaStorageConfig: vi.fn(),
  storageKeyBelongsToTree: vi.fn(),
  createMediaStorageKey: vi.fn(),
  createPresignedPutUrl: vi.fn(),
  isAllowedMediaContentType: vi.fn(),
  listSnapshots: vi.fn(),
  createSnapshot: vi.fn(),
  getSnapshot: vi.fn(),
  restoreSnapshot: vi.fn(),
  userFindMany: vi.fn(),
}));

vi.mock("../lib/rate-limit", () => ({
  applyRateLimit: mocks.applyRateLimit,
  rateLimitConfigs: {
    admin: { windowMs: 60_000, maxRequests: 100 },
    api: { windowMs: 60_000, maxRequests: 60 },
    sensitive: { windowMs: 60_000, maxRequests: 10 },
  },
}));

vi.mock("../lib/auth-helpers", () => ({
  requireUser: mocks.requireUser,
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("../lib/tree/repository", () => {
  class TreeAccessError extends Error {
    constructor(message: string, public readonly status = 403) {
      super(message);
    }
  }

  class InvalidTreeGraphError extends Error {}

  return {
    assertTreeWritable: mocks.assertTreeWritable,
    getTreeForUser: mocks.getTreeForUser,
    TreeAccessError,
    InvalidTreeGraphError,
  };
});

vi.mock("../lib/media/storage", () => {
  class MediaStorageConfigurationError extends Error {}

  return {
    createMediaStorageKey: mocks.createMediaStorageKey,
    createPresignedPutUrl: mocks.createPresignedPutUrl,
    deleteMediaObject: mocks.deleteMediaObject,
    isAllowedMediaContentType: mocks.isAllowedMediaContentType,
    MediaStorageConfigurationError,
    requireMediaStorageConfig: mocks.requireMediaStorageConfig,
    storageKeyBelongsToTree: mocks.storageKeyBelongsToTree,
  };
});

vi.mock("../lib/sync/BackupManager", () => ({
  BackupManager: class {
    listSnapshots(treeId: string) {
      return mocks.listSnapshots(treeId);
    }

    createSnapshot(treeId: string) {
      return mocks.createSnapshot(treeId);
    }

    getSnapshot(snapshotId: string) {
      return mocks.getSnapshot(snapshotId);
    }

    restoreSnapshot(treeId: string, snapshotId: string, userId: string) {
      return mocks.restoreSnapshot(treeId, snapshotId, userId);
    }
  },
}));

vi.mock("../lib/db", () => ({
  prisma: {
    user: {
      findMany: mocks.userFindMany,
    },
  },
}));

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function responseJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("API security behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mocks.applyRateLimit.mockResolvedValue(null);
    mocks.requireUser.mockResolvedValue({
      success: true,
      session: { user: { id: "user-1" } },
    });
    mocks.requireAdmin.mockResolvedValue({
      success: true,
      session: { user: { id: "admin-1", role: "admin" } },
    });
    mocks.assertTreeWritable.mockResolvedValue(undefined);
    mocks.getTreeForUser.mockResolvedValue({ nodes: [] });
    mocks.deleteMediaObject.mockResolvedValue(undefined);
    mocks.requireMediaStorageConfig.mockReturnValue({
      maxFileBytes: 5 * 1024 * 1024,
      treeQuotaBytes: 5 * 1024 * 1024 * 1024,
    });
    mocks.storageKeyBelongsToTree.mockReturnValue(true);
    mocks.createMediaStorageKey.mockReturnValue(
      "trees/tree-1/nodes/node-1/gallery/photo.webp"
    );
    mocks.createPresignedPutUrl.mockReturnValue({
      uploadUrl: "https://storage.example/upload",
      objectUrl: "https://cdn.example/photo.webp",
      storageKey: "trees/tree-1/nodes/node-1/gallery/photo.webp",
      expiresAt: "2026-06-08T00:00:00.000Z",
    });
    mocks.isAllowedMediaContentType.mockReturnValue(true);
    mocks.restoreSnapshot.mockResolvedValue(undefined);
    mocks.userFindMany.mockResolvedValue([]);
  });

  it("rate-limits media presign before auth or storage work", async () => {
    mocks.applyRateLimit.mockResolvedValue(
      responseJson({ error: "Too many requests" }, 429)
    );
    const { POST } = await import("../app/api/media/presign/route");

    const response = await POST(
      jsonRequest("https://lifestory.local/api/media/presign", {
        treeId: "tree-1",
        nodeId: "node-1",
        purpose: "gallery",
        fileName: "photo.webp",
        contentType: "image/webp",
        sizeBytes: 1024,
      })
    );

    expect(response.status).toBe(429);
    expect(mocks.requireUser).not.toHaveBeenCalled();
    expect(mocks.requireMediaStorageConfig).not.toHaveBeenCalled();
    expect(mocks.createPresignedPutUrl).not.toHaveBeenCalled();
  });

  it("rejects cross-tree media delete keys before ownership or storage mutation", async () => {
    mocks.storageKeyBelongsToTree.mockReturnValue(false);
    const { POST } = await import("../app/api/media/delete/route");

    const response = await POST(
      jsonRequest("https://lifestory.local/api/media/delete", {
        treeId: "tree-a",
        storageKey: "trees/tree-b/nodes/node-1/gallery/photo.webp",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid storage key");
    expect(mocks.assertTreeWritable).not.toHaveBeenCalled();
    expect(mocks.deleteMediaObject).not.toHaveBeenCalled();
  });

  it("requires login before restoring a tree snapshot", async () => {
    mocks.requireUser.mockResolvedValue({
      success: false,
      response: responseJson({ error: "Unauthorized - Please login" }, 401),
    });
    const { POST } = await import(
      "../app/api/trees/[id]/snapshots/[snapshotId]/restore/route"
    );

    const response = await POST(
      new Request("https://lifestory.local/api/trees/tree-1/snapshots/snap-1/restore", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "tree-1", snapshotId: "snap-1" }) }
    );

    expect(response.status).toBe(401);
    expect(mocks.restoreSnapshot).not.toHaveBeenCalled();
  });

  it("queries admin users with a password-free projection", async () => {
    const createdAt = new Date("2026-06-08T00:00:00.000Z");
    mocks.userFindMany.mockResolvedValue([
      {
        id: "user-1",
        name: "Naufal",
        email: "naufal@example.com",
        phone: "+6200000000",
        role: "user",
        subscriptionActive: false,
        status: "inactive",
        createdAt,
      },
    ]);
    const { GET } = await import("../app/api/users/route");

    const response = await GET(
      new Request("https://lifestory.local/api/users", { method: "GET" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.userFindMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        subscriptionActive: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    expect(JSON.stringify(body)).not.toContain("passwordHash");
    expect(body[0]).toMatchObject({
      id: "user-1",
      email: "naufal@example.com",
    });
  });
});
