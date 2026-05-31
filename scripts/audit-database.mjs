import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const relevantTables = new Set(["Tree", "TreeSnapshot", "TreeSyncReceipt"]);

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

  console.log(
    JSON.stringify(
      {
        tables: tables.filter(({ table_name }) => relevantTables.has(table_name)),
        columns: columns.filter(({ table_name }) =>
          relevantTables.has(table_name)
        ),
        migrations,
      },
      null,
      2
    )
  );
} finally {
  await prisma.$disconnect();
}
