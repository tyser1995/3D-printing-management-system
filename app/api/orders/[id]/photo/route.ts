import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ id: string }> }

// Admin-only — sets or clears the optional "printed photo" URL for an order.
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { photoUrl } = body as { photoUrl: string | null }

    const existing = await prisma.order.findUnique({ where: { id }, select: { deletedAt: true } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.deletedAt) {
      return NextResponse.json({ error: 'Cannot edit a deleted order' }, { status: 400 })
    }

    const order = await prisma.order.update({
      where: { id },
      data: { printedPhotoUrl: photoUrl || null },
    })

    return NextResponse.json({ data: order })
  } catch (error) {
    console.error('[PATCH /api/orders/[id]/photo]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
