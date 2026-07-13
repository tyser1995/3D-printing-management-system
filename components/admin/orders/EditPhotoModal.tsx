'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Props {
  orderId: string
  initialPhotoUrl: string | null
  onClose: () => void
  onSaved: (photoUrl: string | null) => void
}

export default function EditPhotoModal({ orderId, initialPhotoUrl, onClose, onSaved }: Props) {
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/photo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: photoUrl.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to save photo')
        return
      }
      onSaved(json.data.printedPhotoUrl)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Printed Photo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Photo URL"
            type="url"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://..."
            hint="Optional — a photo of the finished print, once it's done."
          />

          {photoUrl && (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Printed item preview"
                className="max-h-64 w-full object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          )}

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
