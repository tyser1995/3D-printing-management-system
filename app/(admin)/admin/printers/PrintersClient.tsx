'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Wifi, WifiOff } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const BAMBU_MODELS = ['X1 Carbon', 'X1E', 'P1S', 'P1P', 'A1', 'A1 Mini', 'H2D', 'H2D AMS']

interface PrintJob {
  order: {
    items: Array<{ product: { name: string } }>
  }
}

interface Printer {
  id: string
  name: string
  model: string
  brand: string
  isActive: boolean
  ipAddress: string | null
  notes: string | null
  printJobs: PrintJob[]
  _count: { printJobs: number; maintenanceLogs: number }
}

interface Props {
  initialPrinters: Printer[]
}

interface PrinterForm {
  name: string
  model: string
  brand: string
  ipAddress: string
  notes: string
}

const defaultForm: PrinterForm = {
  name: '',
  model: '',
  brand: 'Bambu Lab',
  ipAddress: '',
  notes: '',
}

export default function PrintersClient({ initialPrinters }: Props) {
  const [printers, setPrinters] = useState<Printer[]>(initialPrinters)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Printer | null>(null)
  const [form, setForm] = useState<PrinterForm>(defaultForm)
  const [loading, setLoading] = useState(false)

  const set =
    (k: keyof PrinterForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }))

  const refresh = async () => {
    const res = await fetch('/api/printers')
    const json = await res.json()
    if (json.data) setPrinters(json.data)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false)
        setForm(defaultForm)
        await refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTarget) return
    setLoading(true)
    try {
      const res = await fetch(`/api/printers/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setEditTarget(null)
        await refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this printer?')) return
    await fetch(`/api/printers/${id}`, { method: 'DELETE' })
    setPrinters((p) => p.filter((x) => x.id !== id))
  }

  const openEdit = (p: Printer) => {
    setEditTarget(p)
    setForm({
      name: p.name,
      model: p.model,
      brand: p.brand,
      ipAddress: p.ipAddress ?? '',
      notes: p.notes ?? '',
    })
  }

  const PrinterForm = ({
    onSubmit,
    title,
    submitLabel,
  }: {
    onSubmit: (e: React.FormEvent) => void
    title: string
    submitLabel: string
  }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-semibold text-slate-900">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Printer Name"
            value={form.name}
            onChange={set('name')}
            required
            placeholder="e.g. X1C Workshop"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Model *</label>
            <select
              value={form.model}
              onChange={set('model')}
              required
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="">Select model</option>
              {BAMBU_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <Input label="Brand" value={form.brand} onChange={set('brand')} />
          <Input
            label="IP Address (LAN)"
            value={form.ipAddress}
            onChange={set('ipAddress')}
            placeholder="192.168.1.x"
            hint="Used for Bambu Lab LAN mode"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              className="block w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setEditTarget(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Printer Fleet ({printers.length})</h2>
        <Button
          onClick={() => {
            setShowForm(true)
            setForm(defaultForm)
          }}
        >
          <Plus className="h-4 w-4" /> Add Printer
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {printers.map((printer) => {
          const currentJob = printer.printJobs[0]
          const isBusy = !!currentJob
          const currentProduct = currentJob?.order.items[0]?.product.name

          return (
            <Card key={printer.id} className={!printer.isActive ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${
                      isBusy ? 'bg-green-100' : printer.isActive ? 'bg-slate-100' : 'bg-slate-50'
                    }`}
                  >
                    🖨️
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{printer.name}</p>
                    <p className="text-xs text-slate-500">
                      {printer.brand} {printer.model}
                    </p>
                  </div>
                </div>
                <Badge variant={isBusy ? 'success' : printer.isActive ? 'default' : 'danger'}>
                  {isBusy ? 'Printing' : printer.isActive ? 'Idle' : 'Inactive'}
                </Badge>
              </div>

              {currentProduct && (
                <div className="mt-3 rounded-lg border border-green-100 bg-green-50 p-2.5 text-sm">
                  <p className="truncate font-medium text-green-800">▶ {currentProduct}</p>
                </div>
              )}

              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                {printer.ipAddress ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Wifi className="h-3.5 w-3.5" /> {printer.ipAddress}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400">
                    <WifiOff className="h-3.5 w-3.5" /> No IP
                  </span>
                )}
                <span>{printer._count.printJobs} total jobs</span>
              </div>

              {printer.notes && <p className="mt-2 text-xs text-slate-400">{printer.notes}</p>}

              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs"
                  onClick={() => openEdit(printer)}
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs text-red-500 hover:bg-red-50"
                  onClick={() => handleDelete(printer.id)}
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </Button>
              </div>
            </Card>
          )
        })}

        {printers.length === 0 && (
          <div className="col-span-3 rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
            <p className="mb-3 text-4xl">🖨️</p>
            <p className="font-medium text-slate-700">No printers added yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Add your Bambu Lab printers to manage jobs and track status.
            </p>
          </div>
        )}
      </div>

      {/* Bambu Lab integration note */}
      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h3 className="mb-2 font-semibold text-blue-900">Bambu Lab Integration (Phase 3)</h3>
        <p className="text-sm text-blue-700">
          To enable real-time printer monitoring, add your printer&apos;s IP address and configure
          Bambu Connect:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-blue-600">
          <li>
            Enable <strong>LAN Mode</strong> on your printer (Settings → Network → LAN Mode)
          </li>
          <li>
            Add the <strong>IP address</strong> above to enable MQTT communication
          </li>
          <li>
            Set <code className="rounded bg-blue-100 px-1">BAMBU_ACCESS_CODE</code> in your .env for
            authenticated access
          </li>
          <li>Supports: A1 · A1 Mini · P1P · P1S · X1 Carbon · H2D</li>
        </ul>
      </div>

      {showForm && (
        <PrinterForm title="Add Printer" submitLabel="Add Printer" onSubmit={handleCreate} />
      )}
      {editTarget && (
        <PrinterForm title="Edit Printer" submitLabel="Save Changes" onSubmit={handleEdit} />
      )}
    </>
  )
}
