import type { MediaItem, MediaPurpose } from "../types/tree";

export type UploadedMediaAsset = MediaItem & {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
};

type UploadResponse = {
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  asset: UploadedMediaAsset;
};

function readApiError(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error;
  }
  return fallback;
}

export async function uploadMediaFile(input: {
  treeId: string;
  nodeId?: string | null;
  purpose: MediaPurpose;
  file: File;
}): Promise<UploadedMediaAsset> {
  const presignResponse = await fetch("/api/media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      treeId: input.treeId,
      nodeId: input.nodeId ?? null,
      purpose: input.purpose,
      fileName: input.file.name,
      contentType: input.file.type,
      sizeBytes: input.file.size,
    }),
  });
  const presignPayload = await presignResponse.json().catch(() => ({}));
  if (!presignResponse.ok) {
    throw new Error(
      readApiError(presignPayload, "Media upload could not be prepared")
    );
  }

  const upload = presignPayload as UploadResponse;
  const putResponse = await fetch(upload.uploadUrl, {
    method: upload.method,
    headers: upload.headers,
    body: input.file,
  });
  if (!putResponse.ok) {
    throw new Error(`Media upload failed with HTTP ${putResponse.status}`);
  }

  return upload.asset;
}
