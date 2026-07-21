'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X, FilterX } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Pagination from '@/components/ui/Pagination'
import { usePagination } from '@/lib/hooks/usePagination'
import { formatDate } from '@/lib/utils/format'
import ProductionLogForm, {
  type ProductionLogFormData,
} from '@/components/admin/production/ProductionLogForm'
import BulkProductionLogForm, {
  type BulkProductionLogFormData,
} from '@/components/admin/production/BulkProductionLogForm'

interface Filament {
  id: string
  name: string
  color: string
  colorHex: string | null
}

interface ProductionLog {
  id: string
  product: string
  type: string | null
  item: string | null
  quantity: number
  producedAt: string | Date
  producedBy: string | null
  notes: string | null
  filament: Filament | null
}

interface Props {
  initialLogs: ProductionLog[]
  filaments: Filament[]
}

export default function ProductionClient({ initialLogs, filaments }: Props) {
  const router = useRouter()
  const [logs, setLogs] = useState<ProductionLog[]>(initialLogs)
  const [showForm, setShowForm] = useState(false)
  const [editLog, setEditLog] = useState<ProductionLog | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filters
  const [filterProduct, setFilterProduct] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterItem, setFilterItem] = useState('')
  const [filterColor, setFilterColor] = useState('')

  const hasFilters = filterProduct || filterType || filterItem || filterColor

  const clearFilters = () => {
    setFilterProduct('')
    setFilterType('')
    setFilterItem('')
    setFilterColor('')
    resetPage()
  }

  // Distinct option lists derived from current logs
  const products = useMemo(() => [...new Set(logs.map((l) => l.product))].sort(), [logs])
  const types = useMemo(
    () => [...new Set(logs.map((l) => l.type).filter(Boolean) as string[])].sort(),
    [logs]
  )
  const items = useMemo(
    () => [...new Set(logs.map((l) => l.item).filter(Boolean) as string[])].sort(),
    [logs]
  )
  const colors = useMemo(
    () =>
      [
        ...new Map(
          logs.filter((l) => l.filament).map((l) => [l.filament!.id, l.filament!])
        ).values(),
      ].sort((a, b) => a.color.localeCompare(b.color)),
    [logs]
  )

  // Apply all filters
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (filterProduct && l.product !== filterProduct) return false
      if (filterType && (l.type ?? '') !== filterType) return false
      if (filterItem && (l.item ?? '') !== filterItem) return false
      if (filterColor && l.filament?.id !== filterColor) return false
      return true
    })
  }, [logs, filterProduct, filterType, filterItem, filterColor])

  const totalQty = useMemo(() => filtered.reduce((sum, l) => sum + l.quantity, 0), [filtered])

  const {
    page,
    pageCount,
    total: totalFiltered,
    pageSize,
    pageItems,
    setPage,
    resetPage,
  } = usePagination(filtered)

  const handleFilterChange =
    (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value)
      resetPage()
    }

  const handleAdd = async (data: BulkProductionLogFormData) => {
    const entries = data.rows.map((row) => ({
      product: row.product,
      type: row.type || undefined,
      item: row.item || undefined,
      filamentId: row.filamentId || undefined,
      quantity: Number(row.quantity),
      producedAt: data.producedAt || undefined,
      producedBy: data.producedBy || undefined,
      notes: data.notes || undefined,
    }))

    const res = await fetch('/api/production/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to save')

    const newLogs = (
      json.data as Array<{
        id: string
        product: string
        type: string | null
        item: string | null
        quantity: number
        producedAt: string
        producedBy: string | null
        notes: string | null
        filamentId: string | null
      }>
    ).map((entry) => ({
      id: entry.id,
      product: entry.product,
      type: entry.type,
      item: entry.item,
      quantity: entry.quantity,
      producedAt: entry.producedAt,
      producedBy: entry.producedBy,
      notes: entry.notes,
      filament: filaments.find((f) => f.id === entry.filamentId) ?? null,
    }))

    setLogs((prev) => [...newLogs, ...prev])
    setShowForm(false)
    router.refresh()
  }

  const handleEdit = async (data: ProductionLogFormData) => {
    if (!editLog) return
    const res = await fetch(`/api/production/${editLog.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: data.product,
        type: data.type || null,
        item: data.item || null,
        filamentId: data.filamentId || null,
        quantity: Number(data.quantity),
        producedAt: data.producedAt || undefined,
        producedBy: data.producedBy || null,
        notes: data.notes || null,
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to update')

    const filament = filaments.find((f) => f.id === data.filamentId) ?? null

    setLogs((prev) =>
      prev.map((l) =>
        l.id === editLog.id
          ? {
              ...l,
              product: data.product,
              type: data.type || null,
              item: data.item || null,
              quantity: Number(data.quantity),
              producedAt: data.producedAt || l.producedAt,
              producedBy: data.producedBy || null,
              notes: data.notes || null,
              filament,
            }
          : l
      )
    )
    setEditLog(null)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/production/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        alert(json.error ?? 'Failed to delete')
        return
      }
      setLogs((prev) => prev.filter((l) => l.id !== id))
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  const toFormData = (log: ProductionLog): Partial<ProductionLogFormData> => ({
    product: log.product,
    type: log.type ?? '',
    item: log.item ?? '',
    filamentId: log.filament?.id ?? '',
    quantity: String(log.quantity),
    producedAt: new Date(log.producedAt).toISOString().slice(0, 10),
    producedBy: log.producedBy ?? '',
    notes: log.notes ?? '',
  })

  const selectCls =
    'h-9 rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm focus:border-[#6EC30B] focus:outline-none text-slate-700'

  return (
    <>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* Product filter */}
        <select
          value={filterProduct}
          onChange={handleFilterChange(setFilterProduct)}
          className={selectCls}
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={handleFilterChange(setFilterType)}
          className={selectCls}
        >
          <option value="">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Item filter */}
        <select
          value={filterItem}
          onChange={handleFilterChange(setFilterItem)}
          className={selectCls}
        >
          <option value="">All Items</option>
          {items.map((it) => (
            <option key={it} value={it}>
              {it}
            </option>
          ))}
        </select>

        {/* Color filter */}
        <select
          value={filterColor}
          onChange={handleFilterChange(setFilterColor)}
          className={selectCls}
        >
          <option value="">All Colors</option>
          {colors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.color}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 hover:text-red-500"
          >
            <FilterX className="h-3.5 w-3.5" />
            Clear
          </button>
        )}

        <div className="ml-auto">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Log Production
          </Button>
        </div>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {[
                  'Product',
                  'Type',
                  'Item',
                  'Color',
                  'Qty',
                  'Date',
                  'Produced By',
                  'Notes',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{log.product}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{log.type ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{log.item ?? '—'}</td>
                  <td className="px-4 py-3">
                    {log.filament ? (
                      <div className="flex items-center gap-2">
                        {log.filament.colorHex && (
                          <span
                            className="inline-block h-4 w-4 flex-shrink-0 rounded-full border border-slate-200"
                            style={{ backgroundColor: log.filament.colorHex }}
                          />
                        )}
                        <span className="text-sm text-slate-700">{log.filament.color}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{log.quantity}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatDate(String(log.producedAt), {
                      month: 'short',
                      day: 'numeric',
                      year: undefined,
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{log.producedBy ?? '—'}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-sm text-slate-400">
                    {log.notes ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditLog(log)}
                        className="rounded p-1 text-slate-400 hover:text-orange-500"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        disabled={deletingId === log.id}
                        className="rounded p-1 text-slate-400 hover:text-red-500 disabled:opacity-40"
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
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">
                    {hasFilters
                      ? 'No entries match the selected filters.'
                      : 'No production entries yet.'}
                  </td>
                </tr>
              )}
            </tbody>
            {/* Total row */}
            {filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td
                    colSpan={4}
                    className="px-4 py-2.5 text-xs font-medium tracking-wide text-slate-500 uppercase"
                  >
                    {hasFilters ? 'Filtered Total' : 'Total'}
                    {hasFilters && (
                      <span className="ml-1.5 text-slate-400">
                        ({totalFiltered} {totalFiltered === 1 ? 'entry' : 'entries'})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-bold text-slate-900">
                    {totalQty.toLocaleString()}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <Pagination
          page={page}
          pageCount={pageCount}
          total={totalFiltered}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </Card>

      {/* Add Modal (Bulk) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Log Production</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <BulkProductionLogForm
              filaments={filaments}
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Edit Entry</h2>
              <button
                onClick={() => setEditLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ProductionLogForm
              filaments={filaments}
              initialData={toFormData(editLog)}
              onSubmit={handleEdit}
              onCancel={() => setEditLog(null)}
              submitLabel="Update Entry"
            />
          </div>
        </div>
      )}
    </>
  )
}
