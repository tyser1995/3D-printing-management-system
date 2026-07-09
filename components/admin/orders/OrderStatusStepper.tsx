'use client'

import { CheckCircle2, Circle, Clock } from 'lucide-react'

const ORDER_STEPS = [
  { status: 'PENDING', label: 'Order Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'IN_PRINT_QUEUE', label: 'In Queue' },
  { status: 'PRINTING', label: 'Printing' },
  { status: 'PRINTED', label: 'Printed' },
  { status: 'QUALITY_CHECK', label: 'QC Check' },
  { status: 'PACKAGING', label: 'Packaging' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
]

const STATUS_ORDER = ORDER_STEPS.map((s) => s.status)

interface StatusLog {
  id: string
  status: string
  notes: string | null
  createdAt: string | Date
}

interface OrderStatusStepperProps {
  currentStatus: string
  statusLogs: StatusLog[]
}

export default function OrderStatusStepper({ currentStatus, statusLogs }: OrderStatusStepperProps) {
  if (currentStatus === 'CANCELLED' || currentStatus === 'RETURNED') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
        Order is {currentStatus.toLowerCase()}.
      </div>
    )
  }

  const currentIdx = STATUS_ORDER.indexOf(currentStatus)

  const logsByStatus = statusLogs.reduce<Record<string, StatusLog>>((acc, log) => {
    acc[log.status] = log
    return acc
  }, {})

  return (
    <ol className="relative space-y-0">
      {ORDER_STEPS.map((step, idx) => {
        const isDone = idx < currentIdx
        const isCurrent = idx === currentIdx
        const log = logsByStatus[step.status]

        return (
          <li key={step.status} className="flex gap-4">
            {/* Icon + connector */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isDone
                    ? 'border-green-500 bg-green-500 text-white'
                    : isCurrent
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-slate-200 bg-white text-slate-300'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              {idx < ORDER_STEPS.length - 1 && (
                <div
                  className={`w-0.5 flex-1 ${isDone ? 'bg-green-300' : 'bg-slate-200'}`}
                  style={{ minHeight: 24 }}
                />
              )}
            </div>

            {/* Content */}
            <div className="pt-1 pb-6">
              <p
                className={`text-sm font-medium ${isCurrent ? 'text-orange-600' : isDone ? 'text-slate-900' : 'text-slate-400'}`}
              >
                {step.label}
              </p>
              {log && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {new Date(log.createdAt).toLocaleString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {log.notes && ` — ${log.notes}`}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
