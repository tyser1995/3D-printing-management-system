import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma/client'
import { slugify } from '@/lib/utils/format'
import { generateNextSku } from '@/lib/prisma/sku'
import { getSettings } from '@/lib/settings'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const settings = await getSettings()
    const showDeleted = settings.display?.showDeletedProducts ?? false

    const products = await prisma.product.findMany({
      where: {
        ...(showDeleted ? {} : { isActive: true }),
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
      sku: skuInput,
      stockQuantity,
      isFeatured,
      tags,
      imageUrl,
    } = body
    const sku = typeof skuInput === 'string' ? skuInput.trim() : ''

    if (!name || !categoryId || !basePrice) {
      return NextResponse.json(
        { error: 'name, categoryId, and basePrice are required' },
        { status: 400 }
      )
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 })
    }

    const slug = slugify(name)

    // Retry a couple of times in case of a rare race on the auto-generated SKU.
    let product
    for (let attempt = 0; attempt < 3; attempt++) {
      const resolvedSku = sku || (await generateNextSku(prisma, categoryId, category.name))
      try {
        product = await prisma.product.create({
          data: {
            name,
            slug,
            description: description ?? null,
            categoryId,
            basePrice: Number(basePrice),
            salePrice: salePrice ? Number(salePrice) : null,
            sku: resolvedSku,
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
        break
      } catch (err) {
        const isUniqueSkuClash =
          sku === '' &&
          err instanceof Error &&
          'code' in err &&
          (err as { code: string }).code === 'P2002'
        if (!isUniqueSkuClash || attempt === 2) throw err
      }
    }

    revalidateTag('products', { expire: 0 })
    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/products]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
