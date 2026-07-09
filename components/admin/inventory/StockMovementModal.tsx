'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface StockMovementModalProps {
  filamentId: string
  filamentName: string
  currentStock: number
  onClose: () => void
  onSuccess: (newStock: number) => void
}

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

export default function StockMovementModal({
  filamentId,
  filamentName,
  currentStock,
  onClose,
  onSuccess,
}: StockMovementModalProps) {
  const [type, setType] = useState<MovementType>('IN')
  const [grams, setGrams] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/inventory/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filamentId, type, grams: Number(grams), notes }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to record movement')

      onSuccess(json.data.filament.stockGrams)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record movement')
    } finally {
      setLoading(false)
    }
  }

  const preview = () => {
    const g = Number(grams) || 0
    if (type === 'IN') return currentStock + g
    if (type === 'OUT') return Math.max(0, currentStock - g)
    return g
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Stock Movement</h2>
        <p className="mb-5 text-sm text-slate-500">
          {filamentName} — current: <span className="font-medium">{currentStock}g</span>
        </p>

        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Type</label>
            <div className="flex gap-2">
              {(['IN', 'OUT', 'ADJUSTMENT'] as MovementType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    type === t
                      ? t === 'IN'
                        ? 'border-green-500 bg-green-500 text-white'
                        : t === 'OUT'
                          ? 'border-red-500 bg-red-500 text-white'
                          : 'border-blue-500 bg-blue-500 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t === 'IN' ? '+ Stock In' : t === 'OUT' ? '− Stock Out' : '⟳ Adjust'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {type === 'ADJUSTMENT' ? 'Set stock to (g)' : 'Grams'}
            </label>
            <input
              type="number"
              min="1"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              required
              placeholder="e.g. 500"
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {grams && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <span className="text-slate-500">New stock: </span>
              <span className="font-semibold text-slate-900">{preview()}g</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. New spool from supplier"
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Record
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
