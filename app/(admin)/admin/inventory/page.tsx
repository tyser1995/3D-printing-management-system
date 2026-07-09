import { AlertTriangle } from 'lucide-react'
import AdminHeader from '@/components/layout/AdminHeader'
import { prisma } from '@/lib/prisma/client'
import InventoryClient from './InventoryClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Inventory | Admin' }

export default async function AdminInventoryPage() {
  const [filaments, materials, suppliers] = await Promise.all([
    prisma.filament.findMany({
      where: { isActive: true },
      include: {
        material: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.filamentMaterial.findMany({ orderBy: { name: 'asc' } }),
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ])

  const lowStockCount = filaments.filter((f) => f.stockGrams < f.lowStockAlertG).length

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Filament Inventory" />

      <div className="flex-1 overflow-y-auto p-6">
        {lowStockCount > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <p className="text-sm font-medium text-amber-700">
              {lowStockCount} filament{lowStockCount !== 1 ? 's are' : ' is'} running low on stock.
            </p>
          </div>
        )}

        <InventoryClient
          initialFilaments={filaments.map((f) => ({
            ...f,
            pricePerKg: Number(f.pricePerKg),
          }))}
          materials={materials}
          suppliers={suppliers}
        />
      </div>
    </div>
  )
}
