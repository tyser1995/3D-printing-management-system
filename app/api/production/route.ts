import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'
import type { Prisma } from '@/app/generated/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filamentId = searchParams.get('filamentId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = parseInt(searchParams.get('page') ?? '1')
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50')

    const where: Prisma.ProductionLogWhereInput = {
      ...(filamentId && { filamentId }),
      ...((from || to) && {
        producedAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
    }

    const [logs, total] = await Promise.all([
      prisma.productionLog.findMany({
        where,
        include: { filament: { select: { id: true, name: true, color: true, colorHex: true } } },
        orderBy: { producedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.productionLog.count({ where }),
    ])

    return NextResponse.json({ data: logs, total, page, pageSize })
  } catch (error) {
    console.error('[GET /api/production]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product, type, item, filamentId, quantity, producedAt, notes, producedBy } = body

    if (!product || !quantity) {
      return NextResponse.json({ error: 'product and quantity are required' }, { status: 400 })
    }

    const quantityNum = Number(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 })
    }

    const log = await prisma.productionLog.create({
      data: {
        product,
        type: type || null,
        item: item || null,
        filamentId: filamentId || null,
        quantity: quantityNum,
        producedAt: producedAt ? new Date(producedAt) : new Date(),
        notes: notes || null,
        producedBy: producedBy || null,
      },
      include: { filament: { select: { id: true, name: true, color: true, colorHex: true } } },
    })

    return NextResponse.json({ data: log }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/production]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
