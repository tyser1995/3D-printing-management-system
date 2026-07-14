import { readFile } from 'fs/promises'
import { join } from 'path'
import AdminHeader from '@/components/layout/AdminHeader'
import SettingsClient from './SettingsClient'
import CategoriesManager from './CategoriesManager'
import MaterialsManager from './MaterialsManager'
import SuppliersManager from './SuppliersManager'
import BackupManager from './BackupManager'
import SampleDataManager from './SampleDataManager'
import DataVisibilityManager from './DataVisibilityManager'
import { prisma } from '@/lib/prisma/client'
import { getSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings | Admin' }

async function loadSampleDataEnabled() {
  try {
    const raw = await readFile(join(process.cwd(), 'data', 'sample-data.json'), 'utf-8')
    const { data } = JSON.parse(raw)
    const firstCategoryId = data.category?.[0]?.id
    if (!firstCategoryId) return false
    const found = await prisma.category.findUnique({ where: { id: firstCategoryId } })
    return !!found
  } catch {
    return false
  }
}

export default async function AdminSettingsPage() {
  const [settings, categories, materials, suppliers, sampleDataEnabled] = await Promise.all([
    getSettings(),
    prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.filamentMaterial.findMany({
      include: { _count: { select: { filaments: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.supplier.findMany({
      include: { _count: { select: { filaments: true, purchases: true } } },
      orderBy: { name: 'asc' },
    }),
    loadSampleDataEnabled(),
  ])
  const dbSource = (process.env.DATABASE_URL ?? '').startsWith('file:') ? 'sqlite' : 'postgres'

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Settings" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <SettingsClient initialSettings={settings} />
          <CategoriesManager initialCategories={categories} />
          <MaterialsManager initialMaterials={materials} />
          <SuppliersManager initialSuppliers={suppliers} />
          <DataVisibilityManager initialDisplay={settings.display ?? {}} />
          <SampleDataManager initialEnabled={sampleDataEnabled} />
          <BackupManager dbSource={dbSource} />
        </div>
      </div>
    </div>
  )
}
