import { describe, expect, it } from "vitest";
import { jsonBodyLimits, parseJsonBody } from "../lib/request-body";

function jsonRequest(body: string, headers?: HeadersInit): Request {
  return new Request("https://lifestory.local/api/test", {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

describe("limited JSON request bodies", () => {
  it("parses JSON bodies inside the configured limit", async () => {
    const result = await parseJsonBody(
      jsonRequest(JSON.stringify({ ok: true })),
      jsonBodyLimits.tiny
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.body).toEqual({ ok: true });
    }
  });

  it("rejects oversized bodies even when Content-Length is absent", async () => {
    const result = await parseJsonBody(
      jsonRequest(JSON.stringify({ value: "x".repeat(200) })),
      32
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(413);
    }
  });

  it("rejects oversized bodies from Content-Length before parsing JSON", async () => {
    const result = await parseJsonBody(
      jsonRequest("{}", { "Content-Length": "99" }),
      32
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(413);
    }
  });

  it("returns a safe 400 for invalid JSON", async () => {
    const result = await parseJsonBody(jsonRequest("{"), jsonBodyLimits.tiny);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });
});
