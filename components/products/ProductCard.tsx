import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Heart, Star } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils/format'

export interface ProductCardProps {
  id: string
  slug: string
  name: string
  basePrice: number
  salePrice?: number | null
  imageUrl?: string
  rating?: number
  reviewCount?: number
  isNew?: boolean
  isFeatured?: boolean
  category?: string
}

export default function ProductCard({
  slug,
  name,
  basePrice,
  salePrice,
  imageUrl,
  rating = 0,
  reviewCount = 0,
  isNew = false,
  isFeatured = false,
  category,
}: ProductCardProps) {
  const displayPrice = salePrice ?? basePrice
  const hasDiscount = !!salePrice && salePrice < basePrice

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {isNew && <Badge variant="primary">New</Badge>}
        {isFeatured && <Badge variant="success">Featured</Badge>}
        {hasDiscount && (
          <Badge variant="danger">
            -{Math.round(((basePrice - displayPrice) / basePrice) * 100)}%
          </Badge>
        )}
      </div>

      {/* Wishlist */}
      <button className="absolute top-3 right-3 z-10 rounded-full border border-slate-200 bg-white p-2 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-orange-500">
        <Heart className="h-4 w-4" />
      </button>

      {/* Image */}
      <Link href={`/products/${slug}`} className="block overflow-hidden rounded-t-2xl">
        <div className="relative aspect-square bg-slate-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl text-slate-300">
              🖨️
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {category && (
          <p className="mb-1 text-xs font-medium tracking-wider text-orange-500 uppercase">
            {category}
          </p>
        )}
        <Link href={`/products/${slug}`}>
          <h3 className="line-clamp-2 font-semibold text-slate-900 hover:text-orange-600">
            {name}
          </h3>
        </Link>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-slate-700">{rating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({reviewCount})</span>
          </div>
        )}

        {/* Price + Cart */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div>
            <span className="text-lg font-bold text-slate-900">{formatCurrency(displayPrice)}</span>
            {hasDiscount && (
              <span className="ml-1.5 text-sm text-slate-400 line-through">
                {formatCurrency(basePrice)}
              </span>
            )}
          </div>
          <button className="rounded-lg bg-orange-500 p-2 text-white transition-colors hover:bg-orange-600">
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
