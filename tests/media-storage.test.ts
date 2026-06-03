import { describe, expect, it } from "vitest";
import { calculateTreeMediaUsage } from "../lib/media/quota";
import {
  derivePublicBaseUrlFromEndpoint,
  resolveDisplayMediaUrl,
} from "../lib/media/public-url";
import {
  buildObjectUrl,
  createMediaStorageKey,
  createPresignedPutUrl,
  getMediaStorageConfig,
  isAllowedMediaContentType,
  storageKeyBelongsToTree,
  type MediaStorageConfig,
} from "../lib/media/storage";
import type { FamilyNode } from "../lib/types/tree";

const config: MediaStorageConfig = {
  endpoint: "https://example.r2.cloudflarestorage.com",
  region: "auto",
  bucket: "lifestory-media",
  accessKeyId: "access-key",
  secretAccessKey: "secret-key",
  publicBaseUrl: "https://cdn.example.com",
  uploadUrlTtlSeconds: 600,
  maxFileBytes: 5 * 1024 * 1024,
  treeQuotaBytes: 5 * 1024 * 1024 * 1024,
};

function person(overrides: Partial<FamilyNode> = {}): FamilyNode {
  return {
    id: "node-1",
    label: "A",
    year: null,
    deathYear: null,
    parentId: null,
    parentIds: [],
    adoptiveParentIds: [],
    partners: [],
    childrenIds: [],
    generation: 0,
    line: "default",
    imageUrl: null,
    content: { description: "", media: [] },
    works: [],
    ...overrides,
  };
}

