import AdminHeader from '@/components/layout/AdminHeader'
import { prisma } from '@/lib/prisma/client'
import PrintQueueClient from './PrintQueueClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Print Queue | Admin' }

export default async function AdminPrintQueuePage() {
  const [jobs, printers] = await Promise.all([
    prisma.printJob.findMany({
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      include: {
        order: {
          include: {
            user: { select: { name: true, email: true } },
            items: { include: { product: { select: { name: true } } } },
          },
        },
        printer: { select: { id: true, name: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.printer.findMany({
      where: { isActive: true },
      include: {
        printJobs: {
          where: { status: 'PRINTING' },
          include: {
            order: {
              include: { items: { include: { product: { select: { name: true } } }, take: 1 } },
            },
          },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Print Queue" />
      <div className="flex-1 overflow-y-auto p-6">
        <PrintQueueClient initialJobs={jobs} printers={printers} />
      </div>
    </div>
  )
}
