import { createHmac, createHash, randomUUID } from "crypto";

export type MediaPurpose = "profile" | "gallery";

export type MediaStorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
  uploadUrlTtlSeconds: number;
  maxFileBytes: number;
  treeQuotaBytes: number;
};

export type PresignedUpload = {
  uploadUrl: string;
  objectUrl: string;
  storageKey: string;
  expiresAt: string;
};

export class MediaStorageConfigurationError extends Error {
  constructor() {
    super("Media object storage is not configured");
    this.name = "MediaStorageConfigurationError";
  }
}

const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024;
const DEFAULT_TREE_QUOTA_BYTES = 5 * 1024 * 1024 * 1024;
const DEFAULT_UPLOAD_TTL_SECONDS = 10 * 60;

const allowedImageContentTypes = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function cleanEnv(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed === "replace_me" ? "" : trimmed;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number
): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function encodeStorageKey(key: string): string {
  return key.split("/").map(encodeRfc3986).join("/");
}

function sanitizeSegment(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 128);
}

function extensionForContentType(contentType: string): string {
  switch (contentType.toLowerCase()) {
    case "image/avif":
      return "avif";
    case "image/gif":
      return "gif";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

function amzDates(date: Date): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function signingKey(secretAccessKey: string, dateStamp: string, region: string) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

function credentialScope(dateStamp: string, region: string): string {
  return `${dateStamp}/${region}/s3/aws4_request`;
}

function objectEndpointUrl(config: MediaStorageConfig, storageKey: string): URL {
  const url = new URL(stripTrailingSlash(config.endpoint));
  url.pathname = objectPathname(config, storageKey);
  return url;
}

function canonicalQuery(params: URLSearchParams): string {
  return [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeRfc3986(key)}=${encodeRfc3986(value)}`)
    .join("&");
}

function canonicalObjectUri(config: MediaStorageConfig, storageKey: string) {
  return objectPathname(config, storageKey);
}

function objectPathname(
  config: MediaStorageConfig,
  storageKey: string
): string {
  const endpoint = new URL(stripTrailingSlash(config.endpoint));
  const basePath =
    endpoint.pathname === "/" ? "" : endpoint.pathname.replace(/\/+$/, "");
  return `${basePath}/${encodeRfc3986(config.bucket)}/${encodeStorageKey(
    storageKey
  )}`;
}

function isLikelyConfigured(value: string): boolean {
  return value.length > 0 && value !== "replace_me";
}

export function getMediaStorageConfig(
  env: NodeJS.ProcessEnv = process.env
): MediaStorageConfig | null {
  const endpoint = cleanEnv(env.S3_ENDPOINT);
  const bucket = cleanEnv(env.S3_BUCKET);
  const accessKeyId = cleanEnv(env.S3_ACCESS_KEY);
  const secretAccessKey = cleanEnv(env.S3_SECRET_KEY);

  if (
    ![endpoint, bucket, accessKeyId, secretAccessKey].every(isLikelyConfigured)
  ) {
    return null;
  }

  const publicBaseUrl =
    cleanEnv(env.S3_PUBLIC_BASE_URL) || `${stripTrailingSlash(endpoint)}/${bucket}`;

  return {
    endpoint: stripTrailingSlash(endpoint),
    region: cleanEnv(env.S3_REGION) || "auto",
    bucket,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl: stripTrailingSlash(publicBaseUrl),
    uploadUrlTtlSeconds: parsePositiveInteger(
      env.MEDIA_UPLOAD_URL_TTL_SECONDS,
      DEFAULT_UPLOAD_TTL_SECONDS
    ),
    maxFileBytes: parsePositiveInteger(
      env.MEDIA_FILE_MAX_BYTES,
      DEFAULT_MAX_FILE_BYTES
    ),
    treeQuotaBytes: parsePositiveInteger(
      env.MEDIA_TREE_QUOTA_BYTES,
      DEFAULT_TREE_QUOTA_BYTES
    ),
  };
}

export function requireMediaStorageConfig(): MediaStorageConfig {
  const config = getMediaStorageConfig();
  if (!config) throw new MediaStorageConfigurationError();
  return config;
}

export function isAllowedMediaContentType(contentType: string): boolean {
  return allowedImageContentTypes.has(contentType.toLowerCase());
}

export function createMediaStorageKey(input: {
  treeId: string;
  nodeId?: string | null;
  userId: string;
  purpose: MediaPurpose;
  contentType: string;
  now?: Date;
}): string {
  const now = input.now ?? new Date();
  const yyyy = now.getUTCFullYear();
  const mm = `${now.getUTCMonth() + 1}`.padStart(2, "0");
  const ownerSegment = input.nodeId
    ? `nodes/${sanitizeSegment(input.nodeId)}`
    : `drafts/${sanitizeSegment(input.userId)}`;
  const extension = extensionForContentType(input.contentType);
  return [
    "trees",
    sanitizeSegment(input.treeId),
    ownerSegment,
    input.purpose,
    `${yyyy}`,
    mm,
    `${randomUUID()}.${extension}`,
  ].join("/");
}

export function buildObjectUrl(
  config: MediaStorageConfig,
  storageKey: string
): string {
  return `${config.publicBaseUrl}/${encodeStorageKey(storageKey)}`;
}

export function createPresignedPutUrl(
  config: MediaStorageConfig,
  storageKey: string,
  now = new Date()
): PresignedUpload {
  const { amzDate, dateStamp } = amzDates(now);
  const scope = credentialScope(dateStamp, config.region);
  const endpoint = objectEndpointUrl(config, storageKey);
  const expiresAt = new Date(
    now.getTime() + config.uploadUrlTtlSeconds * 1000
  ).toISOString();
  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": `${config.uploadUrlTtlSeconds}`,
    "X-Amz-SignedHeaders": "host",
  });

  const canonicalRequest = [
    "PUT",
    canonicalObjectUri(config, storageKey),
    canonicalQuery(query),
    `host:${endpoint.host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = createHmac(
    "sha256",
    signingKey(config.secretAccessKey, dateStamp, config.region)
  )
    .update(stringToSign)
    .digest("hex");

  query.set("X-Amz-Signature", signature);
  endpoint.search = query.toString();

  return {
    uploadUrl: endpoint.toString(),
    objectUrl: buildObjectUrl(config, storageKey),
    storageKey,
    expiresAt,
  };
}

export async function deleteMediaObject(
  config: MediaStorageConfig,
  storageKey: string,
  now = new Date()
): Promise<void> {
  const { amzDate, dateStamp } = amzDates(now);
  const scope = credentialScope(dateStamp, config.region);
  const endpoint = objectEndpointUrl(config, storageKey);
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "DELETE",
    canonicalObjectUri(config, storageKey),
    "",
    [
      `host:${endpoint.host}`,
      "x-amz-content-sha256:UNSIGNED-PAYLOAD",
      `x-amz-date:${amzDate}`,
      "",
    ].join("\n"),
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = createHmac(
    "sha256",
    signingKey(config.secretAccessKey, dateStamp, config.region)
  )
    .update(stringToSign)
    .digest("hex");
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: authorization,
      "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
      "x-amz-date": amzDate,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Object storage delete failed with HTTP ${response.status}`);
  }
}

export function storageKeyBelongsToTree(
  storageKey: string,
  treeId: string
): boolean {
  return storageKey.startsWith(`trees/${sanitizeSegment(treeId)}/`);
}
