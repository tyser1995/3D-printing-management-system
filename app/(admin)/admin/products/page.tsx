import AdminHeader from '@/components/layout/AdminHeader'
import { prisma } from '@/lib/prisma/client'
import { getSettings } from '@/lib/settings'
import ProductsClient from './ProductsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Products | Admin' }

export default async function AdminProductsPage() {
  const settings = await getSettings()
  const showDeleted = settings.display?.showDeletedProducts ?? false

  const products = await prisma.product.findMany({
    where: showDeleted ? {} : { isActive: true },
    include: {
      category: { select: { id: true, name: true } },
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { orderItems: true, reviews: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Products" />
      <div className="flex-1 overflow-y-auto p-6">
        <ProductsClient
          initialProducts={products.map((p) => ({
            ...p,
            basePrice: Number(p.basePrice),
            salePrice: p.salePrice ? Number(p.salePrice) : null,
          }))}
        />
      </div>
    </div>
  )
}
