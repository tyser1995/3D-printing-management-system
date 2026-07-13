import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

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

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { status, trackingNumber, notes } = body

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(notes !== undefined && { notes }),
      },
    })

    return NextResponse.json({ data: order })
  } catch (error) {
    console.error('[PATCH /api/orders/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
