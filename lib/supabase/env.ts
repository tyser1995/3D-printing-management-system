// Env values can be missing, truly empty, or malformed (e.g. a stray quoted-empty
// string from a dashboard paste) — validate the URL itself rather than just checking
// truthiness, and fall back to a placeholder so Supabase-dependent code degrades to
// "not configured" instead of throwing at client construction.
export function getSupabaseEnv() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isValidUrl = !!rawUrl && URL.canParse(rawUrl)

  return {
    url: isValidUrl ? rawUrl! : 'https://placeholder.supabase.co',
    key: rawKey && rawKey.length > 0 ? rawKey : 'placeholder-anon-key',
    isConfigured: isValidUrl && !!rawKey,
  }
}
