import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const baseId = request.nextUrl.searchParams.get('baseId')
    const types = await prisma.productionType.findMany({
      where: baseId ? { baseId } : undefined,
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: types })
  } catch (error) {
    console.error('[GET /api/admin/production-types]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { baseId, name } = body
    if (!baseId || !name) {
      return NextResponse.json({ error: 'baseId and name are required' }, { status: 400 })
    }

    const type = await prisma.productionType.create({ data: { baseId, name } })
    return NextResponse.json({ data: type }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/production-types]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
