import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { generateOrderNumber } from '@/lib/utils/format'
import { calculateOrderElectricityFee } from '@/lib/utils/cost'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20')

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: { include: { product: true } },
          address: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ])

    return NextResponse.json({ data: orders, total, page, pageSize })
  } catch (error) {
    console.error('[GET /api/orders]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { items, addressId, notes, shippingFee } = body

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i: { productId: string }) => i.productId) } },
    })

    const subtotal = items.reduce((sum: number, item: { productId: string; quantity: number }) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return sum
      return sum + Number(product.salePrice ?? product.basePrice) * item.quantity
    }, 0)

    const totalQuantity = items.reduce(
      (sum: number, item: { quantity: number }) => sum + item.quantity,
      0
    )
    // Electricity fund is carved out of the item revenue: ₱10 per unit ordered,
    // deducted from (subtotal + shipping) rather than charged on top.
    const electricityFee = calculateOrderElectricityFee(totalQuantity)
    const shipping = Number(shippingFee) || 0
    const total = Math.max(0, subtotal + shipping - electricityFee)

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        addressId: addressId ?? null,
        subtotal,
        shippingFee: shipping,
        electricityFee,
        total,
        notes: notes ?? null,
        items: {
          create: items.map((item: { productId: string; quantity: number }) => {
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
          create: {
            status: 'PENDING',
            notes: 'Order placed',
          },
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/orders]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
