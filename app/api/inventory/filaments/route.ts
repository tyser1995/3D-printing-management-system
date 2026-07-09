import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const materialId = searchParams.get('materialId')
    const lowStock = searchParams.get('lowStock') === 'true'

    const filaments = await prisma.filament.findMany({
      where: {
        isActive: true,
        ...(materialId && { materialId }),
        ...(q && { name: { contains: q } }),
      },
      include: {
        material: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        _count: { select: { movements: true } },
      },
      orderBy: { name: 'asc' },
    })

    // lowStock filter: compare two columns in app layer (Prisma doesn't support column comparison natively)
    const result = lowStock ? filaments.filter((f) => f.stockGrams < f.lowStockAlertG) : filaments

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[GET /api/inventory/filaments]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
    } = body

    if (!name || !materialId || !color || !weightGrams || !pricePerKg) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const filament = await prisma.filament.create({
      data: {
        name,
        materialId,
        supplierId: supplierId ?? null,
        color,
        colorHex: colorHex ?? null,
        weightGrams: Number(weightGrams),
        pricePerKg: Number(pricePerKg),
        stockGrams: Number(stockGrams ?? 0),
        lowStockAlertG: Number(lowStockAlertG ?? 200),
      },
      include: {
        material: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ data: filament }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/inventory/filaments]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
