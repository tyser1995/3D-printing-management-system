import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { slugify } from '@/lib/utils/format'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, sortOrder, isActive } = body

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name, slug: slugify(name) }),
        ...(description !== undefined && { description: description || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return NextResponse.json({ data: category })
  } catch (error) {
    console.error('[PATCH /api/admin/categories/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const productCount = await prisma.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${productCount} product(s) still use this category` },
        { status: 409 }
      )
    }
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/categories/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
