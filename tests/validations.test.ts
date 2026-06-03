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

  it("accepts safe profile and gallery media URLs", () => {
    const result = familyTreeNodesSchema.safeParse([
      {
        id: "node-1",
        label: "A",
        imageUrl: "data:image/webp;base64,AAAA",
        content: {
          description: "",
          media: [
            {
              type: "image",
              url: "https://cdn.example.com/family/photo.jpg",
            },
            {
              type: "video",
              url: "data:video/webm;base64,AAAA",
            },
          ],
        },
      },
    ]);

    expect(result.success).toBe(true);
  });

  it("rejects scriptable or unsupported media URLs", () => {
    expect(
      familyTreeNodesSchema.safeParse([
        { id: "node-1", label: "A", imageUrl: "javascript:alert(1)" },
      ]).success
    ).toBe(false);

    expect(
      familyTreeNodesSchema.safeParse([
        {
          id: "node-1",
          label: "A",
          content: {
            description: "",
            media: [{ type: "video", url: "data:text/html,<script></script>" }],
          },
        },
      ]).success
    ).toBe(false);

    expect(
      familyTreeNodesSchema.safeParse([
        {
          id: "node-1",
          label: "A",
          content: {
            description: "",
            media: [{ type: "image", url: "data:image/svg+xml;base64,AAAA" }],
          },
        },
      ]).success
    ).toBe(false);
  });

  it("caps gallery media at the UI-supported count per person", () => {
    const safeMedia = {
      type: "image" as const,
      url: "data:image/webp;base64,AAAA",
    };

    const result = familyTreeNodesSchema.safeParse([
      {
        id: "node-1",
        label: "A",
        content: {
          description: "",
          media: Array.from({ length: 11 }, () => safeMedia),
        },
      },
    ]);

    expect(result.success).toBe(false);
  });

  it("rejects trees whose aggregate media would bloat database storage", () => {
    const largeSafeUrl = `data:image/webp;base64,${"A".repeat(9_000)}`;
    const nodes = Array.from({ length: 60 }, (_, nodeIndex) => ({
      id: `node-${nodeIndex}`,
      label: `Node ${nodeIndex}`,
      content: {
        description: "",
        media: Array.from({ length: 10 }, () => ({
          type: "image" as const,
          url: largeSafeUrl,
        })),
      },
    }));

    expect(familyTreeNodesSchema.safeParse(nodes).success).toBe(false);
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
