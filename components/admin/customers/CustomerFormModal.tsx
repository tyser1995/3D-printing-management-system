'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export interface CustomerFormData {
  name: string
  email: string
  phone: string
}

interface Props {
  initial: CustomerFormData
  onSubmit: (data: CustomerFormData) => Promise<void>
  onClose: () => void
}

export default function CustomerFormModal({ initial, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<CustomerFormData>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof CustomerFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">Edit Customer</h2>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={set('name')} placeholder="Full name" />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={set('email')}
            required
            placeholder="customer@example.com"
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="09XX XXX XXXX"
          />

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
