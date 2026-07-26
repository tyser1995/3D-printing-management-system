import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export async function GET() {
  try {
    const colors = await prisma.productionColor.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: colors })
  } catch (error) {
    console.error('[GET /api/admin/production-colors]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, colorHex } = body
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const color = await prisma.productionColor.create({
      data: { name, colorHex: colorHex || null },
    })
    return NextResponse.json({ data: color }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/production-colors]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
