import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const costConfig = await prisma.costConfig.findUnique({
      where: { productId: id },
      include: { product: { select: { id: true, name: true, basePrice: true } } },
    })

    if (!costConfig) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: costConfig })
  } catch (error) {
    console.error('[GET /api/products/[id]/cost]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const data = {
      filamentGrams: Number(body.filamentGrams),
      filamentCostPerG: Number(body.filamentCostPerG),
      printHours: Number(body.printHours),
      electricityKwh: Number(body.electricityKwh),
      electricityCost: Number(body.electricityCost),
      laborHours: Number(body.laborHours),
      laborRatePerHour: Number(body.laborRatePerHour),
      packagingCost: Number(body.packagingCost),
      shippingCost: Number(body.shippingCost),
      profitMargin: Number(body.profitMargin),
    }

    const costConfig = await prisma.costConfig.upsert({
      where: { productId: id },
      update: data,
      create: { productId: id, ...data },
    })

    return NextResponse.json({ data: costConfig })
  } catch (error) {
    console.error('[PUT /api/products/[id]/cost]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
