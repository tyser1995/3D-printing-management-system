import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') ?? 'csv'
    const period = searchParams.get('period') ?? 'month'

    const now = new Date()
    const since =
      period === 'year'
        ? new Date(now.getFullYear(), 0, 1)
        : new Date(now.getFullYear(), now.getMonth(), 1)

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since } },
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (format === 'csv') {
      const headers = [
        'Order #',
        'Date',
        'Customer',
        'Email',
        'Items',
        'Subtotal',
        'Shipping',
        'Total',
        'Status',
      ]
      const rows = orders.map((o) => [
        o.orderNumber,
        o.createdAt.toISOString().split('T')[0],
        o.user.name ?? '',
        o.user.email,
        String(o._count.items),
        String(Number(o.subtotal)),
        String(Number(o.shippingFee)),
        String(Number(o.total)),
        o.status,
      ])

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
        .join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="kai3d-orders-${period}-${now.toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (error) {
    console.error('[GET /api/reports/export]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
