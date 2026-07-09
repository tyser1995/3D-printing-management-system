# KAI3D — 3D Printing Management System

A full-stack platform for managing a custom 3D printing business — combining an e-commerce storefront, production management, inventory tracking, reporting, and an AI customization lab.

## Tech Stack

- **Framework** — Next.js 16 (App Router)
- **Database** — Prisma 7 + SQLite (local) / PostgreSQL via Supabase (production)
- **Auth** — Supabase Auth
- **Styling** — Tailwind CSS v4
- **State** — Zustand, TanStack Query
- **Charts** — Recharts

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.local .env.local
```

> **Local dev (SQLite):** The default `.env.local` uses SQLite — no server needed. Leave Supabase keys blank to run in Dev Mode.

> **Production:** Set `DATABASE_URL` to your Supabase PostgreSQL connection string and fill in the Supabase auth keys.

### 3. Set up the database

```bash
npm run db:generate   # generate Prisma client
npm run db:migrate    # apply migrations
npm run db:seed       # seed sample data
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Dev Mode

Set `NEXT_PUBLIC_DEV_MODE=true` in `.env.local` to enable Dev Mode:

- The login page shows an **"Enter Admin Panel"** shortcut button (no credentials needed)
- Auth proxy is bypassed — all routes are accessible
- Sign-out redirects to `/login` without calling Supabase

Set to `false` (or remove) to hide the bypass in production.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed sample data |

## Project Structure

```
app/
  (admin)/        # Admin panel routes
  (auth)/         # Login, register, forgot password
  (public)/       # Customer-facing storefront
  api/            # Route handlers
components/
  admin/          # Admin-specific components
  landing/        # Homepage sections
  layout/         # Navbar, sidebar, footer
  ui/             # Shared UI primitives
lib/
  prisma/         # Prisma client singleton
  supabase/       # Supabase client (browser + server)
  utils/          # Helpers (format, cn, cost)
prisma/
  schema.prisma   # Data model
  seed.ts         # Sample data seeder
stores/           # Zustand stores (cart, etc.)
```

## Switching to Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Update `.env.local`:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. Run `npm run db:migrate` against the Supabase database
