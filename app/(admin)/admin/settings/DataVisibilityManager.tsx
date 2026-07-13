'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'

interface Display {
  showDeletedOrders?: boolean
  showDeletedProducts?: boolean
}

interface Props {
  initialDisplay: Display
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: () => void
  label: string
  hint: string
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-[#6EC30B]' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function DataVisibilityManager({ initialDisplay }: Props) {
  const router = useRouter()
  const [display, setDisplay] = useState<Display>({
    showDeletedOrders: initialDisplay.showDeletedOrders ?? false,
    showDeletedProducts: initialDisplay.showDeletedProducts ?? false,
  })
  const [saving, setSaving] = useState(false)

  const toggle = async (key: keyof Display) => {
    const next = { ...display, [key]: !display[key] }
    setDisplay(next)
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display: next }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Visibility</CardTitle>
      </CardHeader>

      <div className="flex gap-3">
        <Eye className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
        <div className="flex-1 divide-y divide-slate-100">
          <Toggle
            checked={!!display.showDeletedOrders}
            onChange={() => toggle('showDeletedOrders')}
            label="Show deleted orders"
            hint="Reveal cancelled orders you've deleted in the Orders list"
          />
          <Toggle
            checked={!!display.showDeletedProducts}
            onChange={() => toggle('showDeletedProducts')}
            label="Show deleted products"
            hint="Reveal deactivated products in the Products list"
          />
        </div>
      </div>
      {saving && <p className="mt-2 text-xs text-slate-400">Saving...</p>}
    </Card>
  )
}
