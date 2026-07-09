import { PrismaClient } from '@/app/generated/prisma'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? ''

  if (url.startsWith('file:')) {
    // SQLite (local dev) — adapter reads DATABASE_URL from env automatically
    const adapter = new PrismaBetterSqlite3({ url })
    return new PrismaClient({ adapter })
  }

  // PostgreSQL (Supabase / production)
  const adapter = new PrismaPg({ connectionString: url })
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
