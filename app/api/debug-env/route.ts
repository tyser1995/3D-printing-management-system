import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Temporary — safe introspection of DATABASE_URL without exposing credentials.
// Remove after diagnosing the "Can't reach database server at base" production issue.
export async function GET() {
  const raw = process.env.DATABASE_URL ?? ''

  // Safe to reveal: everything after the last '@' (host/port/db/query — no credentials)
  // and the scheme prefix. Never reveal what's before '@' (user:password).
  const atIndex = raw.lastIndexOf('@')
  const afterAt = atIndex >= 0 ? raw.slice(atIndex + 1) : null
  const schemePrefix = raw.split('://')[0] ?? null

  return NextResponse.json({
    length: raw.length,
    schemePrefix,
    afterAt,
    hasAtSymbol: atIndex >= 0,
  })
}
