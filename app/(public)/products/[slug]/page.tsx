import Link from 'next/link'
import Image from 'next/image'
import { Star, Package, Truck, Shield } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { prisma } from '@/lib/prisma/client'
import { formatCurrency } from '@/lib/utils/format'
import { notFound } from 'next/navigation'
import AddToCartButton from './AddToCartButton'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const product = await prisma.product.findUnique({ where: { slug }, select: { name: true } })
  return { title: product ? `${product.name} | Kai3D` : 'Product Not Found' }
}

const GUARANTEE_ITEMS = [
  { icon: Package, text: 'Carefully packed to prevent damage' },
  { icon: Truck, text: 'Shipped within 1–2 business days' },
  { icon: Shield, text: 'Quality guaranteed or we reprint' },
]

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      reviews: {
        select: {
          rating: true,
          title: true,
          body: true,
          user: { select: { name: true } },
          createdAt: true,
        },
        where: { isApproved: true },
      },
      costConfig: { select: { profitMargin: true } },
    },
  })

  if (!product) notFound()

  const displayPrice = product.salePrice ? Number(product.salePrice) : Number(product.basePrice)
  const basePrice = Number(product.basePrice)
  const hasDiscount = !!product.salePrice && Number(product.salePrice) < basePrice
  const isInStock = product.stockQuantity > 0
  const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0]
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-orange-500">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-orange-500">
            Products
          </Link>
          <span>/</span>
          <Link
            href={`/products?category=${product.category.slug}`}
            className="hover:text-orange-500"
          >
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-slate-900">{product.name}</span>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Images */}
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.altText ?? product.name}
                  width={600}
                  height={600}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-8xl text-slate-300">
                  🖨️
                </div>
              )}
            </div>
            {/* Thumbnail strip */}
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {product.images.map((img) => (
                  <div
                    key={img.id}
                    className="h-16 w-16 overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100"
                  >
                    <Image
                      src={img.url}
                      alt={img.altText ?? ''}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <Badge variant="primary">{product.category.name}</Badge>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{product.name}</h1>

            {/* Rating */}
            {product.reviews.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-700">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-slate-400">({product.reviews.length} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-bold text-slate-900">
                {formatCurrency(displayPrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-slate-400 line-through">
                    {formatCurrency(basePrice)}
                  </span>
                  <Badge variant="danger">
                    -{Math.round(((basePrice - displayPrice) / basePrice) * 100)}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="mt-3">
              {isInStock ? (
                <span className="text-sm font-medium text-green-600">
                  ✓ In stock ({product.stockQuantity} available)
                </span>
              ) : (
                <span className="text-sm font-medium text-red-500">Out of stock</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="mt-6 leading-relaxed text-slate-600">{product.description}</p>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.tags
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
            )}

            {/* Add to Cart */}
            <div className="mt-8">
              <AddToCartButton
                productId={product.id}
                name={product.name}
                price={displayPrice}
                imageUrl={primaryImage?.url}
                inStock={isInStock}
              />
            </div>

            <p className="mt-4 text-xs text-slate-400">SKU: {product.sku}</p>

            {/* Guarantees */}
            <div className="mt-8 rounded-xl border border-slate-200 p-5">
              <div className="flex flex-col gap-3">
                {GUARANTEE_ITEMS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-slate-600">
                    <Icon className="h-4 w-4 text-orange-500" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {product.reviews.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">Customer Reviews</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {product.reviews.map((review, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{review.user.name ?? 'Customer'}</span>
                  </div>
                  {review.title && <p className="font-medium text-slate-900">{review.title}</p>}
                  {review.body && <p className="mt-1 text-sm text-slate-600">{review.body}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
