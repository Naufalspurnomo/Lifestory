import { describe, expect, it } from "vitest";
import { isDatabaseHealthCheckAuthorized } from "../lib/health-auth";
import { parseJsonBody } from "../lib/request-body";

function postRequest(body: string, headers: Record<string, string> = {}) {
  return new Request("https://lifestory.test/api/example", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body,
  });
}

describe("request body guard", () => {
  it("rejects a declared payload that exceeds the configured limit", async () => {
    const result = await parseJsonBody(
      postRequest("{}", { "content-length": "1024" }),
      16
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(413);
    }
  });

  it("rejects malformed JSON before route validation runs", async () => {
    const result = await parseJsonBody(postRequest("{"), 16);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });
});

describe("deep health-check authorization", () => {
  it("requires a bearer token in production", () => {
    expect(
      isDatabaseHealthCheckAuthorized(new Headers(), {
        NODE_ENV: "production",
        HEALTH_DATABASE_CHECK_TOKEN: "secret-token",
      })
    ).toBe(false);
  });

  it("accepts only the configured bearer token in production", () => {
    const headers = new Headers({
      authorization: "Bearer secret-token",
    });
    const wrongHeaders = new Headers({
      authorization: "Bearer wrong-token",
    });
    const env = {
      NODE_ENV: "production",
      HEALTH_DATABASE_CHECK_TOKEN: "secret-token",
    };

    expect(isDatabaseHealthCheckAuthorized(headers, env)).toBe(true);
    expect(isDatabaseHealthCheckAuthorized(wrongHeaders, env)).toBe(false);
  });

  it("allows local database checks without a token", () => {
    expect(
      isDatabaseHealthCheckAuthorized(new Headers(), {
        NODE_ENV: "development",
      })
    ).toBe(true);
  });
});
