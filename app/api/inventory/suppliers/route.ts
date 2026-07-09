import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: suppliers })
  } catch (error) {
    console.error('[GET /api/inventory/suppliers]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
