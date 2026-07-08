import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "./db";

export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

type HeaderSource =
  | Headers
  | Record<string, string | string[] | undefined>;

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
};

export const rateLimitConfigs = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  register: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
  contact: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  admin: { windowMs: 60 * 1000, maxRequests: 100 },
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  treeSync: { windowMs: 60 * 1000, maxRequests: 180 },
  sensitive: { windowMs: 60 * 1000, maxRequests: 10 },
};

function readHeader(headers: HeaderSource, name: string): string | null {
  if (headers instanceof Headers) {
    return headers.get(name);
  }

  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function createBucketKey(identifier: string, endpoint: string): string {
  return createHash("sha256")
    .update(`${endpoint}:${identifier}`)
    .digest("hex");
}

function rateLimitResponse(
  retryAfter: number,
  resetTime: number,
  config: RateLimitConfig
): NextResponse {
  return NextResponse.json(
    {
      error: "Too many requests",
      retryAfter,
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
    },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Limit": config.maxRequests.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": resetTime.toString(),
      },
    }
  );
}

export function getClientIdentifier(request: { headers?: HeaderSource }): string {
  const vercelForwarded = request.headers
    ? readHeader(request.headers, "x-vercel-forwarded-for")
    : null;
  const forwarded = request.headers
    ? readHeader(request.headers, "x-forwarded-for")
    : null;
  const realIp = request.headers ? readHeader(request.headers, "x-real-ip") : null;
  return (
    vercelForwarded?.trim() ||
    forwarded?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    "unknown"
  );
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig = defaultConfig
): Promise<NextResponse | null> {
  const key = createBucketKey(identifier, endpoint);
  const now = new Date();
  const nextResetAt = new Date(now.getTime() + config.windowMs);

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitBucket.findUnique({ where: { key } });

    if (!existing || existing.resetAt.getTime() <= now.getTime()) {
      const bucket = await tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt: nextResetAt },
        update: { count: 1, resetAt: nextResetAt },
      });
      return { limited: false, bucket };
    }

    if (existing.count >= config.maxRequests) {
      return { limited: true, bucket: existing };
    }

    const incremented = await tx.rateLimitBucket.updateMany({
      where: {
        key,
        resetAt: { gt: now },
        count: { lt: config.maxRequests },
      },
      data: { count: { increment: 1 } },
    });

    if (incremented.count !== 1) {
      const bucket = await tx.rateLimitBucket.findUniqueOrThrow({
        where: { key },
      });
      return { limited: true, bucket };
    }

    const bucket = await tx.rateLimitBucket.findUniqueOrThrow({
      where: { key },
    });
    return { limited: false, bucket };
  });

  // Keep the table bounded without making unlucky auth requests wait on cleanup.
  if (Math.random() < 0.01) {
    void prisma.rateLimitBucket
      .deleteMany({
        where: {
          resetAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      })
      .catch((error) => {
        console.warn("[rate-limit] Failed to clean old buckets", error);
      });
  }

  if (!result.limited) return null;

  const resetTime = result.bucket.resetAt.getTime();
  const retryAfter = Math.max(1, Math.ceil((resetTime - now.getTime()) / 1000));
  return rateLimitResponse(retryAfter, resetTime, config);
}

export async function applyRateLimit(
  request: Request,
  endpoint: string,
  config?: RateLimitConfig
): Promise<NextResponse | null> {
  return checkRateLimit(getClientIdentifier(request), endpoint, config);
}
