import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { filamentId, type, grams, notes, reference } = body

    if (!filamentId || !type || !grams) {
      return NextResponse.json(
        { error: 'filamentId, type, and grams are required' },
        { status: 400 }
      )
    }

    if (!['IN', 'OUT', 'ADJUSTMENT'].includes(type)) {
      return NextResponse.json({ error: 'type must be IN, OUT, or ADJUSTMENT' }, { status: 400 })
    }

    const gramsNum = Number(grams)
    if (isNaN(gramsNum) || gramsNum <= 0) {
      return NextResponse.json({ error: 'grams must be a positive number' }, { status: 400 })
    }

    // Run movement + stock update atomically
    const stockUpdate =
      type === 'IN' ? { increment: gramsNum } : type === 'OUT' ? { decrement: gramsNum } : undefined // ADJUSTMENT handled with raw set below

    const [movement, filament] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          filamentId,
          type,
          grams: gramsNum,
          notes: notes ?? null,
          reference: reference ?? null,
        },
      }),
      prisma.filament.update({
        where: { id: filamentId },
        data: {
          stockGrams: type === 'ADJUSTMENT' ? gramsNum : stockUpdate,
        },
      }),
    ])

    return NextResponse.json({ data: { movement, filament } }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/inventory/stock-movements]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
