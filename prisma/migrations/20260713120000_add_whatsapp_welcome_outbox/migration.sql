CREATE TABLE "WhatsAppOutbox" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingAt" TIMESTAMP(3),
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppOutbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsAppOutbox_userId_kind_key" ON "WhatsAppOutbox"("userId", "kind");
CREATE INDEX "WhatsAppOutbox_status_nextAttemptAt_idx" ON "WhatsAppOutbox"("status", "nextAttemptAt");

ALTER TABLE "WhatsAppOutbox" ADD CONSTRAINT "WhatsAppOutbox_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
