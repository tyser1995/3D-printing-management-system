'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { usePagination } from '@/lib/hooks/usePagination'

interface CustomerRow {
  id: string
  name: string | null
  email: string
  orderCount: number
  totalSpent: number
  lastOrder: string | Date | null
  status: string
}

interface Props {
  customers: CustomerRow[]
}

export default function CustomersClient({ customers }: Props) {
  const [query, setQuery] = useState('')

  const filtered = customers.filter((c) => {
    const q = query.toLowerCase()
    return (c.name ?? '').toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  })
  const { page, pageCount, total, pageSize, pageItems, setPage, resetPage } =
    usePagination(filtered)

  const handleQueryChange = (value: string) => {
    setQuery(value)
    resetPage()
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
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
                {['Customer', 'Email', 'Orders', 'Total Spent', 'Last Order', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((customer) => (
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    {query ? 'No customers match your search.' : 'No customers yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </Card>
    </>
  )
}
