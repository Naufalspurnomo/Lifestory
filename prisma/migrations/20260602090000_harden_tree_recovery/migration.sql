-- Preserve paid-user archives through accidental deletes and ensure every
-- existing tree has at least one recovery point before new writes continue.

ALTER TABLE "Tree"
ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Tree_deletedAt_idx" ON "Tree"("deletedAt");

ALTER TABLE "Tree"
DROP CONSTRAINT "Tree_ownerId_fkey";

ALTER TABLE "Tree"
ADD CONSTRAINT "Tree_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "TreeSnapshot" ("id", "treeId", "version", "nodeCount", "data", "createdAt")
SELECT
    'snapshot-backfill-' || md5(tree."id"),
    tree."id",
    tree."version",
    (
        SELECT COUNT(*)::INTEGER
        FROM "Node" node
        WHERE node."treeId" = tree."id"
    ),
    jsonb_build_object(
        'nodes',
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', node."id",
                        'label', node."label",
                        'sex', node."sex",
                        'birthYear', node."birthYear",
                        'deathYear', node."deathYear",
                        'line', node."line",
                        'imageUrl', node."imageUrl",
                        'description', node."description",
                        'media', node."media",
                        'works', node."works",
                        'socialInstagram', node."socialInstagram",
                        'socialTiktok', node."socialTiktok",
                        'socialLinkedin', node."socialLinkedin",
                        'generationCached', node."generationCached"
                    )
                    ORDER BY node."createdAt", node."id"
                )
                FROM "Node" node
                WHERE node."treeId" = tree."id"
            ),
            '[]'::jsonb
        ),
        'edges',
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'fromId', edge."fromId",
                        'toId', edge."toId",
                        'kind', edge."kind",
                        'startYear', edge."startYear",
                        'endYear', edge."endYear"
                    )
                    ORDER BY edge."createdAt", edge."id"
                )
                FROM "Edge" edge
                WHERE edge."treeId" = tree."id"
            ),
            '[]'::jsonb
        )
    ),
    CURRENT_TIMESTAMP
FROM "Tree" tree
WHERE NOT EXISTS (
    SELECT 1
    FROM "TreeSnapshot" snapshot
    WHERE snapshot."treeId" = tree."id"
);
