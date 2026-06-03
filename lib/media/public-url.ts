const SUPABASE_STORAGE_HOST_SUFFIX = ".storage.supabase.co";
const SUPABASE_S3_PATH = "/storage/v1/s3";
const SUPABASE_OBJECT_PUBLIC_PATH = "/storage/v1/object/public";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function hostedSupabasePublicOrigin(url: URL): string | null {
  if (!url.hostname.endsWith(SUPABASE_STORAGE_HOST_SUFFIX)) return null;
  const projectRef = url.hostname.slice(0, -SUPABASE_STORAGE_HOST_SUFFIX.length);
  if (!projectRef) return null;
  return `${url.protocol}//${projectRef}.supabase.co`;
}

export function derivePublicBaseUrlFromEndpoint(
  endpoint: string,
  bucket: string
): string | null {
  try {
    const url = new URL(stripTrailingSlash(endpoint));
    const path = url.pathname.replace(/\/+$/, "");
    if (!path.endsWith(SUPABASE_S3_PATH)) return null;

    const hostedOrigin = hostedSupabasePublicOrigin(url);
    const origin = hostedOrigin ?? url.origin;
    const basePath = path.slice(0, -"/s3".length);
    return `${origin}${basePath}/object/public/${encodeRfc3986(bucket)}`;
  } catch {
    return null;
  }
}

export function resolveDisplayMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return url;

  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname;
    const marker = `${SUPABASE_S3_PATH}/`;
    const markerIndex = path.indexOf(marker);
    const hostedOrigin = hostedSupabasePublicOrigin(parsed);

    if (markerIndex === -1) {
      if (!hostedOrigin || path.startsWith(SUPABASE_OBJECT_PUBLIC_PATH)) {
        return trimmed;
      }

      const objectPath = path.replace(/^\/+/, "");
      if (!objectPath) return trimmed;

      return `${hostedOrigin}${SUPABASE_OBJECT_PUBLIC_PATH}/${objectPath}`;
    }

    const origin = hostedOrigin ?? parsed.origin;
    const basePath = path.slice(0, markerIndex + "/storage/v1".length);
    const objectPath = path.slice(markerIndex + marker.length);
    if (!objectPath) return trimmed;

    return `${origin}${basePath}/object/public/${objectPath}`;
  } catch {
    return url;
  }
}
