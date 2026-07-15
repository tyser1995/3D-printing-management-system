'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils/format'
import { calculateOrderElectricityFee } from '@/lib/utils/cost'

interface Product {
  id: string
  name: string
  basePrice: number
  salePrice: number | null
  sku: string
}

interface OrderItem {
  productId: string
  quantity: number
}

interface Props {
  orderId: string
  initialItems: OrderItem[]
  initialShippingFee: number
  initialDiscount: number
  initialNotes: string
  initialTrackingNumber: string
  products: Product[]
  onClose: () => void
  onSaved: (order: unknown) => void
}

export default function EditOrderModal({
  orderId,
  initialItems,
  initialShippingFee,
  initialDiscount,
  initialNotes,
  initialTrackingNumber,
  products,
  onClose,
  onSaved,
}: Props) {
  const [items, setItems] = useState<OrderItem[]>(
    initialItems.length > 0 ? initialItems : [{ productId: '', quantity: 1 }]
  )
  const [shippingFee, setShippingFee] = useState(String(initialShippingFee))
  const [discount, setDiscount] = useState(String(initialDiscount))
  const [notes, setNotes] = useState(initialNotes)
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  const electricityFee = calculateOrderElectricityFee(
    items.reduce((sum, item) => sum + (item.quantity || 0), 0)
  )
  const total = Math.max(
    0,
    subtotal + (Number(shippingFee) || 0) - electricityFee - (Number(discount) || 0)
  )

  const updateItem = (index: number, patch: Partial<OrderItem>) => {
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

    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: validItems,
          shippingFee: Number(shippingFee) || 0,
          discount: Number(discount) || 0,
          notes,
          trackingNumber,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to save order')
        return
      }
      onSaved(json.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Edit Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={addItemRow}>
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

          <Input
            label="Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Optional"
          />

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

          <div className="flex items-center justify-between px-1 text-sm text-green-600">
            <span>
              Electricity Fund (₱10 × {items.reduce((sum, i) => sum + (i.quantity || 0), 0)} units)
            </span>
            <span>−{formatCurrency(electricityFee)}</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">Total</span>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
