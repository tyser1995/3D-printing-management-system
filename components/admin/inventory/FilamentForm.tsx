'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Material {
  id: string
  name: string
}

interface Supplier {
  id: string
  name: string
}

export interface FilamentFormData {
  name: string
  materialId: string
  supplierId: string
  color: string
  colorHex: string
  weightGrams: string
  pricePerKg: string
  stockGrams: string
  lowStockAlertG: string
}

interface FilamentFormProps {
  initialData?: Partial<FilamentFormData>
  onSubmit: (data: FilamentFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export default function FilamentForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: FilamentFormProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FilamentFormData>({
    name: initialData?.name ?? '',
    materialId: initialData?.materialId ?? '',
    supplierId: initialData?.supplierId ?? '',
    color: initialData?.color ?? '',
    colorHex: initialData?.colorHex ?? '#f97316',
    weightGrams: initialData?.weightGrams ?? '1000',
    pricePerKg: initialData?.pricePerKg ?? '',
    stockGrams: initialData?.stockGrams ?? '0',
    lowStockAlertG: initialData?.lowStockAlertG ?? '200',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/inventory/materials').then((r) => r.json()),
      fetch('/api/inventory/suppliers').then((r) => r.json()),
    ]).then(([mats, sups]) => {
      setMaterials(mats.data ?? [])
      setSuppliers(sups.data ?? [])
    })
  }, [])

  const set =
    (key: keyof FilamentFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save filament')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <Input
        label="Name"
        value={form.name}
        onChange={set('name')}
        required
        placeholder="e.g. PLA+ Orange"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Material *</label>
          <select
            value={form.materialId}
            onChange={set('materialId')}
            required
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="">Select material</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Supplier</label>
          <select
            value={form.supplierId}
            onChange={set('supplierId')}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="">None</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Color Name"
          value={form.color}
          onChange={set('color')}
          required
          placeholder="e.g. Orange"
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Color Preview</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.colorHex}
              onChange={set('colorHex')}
              className="h-10 w-16 cursor-pointer rounded-lg border border-slate-300 p-1"
            />
            <Input
              value={form.colorHex}
              onChange={set('colorHex')}
              placeholder="#f97316"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Weight (g)"
          type="number"
          min="1"
          value={form.weightGrams}
          onChange={set('weightGrams')}
          required
        />
        <Input
          label="Price per kg (₱)"
          type="number"
          min="0"
          step="0.01"
          value={form.pricePerKg}
          onChange={set('pricePerKg')}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Current Stock (g)"
          type="number"
          min="0"
          value={form.stockGrams}
          onChange={set('stockGrams')}
        />
        <Input
          label="Low Stock Alert (g)"
          type="number"
          min="0"
          value={form.lowStockAlertG}
          onChange={set('lowStockAlertG')}
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
