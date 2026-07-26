import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAvailableQtyFor, getAvailableQtyForLog } from '@/lib/data/production'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50')

    const [checkouts, total] = await Promise.all([
      prisma.productionCheckout.findMany({
        include: { filament: { select: { id: true, name: true, color: true, colorHex: true } } },
        orderBy: { checkedOutAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.productionCheckout.count(),
    ])

    return NextResponse.json({ data: checkouts, total, page, pageSize })
  } catch (error) {
    console.error('[GET /api/production/checkout]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      product,
      type,
      item,
      filamentId,
      productionLogId,
      quantity,
      unitPrice,
      checkedOutAt,
      checkedOutBy,
      notes,
    } = body

    if (!product || !quantity) {
      return NextResponse.json({ error: 'product and quantity are required' }, { status: 400 })
    }

    const quantityNum = Number(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 })
    }

    const unitPriceNum = unitPrice !== undefined && unitPrice !== '' ? Number(unitPrice) : 0
    if (isNaN(unitPriceNum) || unitPriceNum < 0) {
      return NextResponse.json(
        { error: 'unitPrice must be a non-negative number' },
        { status: 400 }
      )
    }

    const row = {
      product,
      type: type || null,
      item: item || null,
      filamentId: filamentId || null,
    }

    // When tied to a specific production log entry, cap against that entry's
    // own remaining quantity rather than the combo-wide aggregate.
    const availableQty = productionLogId
      ? await getAvailableQtyForLog(productionLogId)
      : await getAvailableQtyFor(row)
    if (quantityNum > availableQty) {
      return NextResponse.json(
        { error: `Only ${availableQty} unit(s) available for checkout` },
        { status: 400 }
      )
    }

    const checkout = await prisma.productionCheckout.create({
      data: {
        ...row,
        productionLogId: productionLogId || null,
        quantity: quantityNum,
        unitPrice: unitPriceNum,
        totalAmount: quantityNum * unitPriceNum,
        checkedOutAt: checkedOutAt ? new Date(checkedOutAt) : new Date(),
        checkedOutBy: checkedOutBy || null,
        notes: notes || null,
      },
      include: { filament: { select: { id: true, name: true, color: true, colorHex: true } } },
    })

    return NextResponse.json({ data: checkout }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/production/checkout]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
