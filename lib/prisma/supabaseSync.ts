import { PrismaClient } from '@/app/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

// A second, independent connection used only for the "Sync to Supabase" feature in
// Settings. Kept separate from the primary `prisma` client (lib/prisma/client.ts) so
// local dev can keep running on SQLite while still pushing/pulling a live Supabase copy.
// Configure by setting SUPABASE_SYNC_DATABASE_URL to a Supabase Postgres connection string
// (see .env.supabase.example for the format).

const globalForSync = globalThis as unknown as { supabaseSyncPrisma?: PrismaClient }

export function isSupabaseSyncConfigured() {
  return !!process.env.SUPABASE_SYNC_DATABASE_URL
}

export function getSupabaseSyncClient(): PrismaClient {
  const url = process.env.SUPABASE_SYNC_DATABASE_URL
  if (!url) {
    throw new Error(
      'SUPABASE_SYNC_DATABASE_URL is not set. Add your Supabase connection string to .env.local to enable cloud sync.'
    )
  }

  if (globalForSync.supabaseSyncPrisma) return globalForSync.supabaseSyncPrisma

  const adapter = new PrismaPg({ connectionString: url })
  const client = new PrismaClient({ adapter })
  if (process.env.NODE_ENV !== 'production') globalForSync.supabaseSyncPrisma = client
  return client
}
