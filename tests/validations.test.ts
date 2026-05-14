import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  updateUserStatusSchema,
  paginationSchema,
  validateBody,
  formatZodErrors,
} from "../lib/validations";

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Naufal",
      email: "naufal@example.com",
      password: "SuperSecret1",
    });
    expect(result.success).toBe(true);
  });

  it("requires uppercase letter", () => {
    const result = registerSchema.safeParse({
      name: "Naufal",
      email: "naufal@example.com",
      password: "allowercase1",
    });
    expect(result.success).toBe(false);
  });

  it("requires a digit", () => {
    const result = registerSchema.safeParse({
      name: "Naufal",
      email: "naufal@example.com",
      password: "NoDigitsHere",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short name", () => {
    const result = registerSchema.safeParse({
      name: "N",
      email: "naufal@example.com",
      password: "SuperSecret1",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid login body", () => {
    const result = loginSchema.safeParse({
      email: "a@b.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "x",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateUserStatusSchema", () => {
  it("requires at least one field", () => {
    const result = updateUserStatusSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts status alone", () => {
    const result = updateUserStatusSchema.safeParse({ status: "active" });
    expect(result.success).toBe(true);
  });

  it("accepts subscriptionActive alone", () => {
    const result = updateUserStatusSchema.safeParse({
      subscriptionActive: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("paginationSchema", () => {
  it("applies defaults", () => {
    const parsed = paginationSchema.parse({});
    expect(parsed).toEqual({ page: 1, limit: 20, sort: "desc" });
  });

  it("coerces strings to numbers", () => {
    const parsed = paginationSchema.parse({ page: "3", limit: "50" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(50);
  });

  it("rejects limit above 100", () => {
    const result = paginationSchema.safeParse({ limit: 500 });
    expect(result.success).toBe(false);
  });
});

describe("validateBody + formatZodErrors", () => {
  it("returns success with typed data", () => {
    const result = validateBody(loginSchema, {
      email: "x@y.com",
      password: "123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("x@y.com");
    }
  });

  it("returns formatted errors on failure", () => {
    const result = validateBody(registerSchema, {
      name: "N",
      email: "bad",
      password: "weak",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodErrors(result.errors);
      expect(formatted.length).toBeGreaterThan(0);
      expect(formatted.every((entry) => entry.includes(":"))).toBe(true);
    }
  });
});
