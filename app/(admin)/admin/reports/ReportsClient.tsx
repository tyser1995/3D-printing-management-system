'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils/format'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface ChartPoint {
  name: string
  revenue: number
  orders: number
}
interface TopProduct {
  name: string
  units: number
  revenue: number
}
interface Kpis {
  revenue: number
  orders: number
  avgOrder: number
  revenueChange: number
}
interface Fulfillment {
  orderedRevenue: number
  deliveredRevenue: number
  orderedItems: number
  deliveredItems: number
  deliveredPct: number
  electricityFund: number
  totalPurchased: number
  netAfterPurchases: number
  takeHomeAmount: number
}

interface Props {
  chartData: ChartPoint[]
  topProducts: TopProduct[]
  kpis: Kpis
  fulfillment: Fulfillment
}

export default function ReportsClient({ chartData, topProducts, kpis, fulfillment }: Props) {
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const [exporting, setExporting] = useState(false)

  const exportCSV = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/reports/export?format=csv&period=${period}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download =
        res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ??
        'orders.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const displayData =
    chartData.length > 0 ? chartData : [{ name: 'No data', revenue: 0, orders: 0 }]
  const maxUnits = topProducts[0]?.units ?? 1

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {(['month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-orange-500 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" loading={exporting} onClick={exportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Revenue',
            value: formatCurrency(kpis.revenue),
            change: `${kpis.revenueChange >= 0 ? '+' : ''}${kpis.revenueChange.toFixed(1)}%`,
            up: kpis.revenueChange >= 0,
          },
          { label: 'Orders', value: String(kpis.orders), change: null, up: true },
          { label: 'Avg. Order', value: formatCurrency(kpis.avgOrder), change: null, up: true },
        ].map(({ label, value, change, up }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
            {change && (
              <p className={`mt-1 text-sm font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
                {up ? '↑' : '↓'} {change} vs last month
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={displayData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
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
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
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
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          {topProducts.length === 0 ? (
            <p className="text-sm text-slate-400">No sales data yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-slate-400">#{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">
                      {product.units} units · {formatCurrency(product.revenue)}
                    </p>
                  </div>
                  <div className="w-16">
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${(product.units / maxUnits) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Delivered vs Ordered (all-time) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Delivered vs Ordered (All-Time)</CardTitle>
        </CardHeader>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-slate-500">Revenue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatCurrency(fulfillment.deliveredRevenue)}
              <span className="ml-1 text-base font-normal text-slate-400">
                / {formatCurrency(fulfillment.orderedRevenue)}
              </span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-orange-500"
                style={{ width: `${Math.min(fulfillment.deliveredPct, 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {fulfillment.deliveredPct.toFixed(1)}% of ordered revenue has been delivered
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Items</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {fulfillment.deliveredItems}
              <span className="ml-1 text-base font-normal text-slate-400">
                / {fulfillment.orderedItems} ordered
              </span>
            </p>
            <p className="mt-3 text-xs text-slate-500">
              &ldquo;Ordered&rdquo; excludes cancelled/returned orders. &ldquo;Delivered&rdquo;
              counts only orders that have reached the Delivered status.
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Electricity Fund</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {formatCurrency(fulfillment.electricityFund)}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              ₱10 × {fulfillment.deliveredItems} delivered units, deducted from item revenue.
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Delivered − Purchased</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                fulfillment.netAfterPurchases >= 0 ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {formatCurrency(fulfillment.netAfterPurchases)}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              {formatCurrency(fulfillment.deliveredRevenue)} delivered revenue minus{' '}
              {formatCurrency(fulfillment.totalPurchased)} spent on material purchases (all-time,
              cancelled purchases excluded).
            </p>
          </div>
        </div>
      </Card>

      {/* Take-home (all-time) */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Take-Home Amount (All-Time)</CardTitle>
        </CardHeader>
        <p
          className={`text-3xl font-bold ${
            fulfillment.takeHomeAmount >= 0 ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {formatCurrency(fulfillment.takeHomeAmount)}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {formatCurrency(fulfillment.deliveredRevenue)} delivered revenue − (
          {formatCurrency(fulfillment.electricityFund)} electricity fund +{' '}
          {formatCurrency(fulfillment.totalPurchased)} material purchases).
        </p>
      </Card>
    </div>
  )
}
