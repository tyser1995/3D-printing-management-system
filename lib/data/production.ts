import { prisma } from '@/lib/prisma/client'

export interface AvailableStockItem {
  product: string
  type: string | null
  item: string | null
  filamentId: string | null
  filament: { id: string; name: string; color: string; colorHex: string | null } | null
  producedQty: number
  checkedOutQty: number
  availableQty: number
  unitPrice: number
}

function stockKey(row: {
  product: string
  type: string | null
  item: string | null
  filamentId: string | null
}) {
  return `${row.product}|${row.type ?? ''}|${row.item ?? ''}|${row.filamentId ?? ''}`
}

export async function getAvailableProductionStock(): Promise<AvailableStockItem[]> {
  const [produced, checkedOut, filaments, logs] = await Promise.all([
    prisma.productionLog.groupBy({
      by: ['product', 'type', 'item', 'filamentId'],
      _sum: { quantity: true },
    }),
    prisma.productionCheckout.groupBy({
      by: ['product', 'type', 'item', 'filamentId'],
      _sum: { quantity: true },
    }),
    prisma.filament.findMany({ select: { id: true, name: true, color: true, colorHex: true } }),
    prisma.productionLog.findMany({
      select: {
        product: true,
        type: true,
        item: true,
        filamentId: true,
        quantity: true,
        amount: true,
      },
    }),
  ])

  const filamentMap = new Map(filaments.map((f) => [f.id, f]))
  const checkedOutMap = new Map(checkedOut.map((c) => [stockKey(c), c._sum.quantity ?? 0]))

  // Weighted-average unit price per stock combo, derived from logged production amounts.
  const priceAgg = new Map<string, { qty: number; total: number }>()
  for (const log of logs) {
    const key = stockKey(log)
    const entry = priceAgg.get(key) ?? { qty: 0, total: 0 }
    entry.qty += log.quantity
    entry.total += log.quantity * Number(log.amount)
    priceAgg.set(key, entry)
  }

  return produced
    .map((p) => {
      const producedQty = p._sum.quantity ?? 0
      const checkedOutQty = checkedOutMap.get(stockKey(p)) ?? 0
      const price = priceAgg.get(stockKey(p))
      return {
        product: p.product,
        type: p.type,
        item: p.item,
        filamentId: p.filamentId,
        filament: p.filamentId ? (filamentMap.get(p.filamentId) ?? null) : null,
        producedQty,
        checkedOutQty,
        availableQty: producedQty - checkedOutQty,
        unitPrice: price && price.qty > 0 ? price.total / price.qty : 0,
      }
    })
    .sort((a, b) => a.product.localeCompare(b.product))
}

/** Batched form of getAvailableQtyFor — one pair of groupBy queries covering every stock combo, instead of one pair per row. */
export async function getAvailableQtyMap(): Promise<Map<string, number>> {
  const [produced, checkedOut] = await Promise.all([
    prisma.productionLog.groupBy({
      by: ['product', 'type', 'item', 'filamentId'],
      _sum: { quantity: true },
    }),
    prisma.productionCheckout.groupBy({
      by: ['product', 'type', 'item', 'filamentId'],
      _sum: { quantity: true },
    }),
  ])

  const checkedOutMap = new Map(checkedOut.map((c) => [stockKey(c), c._sum.quantity ?? 0]))

  const map = new Map<string, number>()
  for (const p of produced) {
    const key = stockKey(p)
    map.set(key, (p._sum.quantity ?? 0) - (checkedOutMap.get(key) ?? 0))
  }
  return map
}

export async function getAvailableQtyFor(row: {
  product: string
  type: string | null
  item: string | null
  filamentId: string | null
}) {
  const [produced, checkedOut] = await Promise.all([
    prisma.productionLog.aggregate({
      _sum: { quantity: true },
      where: {
        product: row.product,
        type: row.type,
        item: row.item,
        filamentId: row.filamentId,
      },
    }),
    prisma.productionCheckout.aggregate({
      _sum: { quantity: true },
      where: {
        product: row.product,
        type: row.type,
        item: row.item,
        filamentId: row.filamentId,
      },
    }),
  ])

  return (produced._sum.quantity ?? 0) - (checkedOut._sum.quantity ?? 0)
}

export async function getAvailableQtyForLog(productionLogId: string) {
  const [log, checkedOut] = await Promise.all([
    prisma.productionLog.findUnique({
      where: { id: productionLogId },
      select: { quantity: true },
    }),
    prisma.productionCheckout.aggregate({
      _sum: { quantity: true },
      where: { productionLogId },
    }),
  ])

  if (!log) return 0
  return log.quantity - (checkedOut._sum.quantity ?? 0)
}

export async function getCheckedOutQtyByLog(): Promise<Map<string, number>> {
  const grouped = await prisma.productionCheckout.groupBy({
    by: ['productionLogId'],
    _sum: { quantity: true },
  })

  const map = new Map<string, number>()
  for (const g of grouped) {
    if (g.productionLogId) map.set(g.productionLogId, g._sum.quantity ?? 0)
  }
  return map
}
