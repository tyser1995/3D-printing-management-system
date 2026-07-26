import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, printerId, filamentUsedGrams, printTimeMinutes, notes } = body

    const data: Record<string, unknown> = {}
    if (status !== undefined) data.status = status
    if (printerId !== undefined) data.printerId = printerId
    if (filamentUsedGrams !== undefined) data.filamentUsedGrams = Number(filamentUsedGrams)
    if (printTimeMinutes !== undefined) data.printTimeMinutes = Number(printTimeMinutes)
    if (notes !== undefined) data.notes = notes

    if (status === 'PRINTING' && !data.startedAt) data.startedAt = new Date()
    if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
      data.completedAt = new Date()
    }

    const job = await prisma.printJob.update({
      where: { id },
      data,
      include: {
        order: { include: { user: { select: { name: true } } } },
        printer: true,
      },
    })

    return NextResponse.json({ data: job })
  } catch (error) {
    console.error('[PATCH /api/print-queue/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
