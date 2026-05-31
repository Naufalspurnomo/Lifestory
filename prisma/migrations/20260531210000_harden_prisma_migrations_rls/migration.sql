-- Keep Prisma's deployment metadata inaccessible through Supabase PostgREST.
-- The database-owner connection used by Prisma Migrate can still manage rows.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
