import { readFile } from 'fs/promises'
import { join } from 'path'

export interface AppSettings {
  shop?: { name?: string; email?: string; phone?: string; address?: string }
  costDefaults?: {
    electricityRate?: number
    laborRate?: number
    profitMargin?: number
    packagingCost?: number
  }
  notifications?: {
    emailNewOrder?: boolean
    emailLowStock?: boolean
    emailPrintDone?: boolean
    smsOrderShipped?: boolean
  }
  display?: {
    showDeletedOrders?: boolean
    showDeletedProducts?: boolean
  }
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(join(process.cwd(), 'data', 'settings.json'), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}
