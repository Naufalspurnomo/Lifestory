import { createHash, timingSafeEqual } from "crypto";

function hash(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function isCronAuthorized(headers: Headers, env = process.env): boolean {
  const expected = env.CRON_SECRET?.trim();
  const authorization = headers.get("authorization");
  const provided = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  return Boolean(
    expected && provided && timingSafeEqual(hash(provided), hash(expected))
  );
}
