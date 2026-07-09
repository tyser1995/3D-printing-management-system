import { readFile } from 'fs/promises'
import { join } from 'path'
import AdminHeader from '@/components/layout/AdminHeader'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings | Admin' }

async function loadSettings() {
  try {
    const raw = await readFile(join(process.cwd(), 'data', 'settings.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export default async function AdminSettingsPage() {
  const settings = await loadSettings()

  return (
    <div className="flex flex-col overflow-hidden">
      <AdminHeader title="Settings" />
      <div className="flex-1 overflow-y-auto p-6">
        <SettingsClient initialSettings={settings} />
      </div>
    </div>
  )
}
