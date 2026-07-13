import { NextResponse } from 'next/server'
import { isSupabaseSyncConfigured, getSupabaseSyncClient } from '@/lib/prisma/supabaseSync'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isSupabaseSyncConfigured()) {
    return NextResponse.json({ data: { configured: false, connected: false } })
  }

  try {
    const client = getSupabaseSyncClient()
    await client.$queryRaw`SELECT 1`
    return NextResponse.json({ data: { configured: true, connected: true } })
  } catch (error) {
    console.error('[GET /api/admin/sync/status]', error)
    return NextResponse.json({
      data: { configured: true, connected: false, error: 'Could not reach Supabase' },
    })
  }
}
