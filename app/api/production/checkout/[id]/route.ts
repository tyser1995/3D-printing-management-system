import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { getAvailableQtyFor } from '@/lib/data/production'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      product,
      type,
      item,
      filamentId,
      quantity,
      unitPrice,
      checkedOutAt,
      checkedOutBy,
      notes,
    } = body

    const existing = await prisma.productionCheckout.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Checkout entry not found' }, { status: 404 })
    }

    const row = {
      product: product !== undefined ? product : existing.product,
      type: type !== undefined ? type || null : existing.type,
      item: item !== undefined ? item || null : existing.item,
      filamentId: filamentId !== undefined ? filamentId || null : existing.filamentId,
    }

    const quantityNum = quantity !== undefined ? Number(quantity) : existing.quantity
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return NextResponse.json({ error: 'quantity must be a positive number' }, { status: 400 })
    }

    const unitPriceNum = unitPrice !== undefined ? Number(unitPrice) : Number(existing.unitPrice)
    if (isNaN(unitPriceNum) || unitPriceNum < 0) {
      return NextResponse.json(
        { error: 'unitPrice must be a non-negative number' },
        { status: 400 }
      )
    }

    // Exclude this entry's own current quantity from the "already checked out" total
    // it's being compared against, so editing an existing entry isn't blocked by itself.
    const sameProduct =
      row.product === existing.product &&
      row.type === existing.type &&
      row.item === existing.item &&
      row.filamentId === existing.filamentId
    const availableQty = (await getAvailableQtyFor(row)) + (sameProduct ? existing.quantity : 0)

    if (quantityNum > availableQty) {
      return NextResponse.json(
        { error: `Only ${availableQty} unit(s) available for checkout` },
        { status: 400 }
      )
    }

    const checkout = await prisma.productionCheckout.update({
      where: { id },
      data: {
        ...row,
        quantity: quantityNum,
        unitPrice: unitPriceNum,
        totalAmount: quantityNum * unitPriceNum,
        ...(checkedOutAt !== undefined && { checkedOutAt: new Date(checkedOutAt) }),
        ...(checkedOutBy !== undefined && { checkedOutBy: checkedOutBy || null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
      include: { filament: { select: { id: true, name: true, color: true, colorHex: true } } },
    })

    return NextResponse.json({ data: checkout })
  } catch (error) {
    console.error('[PATCH /api/production/checkout/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.productionCheckout.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/production/checkout/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
