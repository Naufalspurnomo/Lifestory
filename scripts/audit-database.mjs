import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const relevantTables = new Set([
  "User",
  "PasswordResetToken",
  "RateLimitBucket",
  "Tree",
  "TreeInvite",
  "TreeSnapshot",
  "TreeSyncReceipt",
  "_prisma_migrations",
]);
const requiredColumns = new Set([
  "User.sessionVersion",
  "PasswordResetToken.tokenHash",
  "PasswordResetToken.expiresAt",
  "PasswordResetToken.usedAt",
  "RateLimitBucket.key",
  "RateLimitBucket.count",
  "RateLimitBucket.resetAt",
  "Tree.version",
  "Tree.deletedAt",
  "TreeInvite.tokenHash",
  "TreeInvite.treeId",
  "TreeInvite.expiresAt",
  "TreeSyncReceipt.id",
]);
const rlsRequiredTables = new Set([
  "User",
  "PasswordResetToken",
  "RateLimitBucket",
  "Tree",
  "TreeMember",
  "TreeInvite",
  "Node",
  "Edge",
  "TreeSnapshot",
  "TreeSyncReceipt",
]);

try {
  const [tables, columns, migrations, rls, foreignKeys] = await Promise.all([
    prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() ORDER BY table_name"
    ),
    prisma.$queryRawUnsafe(
      "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = current_schema() ORDER BY table_name, ordinal_position"
    ),
    prisma.$queryRawUnsafe(
      "SELECT migration_name, finished_at, rolled_back_at, logs FROM _prisma_migrations ORDER BY started_at"
    ),
    prisma.$queryRawUnsafe(
      "SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = current_schema() AND c.relkind = 'r' ORDER BY c.relname"
    ),
    prisma.$queryRawUnsafe(
      "SELECT tc.constraint_name, rc.delete_rule FROM information_schema.table_constraints tc JOIN information_schema.referential_constraints rc ON rc.constraint_schema = tc.constraint_schema AND rc.constraint_name = tc.constraint_name WHERE tc.table_schema = current_schema() AND tc.constraint_name = 'Tree_ownerId_fkey'"
    ),
  ]);

  const relevantColumns = columns.filter(({ table_name }) =>
    relevantTables.has(table_name)
  );
  const existingColumns = new Set(
    relevantColumns.map(
      ({ table_name, column_name }) => `${table_name}.${column_name}`
    )
  );
  const missingColumns = [...requiredColumns].filter(
    (column) => !existingColumns.has(column)
  );
  const existingTables = new Set(tables.map(({ table_name }) => table_name));
  const rlsByTable = new Map(
    rls.map(({ table_name, rls_enabled }) => [table_name, rls_enabled])
  );
  const rlsDisabledTables = [...rlsRequiredTables].filter(
    (table) => rlsByTable.get(table) !== true
  );
  const canInspectTreeCoverage = ["Tree", "Node", "TreeSnapshot"].every(
    (table) => existingTables.has(table)
  );
  const hasDeletedAt = existingColumns.has("Tree.deletedAt");
  const deletedAtSelection = hasDeletedAt
    ? 'tree."deletedAt"'
    : 'NULL::TIMESTAMP AS "deletedAt"';
  const deletedAtGroup = hasDeletedAt ? ', tree."deletedAt"' : "";
  const treeCoverage = canInspectTreeCoverage
    ? await prisma.$queryRawUnsafe(
        `SELECT tree."id", tree."version", ${deletedAtSelection}, COUNT(node."id")::INTEGER AS "nodeCount", (SELECT COUNT(*)::INTEGER FROM "TreeSnapshot" snapshot WHERE snapshot."treeId" = tree."id") AS "snapshotCount" FROM "Tree" tree LEFT JOIN "Node" node ON node."treeId" = tree."id" GROUP BY tree."id", tree."version"${deletedAtGroup} ORDER BY tree."id"`
      )
    : [];
  const activeTreesWithoutSnapshots = treeCoverage.filter(
    (tree) => tree.deletedAt === null && tree.snapshotCount === 0
  );
  const emptyActiveTrees = treeCoverage.filter(
    (tree) => tree.deletedAt === null && tree.nodeCount === 0
  );
  const treeOwnerDeleteRule = foreignKeys[0]?.delete_rule;

  console.log(
    JSON.stringify(
      {
        tables: tables.filter(({ table_name }) => relevantTables.has(table_name)),
        columns: relevantColumns,
        missingColumns,
        rlsDisabledTables,
        treeOwnerDeleteRule,
        activeTreesWithoutSnapshots,
        emptyActiveTrees,
        treeCoverage,
        migrations,
      },
      null,
      2
    )
  );

  if (missingColumns.length > 0) {
    throw new Error(`Missing required database columns: ${missingColumns.join(", ")}`);
  }
  if (rlsDisabledTables.length > 0) {
    throw new Error(`RLS is disabled for required tables: ${rlsDisabledTables.join(", ")}`);
  }
  if (treeOwnerDeleteRule !== "RESTRICT" && treeOwnerDeleteRule !== "NO ACTION") {
    throw new Error(`Tree owner deletion is not restricted: ${treeOwnerDeleteRule ?? "missing foreign key"}`);
  }
  if (activeTreesWithoutSnapshots.length > 0) {
    throw new Error(`Active trees without snapshots: ${activeTreesWithoutSnapshots.map((tree) => tree.id).join(", ")}`);
  }
  if (emptyActiveTrees.length > 0) {
    throw new Error(`Empty active trees require recovery review: ${emptyActiveTrees.map((tree) => tree.id).join(", ")}`);
  }
} finally {
  await prisma.$disconnect();
}
