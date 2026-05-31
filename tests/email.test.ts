import { afterEach, describe, expect, it, vi } from "vitest";
import { sendPasswordResetEmail } from "../lib/email";

const input = {
  to: "delivered+password-reset@resend.dev",
  resetUrl: "https://lifestory.co.id/auth/reset?token=secret",
  expiresInMinutes: 30,
};

describe("password reset email", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("skips delivery when configuration is missing", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("PASSWORD_RESET_FROM_EMAIL", "");

    await expect(sendPasswordResetEmail(input)).resolves.toEqual({
      ok: false,
      skipped: true,
      reason: "missing-config",
    });
  });

  it("rejects the environment template placeholder without calling Resend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", "replace_me");
    vi.stubEnv(
      "PASSWORD_RESET_FROM_EMAIL",
      "Lifestory <no-reply@lifestory.co.id>"
    );

    await expect(sendPasswordResetEmail(input)).resolves.toEqual({
      ok: false,
      skipped: true,
      reason: "invalid-config",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns success when Resend accepts the message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "email-1" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", "re_valid");
    vi.stubEnv(
      "PASSWORD_RESET_FROM_EMAIL",
      "Lifestory <no-reply@lifestory.co.id>"
    );

    await expect(sendPasswordResetEmail(input)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("returns a safe failure when the email transport is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    vi.stubEnv("RESEND_API_KEY", "re_valid");
    vi.stubEnv(
      "PASSWORD_RESET_FROM_EMAIL",
      "Lifestory <no-reply@lifestory.co.id>"
    );

    await expect(sendPasswordResetEmail(input)).resolves.toEqual({
      ok: false,
      error: "network down",
    });
  });
});
