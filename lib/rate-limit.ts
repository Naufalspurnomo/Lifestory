import { NextResponse } from "next/server";

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

// In-memory storage (untuk production gunakan Redis/Upstash)
const rateLimitMap = new Map<string, RateLimitEntry>();

type RateLimitConfig = {
  windowMs: number; // Window dalam milliseconds
  maxRequests: number; // Max requests per window
};

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 menit
  maxRequests: 60, // 60 requests per menit
};

// Preset configs untuk berbagai endpoint
export const rateLimitConfigs = {
  // Login: 5 attempts per 15 minutes
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  // Register: 3 per hour
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  // Admin endpoints: 100 per minute
  admin: { windowMs: 60 * 1000, maxRequests: 100 },
  // General API: 60 per minute
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  // Sensitive actions: 10 per minute
  sensitive: { windowMs: 60 * 1000, maxRequests: 10 },
};

/**
 * Simple rate limiter
 * Returns null if allowed, or NextResponse if rate limited
 *
 * @param identifier - Unique identifier (IP, userId, etc)
 * @param endpoint - Endpoint name for tracking
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig = defaultConfig
): NextResponse | null {
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    cleanupExpiredEntries();
  }

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return null; // Allowed
  }

  if (entry.count >= config.maxRequests) {
    // Rate limited
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
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
          "X-RateLimit-Reset": entry.resetTime.toString(),
        },
      }
    );
  }

  // Increment count
  entry.count++;
  rateLimitMap.set(key, entry);
  return null; // Allowed
}

/**
 * Get client identifier from request
 * Uses IP address or forwarded IP
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return ip;
}

/**
 * Cleanup expired entries to prevent memory leak
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Helper: Apply rate limit to request
 * Returns error response or null if allowed
 */
export function applyRateLimit(
  request: Request,
  endpoint: string,
  config?: RateLimitConfig
): NextResponse | null {
  const identifier = getClientIdentifier(request);
  return checkRateLimit(identifier, endpoint, config);
}
