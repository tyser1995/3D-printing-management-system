import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const q = searchParams.get('q')
    const page = parseInt(searchParams.get('page') ?? '1')
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20')

    const where = {
      isActive: true,
      ...(category && { category: { slug: category } }),
      ...(q && {
        OR: [{ name: { contains: q } }, { description: { contains: q } }],
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { where: { isPrimary: true }, take: 1 },
          reviews: { select: { rating: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    const data = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      basePrice: Number(p.basePrice),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      imageUrl: p.images[0]?.url,
      category: p.category.name,
      rating:
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
          : 0,
      reviewCount: p.reviews.length,
      isNew: Date.now() - p.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000,
      isFeatured: p.isFeatured,
    }))

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('[GET /api/products]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
