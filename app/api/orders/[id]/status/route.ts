import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
          changedBy: user.id,
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
