# Deployment guide

Lifestory runs on Next.js 14 with Prisma and Supabase Postgres. The production
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
npm test
npm run build
curl https://lifestory.co.id/api/health?database=1
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
RESEND_API_KEY="..."
PASSWORD_RESET_FROM_EMAIL="Lifestory <no-reply@lifestory.co.id>"
```

`NEXTAUTH_URL` must not point to localhost in Vercel Production.

## Apply migrations

Run this for each release containing a Prisma migration:

```bash
npm run db:deploy
npm run db:status
```

`prisma migrate deploy` is non-interactive and safe to run repeatedly. It skips
migrations that are already applied.

## Post-deploy smoke test

1. Open `https://lifestory.co.id/api/health?database=1`.
2. Log in with a non-admin test account that has an active subscription.
3. Create a new tree and confirm the initial person remains after reload.
4. Add and edit a person, wait for the Saved indicator, then reload.
5. Disable the network, edit a person, re-enable the network, wait for Saved,
   then reload.
6. Confirm a `TreeSnapshot` row and a `TreeSyncReceipt` row were created.

## Known limitations

- Photos still use base64 in `Node.imageUrl`. Move uploads to object storage
  before allowing many photos per family.
- The legacy wholesale `PUT /api/trees/[id]` path remains for invite imports.
  Interactive editor autosave uses incremental WAL batches.
- A true same-field collaborative edit conflict pauses autosave and preserves
  browser WAL entries. Do not market real-time Google Docs-style collaboration
  until the conflict-resolution UI is wired end-to-end.
- `TreeInvite` is still managed with raw SQL in `lib/invites.ts`.

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
