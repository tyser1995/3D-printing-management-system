import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'
import type { PurchaseStatus } from '@/app/generated/prisma'

export const dynamic = 'force-dynamic'

interface PurchaseInput {
  itemName: string
  category: string
  supplierId?: string | null
  quantity: number | string
  unit?: string
  unitCost: number | string
  status?: PurchaseStatus
  notes?: string | null
}

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
    const rows: PurchaseInput[] | null = Array.isArray(body.purchases) ? body.purchases : null

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'purchases must be a non-empty array' }, { status: 400 })
    }

    for (const [index, row] of rows.entries()) {
      if (!row.itemName || !row.category || !row.quantity || row.unitCost === undefined) {
        return NextResponse.json(
          { error: `Row ${index + 1}: itemName, category, quantity, and unitCost are required` },
          { status: 400 }
        )
      }
    }

    const created = await prisma.$transaction(
      rows.map((row) => {
        const qty = Number(row.quantity)
        const cost = Number(row.unitCost)
        return prisma.purchase.create({
          data: {
            itemName: row.itemName,
            category: row.category,
            supplierId: row.supplierId || null,
            quantity: qty,
            unit: row.unit || 'pcs',
            unitCost: cost,
            totalCost: qty * cost,
            status: row.status ?? 'ORDERED',
            receivedAt: row.status === 'RECEIVED' ? new Date() : null,
            notes: row.notes || null,
          },
          include: { supplier: { select: { id: true, name: true } } },
        })
      })
    )

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/purchases]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
