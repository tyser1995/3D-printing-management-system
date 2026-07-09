'use client'

import { useState } from 'react'
import { ShoppingCart, Heart, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useCartStore } from '@/stores/cart.store'

interface Props {
  productId: string
  name: string
  price: number
  imageUrl?: string
  inStock: boolean
}

export default function AddToCartButton({ productId, name, price, imageUrl, inStock }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    addItem({ productId, name, price, imageUrl, quantity: 1 })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex gap-3">
      <Button size="lg" className="flex-1" disabled={!inStock} onClick={handleAddToCart}>
        {added ? (
          <>
            <Check className="h-5 w-5" /> Added!
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            {inStock ? 'Add to Cart' : 'Out of Stock'}
          </>
        )}
      </Button>
      <Button variant="outline" size="lg" title="Add to Wishlist">
        <Heart className="h-5 w-5" />
      </Button>
    </div>
  )
}
