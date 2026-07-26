import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  try {
    const materials = await prisma.filamentMaterial.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ data: materials })
  } catch (error) {
    console.error('[GET /api/inventory/materials]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
