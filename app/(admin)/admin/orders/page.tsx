import AdminHeader from '@/components/layout/AdminHeader'
import { prisma } from '@/lib/prisma/client'
import { getSettings } from '@/lib/settings'
import OrdersClient from './OrdersClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Orders | Admin' }

export default async function AdminOrdersPage() {
  const settings = await getSettings()
  const showDeleted = settings.display?.showDeletedOrders ?? false

  const [orders, summary, customers, products] = await Promise.all([
    prisma.order.findMany({
      where: showDeleted ? {} : { deletedAt: null },
      include: {
        user: { select: { name: true, email: true } },
        address: { select: { city: true, province: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: 'asc' },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, basePrice: true, salePrice: true, sku: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const counts = summary.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = s._count
    return acc
  }, {})

  const summaryCards = [
    { label: 'Pending', status: 'PENDING', color: 'border-amber-200 bg-amber-50 text-amber-700' },
    {
      label: 'In Queue / Printing',
      status: 'IN_PRINT_QUEUE',
      color: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    {
      label: 'Shipped',
      status: 'SHIPPED',
      color: 'border-purple-200 bg-purple-50 text-purple-700',
    },
    {
      label: 'Delivered',
      status: 'DELIVERED',
      color: 'border-green-200 bg-green-50 text-green-700',
    },
  ]

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Orders" />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summaryCards.map(({ label, status, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${color}`}>
              <p className="text-2xl font-bold">{counts[status] ?? 0}</p>
              <p className="text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>

        <OrdersClient
          initialOrders={orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            total: Number(o.total),
            createdAt: o.createdAt,
            deletedAt: o.deletedAt,
            user: o.user,
            address: o.address,
            _count: o._count,
          }))}
          customers={customers}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            basePrice: Number(p.basePrice),
            salePrice: p.salePrice === null ? null : Number(p.salePrice),
          }))}
        />
      </div>
    </div>
  )
}
