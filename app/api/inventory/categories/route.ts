import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error('[GET /api/inventory/categories]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
