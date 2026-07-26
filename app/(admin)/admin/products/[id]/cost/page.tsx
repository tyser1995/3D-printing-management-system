import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AdminHeader from '@/components/layout/AdminHeader'
import { prisma } from '@/lib/prisma/client'
import CostCalculatorForm from '@/components/admin/products/CostCalculatorForm'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } })
  return { title: product ? `Cost Config — ${product.name} | Admin` : 'Cost Config | Admin' }
}

export default async function ProductCostPage({ params }: Props) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: { costConfig: true },
  })

  if (!product) notFound()

  const cfg = product.costConfig

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Cost Calculator" />

      <div className="flex-1 overflow-y-auto p-6">
        <Link
          href="/admin/products"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>

        <CostCalculatorForm
          productId={product.id}
          productName={product.name}
          initialData={
            cfg
              ? {
                  filamentGrams: cfg.filamentGrams,
                  filamentCostPerG: Number(cfg.filamentCostPerG),
                  printHours: cfg.printHours,
                  electricityKwh: cfg.electricityKwh,
                  electricityCost: Number(cfg.electricityCost),
                  laborHours: cfg.laborHours,
                  laborRatePerHour: Number(cfg.laborRatePerHour),
                  packagingCost: Number(cfg.packagingCost),
                  shippingCost: Number(cfg.shippingCost),
                  profitMargin: cfg.profitMargin,
                }
              : undefined
          }
        />
      </div>
    </div>
  )
}
