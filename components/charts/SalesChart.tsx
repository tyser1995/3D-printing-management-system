'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/format'

export interface SalesChartPoint {
  month: string
  revenue: number
  orders: number
}

interface Props {
  data: SalesChartPoint[]
}

export default function SalesChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#f97316"
          strokeWidth={2.5}
          fill="url(#colorRevenue)"
          dot={false}
          activeDot={{ r: 5, fill: '#f97316' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
