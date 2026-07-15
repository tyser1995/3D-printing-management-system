import type { Prisma, PrismaClient } from '@/app/generated/prisma'

// Ordered parents-first so FK targets always exist before dependents are inserted.
// Reversed for deletion so dependents are cleared before their FK targets.
export const BACKUP_MODELS = [
  'user',
  'category',
  'supplier',
  'purchase',
  'filamentMaterial',
  'printer',
  'address',
  'product',
  'productImage',
  'costConfig',
  'filament',
  'stockMovement',
  'order',
  'orderItem',
  'orderStatusLog',
  'quotation',
  'invoice',
  'printJob',
  'maintenanceLog',
  'review',
  'reviewReply',
  'cartItem',
  'wishlistItem',
] as const

export type BackupModel = (typeof BACKUP_MODELS)[number]
export type BackupData = Partial<Record<BackupModel, Record<string, unknown>[]>>

type Delegate = {
  findMany: (args?: unknown) => Promise<Record<string, unknown>[]>
  deleteMany: (args?: { where?: Record<string, unknown> }) => Promise<unknown>
  createMany: (args: { data: Record<string, unknown>[] }) => Promise<unknown>
  update: (args: unknown) => Promise<unknown>
}

function delegate(client: PrismaClient | Prisma.TransactionClient, model: BackupModel): Delegate {
  return (client as unknown as Record<BackupModel, Delegate>)[model]
}

// Unique constraints besides `id`, grouped so composite ones (like the
// [userId, productId] on cart/wishlist items) are checked together. A sample
// row can collide on one of these under a completely different id — e.g. a
// category the user made themselves ends up with the same slug as a bundled
// sample category — which would otherwise crash createMany with a unique
// constraint error.
const ALTERNATE_UNIQUE_KEYS: Partial<Record<BackupModel, string[][]>> = {
  user: [['email']],
  category: [['name'], ['slug']],
  product: [['slug'], ['sku']],
  costConfig: [['productId']],
  order: [['orderNumber']],
  quotation: [['orderId'], ['quoteNumber']],
  invoice: [['orderId'], ['invoiceNumber']],
  filamentMaterial: [['name']],
  cartItem: [['userId', 'productId']],
  wishlistItem: [['userId', 'productId']],
  review: [['productId', 'userId']],
}

// Returns the ids of `rows` that collide with an existing row (under a
// different id) on one of the model's alternate unique constraints. Those
// rows can't be inserted as-is and aren't "ours" to overwrite either, since
// they belong to whatever real record the user already created.
async function findAlternateKeyConflicts(
  tx: Prisma.TransactionClient,
  model: BackupModel,
  rows: Record<string, unknown>[]
): Promise<Set<unknown>> {
  const keyGroups = ALTERNATE_UNIQUE_KEYS[model]
  const conflicts = new Set<unknown>()
  if (!keyGroups || rows.length === 0) return conflicts

  for (const keys of keyGroups) {
    const candidates = rows.filter((r) => keys.every((k) => r[k] != null))
    if (candidates.length === 0) continue

    const existing = await delegate(tx, model).findMany({
      where: { OR: candidates.map((r) => Object.fromEntries(keys.map((k) => [k, r[k]]))) },
    })

    for (const row of candidates) {
      const collides = existing.some((e) => e.id !== row.id && keys.every((k) => e[k] === row[k]))
      if (collides) conflicts.add(row.id)
    }
  }

  return conflicts
}

// Foreign keys (besides self-referencing category.parentId, handled inline)
// that point at another BACKUP_MODELS row. When a row is skipped because it
// collides with the user's own data (see findAlternateKeyConflicts), nothing
// with that id ever gets inserted — so any row pointing at it via one of
// these FKs must be skipped too, or the insert fails with a foreign key
// constraint error instead of a unique constraint one.
const FK_PARENTS: Partial<Record<BackupModel, Record<string, BackupModel>>> = {
  address: { userId: 'user' },
  product: { categoryId: 'category' },
  productImage: { productId: 'product' },
  costConfig: { productId: 'product' },
  filament: { materialId: 'filamentMaterial', supplierId: 'supplier' },
  stockMovement: { filamentId: 'filament' },
  order: { userId: 'user', addressId: 'address' },
  orderItem: { orderId: 'order', productId: 'product' },
  orderStatusLog: { orderId: 'order' },
  quotation: { orderId: 'order' },
  invoice: { orderId: 'order' },
  printJob: { orderId: 'order', printerId: 'printer' },
  maintenanceLog: { printerId: 'printer' },
  review: { productId: 'product', userId: 'user' },
  reviewReply: { reviewId: 'review' },
  cartItem: { userId: 'user', productId: 'product' },
  wishlistItem: { userId: 'user', productId: 'product' },
}

