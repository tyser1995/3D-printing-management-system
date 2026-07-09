import { NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const SETTINGS_PATH = join(process.cwd(), 'data', 'settings.json')

async function readSettings() {
  try {
    const raw = await readFile(SETTINGS_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function GET() {
  try {
    const settings = await readSettings()
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('[GET /api/settings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const current = await readSettings()
    const merged = { ...current, ...body }
    await writeFile(SETTINGS_PATH, JSON.stringify(merged, null, 2), 'utf-8')
    return NextResponse.json({ data: merged })
  } catch (error) {
    console.error('[PUT /api/settings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
