import AdminHeader from '@/components/layout/AdminHeader'
import { prisma } from '@/lib/prisma/client'
import { formatCurrency } from '@/lib/utils/format'
import CustomersClient from './CustomersClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Customers | Admin' }

export default async function AdminCustomersPage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [customers, newThisMonth, avgOrderAgg] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: {
        orders: {
          where: { status: { notIn: ['CANCELLED', 'RETURNED'] }, deletedAt: null },
          select: { total: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: monthStart } } }),
    prisma.order.aggregate({
      where: { status: { notIn: ['CANCELLED', 'RETURNED'] } },
      _avg: { total: true },
    }),
  ])

  const totalCustomers = customers.length
  const activeCustomers = customers.filter((c) => c.orders.length > 0).length
  const avgOrder = Number(avgOrderAgg._avg.total ?? 0)

  const nowMs = now.getTime()
  const customerRows = customers.map((c) => {
    const totalSpent = c.orders.reduce((s, o) => s + Number(o.total), 0)
    const lastOrder = c.orders[0]?.createdAt ?? null
    const orderCount = c.orders.length
    const status =
      orderCount === 0
        ? 'Inactive'
        : nowMs - (c.createdAt?.getTime() ?? 0) < 30 * 24 * 60 * 60 * 1000
          ? 'New'
          : 'Active'
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      orderCount,
      totalSpent,
      lastOrder,
      status,
    }
  })

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Customers" />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Customers', value: String(totalCustomers) },
            { label: 'New This Month', value: String(newThisMonth) },
            { label: 'Active', value: String(activeCustomers) },
            { label: 'Avg. Order Value', value: formatCurrency(avgOrder) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <CustomersClient customers={customerRows} />
      </div>
    </div>
  )
}
