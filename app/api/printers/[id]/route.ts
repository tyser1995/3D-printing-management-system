import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, model, brand, ipAddress, notes, isActive } = body

    const printer = await prisma.printer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(model !== undefined && { model }),
        ...(brand !== undefined && { brand }),
        ...(ipAddress !== undefined && { ipAddress }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return NextResponse.json({ data: printer })
  } catch (error) {
    console.error('[PATCH /api/printers/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.printer.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/printers/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
