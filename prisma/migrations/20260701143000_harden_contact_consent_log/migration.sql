-- Contact consent logs contain PII and must not be exposed through Supabase
-- PostgREST roles. Prisma's owner connection can still write audit rows.
ALTER TABLE "ContactConsentLog" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON TABLE "ContactConsentLog" FROM anon;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON TABLE "ContactConsentLog" FROM authenticated;
    END IF;
END $$;
