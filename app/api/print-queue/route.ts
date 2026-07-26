import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export async function GET() {
  try {
    const jobs = await prisma.printJob.findMany({
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      include: {
        order: {
          include: {
            user: { select: { name: true, email: true } },
            items: { include: { product: { select: { name: true } } } },
          },
        },
        printer: true,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({ data: jobs })
  } catch (error) {
    console.error('[GET /api/print-queue]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, printerId, printTimeMinutes, filamentUsedGrams } = body

    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

    const job = await prisma.printJob.create({
      data: {
        orderId,
        printerId: printerId ?? null,
        status: printerId ? 'PRINTING' : 'QUEUED',
        printTimeMinutes: printTimeMinutes ?? null,
        filamentUsedGrams: filamentUsedGrams ?? null,
        startedAt: printerId ? new Date() : null,
      },
      include: {
        order: { include: { user: { select: { name: true, email: true } } } },
        printer: true,
      },
    })

    return NextResponse.json({ data: job }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/print-queue]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
