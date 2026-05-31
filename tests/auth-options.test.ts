import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { JWT } from "next-auth/jwt";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock("../lib/db", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
    },
  },
}));

import { authOptions } from "../lib/auth/options";

async function runJwtCallback(token: JWT) {
  const jwt = authOptions.callbacks?.jwt;
  if (!jwt) throw new Error("JWT callback is not configured");

  const params = {
    token,
    user: undefined,
    account: null,
    profile: undefined,
    isNewUser: false,
  } as unknown as Parameters<typeof jwt>[0];

  return jwt(params);
}

describe("authOptions jwt callback", () => {
  beforeEach(() => {
    mocks.findUnique.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refreshes token claims from the database", async () => {
    mocks.findUnique.mockResolvedValue({
      subscriptionActive: true,
      role: "admin",
      status: "active",
      sessionVersion: 1,
    });

    const token = await runJwtCallback({
      sub: "user-1",
      subscriptionActive: false,
      role: "user",
      status: "inactive",
    });

    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: {
        subscriptionActive: true,
        role: true,
        status: true,
        sessionVersion: true,
      },
    });
    expect(token.subscriptionActive).toBe(true);
    expect(token.role).toBe("admin");
    expect(token.status).toBe("active");
    expect(token.sessionVersion).toBe(1);
  });

  it("fails closed when a password reset revokes the JWT session", async () => {
    mocks.findUnique.mockResolvedValue({
      subscriptionActive: true,
      role: "user",
      status: "active",
      sessionVersion: 2,
    });

    const token = await runJwtCallback({
      sub: "user-1",
      subscriptionActive: true,
      role: "user",
      status: "active",
      sessionVersion: 1,
    });

    expect(token.subscriptionActive).toBe(false);
    expect(token.status).toBe("suspended");
    expect(token.sessionVersion).toBe(1);
  });

  it("fails closed when the database user no longer exists", async () => {
    mocks.findUnique.mockResolvedValue(null);

    const token = await runJwtCallback({
      sub: "user-1",
      subscriptionActive: true,
      role: "user",
      status: "active",
      sessionVersion: 1,
    });

    expect(token.role).toBe("user");
    expect(token.subscriptionActive).toBe(false);
    expect(token.status).toBe("suspended");
  });

  it("fails closed without throwing when the database is unreachable", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.findUnique.mockRejectedValue(new Error("Can't reach database server"));

    const token = await runJwtCallback({
      sub: "user-1",
      subscriptionActive: true,
      role: "admin",
      status: "active",
      sessionVersion: 1,
    });

    expect(token.role).toBe("user");
    expect(token.subscriptionActive).toBe(false);
    expect(token.status).toBe("suspended");
    expect(warnSpy).toHaveBeenCalledOnce();
  });
});
