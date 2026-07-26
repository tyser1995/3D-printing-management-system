import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getSupabaseSyncClient } from '@/lib/prisma/supabaseSync'
import { syncBackup } from '@/lib/prisma/backup'

// Overwrites local (or whatever DATABASE_URL points to) data with what's on Supabase.
export async function POST() {
  try {
    const supabase = getSupabaseSyncClient()
    const counts = await syncBackup(supabase, prisma)
    const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0)
    return NextResponse.json({ data: { direction: 'pull', counts, total } })
  } catch (error) {
    console.error('[POST /api/admin/sync/pull]', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
