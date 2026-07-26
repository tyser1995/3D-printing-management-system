'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Filament {
  id: string
  name: string
  color: string
  colorHex: string | null
}

export interface ProductionLogFormData {
  product: string
  type: string
  item: string
  filamentId: string
  quantity: string
  amount: string
  producedAt: string
  producedBy: string
  notes: string
}

interface Props {
  filaments: Filament[]
  initialData?: Partial<ProductionLogFormData>
  onSubmit: (data: ProductionLogFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

const today = () => new Date().toISOString().slice(0, 10)

export default function ProductionLogForm({
  filaments,
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<ProductionLogFormData>({
    product: initialData?.product ?? '',
    type: initialData?.type ?? '',
    item: initialData?.item ?? '',
    filamentId: initialData?.filamentId ?? '',
    quantity: initialData?.quantity ?? '1',
    amount: initialData?.amount ?? '0',
    producedAt: initialData?.producedAt ?? today(),
    producedBy: initialData?.producedBy ?? '',
    notes: initialData?.notes ?? '',
  })

  const set =
    (key: keyof ProductionLogFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save production entry')
    } finally {
      setLoading(false)
    }
  }

  const selectedFilament = filaments.find((f) => f.id === form.filamentId)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Product *"
          value={form.product}
          onChange={set('product')}
          placeholder="e.g. Clickers"
          required
        />
        <Input label="Type" value={form.type} onChange={set('type')} placeholder="e.g. Base" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Item" value={form.item} onChange={set('item')} placeholder="e.g. Key Slots" />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Color *</label>
          <div className="relative">
            {selectedFilament?.colorHex && (
              <span
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 rounded-full border border-slate-200"
                style={{ backgroundColor: selectedFilament.colorHex }}
              />
            )}
            <select
              value={form.filamentId}
              onChange={set('filamentId')}
              required
              className={`block w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-3 text-sm focus:ring-2 focus:ring-[#6EC30B] focus:outline-none ${selectedFilament?.colorHex ? 'pl-9' : 'pl-3'}`}
            >
              <option value="">Select color</option>
              {filaments.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.color}
                  {f.name !== f.color ? ` — ${f.name}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Quantity *"
          type="number"
          min="1"
          value={form.quantity}
          onChange={set('quantity')}
          required
        />
        <Input
          label="Amount (per unit)"
          type="number"
          min="0"
          step="0.01"
          value={form.amount}
          onChange={set('amount')}
          placeholder="0.00"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date Produced"
          type="date"
          value={form.producedAt}
          onChange={set('producedAt')}
        />
        <Input
          label="Produced By"
          value={form.producedBy}
          onChange={set('producedBy')}
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          rows={2}
          className="block w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#6EC30B] focus:outline-none"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
