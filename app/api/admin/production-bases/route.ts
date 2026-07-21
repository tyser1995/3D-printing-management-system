import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const bases = await prisma.productionBase.findMany({
      include: {
        types: { orderBy: { name: 'asc' } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: bases })
  } catch (error) {
    console.error('[GET /api/admin/production-bases]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const base = await prisma.productionBase.create({ data: { name } })
    return NextResponse.json({ data: base }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/production-bases]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
