import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

interface BulkEntry {
  product: string
  type?: string
  item?: string
  filamentId?: string
  quantity: number
  amount?: number
  producedAt?: string
  producedBy?: string
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { entries } = body as { entries: BulkEntry[] }

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'entries array is required' }, { status: 400 })
    }

    for (const [i, e] of entries.entries()) {
      if (!e.product?.trim()) {
        return NextResponse.json({ error: `Row ${i + 1}: product is required` }, { status: 400 })
      }
      if (!e.quantity || Number(e.quantity) <= 0) {
        return NextResponse.json(
          { error: `Row ${i + 1}: quantity must be a positive number` },
          { status: 400 }
        )
      }
    }

    const logs = await prisma.$transaction(
      entries.map((e) =>
        prisma.productionLog.create({
          data: {
            product: e.product.trim(),
            type: e.type?.trim() || null,
            item: e.item?.trim() || null,
            filamentId: e.filamentId || null,
            quantity: Number(e.quantity),
            amount: e.amount !== undefined && e.amount !== null ? Number(e.amount) || 0 : 0,
            producedAt: e.producedAt ? new Date(e.producedAt) : new Date(),
            producedBy: e.producedBy?.trim() || null,
            notes: e.notes?.trim() || null,
          },
          include: { filament: { select: { id: true, name: true, color: true, colorHex: true } } },
        })
      )
    )

    return NextResponse.json({ data: logs, count: logs.length }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/production/bulk]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