describe("media object storage helpers", () => {
  it("detects usable S3-compatible configuration", () => {
    expect(
      getMediaStorageConfig({
        S3_ENDPOINT: config.endpoint,
        S3_REGION: config.region,
        S3_BUCKET: config.bucket,
        S3_ACCESS_KEY: config.accessKeyId,
        S3_SECRET_KEY: config.secretAccessKey,
        S3_PUBLIC_BASE_URL: config.publicBaseUrl,
      } as NodeJS.ProcessEnv)
    ).toMatchObject({
      endpoint: config.endpoint,
      bucket: config.bucket,
      publicBaseUrl: config.publicBaseUrl,
    });

    expect(
      getMediaStorageConfig({
        S3_ENDPOINT: "replace_me",
        S3_BUCKET: config.bucket,
        S3_ACCESS_KEY: config.accessKeyId,
        S3_SECRET_KEY: config.secretAccessKey,
      } as NodeJS.ProcessEnv)
    ).toBeNull();
  });

  it("creates tree-scoped storage keys and public URLs", () => {
    const key = createMediaStorageKey({
      treeId: "tree/with unsafe",
      nodeId: "node:one",
      userId: "user-1",
      purpose: "gallery",
      contentType: "image/webp",
      now: new Date("2026-06-03T00:00:00.000Z"),
    });

    expect(key).toMatch(
      /^trees\/tree_with_unsafe\/nodes\/node_one\/gallery\/2026\/06\/.+\.webp$/
    );
    expect(storageKeyBelongsToTree(key, "tree/with unsafe")).toBe(true);
    expect(buildObjectUrl(config, key)).toContain("https://cdn.example.com/");
  });

  it("creates a presigned PUT URL without embedding the secret", () => {
    const upload = createPresignedPutUrl(
      config,
      "trees/tree-1/nodes/node-1/profile/2026/06/photo.webp",
      new Date("2026-06-03T00:00:00.000Z")
    );

    expect(upload.uploadUrl).toContain("X-Amz-Algorithm=AWS4-HMAC-SHA256");
    expect(upload.uploadUrl).toContain("X-Amz-Signature=");
    expect(upload.uploadUrl).not.toContain(config.secretAccessKey);
    expect(upload.objectUrl).toBe(
      "https://cdn.example.com/trees/tree-1/nodes/node-1/profile/2026/06/photo.webp"
    );
  });

  it("preserves path-prefixed S3 endpoints such as Supabase Storage", () => {
    const supabaseConfig: MediaStorageConfig = {
      ...config,
      endpoint: "https://project-ref.storage.supabase.co/storage/v1/s3",
      region: "ap-southeast-1",
      publicBaseUrl:
        "https://project-ref.supabase.co/storage/v1/object/public/lifestory-media",
    };
    const upload = createPresignedPutUrl(
      supabaseConfig,
      "trees/tree-1/nodes/node-1/gallery/2026/06/photo.webp",
      new Date("2026-06-03T00:00:00.000Z")
    );
    const uploadUrl = new URL(upload.uploadUrl);

    expect(uploadUrl.origin).toBe("https://project-ref.storage.supabase.co");
    expect(uploadUrl.pathname).toBe(
      "/storage/v1/s3/lifestory-media/trees/tree-1/nodes/node-1/gallery/2026/06/photo.webp"
    );
    expect(upload.uploadUrl).toContain("X-Amz-Signature=");
    expect(upload.objectUrl).toBe(
      "https://project-ref.supabase.co/storage/v1/object/public/lifestory-media/trees/tree-1/nodes/node-1/gallery/2026/06/photo.webp"
    );
  });

  it("derives Supabase public object URLs from the S3 endpoint", () => {
    expect(
      derivePublicBaseUrlFromEndpoint(
        "https://project-ref.storage.supabase.co/storage/v1/s3",
        "lifestory-media"
      )
    ).toBe(
      "https://project-ref.supabase.co/storage/v1/object/public/lifestory-media"
    );

    expect(
      getMediaStorageConfig({
        S3_ENDPOINT: "https://project-ref.storage.supabase.co/storage/v1/s3",
        S3_BUCKET: "lifestory-media",
        S3_ACCESS_KEY: config.accessKeyId,
        S3_SECRET_KEY: config.secretAccessKey,
      } as NodeJS.ProcessEnv)
    ).toMatchObject({
      publicBaseUrl:
        "https://project-ref.supabase.co/storage/v1/object/public/lifestory-media",
    });
  });

  it("normalizes Supabase S3 URLs before rendering media previews", () => {
    expect(
      resolveDisplayMediaUrl(
        "https://project-ref.storage.supabase.co/storage/v1/s3/lifestory-media/trees/tree-1/photo.webp"
      )
    ).toBe(
      "https://project-ref.supabase.co/storage/v1/object/public/lifestory-media/trees/tree-1/photo.webp"
    );

    expect(
      resolveDisplayMediaUrl(
        "https://project-ref.storage.supabase.co/lifestory-media/trees/tree-1/photo.webp"
      )
    ).toBe(
      "https://project-ref.supabase.co/storage/v1/object/public/lifestory-media/trees/tree-1/photo.webp"
    );

    expect(
      buildObjectUrl(
        {
          ...config,
          publicBaseUrl:
            "https://project-ref.storage.supabase.co/storage/v1/s3/lifestory-media",
        },
        "trees/tree-1/photo.webp"
      )
    ).toBe(
      "https://project-ref.supabase.co/storage/v1/object/public/lifestory-media/trees/tree-1/photo.webp"
    );
  });

  it("allows only supported image upload types for the current gallery UI", () => {
    expect(isAllowedMediaContentType("image/jpeg")).toBe(true);
    expect(isAllowedMediaContentType("image/webp")).toBe(true);
    expect(isAllowedMediaContentType("image/svg+xml")).toBe(false);
    expect(isAllowedMediaContentType("video/mp4")).toBe(false);
  });

  it("counts object media quota from stored metadata", () => {
    const usage = calculateTreeMediaUsage([
      person({
        imageUrl: "https://cdn.example.com/profile.webp",
        imageStorageKey: "trees/tree-1/nodes/node-1/profile/profile.webp",
        imageSizeBytes: 100,
        content: {
          description: "",
          media: [
            {
              type: "image",
              url: "https://cdn.example.com/gallery.webp",
              storageKey: "trees/tree-1/nodes/node-1/gallery/gallery.webp",
              sizeBytes: 250,
            },
          ],
        },
      }),
    ]);

    expect(usage).toEqual({
      inlineBytes: 0,
      objectBytes: 350,
      objectCount: 2,
    });
  });
});
