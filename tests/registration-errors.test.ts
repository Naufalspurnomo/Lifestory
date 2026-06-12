import { describe, expect, it } from "vitest";
import { getRegistrationErrorMessage } from "../lib/registration-errors";

describe("registration error messages", () => {
  it("turns validation details into actionable Indonesian feedback", () => {
    expect(
      getRegistrationErrorMessage(
        400,
        {
          error: "Validation failed",
          details: [
            "phone: Phone number must be at least 8 characters",
            "password: Password must contain at least one uppercase letter",
          ],
        },
        "id"
      )
    ).toBe(
      "Masukkan nomor WhatsApp yang valid (minimal 8 digit). Password harus minimal 8 karakter dan berisi huruf besar, huruf kecil, serta angka."
    );
  });

  it("explains how long to wait after rate limiting", () => {
    expect(
      getRegistrationErrorMessage(429, { retryAfter: 61 }, "id")
    ).toBe(
      "Terlalu banyak percobaan pendaftaran. Coba lagi dalam 2 menit."
    );
  });

  it("does not expose internal server errors", () => {
    expect(
      getRegistrationErrorMessage(500, { error: "database details" }, "en")
    ).toBe(
      "The server is having trouble and could not create the account. Please try again shortly."
    );
  });
});
