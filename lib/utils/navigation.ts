const DEFAULT_NEXT_PATH = "/app";

export function getSafeNextPath(value: string | null | undefined): string {
  if (!value) return DEFAULT_NEXT_PATH;

  const candidate = value.trim();
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return DEFAULT_NEXT_PATH;
  }

  try {
    const parsed = new URL(candidate, "https://lifestory.local");
    if (parsed.origin !== "https://lifestory.local") {
      return DEFAULT_NEXT_PATH;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_NEXT_PATH;
  }
}
