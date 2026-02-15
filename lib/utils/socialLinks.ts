const INSTAGRAM_HANDLE_REGEX = /^[a-zA-Z0-9._]{1,30}$/;
const TIKTOK_HANDLE_REGEX = /^[a-zA-Z0-9._]{2,24}$/;
const LINKEDIN_SLUG_REGEX = /^[a-zA-Z0-9-_%]+$/;

function extractHandleFromPath(pathname: string): string | null {
  const segments = pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) return null;
  if (segments[0].toLowerCase() === "p") return null;

  return segments[0] || null;
}

export function normalizeInstagramHandle(rawValue?: string | null): string | null {
  const value = (rawValue || "").trim();
  if (!value) return null;

  let candidate = value;

  if (value.includes("instagram.com")) {
    try {
      const withProtocol = value.match(/^https?:\/\//i)
        ? value
        : `https://${value}`;
      const url = new URL(withProtocol);
      const host = url.hostname.toLowerCase();
      if (host !== "instagram.com" && host !== "www.instagram.com") {
        return null;
      }

      const handleFromPath = extractHandleFromPath(url.pathname);
      if (!handleFromPath) return null;
      candidate = handleFromPath;
    } catch {
      return null;
    }
  }

  const sanitized = candidate
    .replace(/^@+/, "")
    .split(/[/?#\s]/)[0]
    .trim();

  if (!sanitized || !INSTAGRAM_HANDLE_REGEX.test(sanitized)) {
    return null;
  }

  return sanitized;
}

export function toInstagramUrl(handle: string): string {
  return `https://www.instagram.com/${handle}/`;
}

export function normalizeTikTokHandle(rawValue?: string | null): string | null {
  const value = (rawValue || "").trim();
  if (!value) return null;

  let candidate = value;

  if (value.includes("tiktok.com")) {
    try {
      const withProtocol = value.match(/^https?:\/\//i)
        ? value
        : `https://${value}`;
      const url = new URL(withProtocol);
      const host = url.hostname.toLowerCase();
      if (
        host !== "tiktok.com" &&
        host !== "www.tiktok.com" &&
        host !== "m.tiktok.com"
      ) {
        return null;
      }

      const first = extractHandleFromPath(url.pathname);
      if (!first) return null;
      candidate = first;
    } catch {
      return null;
    }
  }

  const sanitized = candidate
    .replace(/^@+/, "")
    .split(/[/?#\s]/)[0]
    .trim();

  if (!sanitized || !TIKTOK_HANDLE_REGEX.test(sanitized)) {
    return null;
  }

  return sanitized;
}

export function toTikTokUrl(handle: string): string {
  return `https://www.tiktok.com/@${handle}`;
}

export function normalizeLinkedInHandle(rawValue?: string | null): string | null {
  const value = (rawValue || "").trim();
  if (!value) return null;

  let kind: "in" | "company" = "in";
  let slug = "";

  const parseLinkedInPath = (path: string): string | null => {
    const segments = path
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);
    if (segments.length === 0) return null;

    const first = segments[0].toLowerCase();
    if (first === "in" || first === "company") {
      if (!segments[1]) return null;
      kind = first;
      return segments[1];
    }

    kind = "in";
    return segments[0];
  };

  if (value.includes("linkedin.com")) {
    try {
      const withProtocol = value.match(/^https?:\/\//i)
        ? value
        : `https://${value}`;
      const url = new URL(withProtocol);
      const host = url.hostname.toLowerCase();
      if (host !== "linkedin.com" && host !== "www.linkedin.com") {
        return null;
      }

      const parsed = parseLinkedInPath(url.pathname);
      if (!parsed) return null;
      slug = parsed;
    } catch {
      return null;
    }
  } else {
    const parsed = parseLinkedInPath(value);
    if (!parsed) return null;
    slug = parsed;
  }

  const sanitizedSlug = slug.split(/[/?#\s]/)[0].trim();
  if (!sanitizedSlug || !LINKEDIN_SLUG_REGEX.test(sanitizedSlug)) {
    return null;
  }

  return `${kind}/${sanitizedSlug}`;
}

export function toLinkedInUrl(handle: string): string {
  return `https://www.linkedin.com/${handle}/`;
}
