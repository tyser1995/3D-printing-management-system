'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  sortOrder: number
  isActive: boolean
  _count: { products: number }
}

interface Props {
  initialCategories: Category[]
}

interface CategoryForm {
  name: string
  description: string
  sortOrder: string
}

const defaultForm: CategoryForm = { name: '', description: '', sortOrder: '0' }

export default function CategoriesManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set =
    (k: keyof CategoryForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  const refresh = async () => {
    const res = await fetch('/api/admin/categories')
    const json = await res.json()
    if (json.data) setCategories(json.data)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditTarget(null)
    setError(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          sortOrder: Number(form.sortOrder) || 0,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        closeForm()
        setForm(defaultForm)
        await refresh()
      } else {
        setError(json.error ?? 'Failed to create category')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/categories/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          sortOrder: Number(form.sortOrder) || 0,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        closeForm()
        await refresh()
      } else {
        setError(json.error ?? 'Failed to update category')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`Delete category "${category.name}"?`)) return
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' })
    if (res.ok) {
      setCategories((p) => p.filter((c) => c.id !== category.id))
    } else {
      const json = await res.json().catch(() => ({}))
      alert(json.error ?? 'Failed to delete category')
    }
  }

  const openEdit = (c: Category) => {
    setEditTarget(c)
    setError(null)
    setForm({ name: c.name, description: c.description ?? '', sortOrder: String(c.sortOrder) })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Categories</CardTitle>
        <Button
          size="sm"
          onClick={() => {
            setShowForm(true)
            setForm(defaultForm)
            setError(null)
          }}
        >
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </CardHeader>

      <div className="space-y-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-slate-900">{c.name}</p>
                {!c.isActive && (
                  <Badge variant="default" size="sm">
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="truncate text-xs text-slate-400">
                {c.slug} · {c._count.products} product{c._count.products === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:bg-red-50"
                onClick={() => handleDelete(c)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">No categories yet.</p>
        )}
      </div>

      {(showForm || editTarget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editTarget ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={editTarget ? handleEdit : handleCreate} className="space-y-4">
              <Input
                label="Category Name"
                value={form.name}
                onChange={set('name')}
                required
                placeholder="e.g. Anime Figurines"
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  rows={2}
                  className="block w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#6EC30B] focus:outline-none"
                  placeholder="Optional description..."
                />
              </div>
              <Input
                label="Sort Order"
                type="number"
                value={form.sortOrder}
                onChange={set('sortOrder')}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  {editTarget ? 'Save Changes' : 'Add Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  )
}
