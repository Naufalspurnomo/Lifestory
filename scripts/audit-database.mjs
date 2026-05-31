import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const relevantTables = new Set([
  "User",
  "PasswordResetToken",
  "RateLimitBucket",
  "Tree",
  "TreeSnapshot",
  "TreeSyncReceipt",
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
  "TreeSyncReceipt.id",
]);

try {
  const [tables, columns, migrations] = await Promise.all([
    prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() ORDER BY table_name"
    ),
    prisma.$queryRawUnsafe(
      "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = current_schema() ORDER BY table_name, ordinal_position"
    ),
    prisma.$queryRawUnsafe(
      "SELECT migration_name, finished_at, rolled_back_at, logs FROM _prisma_migrations ORDER BY started_at"
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

  console.log(
    JSON.stringify(
      {
        tables: tables.filter(({ table_name }) => relevantTables.has(table_name)),
        columns: relevantColumns,
        missingColumns,
        migrations,
      },
      null,
      2
    )
  );

  if (missingColumns.length > 0) {
    throw new Error(`Missing required database columns: ${missingColumns.join(", ")}`);
  }
} finally {
  await prisma.$disconnect();
}
