import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { itemName, category, supplierId, quantity, unit, unitCost, status, notes } = body

    const existing = await prisma.purchase.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const qty = quantity !== undefined ? Number(quantity) : Number(existing.quantity)
    const cost = unitCost !== undefined ? Number(unitCost) : Number(existing.unitCost)
    const total = qty * cost

    const purchase = await prisma.purchase.update({
      where: { id },
      data: {
        ...(itemName !== undefined && { itemName }),
        ...(category !== undefined && { category }),
        ...(supplierId !== undefined && { supplierId: supplierId || null }),
        ...(quantity !== undefined && { quantity: qty }),
        ...(unit !== undefined && { unit }),
        ...(unitCost !== undefined && { unitCost: cost }),
        ...((quantity !== undefined || unitCost !== undefined) && { totalCost: total }),
        ...(status !== undefined && {
          status,
          receivedAt:
            status === 'RECEIVED' ? (existing.receivedAt ?? new Date()) : existing.receivedAt,
        }),
        ...(notes !== undefined && { notes }),
      },
      include: { supplier: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ data: purchase })
  } catch (error) {
    console.error('[PATCH /api/admin/purchases/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.purchase.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/purchases/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
