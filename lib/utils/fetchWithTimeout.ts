export class FetchTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    this.name = "FetchTimeoutError";
  }
}

export async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit = {},
  timeoutMs = 20_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const originalSignal = init.signal;

  const abortFromOriginal = () => controller.abort();
  if (originalSignal) {
    if (originalSignal.aborted) {
      controller.abort();
    } else {
      originalSignal.addEventListener("abort", abortFromOriginal, {
        once: true,
      });
    }
  }

  try {
    return await fetchImpl.call(globalThis, url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    const isAbortError =
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError");
    if (isAbortError && !originalSignal?.aborted) {
      throw new FetchTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    originalSignal?.removeEventListener("abort", abortFromOriginal);
  }
}
