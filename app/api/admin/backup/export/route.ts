import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { exportBackup } from '@/lib/prisma/backup'

export async function GET() {
  try {
    const data = await exportBackup(prisma)
    const source = (process.env.DATABASE_URL ?? '').startsWith('file:') ? 'sqlite' : 'postgres'
    const payload = {
      meta: { exportedAt: new Date().toISOString(), source },
      data,
    }
    const filename = `kai3d-backup-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/backup/export]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
