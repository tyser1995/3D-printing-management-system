'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils/format'
import type { AvailableStockOption } from '@/components/admin/production/CheckoutForm'

export interface BulkCheckoutRow {
  product: string
  type: string
  item: string
  filamentId: string
  quantity: string
  unitPrice: string
}

export interface BulkCheckoutFormData {
  rows: BulkCheckoutRow[]
  checkedOutAt: string
  checkedOutBy: string
  notes: string
}

interface Props {
  availableStock: AvailableStockOption[]
  onSubmit: (data: BulkCheckoutFormData) => Promise<void>
  onCancel: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyRow = (): BulkCheckoutRow => ({
  product: '',
  type: '',
  item: '',
  filamentId: '',
  quantity: '1',
  unitPrice: '0',
})

const optionKey = (o: {
  product: string
  type: string | null
  item: string | null
  filamentId: string | null
}) => `${o.product}|${o.type ?? ''}|${o.item ?? ''}|${o.filamentId ?? ''}`

const rowKey = (r: BulkCheckoutRow) =>
  r.product
    ? optionKey({
        product: r.product,
        type: r.type || null,
        item: r.item || null,
        filamentId: r.filamentId || null,
      })
    : ''

export default function BulkCheckoutForm({ availableStock, onSubmit, onCancel }: Props) {
  const [rows, setRows] = useState<BulkCheckoutRow[]>([emptyRow()])
  const [checkedOutAt, setCheckedOutAt] = useState(today())
  const [checkedOutBy, setCheckedOutBy] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableByKey = useMemo(
    () => new Map(availableStock.map((o) => [optionKey(o), o.availableQty])),
    [availableStock]
  )

  // Remaining stock per combo after accounting for what other rows already claim.
  const remainingFor = (index: number) => {
    const key = rowKey(rows[index])
    if (!key) return 0
    const total = availableByKey.get(key) ?? 0
    const claimedByOthers = rows.reduce(
      (sum, r, i) => (i !== index && rowKey(r) === key ? sum + (Number(r.quantity) || 0) : sum),
      0
    )
    return total - claimedByOthers
  }

  const updateRow = (index: number, field: keyof BulkCheckoutRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const handlePick = (index: number, key: string) => {
    const opt = availableStock.find((o) => optionKey(o) === key)
    if (!opt) return
    setRows((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              product: opt.product,
              type: opt.type ?? '',
              item: opt.item ?? '',
              filamentId: opt.filamentId ?? '',
              unitPrice: opt.unitPrice.toFixed(2),
            }
          : r
      )
    )
  }

  const addRow = () => setRows((prev) => [...prev, emptyRow()])

  const removeRow = (index: number) => {
    if (rows.length === 1) return
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const rowTotal = (r: BulkCheckoutRow) => (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0)
  const grandTotal = useMemo(() => rows.reduce((sum, r) => sum + rowTotal(r), 0), [rows])
  const grandQty = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0),
    [rows]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (rows.some((r) => !r.product)) {
      setError('Each row must have a Product selected.')
      return
    }
    if (rows.some((r) => !r.quantity || Number(r.quantity) <= 0)) {
      setError('Each row must have a valid Quantity.')
      return
    }
    for (let i = 0; i < rows.length; i++) {
      const key = rowKey(rows[i])
      const total = availableByKey.get(key) ?? 0
      const claimed = rows.reduce(
        (sum, r) => (rowKey(r) === key ? sum + (Number(r.quantity) || 0) : sum),
        0
      )
      if (claimed > total) {
        setError(`${rows[i].product}: only ${total} unit(s) available in total across rows.`)
        return
      }
    }

    setLoading(true)
    try {
      await onSubmit({ rows, checkedOutAt, checkedOutBy, notes })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save checkout entries')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Product *', 'Qty *', 'Unit Price', 'Total', ''].map((h) => (
                <th
                  key={h}
                  className="px-3 py-2 text-left text-xs font-medium tracking-wide text-slate-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => {
              const remaining = remainingFor(i) + (Number(row.quantity) || 0)
              return (
                <tr key={i} className="bg-white align-top">
                  {/* Product */}
                  <td className="min-w-[220px] px-2 py-1.5">
                    <select
                      value={rowKey(row)}
                      onChange={(e) => handlePick(i, e.target.value)}
                      required
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#6EC30B] focus:outline-none"
                    >
                      <option value="">Select a produced item</option>
                      {availableStock
                        .filter((o) => o.availableQty > 0)
                        .map((o) => (
                          <option key={optionKey(o)} value={optionKey(o)}>
                            {o.product}
                            {o.type ? ` — ${o.type}` : ''}
                            {o.item ? ` / ${o.item}` : ''}
                            {o.filament ? ` (${o.filament.color})` : ''} · {o.availableQty}{' '}
                            available
                          </option>
                        ))}
                    </select>
                    {row.product && (
                      <p className="mt-1 text-xs text-slate-400">{remaining} available</p>
                    )}
                  </td>
                  {/* Qty */}
                  <td className="w-[90px] px-2 py-1.5">
                    <input
                      type="number"
                      min="1"
                      max={remaining || undefined}
                      value={row.quantity}
                      onChange={(e) => updateRow(i, 'quantity', e.target.value)}
                      required
                      className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#6EC30B] focus:outline-none"
                    />
                  </td>
                  {/* Unit Price */}
                  <td className="w-[110px] px-2 py-1.5">
                    <input
                      type="number"
                      value={row.unitPrice}
                      readOnly
                      title="From production log"
                      className="w-full cursor-not-allowed rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-sm text-slate-500"
                    />
                  </td>
                  {/* Total */}
                  <td className="px-2 py-1.5 text-sm font-medium whitespace-nowrap text-slate-900">
                    {formatCurrency(rowTotal(row))}
                  </td>
                  {/* Remove */}
                  <td className="w-8 px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      disabled={rows.length === 1}
                      className="rounded p-1 text-slate-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-sm font-medium text-[#6EC30B] hover:text-[#5aab09]"
      >
        <Plus className="h-4 w-4" />
        Add Row
      </button>

      <div className="rounded-lg bg-slate-50 p-3 text-sm">
        <span className="text-slate-500">Total: </span>
        <span className="font-semibold text-slate-900">
          {grandQty.toLocaleString()} unit{grandQty === 1 ? '' : 's'} · {formatCurrency(grandTotal)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <Input
          label="Date"
          type="date"
          value={checkedOutAt}
          onChange={(e) => setCheckedOutAt(e.target.value)}
        />
        <Input
          label="Checked Out By"
          value={checkedOutBy}
          onChange={(e) => setCheckedOutBy(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="block w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#6EC30B] focus:outline-none"
          placeholder="Optional notes for all entries..."
        />
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">
          {rows.length} {rows.length === 1 ? 'entry' : 'entries'} to save
        </span>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Checkout {rows.length > 1 ? `All (${rows.length})` : ''}
          </Button>
        </div>
      </div>
    </form>
  )
}
