'use client'

import Link from 'next/link'
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/format'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <ShoppingBag className="h-16 w-16 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-900">Your cart is empty</h2>
        <p className="text-slate-500">Browse our products and add something you like.</p>
        <Link href="/products">
          <Button>
            Browse Products
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Shopping Cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {items.map((item) => (
            <Card key={item.productId} className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-3xl">
                🖨️
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-500">{formatCurrency(item.price)} each</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="mt-2 text-slate-400 transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-24">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{formatCurrency(total())}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 font-bold text-slate-900">
                <span>Total</span>
                <span>{formatCurrency(total())}</span>
              </div>
            </div>
            <Link href="/checkout" className="mt-6 block">
              <Button fullWidth size="lg">
                Proceed to Checkout
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/products" className="mt-3 block">
              <Button variant="ghost" fullWidth>
                Continue Shopping
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
