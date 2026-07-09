import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const filament = await prisma.filament.findUnique({
      where: { id },
      include: {
        material: true,
        supplier: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!filament) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: filament })
  } catch (error) {
    console.error('[GET /api/inventory/filaments/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      materialId,
      supplierId,
      color,
      colorHex,
      weightGrams,
      pricePerKg,
      stockGrams,
      lowStockAlertG,
      isActive,
    } = body

    const filament = await prisma.filament.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(materialId !== undefined && { materialId }),
        ...(supplierId !== undefined && { supplierId }),
        ...(color !== undefined && { color }),
        ...(colorHex !== undefined && { colorHex }),
        ...(weightGrams !== undefined && { weightGrams: Number(weightGrams) }),
        ...(pricePerKg !== undefined && { pricePerKg: Number(pricePerKg) }),
        ...(stockGrams !== undefined && { stockGrams: Number(stockGrams) }),
        ...(lowStockAlertG !== undefined && { lowStockAlertG: Number(lowStockAlertG) }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        material: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ data: filament })
  } catch (error) {
    console.error('[PATCH /api/inventory/filaments/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.filament.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/inventory/filaments/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
