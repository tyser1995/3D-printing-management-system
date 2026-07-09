import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'text-orange-500',
  iconBg = 'bg-orange-50',
}: StatsCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {change && (
            <p
              className={cn(
                'mt-1 text-sm font-medium',
                changeType === 'up' && 'text-green-600',
                changeType === 'down' && 'text-red-500',
                changeType === 'neutral' && 'text-slate-500'
              )}
            >
              {changeType === 'up' && '↑ '}
              {changeType === 'down' && '↓ '}
              {change}
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-3', iconBg)}>
          <Icon className={cn('h-6 w-6', iconColor)} />
        </div>
      </div>
    </div>
  )
}
