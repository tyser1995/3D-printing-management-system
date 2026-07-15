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

        const conflicts = await findAlternateKeyConflicts(tx, model, notExisting)
        const toInsert = notExisting.filter((r) => !conflicts.has(r.id))
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

        const conflicts = await findAlternateKeyConflicts(tx, model, notExisting)
        const toInsert = notExisting.filter((r) => !conflicts.has(r.id))

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

        if (toInsert.length > 0 || toUpdate.length > 0 || conflicts.size > 0) {
          counts[model] = {
            inserted: toInsert.length,
            updated: toUpdate.length,
            skipped: conflicts.size,
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
