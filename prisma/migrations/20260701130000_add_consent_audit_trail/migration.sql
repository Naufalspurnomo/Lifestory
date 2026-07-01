-- Add richer consent audit fields to User (additive, nullable — safe on existing rows).
ALTER TABLE "User" ADD COLUMN "consentUserAgent" TEXT;
ALTER TABLE "User" ADD COLUMN "consentPolicyVersion" TEXT;

-- Durable audit trail for consent captured on the public contact form.
CREATE TABLE "ContactConsentLog" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "consentAcceptedAt" TIMESTAMP(3) NOT NULL,
    "consentIp" TEXT,
    "consentUserAgent" TEXT,
    "consentPolicyVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactConsentLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactConsentLog_email_idx" ON "ContactConsentLog"("email");
CREATE INDEX "ContactConsentLog_createdAt_idx" ON "ContactConsentLog"("createdAt");
