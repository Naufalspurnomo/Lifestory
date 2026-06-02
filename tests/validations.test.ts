import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserStatusSchema,
  paginationSchema,
  familyTreeNodesSchema,
  treeCreateSchema,
  treeNodesPayloadSchema,
  validateBody,
  formatZodErrors,
} from "../lib/validations";
import { getSafeNextPath } from "../lib/utils/navigation";

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Naufal",
      email: "naufal@example.com",
      phone: "+6281234567890",
      password: "SuperSecret1",
    });
    expect(result.success).toBe(true);
  });

  it("requires uppercase letter", () => {
    const result = registerSchema.safeParse({
      name: "Naufal",
      email: "naufal@example.com",
      phone: "+6281234567890",
      password: "allowercase1",
    });
    expect(result.success).toBe(false);
  });

  it("requires a digit", () => {
    const result = registerSchema.safeParse({
      name: "Naufal",
      email: "naufal@example.com",
      phone: "+6281234567890",
      password: "NoDigitsHere",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short name", () => {
    const result = registerSchema.safeParse({
      name: "N",
      email: "naufal@example.com",
      phone: "+6281234567890",
      password: "SuperSecret1",
    });
    expect(result.success).toBe(false);
  });

  it("requires a usable phone number", () => {
    const result = registerSchema.safeParse({
      name: "Naufal",
      email: "naufal@example.com",
      phone: "abc",
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

describe("password reset schemas", () => {
  it("accepts a valid forgot password request", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "naufal@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid forgot password email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a strong reset password payload", () => {
    const result = resetPasswordSchema.safeParse({
      token: "a".repeat(43),
      password: "SuperSecret1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects weak reset passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "a".repeat(43),
      password: "weak",
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
      phone: "abc",
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

describe("family tree validation", () => {
  it("accepts a minimal valid tree node", () => {
    const result = familyTreeNodesSchema.safeParse([
      {
        id: "node-1",
        label: "Naufal",
        year: null,
        deathYear: null,
        partners: [],
        childrenIds: [],
        content: { description: "", media: [] },
      },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects duplicate node ids", () => {
    const result = familyTreeNodesSchema.safeParse([
      { id: "node-1", label: "A" },
      { id: "node-1", label: "B" },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects relationships to missing nodes", () => {
    const result = familyTreeNodesSchema.safeParse([
      { id: "node-1", label: "A", parentIds: ["missing"] },
    ]);
    expect(result.success).toBe(false);
  });

  it("trims and validates tree names", () => {
    const parsed = treeCreateSchema.parse({
      name: "  Keluarga Naufal  ",
      nodes: [{ id: "root", label: "Naufal" }],
    });
    expect(parsed.name).toBe("Keluarga Naufal");
  });

  it("requires an initial person when creating a tree", () => {
    expect(treeCreateSchema.safeParse({ name: "Keluarga Naufal" }).success).toBe(
      false
    );
  });

  it("rejects empty or unversioned wholesale tree replacement", () => {
    expect(
      treeNodesPayloadSchema.safeParse({ expectedVersion: 1, nodes: [] }).success
    ).toBe(false);
    expect(
      treeNodesPayloadSchema.safeParse({
        nodes: [{ id: "root", label: "Naufal" }],
      }).success
    ).toBe(false);
  });
});

describe("getSafeNextPath", () => {
  it("allows internal paths with query strings", () => {
    expect(getSafeNextPath("/invite/abc?tab=1")).toBe("/invite/abc?tab=1");
  });

  it("blocks external redirects", () => {
    expect(getSafeNextPath("https://evil.example/app")).toBe("/app");
    expect(getSafeNextPath("//evil.example/app")).toBe("/app");
  });

  it("blocks backslash based redirects", () => {
    expect(getSafeNextPath("/\\evil.example")).toBe("/app");
  });
});
