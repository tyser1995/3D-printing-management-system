import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { product, type, item, filamentId, quantity, producedAt, notes, producedBy } = body

    const log = await prisma.productionLog.update({
      where: { id },
      data: {
        ...(product !== undefined && { product }),
        ...(type !== undefined && { type: type || null }),
        ...(item !== undefined && { item: item || null }),
        ...(filamentId !== undefined && { filamentId: filamentId || null }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(producedAt !== undefined && { producedAt: new Date(producedAt) }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(producedBy !== undefined && { producedBy: producedBy || null }),
      },
      include: { filament: { select: { id: true, name: true, color: true, colorHex: true } } },
    })

    return NextResponse.json({ data: log })
  } catch (error) {
    console.error('[PATCH /api/production/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.productionLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/production/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
