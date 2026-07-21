import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, phone } = body

    const customer = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name || null }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone: phone || null }),
      },
    })
    return NextResponse.json({ data: customer })
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Email is already in use by another customer' },
        { status: 409 }
      )
    }
    console.error('[PATCH /api/admin/customers/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Hard delete — but only when it's actually safe to. Addresses/cart/wishlist
// rows cascade automatically; orders and reviews don't (they're the customer's
// real history), so we check for those up front and refuse with a clear
// reason rather than letting a foreign key error bubble up as a 500.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const [orderCount, reviewCount] = await Promise.all([
      prisma.order.count({ where: { userId: id } }),
      prisma.review.count({ where: { userId: id } }),
    ])

    if (orderCount > 0 || reviewCount > 0) {
      const parts = []
      if (orderCount > 0) parts.push(`${orderCount} order${orderCount === 1 ? '' : 's'}`)
      if (reviewCount > 0) parts.push(`${reviewCount} review${reviewCount === 1 ? '' : 's'}`)
      return NextResponse.json(
        { error: `Cannot delete — this customer has ${parts.join(' and ')} on record.` },
        { status: 409 }
      )
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/customers/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
