'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Package, User, Pencil, ImageIcon } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import OrderStatusStepper from './OrderStatusStepper'
import EditOrderModal from './EditOrderModal'
import EditAddressModal from './EditAddressModal'
import EditPhotoModal from './EditPhotoModal'
import { formatCurrency, formatDate } from '@/lib/utils/format'

const STATUS_ORDER = [
  'PENDING',
  'CONFIRMED',
  'IN_PRINT_QUEUE',
  'PRINTING',
  'PRINTED',
  'QUALITY_CHECK',
  'PACKAGING',
  'SHIPPED',
  'DELIVERED',
]

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
  RETURNED: 'danger',
}

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'IN_PRINT_QUEUE',
  IN_PRINT_QUEUE: 'PRINTING',
  PRINTING: 'PRINTED',
  PRINTED: 'QUALITY_CHECK',
  QUALITY_CHECK: 'PACKAGING',
  PACKAGING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
}

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number | string
  totalPrice: number | string
  product: {
    id: string
    name: string
    sku: string
    images: Array<{ url: string }>
  }
}

interface StatusLog {
  id: string
  status: string
  notes: string | null
  createdAt: string | Date
}

interface Order {
  id: string
  orderNumber: string
  status: string
  subtotal: number | string
  shippingFee: number | string
  discount: number | string
  total: number | string
  notes: string | null
  trackingNumber: string | null
  printedPhotoUrl: string | null
  createdAt: string | Date
  deletedAt: string | Date | null
  user: { id: string; name: string | null; email: string; phone: string | null }
  address: {
    firstName: string
    lastName: string
    street: string
    city: string
    province: string
    postalCode: string
  } | null
  items: OrderItem[]
  statusLogs: StatusLog[]
}

interface Product {
  id: string
  name: string
  basePrice: number
  salePrice: number | null
  sku: string
}

