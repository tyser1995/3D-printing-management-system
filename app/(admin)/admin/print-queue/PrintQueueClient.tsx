'use client'

import { useState } from 'react'
import { Printer, Play, Pause, CheckCircle, Clock, XCircle } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

const STATUS_COLORS: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  PRINTING: 'info',
  QUEUED: 'warning',
  COMPLETED: 'success',
  FAILED: 'danger',
  PAUSED: 'default',
  CANCELLED: 'danger',
}

interface PrinterData {
  id: string
  name: string
  model: string
  brand: string
  isActive: boolean
  ipAddress: string | null
  printJobs: Array<{
    order: {
      items: Array<{ product: { name: string } }>
    }
  }>
}

interface PrintJob {
  id: string
  status: string
  filamentUsedGrams: number | null
  printTimeMinutes: number | null
  startedAt: string | Date | null
  notes: string | null
  printer: { id: string; name: string } | null
  order: {
    orderNumber: string
    user: { name: string | null; email: string }
    items: Array<{ product: { name: string } }>
  }
}

interface Props {
  initialJobs: PrintJob[]
  printers: PrinterData[]
}

export default function PrintQueueClient({ initialJobs, printers }: Props) {
  const [jobs, setJobs] = useState<PrintJob[]>(initialJobs)
  const [loading, setLoading] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<PrintJob | null>(null)
  const [selectedPrinter, setSelectedPrinter] = useState('')

  const updateJob = async (id: string, data: Record<string, unknown>) => {
    setLoading(id)
    try {
      const res = await fetch(`/api/print-queue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (res.ok) {
        setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...json.data } : j)))
        if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
          setJobs((prev) => prev.filter((j) => j.id !== id))
        }
      }
    } finally {
      setLoading(null)
    }
  }

  const handleAssign = async () => {
    if (!assignTarget || !selectedPrinter) return
    await updateJob(assignTarget.id, { status: 'PRINTING', printerId: selectedPrinter })
    setAssignTarget(null)
    setSelectedPrinter('')
  }

  return (
    <>
      {/* Printer status */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {printers.map((printer) => {
          const currentJob = printer.printJobs[0]
          const isBusy = !!currentJob
          return (
            <Card key={printer.id} padding="sm">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 shrink-0 rounded-full ${isBusy ? 'animate-pulse bg-green-400' : 'bg-slate-300'}`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{printer.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {isBusy
                      ? `Printing: ${currentJob.order.items[0]?.product.name ?? '—'}`
                      : 'Idle'}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
        {printers.length === 0 && (
          <div className="col-span-4 text-sm text-slate-400">
            No printers registered.{' '}
            <a href="/admin/printers" className="text-orange-500 hover:underline">
              Add printers →
            </a>
          </div>
        )}
      </div>

      {/* Queue */}
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Job Queue ({jobs.length})</h2>

      {jobs.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-slate-400">No active print jobs.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => {
            const productNames = job.order.items.map((i) => i.product.name).join(', ')
            const customerName = job.order.user.name ?? job.order.user.email
            return (
              <Card key={job.id} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-400">{job.id.slice(-6)}</span>
                    <Badge variant={STATUS_COLORS[job.status] ?? 'default'}>{job.status}</Badge>
                  </div>
                  <h3 className="mt-1 truncate font-semibold text-slate-900">{productNames}</h3>
                  <p className="text-sm text-slate-500">
                    Order <span className="font-mono text-orange-500">{job.order.orderNumber}</span>{' '}
                    · {customerName}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Printer className="h-3.5 w-3.5" />
                      {job.printer?.name ?? 'Unassigned'}
                    </span>
                    {job.printTimeMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {Math.ceil(job.printTimeMinutes / 60)}h
                      </span>
                    )}
                    {job.filamentUsedGrams && <span>{job.filamentUsedGrams}g filament</span>}
                    {job.startedAt && (
                      <span>
                        Started:{' '}
                        {new Date(job.startedAt).toLocaleTimeString('en-PH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {job.status === 'PRINTING' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={loading === job.id}
                        onClick={() => updateJob(job.id, { status: 'PAUSED' })}
                        title="Pause"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        loading={loading === job.id}
                        onClick={() => updateJob(job.id, { status: 'COMPLETED' })}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Done
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={loading === job.id}
                        onClick={() => updateJob(job.id, { status: 'FAILED' })}
                        title="Mark Failed"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {job.status === 'PAUSED' && (
                    <Button
                      size="sm"
                      loading={loading === job.id}
                      onClick={() => updateJob(job.id, { status: 'PRINTING' })}
                    >
                      <Play className="h-4 w-4" />
                      Resume
                    </Button>
                  )}
                  {job.status === 'QUEUED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAssignTarget(job)
                        setSelectedPrinter('')
                      }}
                    >
                      <Play className="h-4 w-4" />
                      Assign Printer
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Assign Printer Modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Assign Printer</h2>
            <p className="mb-4 text-sm text-slate-500">
              Assigning printer for job in order {assignTarget.order.orderNumber}
            </p>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="mb-4 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="">Select a printer</option>
              {printers
                .filter((p) => p.isActive && p.printJobs.length === 0)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.model})
                  </option>
                ))}
            </select>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAssignTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={!selectedPrinter}>
                Start Printing
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
