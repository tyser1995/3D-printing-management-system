'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit2, Trash2, Eye, Calculator } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import ProductFormModal, {
  type ProductFormData,
} from '@/components/admin/products/ProductFormModal'
import { formatCurrency } from '@/lib/utils/format'
import { usePagination } from '@/lib/hooks/usePagination'

interface Category {
  id: string
  name: string
}
interface ProductImage {
  url: string
  isPrimary: boolean
}
interface Product {
  id: string
  name: string
  slug: string
  sku: string
  basePrice: string | number
  salePrice: string | number | null
  stockQuantity: number
  isActive: boolean
  isFeatured: boolean
  description: string | null
  tags: string | null
  category: Category
  images: ProductImage[]
  _count: { orderItems: number; reviews: number }
}

interface Props {
  initialProducts: Product[]
}

export default function ProductsClient({ initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  )
  const { page, pageCount, total, pageSize, pageItems, setPage, resetPage } =
    usePagination(filtered)

  const handleQueryChange = (value: string) => {
    setQuery(value)
    resetPage()
  }

  const refresh = async () => {
    const res = await fetch('/api/admin/products')
    const json = await res.json()
    if (json.data) setProducts(json.data)
  }

  const handleCreate = async (data: ProductFormData) => {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        tags: data.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed')
    setShowAdd(false)
    await refresh()
  }

  const handleEdit = async (data: ProductFormData) => {
    if (!editTarget) return
    const res = await fetch(`/api/admin/products/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        tags: data.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed')
    setEditTarget(null)
    await refresh()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"?`)) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    setProducts((p) => p.filter((x) => x.id !== id))
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search products..."
            className="h-9 w-64 rounded-lg border border-slate-200 bg-white pr-4 pl-9 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
          />
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['SKU', 'Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
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
              {pageItems.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{product.sku}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                        {product.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">🖨️</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{product.name}</p>
                        {product.isFeatured && (
                          <span className="text-xs text-orange-500">Featured</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{product.category.name}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {formatCurrency(Number(product.basePrice))}
                    </p>
                    {product.salePrice && (
                      <p className="text-xs text-green-600">
                        Sale: {formatCurrency(Number(product.salePrice))}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={
                        product.stockQuantity === 0
                          ? 'text-red-500'
                          : product.stockQuantity < 10
                            ? 'text-amber-500'
                            : 'text-slate-700'
                      }
                    >
                      {product.stockQuantity} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={product.isActive ? 'success' : 'danger'}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/products/${product.slug}`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}/cost`}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Cost Calculator"
                      >
                        <Calculator className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setEditTarget(product)}
                        className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                    {query ? 'No products match your search.' : 'No products yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </Card>

      {showAdd && (
        <ProductFormModal
          title="Add Product"
          submitLabel="Create Product"
          onSubmit={handleCreate}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editTarget && (
        <ProductFormModal
          title="Edit Product"
          submitLabel="Save Changes"
          initial={{
            name: editTarget.name,
            description: editTarget.description ?? '',
            categoryId: editTarget.category.id,
            basePrice: String(Number(editTarget.basePrice)),
            salePrice: editTarget.salePrice ? String(Number(editTarget.salePrice)) : '',
            sku: editTarget.sku,
            stockQuantity: String(editTarget.stockQuantity),
            isFeatured: editTarget.isFeatured,
            imageUrl: editTarget.images[0]?.url ?? '',
            tags: editTarget.tags ?? '',
          }}
          onSubmit={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  )
}
