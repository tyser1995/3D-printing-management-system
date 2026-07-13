import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { orderedAt: 'desc' },
    })
    return NextResponse.json({ data: purchases })
  } catch (error) {
    console.error('[GET /api/admin/purchases]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemName, category, supplierId, quantity, unit, unitCost, status, notes } = body

    if (!itemName || !category || !quantity || unitCost === undefined) {
      return NextResponse.json(
        { error: 'itemName, category, quantity, and unitCost are required' },
        { status: 400 }
      )
    }

    const qty = Number(quantity)
    const cost = Number(unitCost)
    const total = qty * cost

    const purchase = await prisma.purchase.create({
      data: {
        itemName,
        category,
        supplierId: supplierId || null,
        quantity: qty,
        unit: unit || 'pcs',
        unitCost: cost,
        totalCost: total,
        status: status ?? 'ORDERED',
        receivedAt: status === 'RECEIVED' ? new Date() : null,
        notes: notes || null,
      },
      include: { supplier: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ data: purchase }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/purchases]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
