import { Suspense } from 'react'
import Link from 'next/link'
import { ShoppingBag, TrendingUp, Package, Users, Printer, AlertTriangle } from 'lucide-react'
import AdminHeader from '@/components/layout/AdminHeader'
import StatsCard from '@/components/admin/StatsCard'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import SalesChart from '@/components/charts/SalesChart'
import { prisma } from '@/lib/prisma/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard | Admin' }

const orderStatusColors: Record<
  string,
  'success' | 'warning' | 'info' | 'danger' | 'primary' | 'default'
> = {
  DELIVERED: 'success',
  PRINTING: 'info',
  PENDING: 'warning',
  SHIPPED: 'primary',
  CONFIRMED: 'default',
  CANCELLED: 'danger',
}

export default async function AdminDashboardPage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const chartRangeStart = new Date(now.getFullYear(), now.getMonth() - 6, 1)

  const [
    totalRevenue,
    lastMonthRevenue,
    totalOrders,
    lastMonthOrders,
    activeProducts,
    totalCustomers,
    recentOrders,
    activePrintJobs,
    lowStockFilaments,
    chartOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { notIn: ['CANCELLED', 'RETURNED'] } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: lastMonthStart, lt: monthStart },
        status: { notIn: ['CANCELLED', 'RETURNED'] },
      },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { status: { notIn: ['CANCELLED', 'RETURNED'] } } }),
    prisma.order.count({
      where: {
        createdAt: { gte: lastMonthStart, lt: monthStart },
        status: { notIn: ['CANCELLED', 'RETURNED'] },
      },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true } } }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.printJob.findMany({
      where: { status: { in: ['PRINTING', 'QUEUED'] } },
      include: {
        order: {
          include: { items: { include: { product: { select: { name: true } } }, take: 1 } },
        },
        printer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.filament
      .findMany({
        where: { isActive: true },
        include: { material: { select: { name: true } } },
        orderBy: { stockGrams: 'asc' },
      })
      .then((f) => f.filter((x) => x.stockGrams < x.lowStockAlertG).slice(0, 3)),
    prisma.order.findMany({
      where: {
        createdAt: { gte: chartRangeStart },
        status: { notIn: ['CANCELLED', 'RETURNED'] },
      },
      select: { total: true, createdAt: true },
    }),
  ])

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1)
    const monthOrders = chartOrders.filter(
      (o) =>
        o.createdAt.getFullYear() === d.getFullYear() && o.createdAt.getMonth() === d.getMonth()
    )
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      revenue: monthOrders.reduce((sum, o) => sum + Number(o.total), 0),
      orders: monthOrders.length,
    }
  })

  const thisMonthRevenue = Number(totalRevenue._sum.total ?? 0)
  const prevRevenue = Number(lastMonthRevenue._sum.total ?? 0)
  const revenueChange = prevRevenue > 0 ? ((thisMonthRevenue - prevRevenue) / prevRevenue) * 100 : 0

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(thisMonthRevenue),
      change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}% from last month`,
      changeType: (revenueChange >= 0 ? 'up' : 'down') as 'up' | 'down',
      icon: TrendingUp,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-50',
    },
    {
      title: 'Total Orders',
      value: String(totalOrders),
      change: `+${totalOrders - lastMonthOrders} this month`,
      changeType: 'up' as const,
      icon: ShoppingBag,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Active Products',
      value: String(activeProducts),
      change: 'Currently listed',
      changeType: 'neutral' as const,
      icon: Package,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-50',
    },
    {
      title: 'Customers',
      value: String(totalCustomers),
      change: 'Registered accounts',
      changeType: 'neutral' as const,
      icon: Users,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-50',
    },
  ]

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Dashboard" />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Sales chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <Suspense
              fallback={
                <div className="flex h-72 items-center justify-center">
                  <Spinner />
                </div>
              }
            >
              <SalesChart data={chartData} />
            </Suspense>
          </Card>

          {/* Print Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Print Queue</CardTitle>
              <Printer className="h-5 w-5 text-slate-400" />
            </CardHeader>
            {activePrintJobs.length === 0 ? (
              <p className="text-sm text-slate-400">No active jobs.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {activePrintJobs.map((job) => {
                  const productName = job.order.items[0]?.product.name ?? 'Unknown'
                  return (
                    <div key={job.id} className="rounded-lg border border-slate-100 p-3">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-slate-900">{productName}</p>
                        <Badge variant={job.status === 'PRINTING' ? 'info' : 'warning'} size="sm">
                          {job.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {job.printer?.name ?? 'Unassigned'}
                      </p>
                      {job.printTimeMinutes && (
                        <p className="mt-1 text-xs text-slate-400">
                          ~{Math.ceil(job.printTimeMinutes / 60)}h remaining
                        </p>
                      )}
                    </div>
                  )
                })}
                <Link
                  href="/admin/print-queue"
                  className="text-center text-sm font-medium text-orange-500 hover:text-orange-600"
                >
                  View all →
                </Link>
              </div>
            )}
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <Card padding="none" className="lg:col-span-2">
            <CardHeader className="px-6 pt-6">
              <CardTitle>Recent Orders</CardTitle>
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-orange-500 hover:text-orange-600"
              >
                View all →
              </Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Order', 'Customer', 'Product', 'Total', 'Status', 'Date'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-sm font-medium text-orange-600 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {order.user.name ?? order.user.email}
                      </td>
                      <td className="max-w-[140px] truncate px-6 py-4 text-sm text-slate-600">
                        {order.items[0]?.product.name ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {formatCurrency(Number(order.total))}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={orderStatusColors[order.status] ?? 'default'}>
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
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                        No orders yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Low Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alert</CardTitle>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </CardHeader>
            {lowStockFilaments.length === 0 ? (
              <p className="text-sm text-slate-400">All filaments stocked. ✓</p>
            ) : (
              <div className="flex flex-col gap-3">
                {lowStockFilaments.map((item) => (
                  <div key={item.id} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-amber-600">
                        {item.stockGrams}g remaining
                      </span>
                      <span className="text-slate-400">Alert at {item.lowStockAlertG}g</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-200">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{
                          width: `${Math.min((item.stockGrams / item.lowStockAlertG) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <Link
                  href="/admin/inventory"
                  className="mt-1 text-center text-sm font-medium text-orange-500 hover:text-orange-600"
                >
                  Manage Inventory →
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
