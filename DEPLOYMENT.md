# Deployment guide

Lifestory runs on Next.js 15 with Prisma and Supabase Postgres. The production
deployment for `lifestory.co.id` uses Vercel.

## Release gate

The repository implements a browser WAL, retry queue, atomic tree-version
claims, idempotent sync receipts, and point-in-time snapshots. Existing trees
can collect edits locally during temporary network failures. A brand-new tree
is only opened after Supabase confirms that its root node exists.

Do not call a release production-ready until all of these pass against the
database and commit being deployed:

```bash
npm install
npm run db:deploy
npm run db:status
npm run db:audit
npm test
npm run build
npm audit --omit=dev
curl -H "Authorization: Bearer $HEALTH_DATABASE_CHECK_TOKEN" \
  https://lifestory.co.id/api/health?database=1
```

The deep health response must be:

```json
{"ok":true,"database":"reachable"}
```

The shallow `/api/health` endpoint only proves that the Vercel function is
reachable. It does not prove that Supabase is reachable or migrated.

## Supabase connections

Set both connection strings:

```env
# Vercel runtime: Supavisor transaction pooler for serverless requests.
DATABASE_URL="postgresql://USER.PROJECT_REF:PASSWORD@POOLER_HOST:6543/postgres?pgbouncer=true&connection_limit=1"

# Prisma CLI: Supavisor session pooler for migrations and schema checks.
DIRECT_URL="postgresql://USER.PROJECT_REF:PASSWORD@POOLER_HOST:5432/postgres"
```

Supabase direct database URLs are IPv6-only by default. Use a direct URL for
`DIRECT_URL` only when the environment running Prisma CLI has working IPv6.
The session pooler on port `5432` is the safer default for local Windows and CI
environments without IPv6.

Do not use the transaction-pooler URL on port `6543` for migrations. Prisma CLI
loads `DIRECT_URL` through `prisma.config.ts`.

## Vercel environment

Set these variables in the Vercel project for Production before redeploying:

```env
DATABASE_URL="..."
DIRECT_URL="..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://lifestory.co.id"
ALLOWED_ORIGINS="https://lifestory.co.id,https://www.lifestory.co.id"
ALLOWED_HOSTS="lifestory.co.id,www.lifestory.co.id"
HEALTH_DATABASE_CHECK_TOKEN="..."
RESEND_API_KEY="..."
PASSWORD_RESET_FROM_EMAIL="Lifestory <no-reply@lifestory.co.id>"
```

`NEXTAUTH_URL` must not point to localhost in Vercel Production.
`HEALTH_DATABASE_CHECK_TOKEN` is required only for the deep database health
probe. `/api/health` remains public and does not touch Supabase.

## Apply migrations

Run this for each release containing a Prisma migration:

```bash
npm run db:deploy
npm run db:status
```

`prisma migrate deploy` is non-interactive and safe to run repeatedly. It skips
migrations that are already applied.

`npm run db:audit` must also pass. It rejects active trees without snapshots,
empty active trees, missing recovery columns, disabled RLS, and any schema that
allows deleting a user account to cascade-delete its owned family archive.

## Archive recovery

Tree deletion is soft-delete only. Nodes, relationships, sync receipts, and
snapshots remain in Postgres until a separately reviewed retention policy is
implemented. An admin can recover a deleted tree with:

```bash
curl -X POST https://lifestory.co.id/api/trees/TREE_ID/recover \
  -H "Cookie: NEXTAUTH_ADMIN_SESSION_COOKIE"
```

The endpoint is admin-only and rate-limited.

Application snapshots are not an independent database backup. Before accepting
paid-user archives, enable Supabase backups and Point-in-Time Recovery for the
production project, document the retention window, and perform a restore drill
into a separate database.

## Post-deploy smoke test

1. Call `https://lifestory.co.id/api/health?database=1` with
   `Authorization: Bearer $HEALTH_DATABASE_CHECK_TOKEN`.
2. Log in with a non-admin test account that has an active subscription.
3. Create a new tree and confirm the initial person remains after reload.
4. Add and edit a person, wait for the Saved indicator, then reload.
5. Disable the network, edit a person, re-enable the network, wait for Saved,
   then reload.
6. Confirm a `TreeSnapshot` row and a `TreeSyncReceipt` row were created.

## Authentication smoke test

Run this after every authentication or dependency-security release:

1. Register a new test email and confirm the account appears as `inactive`.
2. Confirm the inactive account cannot open `/app` or call `/api/trees`.
3. Activate the test account from the admin dashboard and confirm login works.
4. Submit forgot password and confirm a Resend email arrives from the verified
   `PASSWORD_RESET_FROM_EMAIL` sender.
5. Open the reset link, set a new password, and confirm the URL token disappears
   from the browser address bar.
6. Confirm the old password fails, the new password succeeds, and any browser
   session that was open before the reset can no longer call `/api/trees`.
7. Submit repeated invalid logins and confirm throttling blocks further
   attempts. Rate-limit counters are stored in `RateLimitBucket` so this must
   remain effective across separate Vercel invocations.

The non-destructive automated entitlement and session-revocation check can be
run with:

```bash
ALLOW_AUTH_SMOKE=1 AUTH_SMOKE_BASE_URL=https://lifestory.co.id npm run auth:smoke
```

The script creates three synthetic users and one temporary tree directly in
Supabase, exercises entitlement, incremental sync, invite isolation, and
session revocation, then deletes the temporary tree and users in a `finally`
block. It does not send an email. Inbox delivery still needs the manual
forgot-password check above.

## Known limitations

- Photos still use compressed base64 in Postgres and the browser cache. Gallery
  video upload is disabled. Move media uploads to object storage before
  marketing large photo galleries or video archives.
- The legacy wholesale `PUT /api/trees/[id]` path remains for guarded recovery
  writes and conflict resolution. Interactive editor autosave uses incremental
  WAL batches.
- Active shared canvases check lightweight server versions every 1.25 seconds
  and apply collaborator changes automatically without a reload. Same-field
  concurrent edits still open a manual conflict-resolution modal. Cursor
  presence and character-level CRDT merging are not implemented.
- Prisma ORM 6 CLI remains in the build toolchain. Plan the Prisma ORM 7
  migration separately because it requires ESM, generated-client import, and
  Postgres driver-adapter changes.

## Routine commands

| Task | Command |
| --- | --- |
| Local dev server | `npm run dev` |
| Production build | `npm run build` |
| Run tests | `npm test` |
| Generate Prisma client | `npx prisma generate` |
| Create migration | `npm run db:migrate -- --name <change>` |
| Apply remote migrations | `npm run db:deploy` |
| Check remote migration status | `npm run db:status` |
| Validate Prisma schema | `npx prisma validate` |
