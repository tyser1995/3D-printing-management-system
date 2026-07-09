import { cn } from '@/lib/utils/cn'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  children: React.ReactNode
  className?: string
}

const config = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle,
    iconClass: 'text-green-500',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: XCircle,
    iconClass: 'text-red-500',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: Info,
    iconClass: 'text-blue-500',
  },
}

export default function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const { container, icon: Icon, iconClass } = config[variant]
  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', container, className)}>
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', iconClass)} />
      <div>
        {title && <p className="mb-1 font-semibold">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  )
}
