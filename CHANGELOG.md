# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- **Manual order entry** — "New Order" button on the Orders admin page. Pick an existing customer or add a new one inline, add product line items, set shipping/discount, and submit. (`app/api/admin/orders`, `app/api/admin/customers`, `OrdersClient.tsx`)
- **Product categories management** — add, edit, and delete product categories directly from Settings, backed by the `Category` table. (`app/api/admin/categories`, `CategoriesManager.tsx`)
- **SKU auto-increment** — new products no longer require a manually-typed SKU. The next SKU continues whatever prefix a category is already using (e.g. `KCH-001`, `KCH-002` → `KCH-003`); a brand-new category derives a prefix from its name. (`lib/prisma/sku.ts`)
- **Sample data toggle** — a Settings switch to load or remove the bundled demo dataset (`data/sample-data.json`) without touching real data you've entered. Removing it skips any record still referenced by your own data instead of failing outright. (`app/api/admin/sample-data`, `SampleDataManager.tsx`)
- **Data backup (export/import)** — download a full JSON snapshot of the database, or restore one, always targeting whichever database `DATABASE_URL` currently points to. (`app/api/admin/backup`, `lib/prisma/backup.ts`, `BackupManager.tsx`)
- **Cloud sync (Supabase push/pull)** — a second, independent database connection (`SUPABASE_SYNC_DATABASE_URL`) lets you push local data to Supabase or pull Supabase data down, without leaving the app or downloading a file. (`app/api/admin/sync`, `lib/prisma/supabaseSync.ts`)
- **Data visibility settings** — "Show deleted orders" and "Show deleted products" toggles (both off by default) reveal soft-deleted records in their respective admin lists. (`DataVisibilityManager.tsx`, `lib/settings.ts`)
- **Delete cancelled orders** — a cancelled order can now be deleted from its detail page. This is a soft delete (`Order.deletedAt`); the order is hidden from the Orders list unless "Show deleted orders" is on.

### Fixed

- **Cancelling an order silently failed and reverted after refresh.** `POST /api/orders/[id]/status` required a Supabase-authenticated user, but this app runs on local SQLite without Supabase configured, so every cancel/advance-status call was throwing a 500. The client also never checked the response, so the UI optimistically showed "Cancelled" regardless. Removed the auth requirement (this route is admin-only, consistent with the rest of `/api/admin/*`) and added proper error handling on the client.
- **Dashboard revenue chart showed fake data.** "Revenue Overview" rendered a hardcoded 7-month mock trend regardless of actual orders. It now computes real monthly revenue/order counts from the database.
- **`Decimal` serialization errors on the Orders pages.** Prisma `Decimal` fields (order totals, product prices) were being passed directly from Server Components into Client Components via object spreads, which Next.js disallows. Fixed by explicitly picking serializable fields instead of spreading.

### Changed

- **Products list hides deactivated products by default.** Previously, deleting a product (which deactivates it) still left it visible in the admin list with an "Inactive" badge. It's now hidden unless "Show deleted products" is enabled in Settings.

### Database

- Added `Order.deletedAt` (nullable) via migration `20260713081940_add_order_deleted_at`.
