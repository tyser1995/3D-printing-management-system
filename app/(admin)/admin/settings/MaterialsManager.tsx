'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Material {
  id: string
  name: string
  description: string | null
  properties: string | null
  _count: { filaments: number }
}

interface Props {
  initialMaterials: Material[]
}

interface MaterialForm {
  name: string
  description: string
  properties: string
}

const defaultForm: MaterialForm = { name: '', description: '', properties: '' }

export default function MaterialsManager({ initialMaterials }: Props) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Material | null>(null)
  const [form, setForm] = useState<MaterialForm>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set =
    (k: keyof MaterialForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  const refresh = async () => {
    const res = await fetch('/api/admin/materials')
    const json = await res.json()
    if (json.data) setMaterials(json.data)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditTarget(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = editTarget ? `/api/admin/materials/${editTarget.id}` : '/api/admin/materials'
      const res = await fetch(url, {
        method: editTarget ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          properties: form.properties || null,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        closeForm()
        await refresh()
      } else {
        setError(json.error ?? 'Failed to save material')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (material: Material) => {
    if (!confirm(`Delete material "${material.name}"?`)) return
    const res = await fetch(`/api/admin/materials/${material.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMaterials((p) => p.filter((m) => m.id !== material.id))
    } else {
      const json = await res.json().catch(() => ({}))
      alert(json.error ?? 'Failed to delete material')
    }
  }

  const openEdit = (m: Material) => {
    setEditTarget(m)
    setError(null)
    setForm({ name: m.name, description: m.description ?? '', properties: m.properties ?? '' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filament Materials</CardTitle>
        <Button
          size="sm"
          onClick={() => {
            setShowForm(true)
            setForm(defaultForm)
            setError(null)
          }}
        >
          <Plus className="h-4 w-4" /> Add Material
        </Button>
      </CardHeader>

      <div className="space-y-2">
        {materials.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{m.name}</p>
              <p className="truncate text-xs text-slate-400">
                {m.description ?? 'No description'} · {m._count.filaments} filament
                {m._count.filaments === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:bg-red-50"
                onClick={() => handleDelete(m)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {materials.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">No materials yet.</p>
        )}
      </div>

      {(showForm || editTarget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editTarget ? 'Edit Material' : 'Add Material'}
              </h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Material Name"
                value={form.name}
                onChange={set('name')}
                required
                placeholder="e.g. PLA, PETG, ABS"
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  rows={2}
                  className="block w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#6EC30B] focus:outline-none"
                  placeholder="Optional description..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Properties
                </label>
                <textarea
                  value={form.properties}
                  onChange={set('properties')}
                  rows={2}
                  className="block w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#6EC30B] focus:outline-none"
                  placeholder="Optional notes on print temp, flexibility, etc."
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  {editTarget ? 'Save Changes' : 'Add Material'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  )
}
