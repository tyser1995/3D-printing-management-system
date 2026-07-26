import AdminHeader from '@/components/layout/AdminHeader'
import ReportsClient from './ReportsClient'
import { prisma } from '@/lib/prisma/client'
import { ORDER_ELECTRICITY_FEE_PER_UNIT } from '@/lib/utils/cost'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reports | Admin' }

export default async function AdminReportsPage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // "Ordered" = every non-cancelled/non-returned order item, all-time.
  // "Delivered" = the subset of those whose order has actually reached DELIVERED.
  const [
    thisMonthOrders,
    lastMonthOrders,
    thisMonthCheckouts,
    lastMonthCheckouts,
    topProducts,
    orderedAgg,
    deliveredAgg,
    checkoutAgg,
    purchaseAgg,
    settings,
  ] = await Promise.all([
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
    prisma.productionCheckout.findMany({
      where: { checkedOutAt: { gte: monthStart } },
      select: { totalAmount: true, checkedOutAt: true },
    }),
    prisma.productionCheckout.findMany({
      where: { checkedOutAt: { gte: lastMonthStart, lt: monthStart } },
      select: { totalAmount: true },
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
    prisma.orderItem.aggregate({
      where: { order: { status: { notIn: ['CANCELLED', 'RETURNED'] } } },
      _sum: { quantity: true, totalPrice: true },
    }),
    prisma.orderItem.aggregate({
      where: { order: { status: 'DELIVERED' } },
      _sum: { quantity: true, totalPrice: true },
    }),
    prisma.productionCheckout.aggregate({ _sum: { totalAmount: true } }),
    prisma.purchase.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { totalCost: true },
    }),
    getSettings(),
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

  // Chart data — group by day, blending order revenue with production checkout revenue
  const chartByDay = new Map<string, { revenue: number; orders: number }>()
  for (const o of thisMonthOrders) {
    const day = String(o.createdAt.getDate())
    const existing = chartByDay.get(day) ?? { revenue: 0, orders: 0 }
    existing.revenue += Number(o.total)
    existing.orders += 1
    chartByDay.set(day, existing)
  }
  for (const c of thisMonthCheckouts) {
    const day = String(c.checkedOutAt.getDate())
    const existing = chartByDay.get(day) ?? { revenue: 0, orders: 0 }
    existing.revenue += Number(c.totalAmount)
    existing.orders += 1
    chartByDay.set(day, existing)
  }
  const chartData = Array.from(chartByDay, ([name, d]) => ({ name, ...d })).sort(
    (a, b) => Number(a.name) - Number(b.name)
  )

  // KPIs — a production checkout is a completed sale, counted the same as an order
  const thisCheckoutRevenue = thisMonthCheckouts.reduce((s, c) => s + Number(c.totalAmount), 0)
  const lastCheckoutRevenue = lastMonthCheckouts.reduce((s, c) => s + Number(c.totalAmount), 0)
  const thisRevenue = thisMonthOrders.reduce((s, o) => s + Number(o.total), 0) + thisCheckoutRevenue
  const lastRevenue = lastMonthOrders.reduce((s, o) => s + Number(o.total), 0) + lastCheckoutRevenue
  const revenueChange = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 0
  const thisOrderCount = thisMonthOrders.length + thisMonthCheckouts.length

  const kpis = {
    revenue: thisRevenue,
    orders: thisOrderCount,
    avgOrder: thisOrderCount > 0 ? thisRevenue / thisOrderCount : 0,
    revenueChange,
  }

  // Production checkouts are already-completed sales, folded into both the
  // ordered and delivered totals below (there's no separate "ordered" stage for them).
  const checkoutRevenue = Number(checkoutAgg._sum.totalAmount ?? 0)
  const orderedRevenue = Number(orderedAgg._sum.totalPrice ?? 0) + checkoutRevenue
  const deliveredRevenue = Number(deliveredAgg._sum.totalPrice ?? 0) + checkoutRevenue
  const deliveredItems = deliveredAgg._sum.quantity ?? 0
  // ₱10 per unit, counted only once an order has actually been delivered,
  // deducted from item revenue rather than charged on top.
  const electricityFund = deliveredItems * ORDER_ELECTRICITY_FEE_PER_UNIT

  // Rough all-time margin: revenue actually collected from delivered orders
  // minus everything spent restocking materials (cancelled purchases excluded).
  const totalPurchased = Number(purchaseAgg._sum.totalCost ?? 0)
  const netAfterPurchases = deliveredRevenue - totalPurchased
  // Bottom line: what's actually left after the electricity fund is set aside
  // and material purchases are paid for.
  const takeHomeAmount = deliveredRevenue - (electricityFund + totalPurchased)

  const fulfillment = {
    orderedRevenue,
    deliveredRevenue,
    orderedItems: orderedAgg._sum.quantity ?? 0,
    deliveredItems,
    deliveredPct: orderedRevenue > 0 ? (deliveredRevenue / orderedRevenue) * 100 : 0,
    electricityFund,
    totalPurchased,
    netAfterPurchases,
    takeHomeAmount,
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Reports" />
      <ReportsClient
        chartData={chartData}
        topProducts={topProductsData}
        kpis={kpis}
        fulfillment={fulfillment}
        roi={settings.roi ?? {}}
      />
    </div>
  )
}
