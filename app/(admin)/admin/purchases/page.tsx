import AdminHeader from '@/components/layout/AdminHeader'
import { prisma } from '@/lib/prisma/client'
import PurchasesClient from './PurchasesClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Purchases | Admin' }

export default async function AdminPurchasesPage() {
  const [purchases, suppliers] = await Promise.all([
    prisma.purchase.findMany({
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { orderedAt: 'desc' },
    }),
    prisma.supplier.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Purchases" />
      <div className="flex-1 overflow-y-auto p-6">
        <PurchasesClient
          initialPurchases={purchases.map((p) => ({
            id: p.id,
            itemName: p.itemName,
            category: p.category,
            quantity: p.quantity,
            unit: p.unit,
            unitCost: Number(p.unitCost),
            totalCost: Number(p.totalCost),
            status: p.status,
            orderedAt: p.orderedAt,
            receivedAt: p.receivedAt,
            notes: p.notes,
            supplier: p.supplier,
          }))}
          suppliers={suppliers}
        />
      </div>
    </div>
  )
}
