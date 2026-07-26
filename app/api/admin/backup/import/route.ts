import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { importBackup, BACKUP_MODELS } from '@/lib/prisma/backup'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = body?.data ?? body

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 })
    }
    const hasKnownModel = BACKUP_MODELS.some((m) => Array.isArray(data[m]))
    if (!hasKnownModel) {
      return NextResponse.json(
        { error: 'Backup file does not contain any recognized tables' },
        { status: 400 }
      )
    }

    const counts = await importBackup(prisma, data)
    const source = (process.env.DATABASE_URL ?? '').startsWith('file:') ? 'sqlite' : 'postgres'
    return NextResponse.json({ data: { counts, restoredTo: source } })
  } catch (error) {
    console.error('[POST /api/admin/backup/import]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
