'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Category {
  id: string
  name: string
}

export interface ProductFormData {
  name: string
  description: string
  categoryId: string
  basePrice: string
  salePrice: string
  sku: string
  stockQuantity: string
  isFeatured: boolean
  imageUrl: string
  tags: string
}

interface Props {
  initial?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => Promise<void>
  onClose: () => void
  title: string
  submitLabel: string
}

export default function ProductFormModal({
  initial,
  onSubmit,
  onClose,
  title,
  submitLabel,
}: Props) {
  const isEditing = initial?.sku !== undefined
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<ProductFormData>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    categoryId: initial?.categoryId ?? '',
    basePrice: initial?.basePrice ?? '',
    salePrice: initial?.salePrice ?? '',
    sku: initial?.sku ?? '',
    stockQuantity: initial?.stockQuantity ?? '0',
    isFeatured: initial?.isFeatured ?? false,
    imageUrl: initial?.imageUrl ?? '',
    tags: initial?.tags ?? '',
  })

  useEffect(() => {
    fetch('/api/inventory/categories')
      .then((r) => r.json())
      .then((j) => setCategories(j.data ?? []))
  }, [])

  const set =
    (key: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('folder', 'products')
      const res = await fetch('/api/admin/upload', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to upload image')
        return
      }
      setForm((p) => ({ ...p, imageUrl: json.data.url }))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">{title}</h2>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Product Name"
            value={form.name}
            onChange={set('name')}
            required
            placeholder="e.g. Custom Name Keychain"
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Category *</label>
            <select
              value={form.categoryId}
              onChange={set('categoryId')}
              required
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="block w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
              placeholder="Product description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Base Price (₱)"
              type="number"
              min="0"
              step="0.01"
              value={form.basePrice}
              onChange={set('basePrice')}
              required
            />
            <Input
              label="Sale Price (₱)"
              type="number"
              min="0"
              step="0.01"
              value={form.salePrice}
              onChange={set('salePrice')}
              hint="Leave blank for no sale"
            />
          </div>

          <div className={isEditing ? 'grid grid-cols-2 gap-4' : ''}>
            {isEditing && (
              <Input
                label="SKU"
                value={form.sku}
                onChange={set('sku')}
                required
                placeholder="KC-001"
              />
            )}
            <Input
              label="Stock Quantity"
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={set('stockQuantity')}
              hint={!isEditing ? 'SKU will be generated automatically' : undefined}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Image</label>
            <div className="flex items-start gap-3">
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
                />
              )}
              <div className="flex-1 space-y-2">
                <Input
                  value={form.imageUrl}
                  onChange={set('imageUrl')}
                  placeholder="Paste an image URL..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
          <Input
            label="Tags (comma separated)"
            value={form.tags}
            onChange={set('tags')}
            placeholder="keychain, custom, name"
          />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 accent-orange-500"
            />
            Featured product
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
