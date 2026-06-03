import { createHash, timingSafeEqual } from "crypto";

type HealthAuthEnv = {
  NODE_ENV?: string;
  HEALTH_DATABASE_CHECK_TOKEN?: string;
};

function hashSecret(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function timingSafeSecretEquals(actual: string, expected: string): boolean {
  return timingSafeEqual(hashSecret(actual), hashSecret(expected));
}

function getBearerToken(headers: Headers): string | null {
  const authorization = headers.get("authorization");
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function isDatabaseHealthCheckAuthorized(
  headers: Headers,
  env: HealthAuthEnv = process.env
): boolean {
  if (env.NODE_ENV !== "production") return true;

  const expectedToken = env.HEALTH_DATABASE_CHECK_TOKEN?.trim();
  const providedToken = getBearerToken(headers);
  if (!expectedToken || !providedToken) return false;

  return timingSafeSecretEquals(providedToken, expectedToken);
}
