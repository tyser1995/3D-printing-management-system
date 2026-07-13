'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { usePagination } from '@/lib/hooks/usePagination'

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

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string | Date
  deletedAt: string | Date | null
  user: { name: string | null; email: string }
  address: { city: string; province: string } | null
  _count: { items: number }
}

interface Customer {
  id: string
  name: string | null
  email: string
  phone: string | null
}

interface Product {
  id: string
  name: string
  basePrice: number
  salePrice: number | null
  sku: string
}

interface Props {
  initialOrders: Order[]
  customers: Customer[]
  products: Product[]
}

interface LineItem {
  productId: string
  quantity: number
}

export default function OrdersClient({
  initialOrders,
  customers: initialCustomers,
  products,
}: Props) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const filtered = orders.filter((o) => {
    const q = query.toLowerCase()
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.user.name ?? '').toLowerCase().includes(q) ||
      o.user.email.toLowerCase().includes(q)
    )
  })
  const {
    page,
    pageCount,
    total: totalFiltered,
    pageSize,
    pageItems,
    setPage,
    resetPage,
  } = usePagination(filtered)

  const handleQueryChange = (value: string) => {
    setQuery(value)
    resetPage()
  }

  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' })
  const [items, setItems] = useState<LineItem[]>([{ productId: '', quantity: 1 }])
  const [shippingFee, setShippingFee] = useState('0')
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')

  const productPrice = (p: Product) => Number(p.salePrice ?? p.basePrice)

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId)
        if (!product) return sum
        return sum + productPrice(product) * item.quantity
      }, 0),
    [items, products]
  )
  const total = Math.max(0, subtotal + (Number(shippingFee) || 0) - (Number(discount) || 0))

  const resetForm = () => {
    setIsNewCustomer(false)
    setCustomerId('')
    setNewCustomer({ name: '', email: '', phone: '' })
    setItems([{ productId: '', quantity: 1 }])
    setShippingFee('0')
    setDiscount('0')
    setNotes('')
    setError(null)
  }

  const closeForm = () => {
    setShowForm(false)
    resetForm()
  }

  const updateItem = (index: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const addItemRow = () => setItems((prev) => [...prev, { productId: '', quantity: 1 }])
  const removeItemRow = (index: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validItems = items.filter((it) => it.productId && it.quantity > 0)
    if (validItems.length === 0) {
      setError('Add at least one product line item')
      return
    }
    if (!isNewCustomer && !customerId) {
      setError('Select a customer')
      return
    }
    if (isNewCustomer && !newCustomer.email) {
      setError('Customer email is required')
      return
    }

    setLoading(true)
    try {
      let resolvedCustomerId = customerId

      if (isNewCustomer) {
        const res = await fetch('/api/admin/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCustomer),
        })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Failed to create customer')
          setLoading(false)
          return
        }
        resolvedCustomerId = json.data.id
        setCustomers((prev) =>
          prev.some((c) => c.id === json.data.id) ? prev : [...prev, json.data]
        )
      }

      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: resolvedCustomerId,
          items: validItems,
          shippingFee: Number(shippingFee) || 0,
          discount: Number(discount) || 0,
          notes: notes || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to create order')
        return
      }

      setOrders((prev) => [
        {
          id: json.data.id,
          orderNumber: json.data.orderNumber,
          status: json.data.status,
          total: json.data.total,
          createdAt: json.data.createdAt,
          deletedAt: null,
          user: json.data.user,
          address: null,
          _count: { items: json.data.items.length },
        },
        ...prev,
      ])
      closeForm()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search orders..."
            className="h-9 w-64 rounded-lg border border-slate-200 bg-white pr-4 pl-9 text-sm focus:border-orange-400 focus:outline-none"
          />
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> New Order
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Ship To'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((order) => (
                <tr
                  key={order.id}
                  className={`cursor-pointer hover:bg-slate-50 ${order.deletedAt ? 'opacity-50' : ''}`}
                >
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
                    <div className="flex items-center gap-1.5">
                      <Badge variant={STATUS_COLORS[order.status] ?? 'default'}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                      {order.deletedAt && (
                        <Badge variant="default" size="sm">
                          Deleted
                        </Badge>
                      )}
                    </div>
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                    {query ? 'No orders match your search.' : 'No orders yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageCount={pageCount}
          total={totalFiltered}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">New Order</h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Customer</label>
                  <button
                    type="button"
                    className="text-xs font-medium text-orange-600 hover:underline"
                    onClick={() => setIsNewCustomer((v) => !v)}
                  >
                    {isNewCustomer ? 'Choose existing customer' : '+ New customer'}
                  </button>
                </div>
                {isNewCustomer ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Input
                      placeholder="Name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Email *"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                    <Input
                      placeholder="Phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                ) : (
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name ?? c.email} ({c.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Items</label>
                <div className="space-y-2">
                  {items.map((item, i) => {
                    const product = products.find((p) => p.id === item.productId)
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(i, { productId: e.target.value })}
                          className="block flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        >
                          <option value="">Select product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {formatCurrency(productPrice(p))}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })}
                          className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                        <span className="w-24 shrink-0 text-right text-sm text-slate-500">
                          {product ? formatCurrency(productPrice(product) * item.quantity) : '—'}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItemRow(i)}
                          className="shrink-0 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={addItemRow}
                >
                  <Plus className="h-3.5 w-3.5" /> Add item
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Shipping Fee (₱)"
                  type="number"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                />
                <Input
                  label="Discount (₱)"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="block w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="text-sm font-medium text-slate-600">Total</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Create Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
