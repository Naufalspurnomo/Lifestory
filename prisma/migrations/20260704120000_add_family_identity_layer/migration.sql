-- Privacy-preserving family identity layer.
-- Existing trees remain readable; family identities are created lazily by the app.

ALTER TABLE "Tree" ADD COLUMN "familyIdentityId" TEXT;

CREATE TABLE "FamilyDiscoveryProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "birthYear" INTEGER,
    "fatherName" TEXT,
    "motherName" TEXT,
    "paternalGrandfatherName" TEXT,
    "paternalGrandmotherName" TEXT,
    "maternalGrandfatherName" TEXT,
    "maternalGrandmotherName" TEXT,
    "hometown" TEXT,
    "siblingNames" JSONB NOT NULL DEFAULT '[]',
    "profileHash" TEXT NOT NULL,
    "consentAcceptedAt" TIMESTAMP(3) NOT NULL,
    "retentionUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyDiscoveryProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FamilyIdentity" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "canonicalTreeId" TEXT,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FamilyMatchKey" (
    "id" TEXT NOT NULL,
    "familyIdentityId" TEXT NOT NULL,
    "keyType" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMatchKey_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FamilyAccessRequest" (
    "id" TEXT NOT NULL,
    "familyIdentityId" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedRole" TEXT NOT NULL DEFAULT 'editor',
    "confidence" INTEGER NOT NULL,
    "matchReasons" JSONB NOT NULL DEFAULT '[]',
    "requesterSummary" JSONB NOT NULL DEFAULT '{}',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyAccessRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FamilyEvidence" (
    "id" TEXT NOT NULL,
    "familyIdentityId" TEXT,
    "accessRequestId" TEXT,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "documentHash" TEXT,
    "storageBucket" TEXT,
    "storageKey" TEXT,
    "retentionUntil" TIMESTAMP(3),
    "consentAcceptedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FamilyMergeProposal" (
    "id" TEXT NOT NULL,
    "familyIdentityId" TEXT,
    "sourceTreeId" TEXT NOT NULL,
    "targetTreeId" TEXT NOT NULL,
    "proposedById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "preview" JSONB NOT NULL DEFAULT '{}',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyMergeProposal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FamilyDiscoveryProfile_userId_key" ON "FamilyDiscoveryProfile"("userId");
CREATE INDEX "FamilyDiscoveryProfile_profileHash_idx" ON "FamilyDiscoveryProfile"("profileHash");
CREATE INDEX "FamilyDiscoveryProfile_retentionUntil_idx" ON "FamilyDiscoveryProfile"("retentionUntil");

CREATE UNIQUE INDEX "FamilyIdentity_canonicalTreeId_key" ON "FamilyIdentity"("canonicalTreeId");
CREATE INDEX "FamilyIdentity_createdById_idx" ON "FamilyIdentity"("createdById");
CREATE INDEX "FamilyIdentity_status_idx" ON "FamilyIdentity"("status");

CREATE UNIQUE INDEX "FamilyMatchKey_familyIdentityId_keyType_keyHash_key" ON "FamilyMatchKey"("familyIdentityId", "keyType", "keyHash");
CREATE INDEX "FamilyMatchKey_keyType_keyHash_idx" ON "FamilyMatchKey"("keyType", "keyHash");
CREATE INDEX "FamilyMatchKey_familyIdentityId_idx" ON "FamilyMatchKey"("familyIdentityId");

CREATE UNIQUE INDEX "FamilyAccessRequest_treeId_requesterId_status_key" ON "FamilyAccessRequest"("treeId", "requesterId", "status");
CREATE INDEX "FamilyAccessRequest_familyIdentityId_status_idx" ON "FamilyAccessRequest"("familyIdentityId", "status");
CREATE INDEX "FamilyAccessRequest_treeId_status_idx" ON "FamilyAccessRequest"("treeId", "status");
CREATE INDEX "FamilyAccessRequest_requesterId_status_idx" ON "FamilyAccessRequest"("requesterId", "status");

CREATE INDEX "FamilyEvidence_familyIdentityId_idx" ON "FamilyEvidence"("familyIdentityId");
CREATE INDEX "FamilyEvidence_accessRequestId_idx" ON "FamilyEvidence"("accessRequestId");
CREATE INDEX "FamilyEvidence_userId_idx" ON "FamilyEvidence"("userId");
CREATE INDEX "FamilyEvidence_documentHash_idx" ON "FamilyEvidence"("documentHash");

CREATE INDEX "FamilyMergeProposal_familyIdentityId_idx" ON "FamilyMergeProposal"("familyIdentityId");
CREATE INDEX "FamilyMergeProposal_sourceTreeId_idx" ON "FamilyMergeProposal"("sourceTreeId");
CREATE INDEX "FamilyMergeProposal_targetTreeId_idx" ON "FamilyMergeProposal"("targetTreeId");
CREATE INDEX "FamilyMergeProposal_status_idx" ON "FamilyMergeProposal"("status");

CREATE INDEX "Tree_familyIdentityId_idx" ON "Tree"("familyIdentityId");

ALTER TABLE "FamilyDiscoveryProfile"
ADD CONSTRAINT "FamilyDiscoveryProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyIdentity"
ADD CONSTRAINT "FamilyIdentity_canonicalTreeId_fkey"
FOREIGN KEY ("canonicalTreeId") REFERENCES "Tree"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FamilyIdentity"
ADD CONSTRAINT "FamilyIdentity_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Tree"
ADD CONSTRAINT "Tree_familyIdentityId_fkey"
FOREIGN KEY ("familyIdentityId") REFERENCES "FamilyIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FamilyMatchKey"
ADD CONSTRAINT "FamilyMatchKey_familyIdentityId_fkey"
FOREIGN KEY ("familyIdentityId") REFERENCES "FamilyIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyAccessRequest"
ADD CONSTRAINT "FamilyAccessRequest_familyIdentityId_fkey"
FOREIGN KEY ("familyIdentityId") REFERENCES "FamilyIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyAccessRequest"
ADD CONSTRAINT "FamilyAccessRequest_treeId_fkey"
FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyAccessRequest"
ADD CONSTRAINT "FamilyAccessRequest_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyAccessRequest"
ADD CONSTRAINT "FamilyAccessRequest_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FamilyEvidence"
ADD CONSTRAINT "FamilyEvidence_familyIdentityId_fkey"
FOREIGN KEY ("familyIdentityId") REFERENCES "FamilyIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FamilyEvidence"
ADD CONSTRAINT "FamilyEvidence_accessRequestId_fkey"
FOREIGN KEY ("accessRequestId") REFERENCES "FamilyAccessRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FamilyEvidence"
ADD CONSTRAINT "FamilyEvidence_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyMergeProposal"
ADD CONSTRAINT "FamilyMergeProposal_familyIdentityId_fkey"
FOREIGN KEY ("familyIdentityId") REFERENCES "FamilyIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FamilyMergeProposal"
ADD CONSTRAINT "FamilyMergeProposal_sourceTreeId_fkey"
FOREIGN KEY ("sourceTreeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyMergeProposal"
ADD CONSTRAINT "FamilyMergeProposal_targetTreeId_fkey"
FOREIGN KEY ("targetTreeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyMergeProposal"
ADD CONSTRAINT "FamilyMergeProposal_proposedById_fkey"
FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FamilyMergeProposal"
ADD CONSTRAINT "FamilyMergeProposal_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FamilyDiscoveryProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FamilyIdentity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FamilyMatchKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FamilyAccessRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FamilyEvidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FamilyMergeProposal" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE "FamilyDiscoveryProfile" FROM anon;
        REVOKE ALL ON TABLE "FamilyIdentity" FROM anon;
        REVOKE ALL ON TABLE "FamilyMatchKey" FROM anon;
        REVOKE ALL ON TABLE "FamilyAccessRequest" FROM anon;
        REVOKE ALL ON TABLE "FamilyEvidence" FROM anon;
        REVOKE ALL ON TABLE "FamilyMergeProposal" FROM anon;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE "FamilyDiscoveryProfile" FROM authenticated;
        REVOKE ALL ON TABLE "FamilyIdentity" FROM authenticated;
        REVOKE ALL ON TABLE "FamilyMatchKey" FROM authenticated;
        REVOKE ALL ON TABLE "FamilyAccessRequest" FROM authenticated;
        REVOKE ALL ON TABLE "FamilyEvidence" FROM authenticated;
        REVOKE ALL ON TABLE "FamilyMergeProposal" FROM authenticated;
    END IF;
END $$;
