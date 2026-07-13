import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { slugify } from '@/lib/utils/format'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error('[GET /api/admin/categories]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, sortOrder } = body
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const category = await prisma.category.create({
      data: {
        name,
        slug: slugify(name),
        description: description || null,
        sortOrder: sortOrder ?? 0,
      },
    })
    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/categories]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
