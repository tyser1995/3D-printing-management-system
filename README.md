# KAI3D — 3D Printing Management System

A full-stack platform for managing a custom 3D printing business — combining an e-commerce storefront, production management, inventory tracking, reporting, and an AI customization lab.

See [CHANGELOG.md](./CHANGELOG.md) for recent changes.

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
  prisma/         # Prisma client singleton, backup/export-import, SKU generator, Supabase sync client
  supabase/       # Supabase client (browser + server)
  settings.ts     # Reads data/settings.json (shop info, cost defaults, display toggles)
  utils/          # Helpers (format, cn, cost)
prisma/
  schema.prisma   # Data model
  seed.ts         # Sample data seeder
data/
  settings.json     # Shop settings, cost defaults, notification & data-visibility preferences
  sample-data.json  # Local-only data snapshot toggled on/off from Settings (gitignored — not shipped in the repo)
stores/           # Zustand stores (cart, etc.)
```

## Settings & Admin Data Management

The Settings page (`/admin/settings`) covers more than shop info:

- **Product Categories** — add, edit, and delete categories inline.
- **Data Visibility** — "Show deleted orders" / "Show deleted products" (both off by default). Deleting a cancelled order or a product hides it from its list rather than destroying it; these toggles reveal it again.
- **Sample Data** — load or remove a local data snapshot (`data/sample-data.json`) without disturbing whatever else is currently in the database. This file is gitignored — it's a local convenience snapshot, not something bundled with the repo, so a fresh clone won't have one until you create it (e.g. via Data Backup export, renamed to `data/sample-data.json`).
- **Data Backup** — export the full database to a JSON file, or import one to restore it (this replaces all current data — confirmed before running).
- **Cloud Sync** — push or pull a live copy of your data to/from Supabase without leaving the app (see below).

New products auto-generate their SKU, continuing whichever prefix a category already uses (`KCH-001` → `KCH-002`); a brand-new category derives a prefix from its name.

## Orders

From an order's detail page (`/admin/orders/[id]`) an admin can:

- **Advance status** step by step (Pending → Confirmed → ... → Delivered), or **Cancel** at any point before delivery
- **Edit** — change line items/quantities, shipping fee, discount, tracking number, and notes (blocked once an order is cancelled, delivered, or deleted)
- **Delete** a cancelled order — a soft delete; hidden from the Orders list unless "Show deleted orders" is on in Settings
- View **Notes** and add/edit the **Ship To** address inline
- Add an optional **Printed Photo** once the order reaches "Printed" or later in the pipeline

Products, Orders, and Customers lists all paginate at 10 rows per page.

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

## Cloud Sync (without switching `DATABASE_URL`)

To push/pull data to Supabase while still running locally on SQLite, set a second, independent connection string:

```env
SUPABASE_SYNC_DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

Then use **Push to Supabase** / **Pull from Supabase** in Settings → Cloud Sync. Push overwrites Supabase with your current data; pull overwrites your current data with what's on Supabase — both are confirmed before running since they replace the target's full dataset.
