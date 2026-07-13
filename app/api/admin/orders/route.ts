import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { generateOrderNumber } from '@/lib/utils/format'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

interface OrderItemInput {
  productId: string
  quantity: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, items, shippingFee, discount, notes, status } = body as {
      customerId?: string
      items?: OrderItemInput[]
      shippingFee?: number
      discount?: number
      notes?: string
      status?: string
    }

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    })
    if (products.length !== new Set(items.map((i) => i.productId)).size) {
      return NextResponse.json({ error: 'One or more products were not found' }, { status: 400 })
    }

    const subtotal = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!
      return sum + Number(product.salePrice ?? product.basePrice) * item.quantity
    }, 0)
    const shipping = Number(shippingFee ?? 0)
    const disc = Number(discount ?? 0)
    const total = Math.max(0, subtotal + shipping - disc)

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: customerId,
        status: (status as never) ?? 'PENDING',
        subtotal,
        shippingFee: shipping,
        discount: disc,
        total,
        notes: notes || null,
        items: {
          create: items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!
            const unitPrice = Number(product.salePrice ?? product.basePrice)
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice,
              totalPrice: unitPrice * item.quantity,
            }
          }),
        },
        statusLogs: {
          create: { status: (status as never) ?? 'PENDING', notes: 'Order created by admin' },
        },
      },
      include: {
        items: { include: { product: { select: { name: true } } } },
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/orders]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
