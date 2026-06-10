import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FetchTimeoutError,
  fetchWithTimeout,
} from "../lib/utils/fetchWithTimeout";

afterEach(() => {
  vi.useRealTimers();
});

describe("fetchWithTimeout", () => {
  it("aborts requests that exceed the configured timeout", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        })
    );

    const request = fetchWithTimeout(
      fetchMock as unknown as typeof fetch,
      "/api/slow",
      {},
      25
    );
    const expectation = expect(request).rejects.toBeInstanceOf(
      FetchTimeoutError
    );

    await vi.advanceTimersByTimeAsync(25);
    await expectation;
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/slow",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});
