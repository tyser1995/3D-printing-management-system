import { PrismaClient } from '@/app/generated/prisma'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'
import fs from 'node:fs'
import path from 'node:path'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function isValidPostgresUrl(url: string): boolean {
  if (!url || !URL.canParse(url)) return false
  const protocol = new URL(url).protocol
  return protocol === 'postgres:' || protocol === 'postgresql:'
}

// No file: URL and no valid Postgres URL configured (e.g. deployed with no database
// wired up yet) — fall back to a bundled read-only demo dataset, copied into Vercel's
// writable /tmp so the site stays usable instead of 500ing on every request.
function resolveDemoSqliteUrl(): string {
  const demoPath = path.join('/tmp', 'kai3d-demo.db')
  if (!fs.existsSync(demoPath)) {
    fs.copyFileSync(path.join(process.cwd(), 'data', 'demo-seed.db'), demoPath)
  }
  return `file:${demoPath}`
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? ''

  if (isValidPostgresUrl(url)) {
    const adapter = new PrismaPg({ connectionString: url })
    return new PrismaClient({ adapter })
  }

  const sqliteUrl = url.startsWith('file:') ? url : resolveDemoSqliteUrl()
  const adapter = new PrismaBetterSqlite3({ url: sqliteUrl })
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
