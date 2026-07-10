-- Additive foundation for the free family archive and studio funnel.
-- Existing tables and legacy JSON fields remain untouched for one release.

ALTER TABLE "User"
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

ALTER TABLE "User"
  ALTER COLUMN "status" SET DEFAULT 'pending_email';

CREATE TABLE "EmailVerificationToken" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key"
  ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_idx"
  ON "EmailVerificationToken"("userId");
CREATE INDEX "EmailVerificationToken_expiresAt_idx"
  ON "EmailVerificationToken"("expiresAt");
ALTER TABLE "EmailVerificationToken"
  ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TreeEntitlement" (
  "id" TEXT NOT NULL,
  "treeId" TEXT NOT NULL,
  "tier" TEXT NOT NULL DEFAULT 'FREE',
  "maxPeople" INTEGER NOT NULL DEFAULT 500,
  "maxVerifiedMembers" INTEGER NOT NULL DEFAULT 50,
  "storageQuotaBytes" BIGINT NOT NULL DEFAULT 262144000,
  "contributionLinksPerMonth" INTEGER NOT NULL DEFAULT 20,
  "snapshotLimit" INTEGER NOT NULL DEFAULT 30,
  "studioVideoAllowed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TreeEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TreeEntitlement_treeId_key" ON "TreeEntitlement"("treeId");
ALTER TABLE "TreeEntitlement"
  ADD CONSTRAINT "TreeEntitlement_treeId_fkey"
  FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Story" (
  "id" TEXT NOT NULL,
  "treeId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3),
  "approximateYear" INTEGER,
  "location" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "visibility" TEXT NOT NULL DEFAULT 'tree',
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Story_treeId_status_createdAt_idx" ON "Story"("treeId", "status", "createdAt");
CREATE INDEX "Story_authorId_idx" ON "Story"("authorId");
ALTER TABLE "Story"
  ADD CONSTRAINT "Story_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Story_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "StoryPerson" (
  "id" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "personId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  CONSTRAINT "StoryPerson_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StoryPerson_storyId_personId_role_key" ON "StoryPerson"("storyId", "personId", "role");
CREATE INDEX "StoryPerson_personId_idx" ON "StoryPerson"("personId");
ALTER TABLE "StoryPerson"
  ADD CONSTRAINT "StoryPerson_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "StoryPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MediaAsset" (
  "id" TEXT NOT NULL,
  "treeId" TEXT NOT NULL,
  "personId" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'image',
  "storageKey" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" BIGINT NOT NULL,
  "caption" TEXT,
  "capturedAt" TIMESTAMP(3),
  "uploaderId" TEXT,
  "visibility" TEXT NOT NULL DEFAULT 'tree',
  "consentStatus" TEXT NOT NULL DEFAULT 'unknown',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MediaAsset_treeId_storageKey_key" ON "MediaAsset"("treeId", "storageKey");
