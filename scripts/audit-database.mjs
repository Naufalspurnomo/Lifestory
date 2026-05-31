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
  const [tables, columns, migrations, rls] = await Promise.all([
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
  const rlsByTable = new Map(
    rls.map(({ table_name, rls_enabled }) => [table_name, rls_enabled])
  );
  const rlsDisabledTables = [...rlsRequiredTables].filter(
    (table) => rlsByTable.get(table) !== true
  );

  console.log(
    JSON.stringify(
      {
        tables: tables.filter(({ table_name }) => relevantTables.has(table_name)),
        columns: relevantColumns,
        missingColumns,
        rlsDisabledTables,
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
} finally {
  await prisma.$disconnect();
}
