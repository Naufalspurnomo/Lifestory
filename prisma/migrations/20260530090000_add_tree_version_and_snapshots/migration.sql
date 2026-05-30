-- Add optimistic-concurrency versioning and separate point-in-time snapshots.

ALTER TABLE "Tree"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "TreeSnapshot" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "nodeCount" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreeSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TreeSnapshot_treeId_createdAt_idx" ON "TreeSnapshot"("treeId", "createdAt");

ALTER TABLE "TreeSnapshot"
ADD CONSTRAINT "TreeSnapshot_treeId_fkey"
FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
