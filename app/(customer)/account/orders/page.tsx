import { Package } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma/client'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils/format'

export const metadata = { title: 'My Orders' }

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  DELIVERED: 'success',
  PRINTING: 'info',
  PENDING: 'warning',
  SHIPPED: 'default',
  CANCELLED: 'danger',
  RETURNED: 'danger',
}

export default async function AccountOrdersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const orders = user
    ? await prisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: {
            include: { product: { select: { name: true } } },
            take: 2,
          },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    : []

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">My Orders</h1>

      {!user ? (
        <Card className="flex flex-col items-center gap-4 py-16 text-center">
          <Package className="h-12 w-12 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900">Sign in to view orders</h2>
          <Link href="/login" className="text-sm font-medium text-orange-600 hover:underline">
            Go to login
          </Link>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-16 text-center">
          <Package className="h-12 w-12 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-900">No orders yet</h2>
          <p className="text-slate-500">Your order history will appear here.</p>
          <Link href="/products" className="text-sm font-medium text-orange-600 hover:underline">
            Browse products
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const itemSummary = order.items
              .map((i) => `${i.product.name} x${i.quantity}`)
              .join(', ')
            const extra = order._count.items > 2 ? ` +${order._count.items - 2} more` : ''

            return (
              <Card key={order.id} className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-orange-500">{order.orderNumber}</span>
                    <Badge variant={STATUS_COLORS[order.status] ?? 'default'}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-600">
                    {itemSummary}
                    {extra}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(String(order.createdAt))}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-slate-900">{formatCurrency(Number(order.total))}</p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
