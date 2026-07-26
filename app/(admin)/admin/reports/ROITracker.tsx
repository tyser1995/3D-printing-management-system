'use client'

import { useState } from 'react'
import { Pencil, Target } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatCurrency, formatDate } from '@/lib/utils/format'

interface RoiSettings {
  investmentAmount?: number
  targetMonths?: number
  startDate?: string
}

interface Props {
  roi: RoiSettings
  takeHomeAmount: number
}

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.4375

function monthsBetween(start: Date, end: Date) {
  return Math.max(0, (end.getTime() - start.getTime()) / MS_PER_MONTH)
}

function addMonths(start: Date, months: number) {
  return new Date(start.getTime() + months * MS_PER_MONTH)
}

export default function ROITracker({ roi: initialRoi, takeHomeAmount }: Props) {
  const [roi, setRoi] = useState(initialRoi)
  const [editing, setEditing] = useState(!initialRoi.investmentAmount)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    investmentAmount: initialRoi.investmentAmount?.toString() ?? '',
    targetMonths: initialRoi.targetMonths?.toString() ?? '3',
    startDate: initialRoi.startDate ?? new Date().toISOString().slice(0, 10),
  })

  const save = async () => {
    const investmentAmount = Number(form.investmentAmount)
    const targetMonths = Number(form.targetMonths)
    if (!investmentAmount || investmentAmount <= 0) return
    if (!targetMonths || targetMonths <= 0) return

    const next: RoiSettings = { investmentAmount, targetMonths, startDate: form.startDate }
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roi: next }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setRoi(next)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ROI Target</CardTitle>
        </CardHeader>
        <p className="mb-4 text-sm text-slate-500">
          Set what you invested and how many months you&apos;re targeting to earn it back. Progress
          is tracked against the all-time Take-Home Amount above.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Investment Amount (₱)"
            type="number"
            min="0"
            step="0.01"
            value={form.investmentAmount}
            onChange={(e) => setForm((f) => ({ ...f, investmentAmount: e.target.value }))}
            placeholder="e.g. 50000"
          />
          <Input
            label="Target Months"
            type="number"
            min="1"
            step="1"
            value={form.targetMonths}
            onChange={(e) => setForm((f) => ({ ...f, targetMonths: e.target.value }))}
            placeholder="e.g. 3"
          />
          <Input
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" loading={saving} onClick={save}>
            Save Target
          </Button>
          {roi.investmentAmount != null && (
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
      </Card>
    )
  }

  const investment = roi.investmentAmount ?? 0
  const targetMonths = roi.targetMonths ?? 1
  const startDate = new Date(roi.startDate!)
  const now = new Date()

  const recoveredPct = investment > 0 ? Math.min(100, (takeHomeAmount / investment) * 100) : 0
  const remaining = Math.max(0, investment - takeHomeAmount)

  const elapsedMonths = monthsBetween(startDate, now)
  const monthsRemaining = Math.max(0, targetMonths - elapsedMonths)
  const pacePct = Math.min(100, (elapsedMonths / targetMonths) * 100)

  const isRecovered = takeHomeAmount >= investment
  const onTrack = isRecovered || recoveredPct >= pacePct

  const monthlyRunRate = elapsedMonths >= 1 ? takeHomeAmount / elapsedMonths : takeHomeAmount
  const projectedMonths = monthlyRunRate > 0 ? investment / monthlyRunRate : null
  const projectedDate = projectedMonths ? addMonths(startDate, projectedMonths) : null

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-500" />
          <CardTitle>ROI Target</CardTitle>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </CardHeader>

      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {formatCurrency(takeHomeAmount)} recovered of {formatCurrency(investment)} invested since{' '}
          {formatDate(startDate)}
        </p>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isRecovered
              ? 'bg-green-100 text-green-700'
              : onTrack
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isRecovered ? 'Recovered' : onTrack ? 'On Track' : 'Behind Pace'}
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${isRecovered ? 'bg-green-500' : 'bg-orange-500'}`}
          style={{ width: `${recoveredPct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">{recoveredPct.toFixed(1)}% recovered</p>

      <div className="mt-5 grid gap-6 sm:grid-cols-3">
        <div>
          <p className="text-sm text-slate-500">Remaining to Recover</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(remaining)}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Target Window</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {elapsedMonths.toFixed(1)} / {targetMonths} mo
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {isRecovered
              ? 'Goal already met'
              : `${monthsRemaining.toFixed(1)} months left in target`}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Projected Payback</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {isRecovered
              ? formatDate(now)
              : projectedDate
                ? formatDate(projectedDate)
                : 'Not enough data yet'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">at current take-home run rate</p>
        </div>
      </div>
    </Card>
  )
}
