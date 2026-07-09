import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const printers = await prisma.printer.findMany({
      include: {
        printJobs: {
          where: { status: 'PRINTING' },
          include: {
            order: {
              include: { items: { include: { product: { select: { name: true } } }, take: 1 } },
            },
          },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: printers })
  } catch (error) {
    console.error('[GET /api/printers]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, model, brand, ipAddress, notes } = body
    if (!name || !model)
      return NextResponse.json({ error: 'name and model are required' }, { status: 400 })

    const printer = await prisma.printer.create({
      data: {
        name,
        model,
        brand: brand ?? 'Bambu Lab',
        ipAddress: ipAddress ?? null,
        notes: notes ?? null,
      },
    })
    return NextResponse.json({ data: printer }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/printers]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
