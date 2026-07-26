import { NextResponse } from 'next/server'
import { getAvailableProductionStock } from '@/lib/data/production'

export async function GET() {
  try {
    const data = await getAvailableProductionStock()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/production/available]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
