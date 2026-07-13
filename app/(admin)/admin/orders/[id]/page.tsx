import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AdminHeader from '@/components/layout/AdminHeader'
import { prisma } from '@/lib/prisma/client'
import OrderDetail from '@/components/admin/orders/OrderDetail'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id }, select: { orderNumber: true } })
  return { title: order ? `Order ${order.orderNumber} | Admin` : 'Order | Admin' }
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      address: true,
      items: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
        },
      },
      statusLogs: { orderBy: { createdAt: 'asc' } },
      printJobs: {
        include: { printer: { select: { id: true, name: true, model: true } } },
      },
    },
  })

  if (!order) notFound()

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Order Detail" />

      <div className="flex-1 overflow-y-auto p-6">
        <Link
          href="/admin/orders"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>

        <OrderDetail
          order={{
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            subtotal: Number(order.subtotal),
            shippingFee: Number(order.shippingFee),
            discount: Number(order.discount),
            total: Number(order.total),
            notes: order.notes,
            trackingNumber: order.trackingNumber,
            createdAt: order.createdAt,
            deletedAt: order.deletedAt,
            user: order.user,
            address: order.address,
            statusLogs: order.statusLogs,
            items: order.items.map((item) => ({
              id: item.id,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice),
              product: {
                id: item.product.id,
                name: item.product.name,
                sku: item.product.sku,
                images: item.product.images,
              },
            })),
          }}
        />
      </div>
    </div>
  )
}
