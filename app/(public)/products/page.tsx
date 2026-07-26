import Link from 'next/link'
import ProductCard from '@/components/products/ProductCard'
import SortSelect from './SortSelect'
import { getActiveCategories, getPublicProducts } from '@/lib/data/products'

export const metadata = { title: 'Products | Kai3D' }

type Props = {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category, sort = 'newest', q } = await searchParams

  const [categories, products] = await Promise.all([
    getActiveCategories(),
    getPublicProducts(category, sort, q),
  ])

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const productList = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    basePrice: Number(p.basePrice),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    imageUrl: p.images[0]?.url,
    category: p.category.name,
    rating:
      p.reviews.length > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0,
    reviewCount: p.reviews.length,
    isNew: now - new Date(p.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
    isFeatured: p.isFeatured,
  }))

  const activeCategory = category ?? 'all'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="mt-1 text-slate-500">Custom 3D printed products, made to order</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/products"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-orange-500 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <SortSelect sort={sort} category={category} q={q} />
          </div>
        </div>

        {/* Results count */}
        <p className="mb-6 text-sm text-slate-500">
          Showing {productList.length} product{productList.length !== 1 ? 's' : ''}
        </p>

        {/* Product grid */}
        {productList.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productList.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-5xl">🔍</p>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No products found</h3>
            <p className="mt-2 text-slate-500">Try a different category or search term.</p>
          </div>
        )}
      </div>
    </div>
  )
}
