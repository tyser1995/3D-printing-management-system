import { readFile } from 'fs/promises'
import { join } from 'path'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { mergeBackup, removeBackup, type BackupData } from '@/lib/prisma/backup'

export const dynamic = 'force-dynamic'

async function loadSampleData(): Promise<{ meta: unknown; data: BackupData }> {
  const raw = await readFile(join(process.cwd(), 'data', 'sample-data.json'), 'utf-8')
  return JSON.parse(raw)
}

// A handful of sample ids are enough to tell whether the demo dataset is loaded.
async function isEnabled(data: BackupData) {
  const firstCategoryId = data.category?.[0]?.id as string | undefined
  if (!firstCategoryId) return false
  const found = await prisma.category.findUnique({ where: { id: firstCategoryId } })
  return !!found
}

export async function GET() {
  try {
    const { meta, data } = await loadSampleData()
    const enabled = await isEnabled(data)
    return NextResponse.json({ data: { enabled, meta } })
  } catch (error) {
    console.error('[GET /api/admin/sample-data]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const { data } = await loadSampleData()
    const counts = await mergeBackup(prisma, data)
    return NextResponse.json({ data: { enabled: true, counts } })
  } catch (error) {
    console.error('[POST /api/admin/sample-data]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const { data } = await loadSampleData()
    const { counts, blocked } = await removeBackup(prisma, data)
    return NextResponse.json({ data: { enabled: false, counts, blocked } })
  } catch (error) {
    console.error('[DELETE /api/admin/sample-data]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
