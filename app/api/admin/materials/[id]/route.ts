import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, properties } = body

    const material = await prisma.filamentMaterial.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(properties !== undefined && { properties: properties || null }),
      },
    })
    return NextResponse.json({ data: material })
  } catch (error) {
    console.error('[PATCH /api/admin/materials/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const filamentCount = await prisma.filament.count({ where: { materialId: id } })
    if (filamentCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${filamentCount} filament(s) still use this material` },
        { status: 409 }
      )
    }
    await prisma.filamentMaterial.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/materials/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
