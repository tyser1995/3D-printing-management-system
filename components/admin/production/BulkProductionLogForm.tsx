'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Filament {
  id: string
  name: string
  color: string
  colorHex: string | null
}

export interface BulkRow {
  product: string
  type: string
  item: string
  filamentId: string
  quantity: string
  amount: string
}

export interface BulkProductionLogFormData {
  rows: BulkRow[]
  producedAt: string
  producedBy: string
  notes: string
}

interface Props {
  filaments: Filament[]
  onSubmit: (data: BulkProductionLogFormData) => Promise<void>
  onCancel: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyRow = (): BulkRow => ({
  product: '',
  type: '',
  item: '',
  filamentId: '',
  quantity: '1',
  amount: '0',
})

export default function BulkProductionLogForm({ filaments, onSubmit, onCancel }: Props) {
  const [rows, setRows] = useState<BulkRow[]>([emptyRow()])
  const [producedAt, setProducedAt] = useState(today())
  const [producedBy, setProducedBy] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateRow = (index: number, field: keyof BulkRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, emptyRow()])

  const removeRow = (index: number) => {
    if (rows.length === 1) return
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const valid = rows.every((r) => r.product.trim() && r.quantity && Number(r.quantity) > 0)
    if (!valid) {
      setError('Each row must have a Product and a valid Quantity.')
      return
    }

    setLoading(true)
    try {
      await onSubmit({ rows, producedAt, producedBy, notes })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save entries')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {/* Rows table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Product *', 'Type', 'Item', 'Color', 'Qty *', 'Amount', ''].map((h) => (
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
            {rows.map((row, i) => (
              <tr key={i} className="bg-white">
                {/* Product */}
                <td className="min-w-[120px] px-2 py-1.5">
                  <input
                    type="text"
                    value={row.product}
                    onChange={(e) => updateRow(i, 'product', e.target.value)}
                    placeholder="e.g. Clickers"
                    required
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#6EC30B] focus:outline-none"
                  />
                </td>
                {/* Type */}
                <td className="min-w-[100px] px-2 py-1.5">
                  <input
                    type="text"
                    value={row.type}
                    onChange={(e) => updateRow(i, 'type', e.target.value)}
                    placeholder="e.g. Base"
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#6EC30B] focus:outline-none"
                  />
                </td>
                {/* Item */}
                <td className="min-w-[100px] px-2 py-1.5">
                  <input
                    type="text"
                    value={row.item}
                    onChange={(e) => updateRow(i, 'item', e.target.value)}
                    placeholder="e.g. Key Slots"
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#6EC30B] focus:outline-none"
                  />
                </td>
                {/* Color */}
                <td className="min-w-[130px] px-2 py-1.5">
                  <div className="relative">
                    {(() => {
                      const f = filaments.find((f) => f.id === row.filamentId)
                      return f?.colorHex ? (
                        <span
                          className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-slate-200"
                          style={{ backgroundColor: f.colorHex }}
                        />
                      ) : null
                    })()}
                    <select
                      value={row.filamentId}
                      onChange={(e) => updateRow(i, 'filamentId', e.target.value)}
                      className={`w-full rounded border border-slate-300 bg-white py-1.5 pr-2 text-sm focus:ring-1 focus:ring-[#6EC30B] focus:outline-none ${filaments.find((f) => f.id === row.filamentId)?.colorHex ? 'pl-7' : 'pl-2'}`}
                    >
                      <option value="">Color</option>
                      {filaments.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.color}
                          {f.name !== f.color ? ` — ${f.name}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                {/* Qty */}
                <td className="w-[70px] px-2 py-1.5">
                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) => updateRow(i, 'quantity', e.target.value)}
                    required
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#6EC30B] focus:outline-none"
                  />
                </td>
                {/* Amount */}
                <td className="w-[90px] px-2 py-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) => updateRow(i, 'amount', e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#6EC30B] focus:outline-none"
                  />
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row */}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-sm font-medium text-[#6EC30B] hover:text-[#5aab09]"
      >
        <Plus className="h-4 w-4" />
        Add Row
      </button>

      {/* Shared fields */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <Input
          label="Date Produced"
          type="date"
          value={producedAt}
          onChange={(e) => setProducedAt(e.target.value)}
        />
        <Input
          label="Produced By"
          value={producedBy}
          onChange={(e) => setProducedBy(e.target.value)}
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
            Save {rows.length > 1 ? `All (${rows.length})` : 'Entry'}
          </Button>
        </div>
      </div>
    </form>
  )
}
