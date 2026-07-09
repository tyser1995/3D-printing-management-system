'use client'

import { useState } from 'react'
import { Plus, Edit2, Package } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import FilamentForm, { type FilamentFormData } from '@/components/admin/inventory/FilamentForm'
import StockMovementModal from '@/components/admin/inventory/StockMovementModal'

interface Material {
  id: string
  name: string
}
interface Supplier {
  id: string
  name: string
}

interface Filament {
  id: string
  name: string
  color: string
  colorHex: string | null
  weightGrams: number
  pricePerKg: number
  stockGrams: number
  lowStockAlertG: number
  material: Material
  supplier: Supplier | null
}

interface Props {
  initialFilaments: Filament[]
  materials: Material[]
  suppliers: Supplier[]
}

function getStockStatus(stock: number, alert: number) {
  if (stock < alert * 0.5) return { label: 'Critical', variant: 'danger' as const }
  if (stock < alert) return { label: 'Low', variant: 'warning' as const }
  return { label: 'OK', variant: 'success' as const }
}

export default function InventoryClient({ initialFilaments }: Props) {
  const [filaments, setFilaments] = useState<Filament[]>(initialFilaments)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Filament | null>(null)
  const [stockTarget, setStockTarget] = useState<Filament | null>(null)

  const refresh = async () => {
    const res = await fetch('/api/inventory/filaments')
    const json = await res.json()
    if (json.data) {
      setFilaments(
        json.data.map((f: Filament & { pricePerKg: number | string }) => ({
          ...f,
          pricePerKg: Number(f.pricePerKg),
        }))
      )
    }
  }

  const handleCreate = async (data: FilamentFormData) => {
    const res = await fetch('/api/inventory/filaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to create')
    setShowForm(false)
    await refresh()
  }

  const handleEdit = async (data: FilamentFormData) => {
    if (!editTarget) return
    const res = await fetch(`/api/inventory/filaments/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to update')
    setEditTarget(null)
    await refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this filament?')) return
    await fetch(`/api/inventory/filaments/${id}`, { method: 'DELETE' })
    setFilaments((prev) => prev.filter((f) => f.id !== id))
  }

  const handleStockSuccess = async (id: string, newStock: number) => {
    setFilaments((prev) => prev.map((f) => (f.id === id ? { ...f, stockGrams: newStock } : f)))
    setStockTarget(null)
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{filaments.length} Filaments</h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStockTarget(filaments[0] ?? null)}>
            <Package className="h-4 w-4" />
            Stock Movement
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Filament
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filaments.map((filament) => {
          const status = getStockStatus(filament.stockGrams, filament.lowStockAlertG)
          const percentage = Math.min((filament.stockGrams / filament.weightGrams) * 100, 100)

          return (
            <Card key={filament.id} className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 shrink-0 rounded-full border-2 border-slate-200 shadow-inner"
                    style={{ background: filament.colorHex ?? filament.color }}
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{filament.name}</p>
                    <p className="text-xs text-slate-500">
                      {filament.material.name} · {filament.supplier?.name ?? 'No supplier'}
                    </p>
                  </div>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Stock</span>
                  <span className="font-medium text-slate-900">
                    {filament.stockGrams}g / {filament.weightGrams}g
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      status.variant === 'danger'
                        ? 'bg-red-500'
                        : status.variant === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>₱{filament.pricePerKg}/kg</span>
                <span>Alert at {filament.lowStockAlertG}g</span>
              </div>

              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs"
                  onClick={() => setStockTarget(filament)}
                >
                  <Package className="h-3 w-3" />
                  Stock
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs"
                  onClick={() => setEditTarget(filament)}
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDelete(filament.id)}
                >
                  Remove
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Add Filament Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">Add Filament</h2>
            <FilamentForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              submitLabel="Create Filament"
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">Edit Filament</h2>
            <FilamentForm
              initialData={{
                name: editTarget.name,
                materialId: editTarget.material.id,
                supplierId: editTarget.supplier?.id ?? '',
                color: editTarget.color,
                colorHex: editTarget.colorHex ?? '',
                weightGrams: String(editTarget.weightGrams),
                pricePerKg: String(editTarget.pricePerKg),
                stockGrams: String(editTarget.stockGrams),
                lowStockAlertG: String(editTarget.lowStockAlertG),
              }}
              onSubmit={handleEdit}
              onCancel={() => setEditTarget(null)}
              submitLabel="Save Changes"
            />
          </div>
        </div>
      )}

      {/* Stock Movement Modal */}
      {stockTarget && (
        <StockMovementModal
          filamentId={stockTarget.id}
          filamentName={stockTarget.name}
          currentStock={stockTarget.stockGrams}
          onClose={() => setStockTarget(null)}
          onSuccess={(newStock) => handleStockSuccess(stockTarget.id, newStock)}
        />
      )}
    </>
  )
}
