-- Reserve object-storage bytes at presign time so concurrent uploads cannot
-- bypass the tree quota before their metadata is committed by tree sync.
CREATE TABLE "MediaUploadReservation" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaUploadReservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaUploadReservation_treeId_storageKey_key"
  ON "MediaUploadReservation"("treeId", "storageKey");
CREATE INDEX "MediaUploadReservation_treeId_expiresAt_idx"
  ON "MediaUploadReservation"("treeId", "expiresAt");
CREATE INDEX "MediaUploadReservation_userId_expiresAt_idx"
  ON "MediaUploadReservation"("userId", "expiresAt");

ALTER TABLE "MediaUploadReservation"
  ADD CONSTRAINT "MediaUploadReservation_treeId_fkey"
  FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaUploadReservation"
  ADD CONSTRAINT "MediaUploadReservation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- This table is server-owned and must not be exposed through PostgREST.
ALTER TABLE "MediaUploadReservation" ENABLE ROW LEVEL SECURITY;
