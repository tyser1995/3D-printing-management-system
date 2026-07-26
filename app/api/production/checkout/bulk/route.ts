import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAvailableQtyMap } from '@/lib/data/production'
import type { NextRequest } from 'next/server'

interface BulkCheckoutEntry {
  product: string
  type?: string
  item?: string
  filamentId?: string
  quantity: number
  unitPrice?: number
}

interface Row {
  product: string
  type: string | null
  item: string | null
  filamentId: string | null
  quantity: number
  unitPrice: number
}

const rowKey = (r: Pick<Row, 'product' | 'type' | 'item' | 'filamentId'>) =>
  `${r.product}|${r.type ?? ''}|${r.item ?? ''}|${r.filamentId ?? ''}`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { entries, checkedOutAt, checkedOutBy, notes } = body as {
      entries: BulkCheckoutEntry[]
      checkedOutAt?: string
      checkedOutBy?: string
      notes?: string
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'entries array is required' }, { status: 400 })
    }

    const rows: Row[] = entries.map((e) => ({
      product: e.product?.trim() ?? '',
      type: e.type?.trim() || null,
      item: e.item?.trim() || null,
      filamentId: e.filamentId || null,
      quantity: Number(e.quantity),
      unitPrice: e.unitPrice !== undefined ? Number(e.unitPrice) : 0,
    }))

    for (const [i, r] of rows.entries()) {
      if (!r.product) {
        return NextResponse.json({ error: `Row ${i + 1}: product is required` }, { status: 400 })
      }
      if (!r.quantity || r.quantity <= 0) {
        return NextResponse.json(
          { error: `Row ${i + 1}: quantity must be a positive number` },
          { status: 400 }
        )
      }
      if (isNaN(r.unitPrice) || r.unitPrice < 0) {
        return NextResponse.json(
          { error: `Row ${i + 1}: unitPrice must be a non-negative number` },
          { status: 400 }
        )
      }
    }

    // Multiple rows may check out the same product — validate their combined
    // quantity against available stock, not each row in isolation.
    const requestedByKey = new Map<string, { row: Row; requested: number }>()
    for (const r of rows) {
      const key = rowKey(r)
      const existing = requestedByKey.get(key)
      if (existing) existing.requested += r.quantity
      else requestedByKey.set(key, { row: r, requested: r.quantity })
    }

    const availableByKey = await getAvailableQtyMap()
    for (const [key, { row, requested }] of requestedByKey) {
      const available = availableByKey.get(key) ?? 0
      if (requested > available) {
        return NextResponse.json(
          {
            error: `${row.product}${row.type ? ` — ${row.type}` : ''}: only ${available} unit(s) available, requested ${requested}`,
          },
          { status: 400 }
        )
      }
    }

    const checkedOutDate = checkedOutAt ? new Date(checkedOutAt) : new Date()
    const checkedOutByTrimmed = checkedOutBy?.trim() || null
    const notesTrimmed = notes?.trim() || null

    const checkouts = await prisma.$transaction(
      rows.map((r) =>
        prisma.productionCheckout.create({
          data: {
            product: r.product,
            type: r.type,
            item: r.item,
            filamentId: r.filamentId,
            quantity: r.quantity,
            unitPrice: r.unitPrice,
            totalAmount: r.quantity * r.unitPrice,
            checkedOutAt: checkedOutDate,
            checkedOutBy: checkedOutByTrimmed,
            notes: notesTrimmed,
          },
          include: { filament: { select: { id: true, name: true, color: true, colorHex: true } } },
        })
      )
    )

    return NextResponse.json({ data: checkouts, count: checkouts.length }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/production/checkout/bulk]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
