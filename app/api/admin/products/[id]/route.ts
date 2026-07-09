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
    const {
      name,
      description,
      categoryId,
      basePrice,
      salePrice,
      sku,
      stockQuantity,
      isFeatured,
      isActive,
      tags,
      imageUrl,
    } = body

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name, slug: slugify(name) }),
        ...(description !== undefined && { description }),
        ...(categoryId !== undefined && { categoryId }),
        ...(basePrice !== undefined && { basePrice: Number(basePrice) }),
        ...(salePrice !== undefined && { salePrice: salePrice ? Number(salePrice) : null }),
        ...(sku !== undefined && { sku }),
        ...(stockQuantity !== undefined && { stockQuantity: Number(stockQuantity) }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isActive !== undefined && { isActive }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags.join(', ') : (tags ?? '') }),
      },
      include: {
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    })

    // Update primary image if provided
    if (imageUrl) {
      await prisma.productImage.deleteMany({ where: { productId: id, isPrimary: true } })
      await prisma.productImage.create({
        data: { productId: id, url: imageUrl, isPrimary: true, altText: name ?? product.name },
      })
    }

    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('[PATCH /api/admin/products/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    await prisma.product.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/admin/products/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
