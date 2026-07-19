import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, colorHex, isActive } = body

    const color = await prisma.productionColor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(colorHex !== undefined && { colorHex: colorHex || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return NextResponse.json({ data: color })
  } catch (error) {
    console.error('[PATCH /api/admin/production-colors/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Soft delete — deactivates rather than removing, since past production logs may still reference it.
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.productionColor.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/production-colors/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