// Splits `rows` into those safe to insert and those referencing an id that
// was skipped earlier in this same run (BACKUP_MODELS is ordered parent-first,
// so by the time a child model is processed every parent it could reference
// has already been resolved).
function splitCascadeSkipped(
  model: BackupModel,
  rows: Record<string, unknown>[],
  skippedIds: Map<BackupModel, Set<unknown>>
): { ok: Record<string, unknown>[]; skipped: Record<string, unknown>[] } {
  const fkMap = FK_PARENTS[model]
  if (!fkMap) return { ok: rows, skipped: [] }

  const ok: Record<string, unknown>[] = []
  const skipped: Record<string, unknown>[] = []
  for (const row of rows) {
    const blocked = Object.entries(fkMap).some(([field, parentModel]) => {
      const value = row[field]
      return value != null && skippedIds.get(parentModel)?.has(value)
    })
    ;(blocked ? skipped : ok).push(row)
  }
  return { ok, skipped }
}

export async function exportBackup(prisma: PrismaClient) {
  const data: BackupData = {}
  for (const model of BACKUP_MODELS) {
    data[model] = await delegate(prisma, model).findMany()
  }
  return data
}

export async function importBackup(prisma: PrismaClient, data: BackupData) {
  const counts: Partial<Record<BackupModel, number>> = {}

  await prisma.$transaction(
    async (tx) => {
      for (const model of [...BACKUP_MODELS].reverse()) {
        await delegate(tx, model).deleteMany()
      }

      for (const model of BACKUP_MODELS) {
        const rows = data[model] ?? []
        if (rows.length === 0) continue

        if (model === 'category') {
          // Self-referencing parentId: insert flat, then re-link in a second pass.
          const flat = rows.map((r) => ({ ...r, parentId: null }))
          await delegate(tx, model).createMany({ data: flat })
          for (const row of rows) {
            if (row.parentId) {
              await delegate(tx, model).update({
                where: { id: row.id },
                data: { parentId: row.parentId },
              })
            }
          }
        } else {
          await delegate(tx, model).createMany({ data: rows })
        }

        counts[model] = rows.length
      }
    },
    { timeout: 60_000 }
  )

  return counts
}

// Adds rows from `data` that aren't already present (by id), without touching
// anything else. Safe to call repeatedly — used for toggling bundled sample data
// on without disturbing real data the user has entered.
// Note: skipDuplicates isn't supported on SQLite, so existing ids are filtered
// out in JS instead.
export async function mergeBackup(prisma: PrismaClient, data: BackupData) {
  const counts: Partial<Record<BackupModel, number>> = {}
  const skippedIds = new Map<BackupModel, Set<unknown>>()

  await prisma.$transaction(
    async (tx) => {
      for (const model of BACKUP_MODELS) {
        const rows = data[model] ?? []
        if (rows.length === 0) continue

        const ids = rows.map((r) => r.id)
        const existing = await delegate(tx, model).findMany({
          where: { id: { in: ids } },
          select: { id: true },
        })
        const existingIds = new Set(existing.map((r) => r.id))
        const notExisting = rows.filter((r) => !existingIds.has(r.id))
        if (notExisting.length === 0) continue

        const { ok, skipped: cascaded } = splitCascadeSkipped(model, notExisting, skippedIds)
        const conflicts = await findAlternateKeyConflicts(tx, model, ok)
        const toInsert = ok.filter((r) => !conflicts.has(r.id))

        const skippedThisModel = new Set<unknown>([...conflicts, ...cascaded.map((r) => r.id)])
        if (skippedThisModel.size > 0) skippedIds.set(model, skippedThisModel)

        if (toInsert.length === 0) continue

        if (model === 'category') {
          const flat = toInsert.map((r) => ({ ...r, parentId: null }))
          await delegate(tx, model).createMany({ data: flat })
          for (const row of toInsert) {
            if (row.parentId) {
              await delegate(tx, model).update({
                where: { id: row.id },
                data: { parentId: row.parentId },
              })
            }
          }
        } else {
          await delegate(tx, model).createMany({ data: toInsert })
        }

        counts[model] = toInsert.length
      }
    },
    { timeout: 60_000 }
  )

  return counts
}

