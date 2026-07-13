import type { PrismaClient } from '@/app/generated/prisma'

const SKU_PATTERN = /^([A-Z0-9]+)-(\d+)$/

function prefixFromCategoryName(name: string) {
  const letters = name.replace(/[^a-zA-Z]/g, '').toUpperCase()
  return letters.slice(0, 3) || 'PRD'
}

async function dominantPrefixInCategory(prisma: PrismaClient, categoryId: string) {
  const products = await prisma.product.findMany({ where: { categoryId }, select: { sku: true } })

  const counts = new Map<string, number>()
  for (const { sku } of products) {
    const match = sku.match(SKU_PATTERN)
    if (match) counts.set(match[1], (counts.get(match[1]) ?? 0) + 1)
  }
  if (counts.size === 0) return null

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

export async function generateNextSku(
  prisma: PrismaClient,
  categoryId: string,
  categoryName: string
) {
  // Continue whatever prefix this category's products already use, so a category
  // seeded with e.g. KCH-001/KCH-002 keeps growing as KCH-003 rather than starting
  // a new prefix derived fresh from the category name.
  const prefix =
    (await dominantPrefixInCategory(prisma, categoryId)) ?? prefixFromCategoryName(categoryName)

  const existing = await prisma.product.findMany({
    where: { sku: { startsWith: `${prefix}-` } },
    select: { sku: true },
  })

  let max = 0
  const pattern = new RegExp(`^${prefix}-(\\d+)$`)
  for (const { sku } of existing) {
    const match = sku.match(pattern)
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }

  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}
