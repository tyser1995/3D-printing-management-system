import { Search } from 'lucide-react'
import AdminHeader from '@/components/layout/AdminHeader'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { prisma } from '@/lib/prisma/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'

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
    return { id: c.id, name: c.name, email: c.email, orderCount, totalSpent, lastOrder, status }
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

        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search customers..."
              className="h-9 w-64 rounded-lg border border-slate-200 bg-white pr-4 pl-9 text-sm focus:border-orange-400 focus:outline-none"
            />
          </div>
        </div>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Customer', 'Email', 'Orders', 'Total Spent', 'Last Order', 'Status'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerRows.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-bold text-white">
                          {(customer.name ?? customer.email).charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-slate-900">{customer.name ?? '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{customer.orderCount}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {customer.lastOrder
                        ? formatDate(String(customer.lastOrder), {
                            month: 'short',
                            day: 'numeric',
                            year: undefined,
                          })
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          customer.status === 'Active'
                            ? 'success'
                            : customer.status === 'New'
                              ? 'primary'
                              : 'default'
                        }
                      >
                        {customer.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {customerRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      No customers yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
