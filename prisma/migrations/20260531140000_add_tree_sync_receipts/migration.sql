-- Record accepted WAL batches so retries are idempotent after lost responses.

CREATE TABLE "TreeSyncReceipt" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "clientVersion" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "acknowledgedSeqNos" JSONB NOT NULL,
    "nodeIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreeSyncReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TreeSyncReceipt_treeId_version_key" ON "TreeSyncReceipt"("treeId", "version");
CREATE INDEX "TreeSyncReceipt_treeId_createdAt_idx" ON "TreeSyncReceipt"("treeId", "createdAt");

ALTER TABLE "TreeSyncReceipt"
ADD CONSTRAINT "TreeSyncReceipt_treeId_fkey"
FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
