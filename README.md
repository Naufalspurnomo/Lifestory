<p align="center">
  <img src="/public/logo/lifestory-logo.webp" alt="Lifestory" height="48" />
</p>

<h1 align="center">Lifestory</h1>

<p align="center">
  <strong>Premium family biography studio & interactive digital family tree.</strong><br/>
  Preserve life stories, map lineage, and pass memory to future generations.
</p>

<p align="center">
  <a href="https://lifestory.co.id">lifestory.co.id</a> · Surabaya, Indonesia
</p>

---

## Overview

Lifestory is a full-stack web application that helps families preserve their heritage through interactive digital family trees, biography archives, and collaborative genealogy tools. Built with a philosophy that **life stories should never be forgotten** — preventing what we call *the third death*: when a person's name is no longer spoken.

### What It Does

- **Interactive Family Tree** — Canvas-based visualization with Sugiyama layout algorithm, supporting unlimited generations, multiple family lines, and real-time editing
- **Offline-First Sync Engine** — Write-Ahead Log (IndexedDB), automatic retry with exponential backoff, optimistic-version conflict detection, and idempotent replay
- **Multi-User Collaboration** — Invite family members with role-based access (owner / editor / viewer), shared editing across devices
- **Biography Gallery** — Curated memoir collections with PDF reader, photo archives, and rich biographical content
- **Server-Side Backups** — Automatic snapshots on every write, point-in-time restore, rolling retention of 50 versions per tree
- **Export & Import** — Full JSON export/import with validation, duplicate detection, and merge/replace options
- **Admin Dashboard** — User management, subscription control, activity monitoring
- **Bilingual** — Full Indonesian (Bahasa) and English support throughout the UI

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.3 |
| Styling | Tailwind CSS 3.4 + custom design system |
| Database | PostgreSQL (Supabase-compatible) |
| ORM | Prisma 6.19 |
| Auth | NextAuth 4.24 (credentials) |
| Animation | Framer Motion 12 |
| Validation | Zod + react-hook-form |
| Testing | Vitest + fast-check (property-based) |
| Email | Resend API |
| Image Processing | Sharp |

---

## Architecture

```
lifestory/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # REST endpoints
│   │   ├── auth/           # Register, login, forgot/reset password
│   │   ├── trees/          # Tree CRUD, sync, snapshots
│   │   ├── invites/        # Collaboration invites
│   │   ├── users/          # Admin user management
│   │   └── gallery-pdf/    # PDF serving for biography gallery
│   ├── app/                # Main tree editor (authenticated)
│   ├── auth/               # Login, register, forgot, reset pages
│   ├── dashboard/          # Admin panel
│   ├── gallery/            # Public biography gallery
│   └── ...                 # Landing, about, contact, subscribe
├── components/
│   ├── home/               # Landing page sections
│   ├── tree/               # Family tree editor components
│   ├── site/               # NavBar, Footer, shared layout
│   ├── ui/                 # Design system primitives
│   ├── about/              # About page sections
│   └── providers/          # Auth & Language context providers
├── lib/
│   ├── sync/               # Offline-first sync engine
│   │   ├── SyncEngine.ts   # Central orchestrator
│   │   ├── WriteAheadLog.ts # IndexedDB + localStorage WAL
│   │   ├── RetryQueue.ts   # Exponential backoff scheduler
│   │   ├── ConflictResolver.ts # Field-level merge
│   │   ├── IntegrityValidator.ts # Tree data validation
│   │   ├── NetworkDetector.ts # Connectivity monitoring
│   │   ├── BackupManager.ts # Server-side snapshots
│   │   └── ExportManager.ts # JSON export/import
│   ├── auth/               # NextAuth config & utilities
│   ├── tree/               # Tree repository & persistence
│   ├── hooks/              # React hooks (useTreeState, etc.)
│   ├── types/              # Shared TypeScript types
│   └── utils/              # Helpers, rate limiting, navigation
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed script
└── tests/
    └── sync/               # Property-based & unit tests
```

### Data Model

```
User ──owns──> Tree ──contains──> Node (family member)
  │               │                   │
  │               ├── Edge (relationship: parent/partner/adoptive)
  │               ├── TreeSnapshot (point-in-time backup)
  │               └── TreeMember (collaborator access)
  │
  └── PasswordResetToken
```

**Relationships are stored as directed edges** with semantic types (`biological-parent`, `adoptive-parent`, `partner`, `ex-partner`) and optional date ranges — enabling complex family structures without schema limitations.

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or a Supabase project)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/lifestory.git
cd lifestory

