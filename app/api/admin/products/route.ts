import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { slugify } from '@/lib/utils/format'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    const products = await prisma.product.findMany({
      where: {
        ...(q && {
          OR: [{ name: { contains: q } }, { sku: { contains: q } }],
        }),
      },
      include: {
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { orderItems: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: products })
  } catch (error) {
    console.error('[GET /api/admin/products]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
      tags,
      imageUrl,
    } = body

    if (!name || !categoryId || !basePrice || !sku) {
      return NextResponse.json(
        { error: 'name, categoryId, basePrice, and sku are required' },
        { status: 400 }
      )
    }

    const slug = slugify(name)

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description ?? null,
        categoryId,
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : null,
        sku,
        stockQuantity: Number(stockQuantity ?? 0),
        isFeatured: Boolean(isFeatured),
        isActive: true,
        tags: Array.isArray(tags) ? tags.join(', ') : (tags ?? ''),
        ...(imageUrl && {
          images: {
            create: [{ url: imageUrl, isPrimary: true, altText: name }],
          },
        }),
      },
      include: {
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    })

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/products]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