// Adds rows from `data` that aren't already present (by id), and overwrites
// the fields of rows that are (regardless of whether anything actually
// differs), so edits made to the bundled JSON (e.g. a filament price change)
// reach the database. Rows not present in `data` are left alone — this never
// deletes anything, even in production.
export async function upsertBackup(prisma: PrismaClient, data: BackupData) {
  const counts: Partial<
    Record<BackupModel, { inserted: number; updated: number; skipped: number }>
  > = {}
  const skippedIds = new Map<BackupModel, Set<unknown>>()

  await prisma.$transaction(
    async (tx) => {
      for (const model of BACKUP_MODELS) {
        const rows = data[model] ?? []
        if (rows.length === 0) continue

        const ids = rows.map((r) => r.id)
        const existing = await delegate(tx, model).findMany({
          where: { id: { in: ids } },
          select: { id: true },
        })
        const existingIds = new Set(existing.map((r) => r.id))
        const notExisting = rows.filter((r) => !existingIds.has(r.id))
        const toUpdate = rows.filter((r) => existingIds.has(r.id))

        const { ok, skipped: cascaded } = splitCascadeSkipped(model, notExisting, skippedIds)
        const conflicts = await findAlternateKeyConflicts(tx, model, ok)
        const toInsert = ok.filter((r) => !conflicts.has(r.id))

        const skippedThisModel = new Set<unknown>([...conflicts, ...cascaded.map((r) => r.id)])
        if (skippedThisModel.size > 0) skippedIds.set(model, skippedThisModel)

        if (toInsert.length > 0) {
          if (model === 'category') {
            const flat = toInsert.map((r) => ({ ...r, parentId: null }))
            await delegate(tx, model).createMany({ data: flat })
            for (const row of toInsert) {
              if (row.parentId) {
                await delegate(tx, model).update({
                  where: { id: row.id },
                  data: { parentId: row.parentId },
                })
              }
            }
          } else {
            await delegate(tx, model).createMany({ data: toInsert })
          }
        }

        for (const row of toUpdate) {
          const { id, ...fields } = row
          await delegate(tx, model).update({ where: { id }, data: fields })
        }

        if (toInsert.length > 0 || toUpdate.length > 0 || skippedThisModel.size > 0) {
          counts[model] = {
            inserted: toInsert.length,
            updated: toUpdate.length,
            skipped: skippedThisModel.size,
          }
        }
      }
    },
    { timeout: 60_000 }
  )

  return counts
}

// Removes exactly the rows in `data` (by id), children first. Rows that fail
// to delete (e.g. a real order referencing a sample product) are skipped and
// reported rather than aborting the whole operation.
export async function removeBackup(prisma: PrismaClient, data: BackupData) {
  const counts: Partial<Record<BackupModel, number>> = {}
  const blocked: Partial<Record<BackupModel, number>> = {}

  for (const model of [...BACKUP_MODELS].reverse()) {
    const rows = data[model] ?? []
    if (rows.length === 0) continue

    const ids = rows.map((r) => r.id)
    let deleted = 0
    try {
      const result = (await delegate(prisma, model).deleteMany({
        where: { id: { in: ids } },
      })) as { count: number }
      deleted = result.count
    } catch {
      // FK constraint — fall back to one-by-one so partial removal still succeeds.
      for (const id of ids) {
        try {
          await delegate(prisma, model).deleteMany({ where: { id } })
          deleted++
        } catch {
          blocked[model] = (blocked[model] ?? 0) + 1
        }
      }
    }
    if (deleted > 0) counts[model] = deleted
  }

  return { counts, blocked }
}

// Makes `target` match `source` exactly (used for local <-> Supabase live sync).
export async function syncBackup(source: PrismaClient, target: PrismaClient) {
  const data = await exportBackup(source)
  return importBackup(target, data)
}
