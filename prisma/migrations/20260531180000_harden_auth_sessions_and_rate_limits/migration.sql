-- Revoke existing JWT sessions after a password reset and persist rate-limit
-- counters across Vercel serverless instances.

ALTER TABLE "User"
ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");
