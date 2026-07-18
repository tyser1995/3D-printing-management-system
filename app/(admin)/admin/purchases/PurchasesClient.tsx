'use client'

import { useState } from 'react'
import { Plus, Search, Check, X, Trash2, Edit2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { usePagination } from '@/lib/hooks/usePagination'

const CATEGORY_SUGGESTIONS = [
  'Keychain Materials',
  'Switches',
  'Filament',
  'Packaging',
  'Tools',
  'Other',
]

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger'> = {
  ORDERED: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'danger',
}

interface Supplier {
  id: string
  name: string
}

interface Purchase {
  id: string
  itemName: string
  category: string
  quantity: number
  unit: string
  unitCost: number
  totalCost: number
  status: string
  orderedAt: string | Date
  receivedAt: string | Date | null
  notes: string | null
  supplier: Supplier | null
}

interface Props {
  initialPurchases: Purchase[]
  suppliers: Supplier[]
}

interface PurchaseForm {
  itemName: string
  category: string
  supplierId: string
  quantity: string
  unit: string
  unitCost: string
  notes: string
}

const defaultForm: PurchaseForm = {
  itemName: '',
  category: '',
  supplierId: '',
  quantity: '1',
  unit: 'pcs',
  unitCost: '',
  notes: '',
}

// API responses carry unitCost/totalCost as strings (Prisma serializes Decimal
// fields to strings over JSON), while the initial server-rendered page converts
// them to numbers. Normalize on every merge so number math (e.g. totalSpend)
// doesn't silently fall back to string concatenation.
function normalizePurchase(p: Purchase): Purchase {
  return { ...p, unitCost: Number(p.unitCost), totalCost: Number(p.totalCost) }
}

