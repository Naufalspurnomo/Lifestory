import { describe, expect, it } from "vitest";
import { listTrees, TreeApiError } from "../lib/tree/apiClient";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("tree inventory API contract", () => {
  it("accepts a confirmed empty tree list", async () => {
    const result = await listTrees(
      (async () =>
        jsonResponse({
          trees: [],
          onboarding: { firstTreeWelcomeTreeId: null },
        })) as typeof fetch
    );

    expect(result.trees).toEqual([]);
    expect(result.onboarding.firstTreeWelcomeTreeId).toBeNull();
  });

  it("never interprets a malformed successful response as a new account", async () => {
    await expect(
      listTrees((async () => jsonResponse({ onboarding: {} })) as typeof fetch)
    ).rejects.toBeInstanceOf(TreeApiError);
  });
});
