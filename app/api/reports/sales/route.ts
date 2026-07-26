import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') ?? 'month' // month | year

    const now = new Date()
    let since: Date

    if (period === 'year') {
      since = new Date(now.getFullYear(), 0, 1)
    } else {
      since = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const [orders, checkouts, topProducts] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: since },
          status: { notIn: ['CANCELLED', 'RETURNED'] },
        },
        select: {
          total: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.productionCheckout.findMany({
        where: { checkedOutAt: { gte: since } },
        select: { totalAmount: true, checkedOutAt: true },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            createdAt: { gte: since },
            status: { notIn: ['CANCELLED', 'RETURNED'] },
          },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5,
      }),
    ])

    // Group orders and production checkouts by day or month
    const grouped: Record<string, { revenue: number; count: number }> = {}
    for (const o of orders) {
      const key =
        period === 'year'
          ? o.createdAt.toLocaleString('en-US', { month: 'short' })
          : String(o.createdAt.getDate())
      if (!grouped[key]) grouped[key] = { revenue: 0, count: 0 }
      grouped[key].revenue += Number(o.total)
      grouped[key].count += 1
    }
    for (const c of checkouts) {
      const key =
        period === 'year'
          ? c.checkedOutAt.toLocaleString('en-US', { month: 'short' })
          : String(c.checkedOutAt.getDate())
      if (!grouped[key]) grouped[key] = { revenue: 0, count: 0 }
      grouped[key].revenue += Number(c.totalAmount)
      grouped[key].count += 1
    }

    const chartData = Object.entries(grouped).map(([name, d]) => ({
      name,
      revenue: Math.round(d.revenue * 100) / 100,
      orders: d.count,
    }))

    // Enrich top products with names
    const productIds = topProducts.map((p) => p.productId)
    const productNames = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    })
    const nameMap = Object.fromEntries(productNames.map((p) => [p.id, p.name]))

    const topProductsData = topProducts.map((p) => ({
      name: nameMap[p.productId] ?? 'Unknown',
      units: p._sum.quantity ?? 0,
      revenue: Number(p._sum.totalPrice ?? 0),
    }))

    // Summary KPIs — a production checkout is a completed sale, counted the same as an order
    const orderRevenue = orders.reduce((s, o) => s + Number(o.total), 0)
    const checkoutRevenue = checkouts.reduce((s, c) => s + Number(c.totalAmount), 0)
    const totalRevenue = orderRevenue + checkoutRevenue
    const totalOrders = orders.length + checkouts.length
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

    return NextResponse.json({
      data: {
        chartData,
        topProducts: topProductsData,
        summary: {
          revenue: Math.round(totalRevenue * 100) / 100,
          orders: totalOrders,
          avgOrder: Math.round(avgOrder * 100) / 100,
        },
        period,
        since: since.toISOString(),
      },
    })
  } catch (error) {
    console.error('[GET /api/reports/sales]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
