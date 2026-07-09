import AdminHeader from '@/components/layout/AdminHeader'
import ReportsClient from './ReportsClient'
import { prisma } from '@/lib/prisma/client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reports | Admin' }

export default async function AdminReportsPage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [thisMonthOrders, lastMonthOrders, topProducts] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: monthStart },
        status: { notIn: ['CANCELLED', 'RETURNED'] },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: lastMonthStart, lt: monthStart },
        status: { notIn: ['CANCELLED', 'RETURNED'] },
      },
      select: { total: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: monthStart },
          status: { notIn: ['CANCELLED', 'RETURNED'] },
        },
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5,
    }),
  ])

  // Enrich top products with names
  const productIds = topProducts.map((p) => p.productId)
  const productRows = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  })
  const nameMap = Object.fromEntries(productRows.map((p) => [p.id, p.name]))
  const topProductsData = topProducts.map((p) => ({
    name: nameMap[p.productId] ?? 'Unknown',
    units: p._sum.quantity ?? 0,
    revenue: Number(p._sum.totalPrice ?? 0),
  }))

  // Chart data — group by day
  const chartData = thisMonthOrders.reduce<
    Array<{ name: string; revenue: number; orders: number }>
  >((acc, o) => {
    const day = String(o.createdAt.getDate())
    const existing = acc.find((d) => d.name === day)
    if (existing) {
      existing.revenue += Number(o.total)
      existing.orders += 1
    } else {
      acc.push({ name: day, revenue: Number(o.total), orders: 1 })
    }
    return acc
  }, [])

  // KPIs
  const thisRevenue = thisMonthOrders.reduce((s, o) => s + Number(o.total), 0)
  const lastRevenue = lastMonthOrders.reduce((s, o) => s + Number(o.total), 0)
  const revenueChange = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 0

  const kpis = {
    revenue: thisRevenue,
    orders: thisMonthOrders.length,
    avgOrder: thisMonthOrders.length > 0 ? thisRevenue / thisMonthOrders.length : 0,
    revenueChange,
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Reports" />
      <ReportsClient chartData={chartData} topProducts={topProductsData} kpis={kpis} />
    </div>
  )
}
