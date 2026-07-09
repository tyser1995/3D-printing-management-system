import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fall back to placeholder values when Supabase is not configured (local dev mode)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  return createBrowserClient(url, key)
}
