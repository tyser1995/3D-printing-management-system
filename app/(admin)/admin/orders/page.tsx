import Link from 'next/link'
import { Search } from 'lucide-react'
import AdminHeader from '@/components/layout/AdminHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { prisma } from '@/lib/prisma/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Orders | Admin' }

const STATUS_COLORS: Record<
  string,
  'success' | 'warning' | 'info' | 'danger' | 'primary' | 'default'
> = {
  DELIVERED: 'success',
  PRINTING: 'info',
  PENDING: 'warning',
  SHIPPED: 'primary',
  CONFIRMED: 'default',
  IN_PRINT_QUEUE: 'info',
  QUALITY_CHECK: 'warning',
  CANCELLED: 'danger',
}

export default async function AdminOrdersPage() {
  const [orders, summary] = await Promise.all([
    prisma.order.findMany({
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
        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search orders..."
              className="h-9 w-64 rounded-lg border border-slate-200 bg-white pr-4 pl-9 text-sm focus:border-orange-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {summaryCards.map(({ label, status, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${color}`}>
              <p className="text-2xl font-bold">{counts[status] ?? 0}</p>
              <p className="text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Ship To'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-sm font-semibold text-orange-600 hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {order.user.name ?? order.user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {order._count.items} item{order._count.items !== 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(Number(order.total))}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_COLORS[order.status] ?? 'default'}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(String(order.createdAt), {
                        month: 'short',
                        day: 'numeric',
                        year: undefined,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {order.address ? `${order.address.city}, ${order.address.province}` : '—'}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
