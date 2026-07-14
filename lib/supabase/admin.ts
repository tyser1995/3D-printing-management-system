import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Server-only Supabase client using the service role key. This is separate from the
// Prisma data layer (lib/prisma/*) and from the anon-key SSR clients in lib/supabase/
// client.ts and server.ts — it's used by features (like /api/track) that write
// directly to Supabase via supabase-js and should work regardless of whether the app
// is currently running on local SQLite or synced Postgres.
//
// Never import this from client components: SUPABASE_SERVICE_ROLE_KEY bypasses RLS.

let cachedClient: SupabaseClient | null | undefined

export function isSupabaseAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return !!url && URL.canParse(url) && !!key
}

/** Returns a memoized admin client, or null when Supabase env vars aren't configured. */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured()) return null

  if (cachedClient === undefined) {
    cachedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
  }

  return cachedClient
}
