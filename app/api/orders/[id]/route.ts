import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { calculateOrderElectricityFee } from '@/lib/utils/cost'
import type { NextRequest } from 'next/server'

interface OrderItemInput {
  productId: string
  quantity: number
}

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: true,
        items: {
          include: {
            product: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
        statusLogs: { orderBy: { createdAt: 'asc' } },
        printJobs: {
          include: { printer: { select: { id: true, name: true, model: true } } },
        },
      },
    })

    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: order })
  } catch (error) {
    console.error('[GET /api/orders/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Admin-only soft delete — only allowed once an order is cancelled. Hidden from
// the Orders list unless "Show deleted orders" is enabled in Settings.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const order = await prisma.order.findUnique({ where: { id }, select: { status: true } })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (order.status !== 'CANCELLED') {
      return NextResponse.json({ error: 'Only cancelled orders can be deleted' }, { status: 400 })
    }

    await prisma.order.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/orders/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Admin-only edit — updates line items, shipping/discount, notes and tracking
// number on an order that hasn't shipped yet. Status changes go through
// /api/orders/[id]/status instead.
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { items, shippingFee, discount, notes, trackingNumber } = body as {
      items?: OrderItemInput[]
      shippingFee?: number
      discount?: number
      notes?: string
      trackingNumber?: string
    }

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.deletedAt) {
      return NextResponse.json({ error: 'Cannot edit a deleted order' }, { status: 400 })
    }
    if (existing.status === 'CANCELLED' || existing.status === 'DELIVERED') {
      return NextResponse.json(
        { error: `Cannot edit a ${existing.status.toLowerCase()} order` },
        { status: 400 }
      )
    }
    if (items && items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    let subtotal = Number(existing.subtotal)
    let itemsData: {
      productId: string
      quantity: number
      unitPrice: number
      totalPrice: number
    }[] = []

    if (items) {
      const products = await prisma.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } },
      })
      if (products.length !== new Set(items.map((i) => i.productId)).size) {
        return NextResponse.json({ error: 'One or more products were not found' }, { status: 400 })
      }

      itemsData = items.map((item) => {
        const product = products.find((p) => p.id === item.productId)!
        const unitPrice = Number(product.salePrice ?? product.basePrice)
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          totalPrice: unitPrice * item.quantity,
        }
      })
      subtotal = itemsData.reduce((sum, i) => sum + i.totalPrice, 0)
    }

    const newShipping =
      shippingFee !== undefined ? Number(shippingFee) : Number(existing.shippingFee)
    const newDiscount = discount !== undefined ? Number(discount) : Number(existing.discount)
    // Electricity fund is carved out of the item revenue: ₱10 per unit ordered,
    // deducted from (subtotal + shipping) rather than charged on top.
    const newElectricityFee = items
      ? calculateOrderElectricityFee(itemsData.reduce((sum, i) => sum + i.quantity, 0))
      : Number(existing.electricityFee)
    const total = Math.max(0, subtotal + newShipping - newElectricityFee - newDiscount)

    const order = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.orderItem.deleteMany({ where: { orderId: id } })
        await tx.orderItem.createMany({
          data: itemsData.map((i) => ({ ...i, orderId: id })),
        })
      }

      return tx.order.update({
        where: { id },
        data: {
          subtotal,
          shippingFee: newShipping,
          electricityFee: newElectricityFee,
          discount: newDiscount,
          total,
          ...(notes !== undefined && { notes }),
          ...(trackingNumber !== undefined && { trackingNumber }),
        },
        include: {
          items: {
            include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
          },
        },
      })
    })

    return NextResponse.json({ data: order })
  } catch (error) {
    console.error('[PATCH /api/orders/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
