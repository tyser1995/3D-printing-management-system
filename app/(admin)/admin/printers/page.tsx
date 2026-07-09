import AdminHeader from '@/components/layout/AdminHeader'
import { prisma } from '@/lib/prisma/client'
import PrintersClient from './PrintersClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Printers | Admin' }

export default async function AdminPrintersPage() {
  const printers = await prisma.printer.findMany({
    include: {
      printJobs: {
        where: { status: { in: ['QUEUED', 'PRINTING', 'PAUSED'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          order: {
            include: { items: { include: { product: { select: { name: true } } }, take: 1 } },
          },
        },
      },
      _count: { select: { printJobs: true, maintenanceLogs: true } },
    },
    orderBy: { name: 'asc' },
  })

  const totalJobs = printers.reduce((s, p) => s + p._count.printJobs, 0)
  const activePrinters = printers.filter((p) => p.isActive && p.printJobs.length > 0).length

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Printers — Bambu Lab" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Printers', value: String(printers.length) },
            { label: 'Currently Printing', value: String(activePrinters) },
            { label: 'Total Jobs Run', value: String(totalJobs) },
            { label: 'Active', value: String(printers.filter((p) => p.isActive).length) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <PrintersClient initialPrinters={printers} />
      </div>
    </div>
  )
}
