'use client'

import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils/format'

export interface AvailableStockOption {
  product: string
  type: string | null
  item: string | null
  filamentId: string | null
  filament: { id: string; name: string; color: string; colorHex: string | null } | null
  availableQty: number
  unitPrice: number
}

export interface CheckoutFormData {
  product: string
  type: string
  item: string
  filamentId: string
  quantity: string
  unitPrice: string
  checkedOutAt: string
  checkedOutBy: string
  notes: string
}

interface Props {
  availableStock: AvailableStockOption[]
  initialData?: Partial<CheckoutFormData>
  /** When set, the product/type/item/color is fixed (edit mode) and shown read-only. */
  lockProduct?: boolean
  /** Available qty to allow for the currently-selected combo (includes this entry's own qty when editing). */
  maxQty?: number
  onSubmit: (data: CheckoutFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

const today = () => new Date().toISOString().slice(0, 10)

const optionKey = (o: {
  product: string
  type: string | null
  item: string | null
  filamentId: string | null
}) => `${o.product}|${o.type ?? ''}|${o.item ?? ''}|${o.filamentId ?? ''}`

export default function CheckoutForm({
  availableStock,
  initialData,
  lockProduct = false,
  maxQty,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CheckoutFormData>({
    product: initialData?.product ?? '',
    type: initialData?.type ?? '',
    item: initialData?.item ?? '',
    filamentId: initialData?.filamentId ?? '',
    quantity: initialData?.quantity ?? '1',
    unitPrice: initialData?.unitPrice ?? '0',
    checkedOutAt: initialData?.checkedOutAt ?? today(),
    checkedOutBy: initialData?.checkedOutBy ?? '',
    notes: initialData?.notes ?? '',
  })

  const selectedKey = form.product
    ? optionKey({
        product: form.product,
        type: form.type || null,
        item: form.item || null,
        filamentId: form.filamentId || null,
      })
    : ''
  const selectedOption = availableStock.find((o) => optionKey(o) === selectedKey)
  const available = maxQty ?? selectedOption?.availableQty ?? 0

  const set =
    (key: keyof CheckoutFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handlePick = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const opt = availableStock.find((o) => optionKey(o) === e.target.value)
    if (!opt) return
    setForm((prev) => ({
      ...prev,
      product: opt.product,
      type: opt.type ?? '',
      item: opt.item ?? '',
      filamentId: opt.filamentId ?? '',
      unitPrice: opt.unitPrice.toFixed(2),
    }))
  }

  const total = useMemo(
    () => (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0),
    [form.quantity, form.unitPrice]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.product) {
      setError('Select a product to check out.')
      return
    }
    const qty = Number(form.quantity)
    if (!qty || qty <= 0) {
      setError('Quantity must be a positive number.')
      return
    }
    if (qty > available) {
      setError(`Only ${available} unit(s) available for this product.`)
      return
    }

    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save checkout entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {lockProduct ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-medium text-slate-900">
            {form.product}
            {form.type ? ` — ${form.type}` : ''}
            {form.item ? ` / ${form.item}` : ''}
          </p>
          {selectedOption?.filament && (
            <div className="mt-1 flex items-center gap-1.5">
              {selectedOption.filament.colorHex && (
                <span
                  className="h-3.5 w-3.5 rounded-full border border-slate-200"
                  style={{ backgroundColor: selectedOption.filament.colorHex }}
                />
              )}
              <span className="text-xs text-slate-500">{selectedOption.filament.color}</span>
            </div>
          )}
          <p className="mt-1 text-xs text-slate-400">{available} available</p>
        </div>
      ) : (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Product *</label>
          <select
            value={selectedKey}
            onChange={handlePick}
            required
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#6EC30B] focus:outline-none"
          >
            <option value="">Select a produced item</option>
            {availableStock
              .filter((o) => o.availableQty > 0)
              .map((o) => (
                <option key={optionKey(o)} value={optionKey(o)}>
                  {o.product}
                  {o.type ? ` — ${o.type}` : ''}
                  {o.item ? ` / ${o.item}` : ''}
                  {o.filament ? ` (${o.filament.color})` : ''} · {o.availableQty} available
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={`Quantity * ${selectedOption || maxQty !== undefined ? `(max ${available})` : ''}`}
          type="number"
          min="1"
          max={available || undefined}
          value={form.quantity}
          onChange={set('quantity')}
          required
        />
        <Input
          label="Unit Price"
          type="number"
          value={form.unitPrice}
          readOnly
          hint="From production log"
          className="cursor-not-allowed bg-slate-50 text-slate-500"
        />
      </div>

      <div className="rounded-lg bg-slate-50 p-3 text-sm">
        <span className="text-slate-500">Total Amount: </span>
        <span className="font-semibold text-slate-900">{formatCurrency(total)}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Date" type="date" value={form.checkedOutAt} onChange={set('checkedOutAt')} />
        <Input
          label="Checked Out By"
          value={form.checkedOutBy}
          onChange={set('checkedOutBy')}
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
