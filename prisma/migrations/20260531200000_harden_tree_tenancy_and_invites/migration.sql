-- Replace the legacy JSON-copy invite table with one-time membership invites.
-- Existing links are intentionally invalidated; family graph rows are untouched.
DROP TABLE IF EXISTS "TreeInvite";

CREATE TABLE "TreeInvite" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "acceptedById" TEXT,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreeInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TreeInvite_tokenHash_key" ON "TreeInvite"("tokenHash");
CREATE INDEX "TreeInvite_treeId_idx" ON "TreeInvite"("treeId");
CREATE INDEX "TreeInvite_expiresAt_idx" ON "TreeInvite"("expiresAt");

ALTER TABLE "TreeInvite"
ADD CONSTRAINT "TreeInvite_treeId_fkey"
FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TreeInvite"
ADD CONSTRAINT "TreeInvite_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TreeInvite"
ADD CONSTRAINT "TreeInvite_acceptedById_fkey"
FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Supabase exposes public-schema tables through PostgREST. Prisma connects as
-- the database owner and remains the only supported data path; anon and
-- authenticated Supabase API roles receive no table policies.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimitBucket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tree" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TreeMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TreeInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Node" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Edge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TreeSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TreeSyncReceipt" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF to_regclass('"UserTree"') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE "UserTree" ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;
