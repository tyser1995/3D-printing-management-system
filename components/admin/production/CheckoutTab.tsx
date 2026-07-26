'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Pagination from '@/components/ui/Pagination'
import { usePagination } from '@/lib/hooks/usePagination'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import CheckoutForm, {
  type AvailableStockOption,
  type CheckoutFormData,
} from '@/components/admin/production/CheckoutForm'
import BulkCheckoutForm, {
  type BulkCheckoutFormData,
} from '@/components/admin/production/BulkCheckoutForm'

interface Filament {
  id: string
  name: string
  color: string
  colorHex: string | null
}

export interface CheckoutEntry {
  id: string
  product: string
  type: string | null
  item: string | null
  quantity: number
  unitPrice: number | string
  totalAmount: number | string
  checkedOutAt: string | Date
  checkedOutBy: string | null
  notes: string | null
  filament: Filament | null
}

interface Props {
  initialCheckouts: CheckoutEntry[]
  availableStock: AvailableStockOption[]
}

export default function CheckoutTab({ initialCheckouts, availableStock }: Props) {
  const router = useRouter()
  const [checkouts, setCheckouts] = useState<CheckoutEntry[]>(initialCheckouts)
  const [showForm, setShowForm] = useState(false)
  const [editEntry, setEditEntry] = useState<CheckoutEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalQty = useMemo(() => checkouts.reduce((sum, c) => sum + c.quantity, 0), [checkouts])
  const totalAmount = useMemo(
    () => checkouts.reduce((sum, c) => sum + Number(c.totalAmount), 0),
    [checkouts]
  )

  const { page, pageCount, total, pageSize, pageItems, setPage } = usePagination(checkouts)

  const handleAdd = async (data: BulkCheckoutFormData) => {
    const entries = data.rows.map((row) => ({
      product: row.product,
      type: row.type || undefined,
      item: row.item || undefined,
      filamentId: row.filamentId || undefined,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice) || 0,
    }))

    const res = await fetch('/api/production/checkout/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entries,
        checkedOutAt: data.checkedOutAt || undefined,
        checkedOutBy: data.checkedOutBy || undefined,
        notes: data.notes || undefined,
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to save')

    setCheckouts((prev) => [...(json.data as CheckoutEntry[]), ...prev])
    setShowForm(false)
    router.refresh()
  }

  const handleEdit = async (data: CheckoutFormData) => {
    if (!editEntry) return
    const res = await fetch(`/api/production/checkout/${editEntry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: Number(data.quantity),
        unitPrice: Number(data.unitPrice) || 0,
        checkedOutAt: data.checkedOutAt || undefined,
        checkedOutBy: data.checkedOutBy || null,
        notes: data.notes || null,
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to update')

    setCheckouts((prev) => prev.map((c) => (c.id === editEntry.id ? json.data : c)))
    setEditEntry(null)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/production/checkout/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        alert(json.error ?? 'Failed to delete')
        return
      }
      setCheckouts((prev) => prev.filter((c) => c.id !== id))
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  const toFormData = (entry: CheckoutEntry): Partial<CheckoutFormData> => ({
    product: entry.product,
    type: entry.type ?? '',
    item: entry.item ?? '',
    filamentId: entry.filament?.id ?? '',
    quantity: String(entry.quantity),
    unitPrice: String(entry.unitPrice),
    checkedOutAt: new Date(entry.checkedOutAt).toISOString().slice(0, 10),
    checkedOutBy: entry.checkedOutBy ?? '',
    notes: entry.notes ?? '',
  })

  const editMaxQty = useMemo(() => {
    if (!editEntry) return undefined
    const match = availableStock.find(
      (o) =>
        o.product === editEntry.product &&
        (o.type ?? '') === (editEntry.type ?? '') &&
        (o.item ?? '') === (editEntry.item ?? '') &&
        (o.filamentId ?? '') === (editEntry.filament?.id ?? '')
    )
    return (match?.availableQty ?? 0) + editEntry.quantity
  }, [editEntry, availableStock])

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Checkout
        </Button>
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
                  'Unit Price',
                  'Total',
                  'Date',
                  'Checked Out By',
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
              {pageItems.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{entry.product}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{entry.type ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{entry.item ?? '—'}</td>
                  <td className="px-4 py-3">
                    {entry.filament ? (
                      <div className="flex items-center gap-2">
                        {entry.filament.colorHex && (
                          <span
                            className="inline-block h-4 w-4 flex-shrink-0 rounded-full border border-slate-200"
                            style={{ backgroundColor: entry.filament.colorHex }}
                          />
                        )}
                        <span className="text-sm text-slate-700">{entry.filament.color}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    {entry.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatCurrency(entry.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {formatCurrency(entry.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatDate(String(entry.checkedOutAt), {
                      month: 'short',
                      day: 'numeric',
                      year: undefined,
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{entry.checkedOutBy ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditEntry(entry)}
                        className="rounded p-1 text-slate-400 hover:text-orange-500"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="rounded p-1 text-slate-400 hover:text-red-500 disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {checkouts.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-sm text-slate-400">
                    No checkout entries yet.
                  </td>
                </tr>
              )}
            </tbody>
            {checkouts.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td
                    colSpan={4}
                    className="px-4 py-2.5 text-xs font-medium tracking-wide text-slate-500 uppercase"
                  >
                    Total
                  </td>
                  <td className="px-4 py-2.5 text-sm font-bold text-slate-900">
                    {totalQty.toLocaleString()}
                  </td>
                  <td />
                  <td className="px-4 py-2.5 text-sm font-bold text-slate-900">
                    {formatCurrency(totalAmount)}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
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

      {/* Add Modal (Bulk) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Checkout Products</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <BulkCheckoutForm
              availableStock={availableStock}
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Edit Checkout</h2>
              <button
                onClick={() => setEditEntry(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CheckoutForm
              availableStock={availableStock}
              initialData={toFormData(editEntry)}
              lockProduct
              maxQty={editMaxQty}
              onSubmit={handleEdit}
              onCancel={() => setEditEntry(null)}
              submitLabel="Update Entry"
            />
          </div>
        </div>
      )}
    </>
  )
}