function PurchaseRowFields({
  form,
  onChange,
  suppliers,
}: {
  form: PurchaseForm
  onChange: (patch: Partial<PurchaseForm>) => void
  suppliers: Supplier[]
}) {
  const setField =
    (key: keyof PurchaseForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange({ [key]: e.target.value })

  return (
    <>
      <Input
        label="Item Name"
        value={form.itemName}
        onChange={setField('itemName')}
        required
        placeholder="e.g. Keychain rings 20mm"
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Category *</label>
        <input
          list="purchase-categories"
          value={form.category}
          onChange={setField('category')}
          required
          placeholder="e.g. Keychain Materials, Switches, Filament..."
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Supplier</label>
        <select
          value={form.supplierId}
          onChange={setField('supplierId')}
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
        >
          <option value="">No supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Quantity"
          type="number"
          min="0"
          step="any"
          value={form.quantity}
          onChange={setField('quantity')}
        />
        <Input label="Unit" value={form.unit} onChange={setField('unit')} placeholder="pcs" />
        <Input
          label="Unit Cost (₱)"
          type="number"
          min="0"
          step="0.01"
          value={form.unitCost}
          onChange={setField('unitCost')}
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          value={form.notes}
          onChange={setField('notes')}
          rows={2}
          className="block w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
          placeholder="Optional notes..."
        />
      </div>
    </>
  )
}

export default function PurchasesClient({ initialPurchases, suppliers }: Props) {
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Purchase | null>(null)
  const [form, setForm] = useState<PurchaseForm>(defaultForm)
  const [rows, setRows] = useState<PurchaseForm[]>([defaultForm])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const categories = Array.from(new Set(purchases.map((p) => p.category))).sort()

  const filtered = purchases.filter((p) => {
    const q = query.toLowerCase()
    const matchesQuery =
      p.itemName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.supplier?.name ?? '').toLowerCase().includes(q)
    const matchesStatus = !statusFilter || p.status === statusFilter
    const matchesCategory = !categoryFilter || p.category === categoryFilter
    return matchesQuery && matchesStatus && matchesCategory
  })
  const { page, pageCount, total, pageSize, pageItems, setPage, resetPage } =
    usePagination(filtered)

  const handleQueryChange = (value: string) => {
    setQuery(value)
    resetPage()
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    resetPage()
  }

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value)
    resetPage()
  }

  const updateRow = (index: number, patch: Partial<PurchaseForm>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }
  const addRow = () => setRows((prev) => [...prev, defaultForm])
  const removeRow = (index: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))

  const closeForm = () => {
    setShowForm(false)
    setEditTarget(null)
    setForm(defaultForm)
    setRows([defaultForm])
    setError(null)
  }

  const openEdit = (p: Purchase) => {
    setEditTarget(p)
    setError(null)
    setForm({
      itemName: p.itemName,
      category: p.category,
      supplierId: p.supplier?.id ?? '',
      quantity: String(p.quantity),
      unit: p.unit,
      unitCost: String(p.unitCost),
      notes: p.notes ?? '',
    })
  }

  const rowTotal = (r: PurchaseForm) => (Number(r.quantity) || 0) * (Number(r.unitCost) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (editTarget) {
      if (!form.itemName || !form.category || !form.unitCost) {
        setError('Item, category, and unit cost are required')
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/purchases/${editTarget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemName: form.itemName,
            category: form.category,
            supplierId: form.supplierId || null,
            quantity: Number(form.quantity) || 1,
            unit: form.unit,
            unitCost: Number(form.unitCost),
            notes: form.notes || null,
          }),
        })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Failed to save purchase')
          return
        }
        const saved = normalizePurchase(json.data)
        setPurchases((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
        closeForm()
      } finally {
        setLoading(false)
      }
      return
    }

    const validRows = rows.filter((r) => r.itemName && r.category && r.unitCost)
    if (validRows.length === 0) {
      setError('Add at least one item with a name, category, and unit cost')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchases: validRows.map((r) => ({
            itemName: r.itemName,
            category: r.category,
            supplierId: r.supplierId || null,
            quantity: Number(r.quantity) || 1,
            unit: r.unit,
            unitCost: Number(r.unitCost),
            notes: r.notes || null,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to save purchases')
        return
      }
      const saved = (json.data as Purchase[]).map(normalizePurchase)
      setPurchases((prev) => [...saved, ...prev])
      closeForm()
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/purchases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const json = await res.json()
    if (res.ok) {
      const updated = normalizePurchase(json.data)
      setPurchases((prev) => prev.map((p) => (p.id === id ? updated : p)))
    }
  }

  const deletePurchase = async (id: string, itemName: string) => {
    if (!confirm(`Delete purchase "${itemName}"?`)) return
    const res = await fetch(`/api/admin/purchases/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPurchases((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const pageIds = pageItems.map((p) => p.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) pageIds.forEach((id) => next.delete(id))
      else pageIds.forEach((id) => next.add(id))
      return next
    })
  }

  const bulkMarkStatus = async (status: string) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBulkLoading(true)
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/purchases/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          }).then((res) => res.json().then((json) => ({ ok: res.ok, json })))
        )
      )
      setPurchases((prev) => {
        const updates = new Map(
          results.filter((r) => r.ok).map((r) => [r.json.data.id, normalizePurchase(r.json.data)])
        )
        return prev.map((p) => updates.get(p.id) ?? p)
      })
      setSelectedIds(new Set())
    } finally {
      setBulkLoading(false)
    }
  }

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    if (!confirm(`Delete ${ids.length} selected purchase${ids.length !== 1 ? 's' : ''}?`)) return
    setBulkLoading(true)
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/purchases/${id}`, { method: 'DELETE' }).then((res) => ({
            id,
            ok: res.ok,
          }))
        )
      )
      const deletedIds = new Set(results.filter((r) => r.ok).map((r) => r.id))
      setPurchases((prev) => prev.filter((p) => !deletedIds.has(p.id)))
      setSelectedIds(new Set())
    } finally {
      setBulkLoading(false)
    }
  }

  const totalSpend = purchases
    .filter((p) => p.status !== 'CANCELLED')
    .reduce((sum, p) => sum + p.totalCost, 0)
  const pendingCount = purchases.filter((p) => p.status === 'ORDERED').length

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">{purchases.length}</p>
          <p className="text-sm text-slate-500">Total Purchases</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
          <p className="text-sm text-slate-500">Awaiting Delivery</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpend)}</p>
          <p className="text-sm text-slate-500">Total Spend</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search purchases..."
              className="h-9 w-64 rounded-lg border border-slate-200 bg-white pr-4 pl-9 text-sm focus:border-orange-400 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-orange-400 focus:outline-none"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="ORDERED">Ordered</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-orange-400 focus:outline-none"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Button
          onClick={() => {
            setRows([defaultForm])
            setShowForm(true)
          }}
        >
          <Plus className="h-4 w-4" /> Add Purchase
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-700">{selectedIds.size} selected</span>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkLoading}
            onClick={() => bulkMarkStatus('RECEIVED')}
          >
            <Check className="h-3.5 w-3.5" /> Mark Received
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkLoading}
            onClick={() => bulkMarkStatus('CANCELLED')}
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button size="sm" variant="danger" disabled={bulkLoading} onClick={bulkDelete}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-sm text-slate-500 hover:text-slate-700"
          >
            Clear selection
          </button>
        </div>
      )}

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="w-10 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAllOnPage}
                    className="h-4 w-4 rounded border-slate-300"
                    aria-label="Select all on page"
                  />
                </th>
                {[
                  'Item',
                  'Category',
                  'Supplier',
                  'Qty',
                  'Unit Cost',
                  'Total',
                  'Status',
                  'Date',
                  'Actions',
                ].map((h) => (
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
              {pageItems.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="h-4 w-4 rounded border-slate-300"
                      aria-label={`Select ${p.itemName}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{p.itemName}</p>
                    {p.notes && (
                      <p className="max-w-xs truncate text-xs text-slate-400">{p.notes}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.supplier?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {p.quantity} {p.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatCurrency(p.unitCost)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {formatCurrency(p.totalCost)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={STATUS_COLORS[p.status] ?? 'default'}>{p.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDate(String(p.orderedAt), {
                      month: 'short',
                      day: 'numeric',
                      year: undefined,
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {p.status === 'ORDERED' && (
                        <>
                          <button
                            onClick={() => updateStatus(p.id, 'RECEIVED')}
                            className="rounded p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600"
                            title="Mark received"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(p.id, 'CANCELLED')}
                            className="rounded p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deletePurchase(p.id, p.itemName)}
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
                  <td colSpan={10} className="px-6 py-12 text-center text-sm text-slate-400">
                    {query || statusFilter || categoryFilter
                      ? 'No purchases match your filters.'
                      : 'No purchases logged yet.'}
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

      <datalist id="purchase-categories">
        {CATEGORY_SUGGESTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {(showForm || editTarget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ${editTarget ? 'max-w-lg' : 'max-w-2xl'}`}
          >
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              {editTarget ? 'Edit Purchase' : 'Add Purchase'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {editTarget ? (
                <PurchaseRowFields
                  form={form}
                  onChange={(patch) => setForm((p) => ({ ...p, ...patch }))}
                  suppliers={suppliers}
                />
              ) : (
                <div className="space-y-3">
                  {rows.map((row, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Item {i + 1}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-500">
                            {formatCurrency(rowTotal(row))}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeRow(i)}
                            disabled={rows.length === 1}
                            className="text-slate-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <PurchaseRowFields
                          form={row}
                          onChange={(patch) => updateRow(i, patch)}
                          suppliers={suppliers}
                        />
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={addRow}>
                    <Plus className="h-3.5 w-3.5" /> Add another item
                  </Button>
                  <div className="flex justify-end border-t border-slate-100 pt-3 text-sm font-semibold text-slate-900">
                    Total: {formatCurrency(rows.reduce((sum, r) => sum + rowTotal(r), 0))}
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  {editTarget ? 'Save Changes' : 'Add Purchase'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
