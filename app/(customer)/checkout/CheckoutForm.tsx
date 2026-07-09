'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, MapPin, CheckCircle2 } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils/format'

const SHIPPING_FEE = 100

export default function CheckoutForm() {
  const router = useRouter()
  const { items, total, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<string | null>(null)

  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    province: '',
    postalCode: '',
  })

  const [notes, setNotes] = useState('')

  const subtotal = total()
  const orderTotal = subtotal + SHIPPING_FEE

  const set = (key: keyof typeof address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          notes,
          shippingFee: SHIPPING_FEE,
          // In production you'd create/find the address first; simplified here
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to place order')

      clearCart()
      setSuccess(json.data.orderNumber)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Order Placed!</h1>
          <p className="text-slate-500">
            Your order <span className="font-mono font-semibold text-orange-600">{success}</span>{' '}
            has been received. We&apos;ll start printing soon!
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/products')}>
              Continue Shopping
            </Button>
            <Button onClick={() => router.push('/account/orders')}>View Orders</Button>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h1 className="mb-2 text-xl font-semibold text-slate-900">Your cart is empty</h1>
          <Button onClick={() => router.push('/products')}>Browse Products</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Checkout</h1>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-5">
        {/* Address */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-semibold text-slate-900">Delivery Address</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={address.firstName}
                  onChange={set('firstName')}
                  required
                />
                <Input
                  label="Last Name"
                  value={address.lastName}
                  onChange={set('lastName')}
                  required
                />
              </div>
              <Input
                label="Street Address"
                value={address.street}
                onChange={set('street')}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City / Municipality"
                  value={address.city}
                  onChange={set('city')}
                  required
                />
                <Input
                  label="Province"
                  value={address.province}
                  onChange={set('province')}
                  required
                />
              </div>
              <Input
                label="Postal Code"
                value={address.postalCode}
                onChange={set('postalCode')}
                required
              />
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Notes (optional)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Special instructions for your order..."
              className="block w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
              <ShoppingBag className="h-5 w-5 text-orange-500" />
              Order Summary
            </h2>

            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="ml-4 text-sm font-medium text-slate-900">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{formatCurrency(SHIPPING_FEE)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(orderTotal)}</span>
              </div>
            </div>

            <Button type="submit" fullWidth className="mt-6" loading={loading}>
              Place Order
            </Button>
            <p className="mt-3 text-center text-xs text-slate-400">
              Payment on delivery · Cash or GCash accepted
            </p>
          </Card>
        </div>
      </form>
    </div>
  )
}
