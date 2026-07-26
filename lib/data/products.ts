import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma/client'

export const getActiveCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } })
  },
  ['public-categories'],
  { tags: ['categories'], revalidate: 60 }
)

export const getPublicProducts = unstable_cache(
  async (category: string | undefined, sort: string, q: string | undefined) => {
    return prisma.product.findMany({
      where: {
        isActive: true,
        ...(category && { category: { slug: category } }),
        ...(q && {
          OR: [{ name: { contains: q } }, { description: { contains: q } }],
        }),
      },
      include: {
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        reviews: { select: { rating: true } },
      },
      orderBy:
        sort === 'price-asc'
          ? { basePrice: 'asc' }
          : sort === 'price-desc'
            ? { basePrice: 'desc' }
            : sort === 'featured'
              ? { isFeatured: 'desc' }
              : { createdAt: 'desc' },
    })
  },
  ['public-products'],
  { tags: ['products'], revalidate: 60 }
)
