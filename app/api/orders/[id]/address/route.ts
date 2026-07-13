import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

// Admin-only — creates or updates the shipping address linked to an order.
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { firstName, lastName, street, city, province, postalCode } = body

    if (!firstName || !lastName || !street || !city || !province || !postalCode) {
      return NextResponse.json({ error: 'All address fields are required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { addressId: true, userId: true, deletedAt: true },
    })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (order.deletedAt) {
      return NextResponse.json({ error: 'Cannot edit a deleted order' }, { status: 400 })
    }

    const data = { firstName, lastName, street, city, province, postalCode }

    const address = order.addressId
      ? await prisma.address.update({ where: { id: order.addressId }, data })
      : await prisma.$transaction(async (tx) => {
          const created = await tx.address.create({ data: { ...data, userId: order.userId } })
          await tx.order.update({ where: { id }, data: { addressId: created.id } })
          return created
        })

    return NextResponse.json({ data: address })
  } catch (error) {
    console.error('[PATCH /api/orders/[id]/address]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
