'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Supplier {
  id: string
  name: string
  contact: string | null
  email: string | null
  phone: string | null
  address: string | null
  isActive: boolean
  _count: { filaments: number; purchases: number }
}

interface Props {
  initialSuppliers: Supplier[]
}

interface SupplierForm {
  name: string
  contact: string
  email: string
  phone: string
  address: string
}

const defaultForm: SupplierForm = { name: '', contact: '', email: '', phone: '', address: '' }

export default function SuppliersManager({ initialSuppliers }: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Supplier | null>(null)
  const [form, setForm] = useState<SupplierForm>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof SupplierForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const refresh = async () => {
    const res = await fetch('/api/admin/suppliers')
    const json = await res.json()
    if (json.data) setSuppliers(json.data)
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
      const url = editTarget ? `/api/admin/suppliers/${editTarget.id}` : '/api/admin/suppliers'
      const res = await fetch(url, {
        method: editTarget ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          contact: form.contact || null,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
        }),
      })
      const json = await res.json()
      if (res.ok) {
        closeForm()
        await refresh()
      } else {
        setError(json.error ?? 'Failed to save supplier')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Deactivate supplier "${supplier.name}"?`)) return
    const res = await fetch(`/api/admin/suppliers/${supplier.id}`, { method: 'DELETE' })
    if (res.ok) {
      await refresh()
    } else {
      const json = await res.json().catch(() => ({}))
      alert(json.error ?? 'Failed to deactivate supplier')
    }
  }

  const openEdit = (s: Supplier) => {
    setEditTarget(s)
    setError(null)
    setForm({
      name: s.name,
      contact: s.contact ?? '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      address: s.address ?? '',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suppliers</CardTitle>
        <Button
          size="sm"
          onClick={() => {
            setShowForm(true)
            setForm(defaultForm)
            setError(null)
          }}
        >
          <Plus className="h-4 w-4" /> Add Supplier
        </Button>
      </CardHeader>

      <div className="space-y-2">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-slate-900">{s.name}</p>
                {!s.isActive && (
                  <Badge variant="default" size="sm">
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="truncate text-xs text-slate-400">
                {s.contact ?? s.email ?? s.phone ?? 'No contact info'} · {s._count.filaments}{' '}
                filament{s._count.filaments === 1 ? '' : 's'} · {s._count.purchases} purchase
                {s._count.purchases === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:bg-red-50"
                onClick={() => handleDelete(s)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {suppliers.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">No suppliers yet.</p>
        )}
      </div>

      {(showForm || editTarget) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editTarget ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Supplier Name"
                value={form.name}
                onChange={set('name')}
                required
                placeholder="e.g. Bambu Lab"
              />
              <Input
                label="Contact Person"
                value={form.contact}
                onChange={set('contact')}
                placeholder="Optional"
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="Optional"
              />
              <Input
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="Optional"
              />
              <Input
                label="Address"
                value={form.address}
                onChange={set('address')}
                placeholder="Optional"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  {editTarget ? 'Save Changes' : 'Add Supplier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  )
}
