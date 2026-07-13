'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Address {
  firstName: string
  lastName: string
  street: string
  city: string
  province: string
  postalCode: string
}

interface Props {
  orderId: string
  initialAddress: Address | null
  onClose: () => void
  onSaved: (address: Address) => void
}

const emptyAddress: Address = {
  firstName: '',
  lastName: '',
  street: '',
  city: '',
  province: '',
  postalCode: '',
}

export default function EditAddressModal({ orderId, initialAddress, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Address>(initialAddress ?? emptyAddress)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/address`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to save address')
        return
      }
      onSaved(json.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {initialAddress ? 'Edit Ship To' : 'Add Ship To'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={form.firstName} onChange={set('firstName')} required />
            <Input label="Last Name" value={form.lastName} onChange={set('lastName')} required />
          </div>
          <Input label="Street Address" value={form.street} onChange={set('street')} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="City" value={form.city} onChange={set('city')} required />
            <Input label="Province" value={form.province} onChange={set('province')} required />
          </div>
          <Input
            label="Postal Code"
            value={form.postalCode}
            onChange={set('postalCode')}
            required
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
