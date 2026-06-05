import type { MediaItem, MediaPurpose } from "../types/tree";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import { prepareMediaFileForUpload } from "./image-optimizer";
import { resolveDisplayMediaUrl } from "./public-url";

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

export type MediaUploadStage = "optimizing" | "presigning" | "uploading" | "done";

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
  onStage?: (stage: MediaUploadStage) => void;
}): Promise<UploadedMediaAsset> {
  input.onStage?.("optimizing");
  const prepared = await prepareMediaFileForUpload(input.file, input.purpose);
  const file = prepared.file;

  input.onStage?.("presigning");
  const presignResponse = await fetchWithTimeout(
    fetch,
    "/api/media/presign",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        treeId: input.treeId,
        nodeId: input.nodeId ?? null,
        purpose: input.purpose,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      }),
    },
    20_000
  );
  const presignPayload = await presignResponse.json().catch(() => ({}));
  if (!presignResponse.ok) {
    throw new Error(
      readApiError(presignPayload, "Media upload could not be prepared")
    );
  }

  const upload = presignPayload as UploadResponse;
  input.onStage?.("uploading");
  const putResponse = await fetchWithTimeout(
    fetch,
    upload.uploadUrl,
    {
      method: upload.method,
      headers: upload.headers,
      body: file,
    },
    90_000
  );
  if (!putResponse.ok) {
    throw new Error(`Media upload failed with HTTP ${putResponse.status}`);
  }

  input.onStage?.("done");
  return {
    ...upload.asset,
    url: resolveDisplayMediaUrl(upload.asset.url),
  };
}