export default function OrderDetail({
  order: initialOrder,
  products,
}: {
  order: Order
  products: Product[]
}) {
  const router = useRouter()
  const [order, setOrder] = useState(initialOrder)
  const [advancing, setAdvancing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState(false)

  const isEditable =
    order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && !order.deletedAt

  const hasBeenPrinted =
    STATUS_ORDER.indexOf(order.status) >= STATUS_ORDER.indexOf('PRINTED') || !!order.printedPhotoUrl

  const nextStatus = NEXT_STATUS[order.status]

  const advanceStatus = async () => {
    if (!nextStatus) return
    setAdvancing(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const json = await res.json()
      if (res.ok) {
        setOrder((prev) => ({
          ...prev,
          status: nextStatus,
          statusLogs: [
            ...prev.statusLogs,
            { ...json.data.log, createdAt: new Date(json.data.log.createdAt) },
          ],
        }))
        router.refresh()
      } else {
        alert(json.error ?? 'Failed to update order status')
      }
    } finally {
      setAdvancing(false)
    }
  }

  const cancelOrder = async () => {
    if (!confirm('Cancel this order?')) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', notes: 'Cancelled by admin' }),
      })
      const json = await res.json()
      if (res.ok) {
        setOrder((prev) => ({
          ...prev,
          status: 'CANCELLED',
          statusLogs: [
            ...prev.statusLogs,
            { ...json.data.log, createdAt: new Date(json.data.log.createdAt) },
          ],
        }))
        router.refresh()
      } else {
        alert(json.error ?? 'Failed to cancel order')
      }
    } finally {
      setCancelling(false)
    }
  }

  const deleteOrder = async () => {
    if (!confirm('Delete this cancelled order? It will be hidden from the Orders list.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) {
        router.push('/admin/orders')
        router.refresh()
      } else {
        alert(json.error ?? 'Failed to delete order')
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left — details */}
      <div className="space-y-6 lg:col-span-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-lg font-bold text-orange-600">{order.orderNumber}</p>
            <p className="text-sm text-slate-500">{formatDate(String(order.createdAt))}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_COLORS[order.status] ?? 'default'} size="md">
              {order.status.replace(/_/g, ' ')}
            </Badge>
            {nextStatus && (
              <Button size="sm" loading={advancing} onClick={advanceStatus}>
                → {nextStatus.replace(/_/g, ' ')}
              </Button>
            )}
            {isEditable && (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
              <Button size="sm" variant="danger" loading={cancelling} onClick={cancelOrder}>
                Cancel
              </Button>
            )}
            {order.status === 'CANCELLED' && !order.deletedAt && (
              <Button size="sm" variant="outline" loading={deleting} onClick={deleteOrder}>
                Delete
              </Button>
            )}
          </div>
        </div>
        {order.deletedAt && (
          <p className="-mt-4 text-sm text-slate-400">
            This order was deleted and is hidden from the Orders list.
          </p>
        )}

        {/* Items */}
        <Card padding="none">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900">Items ({order.items.length})</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {item.product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="m-auto h-6 w-6 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{item.product.name}</p>
                  <p className="text-xs text-slate-500">
                    SKU: {item.product.sku} · Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(Number(item.totalPrice))}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatCurrency(Number(item.unitPrice))} each
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* Totals */}
          <div className="space-y-1.5 border-t border-slate-100 p-5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span>{formatCurrency(Number(order.shippingFee))}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>−{formatCurrency(Number(order.discount))}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </Card>

        {/* Customer & Address */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" /> Customer
              </CardTitle>
            </CardHeader>
            <div className="space-y-1 text-sm text-slate-600">
              <p className="font-medium text-slate-900">{order.user.name ?? 'N/A'}</p>
              <p>{order.user.email}</p>
              {order.user.phone && <p>{order.user.phone}</p>}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" /> Ship To
              </CardTitle>
              {!order.deletedAt && (
                <button
                  onClick={() => setEditingAddress(true)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  title={order.address ? 'Edit address' : 'Add address'}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </CardHeader>
            {order.address ? (
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-medium text-slate-900">
                  {order.address.firstName} {order.address.lastName}
                </p>
                <p>{order.address.street}</p>
                <p>
                  {order.address.city}, {order.address.province} {order.address.postalCode}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No address on file</p>
            )}
          </Card>
        </div>

        {/* Tracking */}
        {order.trackingNumber && (
          <Card>
            <p className="text-sm text-slate-500">Tracking Number</p>
            <p className="font-mono font-semibold text-slate-900">{order.trackingNumber}</p>
          </Card>
        )}

        {/* Notes */}
        {order.notes && (
          <Card>
            <p className="text-sm text-slate-500">Notes</p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-slate-900">{order.notes}</p>
          </Card>
        )}

        {/* Printed Photo (optional) */}
        {hasBeenPrinted && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4" /> Printed Photo
              </CardTitle>
              {!order.deletedAt && (
                <button
                  onClick={() => setEditingPhoto(true)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  title={order.printedPhotoUrl ? 'Change photo' : 'Add photo'}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </CardHeader>
            {order.printedPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={order.printedPhotoUrl}
                alt="Finished print"
                className="max-h-72 w-full rounded-lg object-contain"
              />
            ) : (
              <p className="text-sm text-slate-400">No photo added yet</p>
            )}
          </Card>
        )}
      </div>

      {/* Right — timeline */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Status Timeline</CardTitle>
          </CardHeader>
          <OrderStatusStepper currentStatus={order.status} statusLogs={order.statusLogs} />
        </Card>
      </div>

      {editing && (
        <EditOrderModal
          orderId={order.id}
          initialItems={order.items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          }))}
          initialShippingFee={Number(order.shippingFee)}
          initialDiscount={Number(order.discount)}
          initialNotes={order.notes ?? ''}
          initialTrackingNumber={order.trackingNumber ?? ''}
          products={products}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            const u = updated as Order
            setOrder((prev) => ({
              ...prev,
              subtotal: u.subtotal,
              shippingFee: u.shippingFee,
              discount: u.discount,
              total: u.total,
              notes: u.notes,
              trackingNumber: u.trackingNumber,
              items: u.items,
            }))
            setEditing(false)
            router.refresh()
          }}
        />
      )}

      {editingAddress && (
        <EditAddressModal
          orderId={order.id}
          initialAddress={order.address}
          onClose={() => setEditingAddress(false)}
          onSaved={(address) => {
            setOrder((prev) => ({ ...prev, address }))
            setEditingAddress(false)
            router.refresh()
          }}
        />
      )}

      {editingPhoto && (
        <EditPhotoModal
          orderId={order.id}
          initialPhotoUrl={order.printedPhotoUrl}
          onClose={() => setEditingPhoto(false)}
          onSaved={(photoUrl) => {
            setOrder((prev) => ({ ...prev, printedPhotoUrl: photoUrl }))
            setEditingPhoto(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
