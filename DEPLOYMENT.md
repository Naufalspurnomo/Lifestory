# Deployment guide

The app runs as a standard Next.js 14 server. Anywhere that runs Node.js 18+ and lets you set environment variables works (Vercel, Railway, Render, Fly, a VPS, etc.).

## What's already production-ready

- ✅ Postgres schema is migrated and tracked under `prisma/migrations/`
- ✅ Next.js production build succeeds (`npm run build`)
- ✅ TypeScript strict mode passes (`npx tsc --noEmit`)
- ✅ 92 tests pass (`npm test`)
- ✅ API routes degrade gracefully if the DB isn't reachable (the family tree falls back to localStorage so the app never blank-screens)

## Pre-deploy checklist

Run these locally once before pushing:

```bash
npm install
npm run db:status     # all migrations should be applied to your DB
npm test              # all 92 tests pass
npm run build         # production build succeeds
```

If all four pass, you're ready to deploy.

## On the hosting provider

1. **Set environment variables** (see `.env.example` for the full list). The minimum:
   - `DATABASE_URL` — pooled Postgres connection
   - `DIRECT_URL` — direct Postgres connection (used by migrations only)
   - `NEXTAUTH_SECRET` — 32+ char random string
   - `NEXTAUTH_URL` — your public HTTPS URL, e.g. `https://lifestory.example.com`
   - `ALLOWED_ORIGINS` — same as `NEXTAUTH_URL`, no trailing slash
   - `ALLOWED_HOSTS` — your domain hostname, e.g. `lifestory.example.com`

2. **Build command** (most platforms detect this automatically):
   ```
   npm run build
   ```

3. **Start command**:
   ```
   npm start
   ```

4. **Apply pending migrations** (only needed when you add new schema changes after the initial deploy):
   ```
   npm run db:deploy
   ```
   This runs `prisma migrate deploy`, which is the non-interactive version of `migrate dev`. Safe to run repeatedly — it skips migrations that are already applied.

## HTTPS

HTTPS enforcement is delegated to your hosting layer (Vercel handles this automatically; Cloudflare has "Always Use HTTPS"; Nginx uses a 301 redirect). The app does not enforce HTTPS at the framework level because Next's `redirects()` config can't reliably interpolate the request host.

## What to set up after first deploy

- **Subscription / billing** — currently `subscriptionActive` is a boolean on `User`. Wire it up to your payment provider when ready.
- **Object storage** — the `S3_*` env vars are placeholders. Until they're set, family member photos go into Postgres as base64. That works but eats DB space; switch to S3/R2 before scale.
- **Email** — invite tokens (`/api/invites`) currently store data in DB but don't send email. Wire to your provider (Resend, SES, Postmark) when needed.

## Routine commands

| Task | Command |
| --- | --- |
| Local dev server | `npm run dev` |
| Production build | `npm run build` |
| Run production locally | `npm start` |
| Run tests | `npm test` |
| Generate Prisma client | `npx prisma generate` |
| Create new migration | `npm run db:migrate -- --name <change>` |
| Apply migrations to remote DB | `npm run db:deploy` |
| Check migration status | `npm run db:status` |
| Visual layout report | `npm run layout:report` then open `reports/real-families/index.html` |

## Known limitations

- Photos still inline as base64 in `Node.imageUrl`. Migrate to object storage before allowing many uploads.
- The wholesale `PUT /api/trees/[id]` replaces all nodes on every save. Fine until trees grow into the thousands of nodes; then move to per-node mutations.
- `TreeInvite` table is managed by `lib/invites.ts` via raw SQL, separate from Prisma's migration history. A future migration can fold it into the schema.