CREATE INDEX "MediaAsset_treeId_createdAt_idx" ON "MediaAsset"("treeId", "createdAt");
CREATE INDEX "MediaAsset_personId_idx" ON "MediaAsset"("personId");
ALTER TABLE "MediaAsset"
  ADD CONSTRAINT "MediaAsset_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MediaAsset_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "MediaAsset_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "StoryAsset" (
  "id" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "mediaAssetId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'source',
  CONSTRAINT "StoryAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StoryAsset_storyId_mediaAssetId_role_key" ON "StoryAsset"("storyId", "mediaAssetId", "role");
CREATE INDEX "StoryAsset_mediaAssetId_idx" ON "StoryAsset"("mediaAssetId");
ALTER TABLE "StoryAsset"
  ADD CONSTRAINT "StoryAsset_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "StoryAsset_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ContributionRequest" (
  "id" TEXT NOT NULL,
  "treeId" TEXT NOT NULL,
  "targetPersonId" TEXT,
  "createdById" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContributionRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContributionRequest_tokenHash_key" ON "ContributionRequest"("tokenHash");
CREATE INDEX "ContributionRequest_treeId_createdAt_idx" ON "ContributionRequest"("treeId", "createdAt");
CREATE INDEX "ContributionRequest_createdById_idx" ON "ContributionRequest"("createdById");
CREATE INDEX "ContributionRequest_expiresAt_idx" ON "ContributionRequest"("expiresAt");
ALTER TABLE "ContributionRequest"
  ADD CONSTRAINT "ContributionRequest_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ContributionRequest_targetPersonId_fkey" FOREIGN KEY ("targetPersonId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ContributionRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ContributionProposal" (
  "id" TEXT NOT NULL,
  "treeId" TEXT NOT NULL,
  "requestId" TEXT,
  "submittedById" TEXT,
  "kind" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContributionProposal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ContributionProposal_requestId_key" ON "ContributionProposal"("requestId");
CREATE INDEX "ContributionProposal_treeId_status_createdAt_idx" ON "ContributionProposal"("treeId", "status", "createdAt");
CREATE INDEX "ContributionProposal_submittedById_idx" ON "ContributionProposal"("submittedById");
ALTER TABLE "ContributionProposal"
  ADD CONSTRAINT "ContributionProposal_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ContributionProposal_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ContributionRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ContributionProposal_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ContributionProposal_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TreeAuditEvent" (
  "id" TEXT NOT NULL,
  "treeId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TreeAuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TreeAuditEvent_treeId_createdAt_idx" ON "TreeAuditEvent"("treeId", "createdAt");
CREATE INDEX "TreeAuditEvent_actorId_idx" ON "TreeAuditEvent"("actorId");
ALTER TABLE "TreeAuditEvent"
  ADD CONSTRAINT "TreeAuditEvent_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TreeAuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "StudioLead" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "treeId" TEXT,
  "packageInterest" TEXT NOT NULL,
  "milestone" TEXT,
  "consentAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudioLead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StudioLead_userId_createdAt_idx" ON "StudioLead"("userId", "createdAt");
CREATE INDEX "StudioLead_treeId_status_idx" ON "StudioLead"("treeId", "status");
ALTER TABLE "StudioLead"
  ADD CONSTRAINT "StudioLead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "StudioLead_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "StudioDeliverable" (
  "id" TEXT NOT NULL,
  "treeId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "checksum" TEXT,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" BIGINT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudioDeliverable_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StudioDeliverable_treeId_storageKey_key" ON "StudioDeliverable"("treeId", "storageKey");
CREATE INDEX "StudioDeliverable_treeId_createdAt_idx" ON "StudioDeliverable"("treeId", "createdAt");
ALTER TABLE "StudioDeliverable"
  ADD CONSTRAINT "StudioDeliverable_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "StudioDeliverable_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Existing active accounts are treated as already verified. New registrations
-- use pending_email and must complete the email link before login.
UPDATE "User"
SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", "createdAt")
WHERE "status" = 'active';

-- Every tree gets a local entitlement. Legacy subscribers keep their existing
-- access while free trees receive the bounded archive limits from the product plan.
INSERT INTO "TreeEntitlement" (
  "id", "treeId", "tier", "maxPeople", "maxVerifiedMembers",
  "storageQuotaBytes", "contributionLinksPerMonth", "snapshotLimit",
  "studioVideoAllowed", "createdAt", "updatedAt"
)
SELECT
  'ent_' || t."id",
  t."id",
  CASE WHEN u."subscriptionActive" THEN 'LEGACY_UNLIMITED' ELSE 'FREE' END,
  CASE WHEN u."subscriptionActive" THEN 100000 ELSE 500 END,
  CASE WHEN u."subscriptionActive" THEN 10000 ELSE 50 END,
  CASE WHEN u."subscriptionActive" THEN 107374182400 ELSE 262144000 END,
  CASE WHEN u."subscriptionActive" THEN 10000 ELSE 20 END,
  CASE WHEN u."subscriptionActive" THEN 1000 ELSE 30 END,
  u."subscriptionActive",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Tree" t
JOIN "User" u ON u."id" = t."ownerId"
ON CONFLICT ("treeId") DO NOTHING;

-- Biography text becomes a published story without deleting the legacy field.
INSERT INTO "Story" (
  "id", "treeId", "title", "body", "status", "visibility", "authorId", "createdAt", "updatedAt"
)
SELECT
  'legacy_story_' || md5(n."treeId" || ':' || n."id"),
  n."treeId",
  'Catatan tentang ' || n."label",
  n."description",
  'published',
  'tree',
  t."ownerId",
  n."createdAt",
  n."updatedAt"
FROM "Node" n
JOIN "Tree" t ON t."id" = n."treeId"
WHERE length(trim(n."description")) > 0
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "StoryPerson" ("id", "storyId", "personId", "role")
SELECT
  'legacy_story_person_' || md5(n."treeId" || ':' || n."id"),
  'legacy_story_' || md5(n."treeId" || ':' || n."id"),
  n."id",
  'subject'
FROM "Node" n
WHERE length(trim(n."description")) > 0
ON CONFLICT ("id") DO NOTHING;

-- Relationships without provenance are explicitly unknown during the first
-- projection; the UI can now distinguish confirmed from unverified links.
UPDATE "Edge"
SET "metadata" = COALESCE("metadata", '{}'::jsonb) || '{"confidence":"unknown"}'::jsonb
WHERE NOT (COALESCE("metadata", '{}'::jsonb) ? 'confidence');

-- New archive tables are not intended to be exposed through PostgREST.
ALTER TABLE "EmailVerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TreeEntitlement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Story" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StoryPerson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StoryAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContributionRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContributionProposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TreeAuditEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudioLead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudioDeliverable" ENABLE ROW LEVEL SECURITY;
