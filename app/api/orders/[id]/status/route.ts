import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// Admin-only (called from the admin order detail page) — no Supabase auth gate,
// consistent with the other /api/admin/* routes in this app.
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, notes } = body

    if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 })

    const [log, order] = await prisma.$transaction([
      prisma.orderStatusLog.create({
        data: {
          orderId: id,
          status,
          notes: notes ?? null,
        },
      }),
      prisma.order.update({
        where: { id },
        data: { status },
      }),
    ])

    return NextResponse.json({ data: { log, order } }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/orders/[id]/status]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
