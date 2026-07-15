'use client'

import { useState } from 'react'
import { FlaskConical, RefreshCw } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface Props {
  initialEnabled: boolean
}

export default function SampleDataManager({ initialEnabled }: Props) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const toggle = async () => {
    const next = !enabled
    if (!next) {
      const confirmed = confirm(
        'Remove the bundled sample categories, products, filaments and demo orders? Anything you added yourself is left alone.'
      )
      if (!confirmed) return
    }

    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/sample-data', { method: next ? 'POST' : 'DELETE' })
      const json = await res.json()
      if (res.ok) {
        setEnabled(json.data.enabled)
        if (!next && json.data.blocked && Object.keys(json.data.blocked).length > 0) {
          setMessage('Some sample records are still referenced by your own data and were kept.')
        }
        router.refresh()
      } else {
        setMessage(json.error ?? 'Failed to update sample data')
      }
    } finally {
      setLoading(false)
    }
  }

  const update = async () => {
    setUpdating(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/sample-data', { method: 'PATCH' })
      const json = await res.json()
      if (res.ok) {
        const counts = json.data.counts as Record<string, { inserted: number; updated: number }>
        const inserted = Object.values(counts).reduce((a, c) => a + c.inserted, 0)
        const updated = Object.values(counts).reduce((a, c) => a + c.updated, 0)
        setMessage(
          inserted || updated
            ? `Sample data synced — ${updated} row${updated === 1 ? '' : 's'} refreshed, ${inserted} added.`
            : 'No sample data to update yet.'
        )
        router.refresh()
      } else {
        setMessage(json.error ?? 'Failed to update sample data')
      }
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sample Data</CardTitle>
      </CardHeader>

      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          <div>
            <p className="text-sm text-slate-700">
              Demo categories, products, filaments, suppliers and sample orders for exploring the
              app before entering your real data.
            </p>
            {message && <p className="mt-2 text-sm text-amber-600">{message}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {enabled && (
            <Button type="button" variant="outline" size="sm" loading={updating} onClick={update}>
              <RefreshCw className="h-3.5 w-3.5" /> Update Sample Data
            </Button>
          )}

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={loading}
            onClick={toggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              enabled ? 'bg-[#6EC30B]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </Card>
  )
}
