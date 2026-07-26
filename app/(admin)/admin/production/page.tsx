import AdminHeader from '@/components/layout/AdminHeader'
import { prisma } from '@/lib/prisma/client'
import { getAvailableProductionStock, getCheckedOutQtyByLog } from '@/lib/data/production'
import { formatCurrency } from '@/lib/utils/format'
import ProductionClient from './ProductionClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Production Log | Admin' }

export default async function AdminProductionPage() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    logs,
    total,
    todayAgg,
    filaments,
    checkouts,
    checkoutAgg,
    availableStock,
    checkedOutByLog,
  ] = await Promise.all([
    prisma.productionLog.findMany({
      include: { filament: { select: { id: true, name: true, color: true, colorHex: true } } },
      orderBy: { producedAt: 'desc' },
      take: 100,
    }),
    prisma.productionLog.count(),
    prisma.productionLog.aggregate({
      _sum: { quantity: true },
      where: { producedAt: { gte: todayStart } },
    }),
    prisma.filament.findMany({
      where: { isActive: true },
      orderBy: { color: 'asc' },
      select: { id: true, name: true, color: true, colorHex: true },
    }),
    prisma.productionCheckout.findMany({
      include: { filament: { select: { id: true, name: true, color: true, colorHex: true } } },
      orderBy: { checkedOutAt: 'desc' },
      take: 100,
    }),
    prisma.productionCheckout.aggregate({ _sum: { totalAmount: true } }),
    getAvailableProductionStock(),
    getCheckedOutQtyByLog(),
  ])

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Production Log" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Entries', value: String(total) },
            { label: 'Produced Today', value: String(todayAgg._sum.quantity ?? 0) },
            { label: 'Filament Colors', value: String(filaments.length) },
            {
              label: 'Checkout Revenue',
              value: formatCurrency(Number(checkoutAgg._sum.totalAmount ?? 0)),
            },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <ProductionClient
          initialLogs={logs.map((l) => ({
            ...l,
            amount: Number(l.amount),
            checkedOutQty: checkedOutByLog.get(l.id) ?? 0,
          }))}
          filaments={filaments}
          initialCheckouts={checkouts.map((c) => ({
            ...c,
            unitPrice: Number(c.unitPrice),
            totalAmount: Number(c.totalAmount),
          }))}
          availableStock={availableStock}
        />
      </div>
    </div>
  )
}
