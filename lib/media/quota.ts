import type { FamilyNode, MediaItem } from "../types/tree";

function byteLength(value: string | null | undefined): number {
  return value ? new TextEncoder().encode(value).byteLength : 0;
}

function isInlineDataUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && value.toLowerCase().startsWith("data:");
}

function mediaItemObjectBytes(item: MediaItem): number {
  return typeof item.sizeBytes === "number" && item.sizeBytes > 0
    ? item.sizeBytes
    : 0;
}

export function calculateTreeMediaUsage(nodes: FamilyNode[]): {
  inlineBytes: number;
  objectBytes: number;
  objectCount: number;
} {
  let inlineBytes = 0;
  let objectBytes = 0;
  let objectCount = 0;

  for (const node of nodes) {
    if (isInlineDataUrl(node.imageUrl)) {
      inlineBytes += byteLength(node.imageUrl);
    } else if (node.imageStorageKey) {
      objectBytes += node.imageSizeBytes ?? 0;
      objectCount += 1;
    }

    for (const item of node.content?.media ?? []) {
      if (isInlineDataUrl(item.url)) {
        inlineBytes += byteLength(item.url);
      } else if (item.storageKey) {
        objectBytes += mediaItemObjectBytes(item);
        objectCount += 1;
      }
    }
  }

  return { inlineBytes, objectBytes, objectCount };
}

export function countNodeGalleryItems(
  nodes: FamilyNode[],
  nodeId: string | null | undefined
): number {
  if (!nodeId) return 0;
  return (
    nodes.find((node) => node.id === nodeId)?.content?.media?.length ?? 0
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