# Install dependencies (also runs prisma generate via postinstall)
npm install

# Copy environment template
cp .env.example .env
```

### Environment Variables

Edit `.env` with your values:

```env
# Database (PostgreSQL / Supabase)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://USER.PROJECT_REF:PASSWORD@POOLER_HOST:5432/postgres"

# Authentication
NEXTAUTH_SECRET="your-random-32-char-string"
NEXTAUTH_URL="http://localhost:3000"
ALLOWED_ORIGINS="http://localhost:3000"
ALLOWED_HOSTS="localhost"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
PASSWORD_RESET_FROM_EMAIL="Lifestory <no-reply@yourdomain.com>"
```

### Database Setup

```bash
# Push schema to database (development)
npm run db:push

# Or run migrations (production)
npm run db:migrate

# Seed initial data (optional)
npm run db:seed

# Open Prisma Studio to inspect data
npm run db:studio
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint check |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:ui` | Vitest UI |
| `npm run db:push` | Push Prisma schema to DB |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:deploy` | Deploy migrations (CI/CD) |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run optimize:images` | Convert images to WebP |

---

## Key Features Deep Dive

### Sync Engine (Offline-First)

The sync engine is designed to protect edits across normal network failures
without making an absolute zero-data-loss claim:

```
User Edit → WAL (IndexedDB) → Debounced Flush → Server API
                                    ├── 200 OK → Acknowledge & Snapshot
                                    ├── 409 → Conflict Resolution
                                    ├── 401 → Pause & Re-auth Prompt
                                    ├── 5xx → Exponential Backoff Retry
                                    └── Offline → Queue until online
```

- **Write-Ahead Log**: Mutations are queued locally and stay visible as pending until the server acknowledges them
- **Automatic Retry**: Exponential backoff (1s → 60s max) with ±500ms jitter
- **Conflict Detection**: Server-side optimistic versions, change receipts, and auto-rebase for non-overlapping edits
- **Graceful Degradation**: IndexedDB → localStorage (50 mutations) → in-memory (last resort)

A true same-field collaborative conflict is preserved locally and pauses
autosave until it is deliberately resolved. Do not market Google Docs-style
real-time collaboration yet.

### Family Tree Canvas

- Sugiyama-based hierarchical layout algorithm
- Infinite pan & zoom with touch support
- Real-time node editing (add parent, child, partner, sibling)
- Undo/redo with keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- Search across all family members
- Timeline view alternative

### Security

- Bcrypt password hashing
- CSRF/origin protection
- Rate limiting on sensitive endpoints
- Security headers (CSP, X-Frame-Options, Permissions-Policy)
- Session-based auth with secure cookie handling

---

## Design System

The UI follows a warm, premium aesthetic inspired by heritage and craftsmanship:

| Token | Value | Usage |
|-------|-------|-------|
| `cream-50` to `cream-500` | Warm neutrals | Backgrounds |
| `ink-50` to `ink-900` | Deep browns | Text |
| `brand-400` / `brand-500` | Gold/amber | CTAs, accents |
| `accent-500` | Deep teal | Trust/secure pages |
| Font (display) | Playfair Display | Headings |
| Font (body) | Inter | Body text |

The tree editor uses a dark theme with leather textures and gold accents for an immersive archival experience.

---

## Testing

```bash
# Run all tests
npm test

# Property-based tests cover:
# - WAL ordering, capacity, acknowledgment
# - Exponential backoff bounds
# - Sync status state machine
# - Version vector monotonicity
# - Conflict detection & auto-merge
# - Integrity validation
# - Export/import round-trip
# - Snapshot retention
```

Tests use [fast-check](https://github.com/dubzzz/fast-check) for property-based testing, ensuring correctness properties hold across thousands of randomized inputs.

---

## Deployment

The app is designed for deployment on:

- **Vercel** (recommended) — zero-config Next.js hosting
- **Any Node.js host** — with PostgreSQL access
- **Supabase** — for managed Postgres with connection pooling

HTTPS enforcement is delegated to the reverse proxy / CDN layer.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Private — All rights reserved. © Lifestory Company, Surabaya.

---

<p align="center">
  <em>"Hidup hanya satu kali. Cerita yang tidak ditulis akan hilang bersama orang yang membawanya."</em><br/>
  <sub>Life is lived only once. Stories left unwritten vanish with those who carry them.</sub>
</p>
