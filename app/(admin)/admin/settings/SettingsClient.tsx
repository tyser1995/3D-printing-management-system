'use client'

import { useState } from 'react'
import { Save, CheckCircle2 } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface Settings {
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
  storage?: {
    provider?: 'local' | 'supabase'
    supabaseBucket?: string
  }
}

interface Props {
  initialSettings: Settings
  supabaseConfigured: boolean
}

interface SaveBtnProps {
  loading: boolean
  saved: boolean
  onClick: () => void
}

function SaveBtn({ loading, saved, onClick }: SaveBtnProps) {
  return (
    <Button loading={loading} onClick={onClick}>
      {saved ? (
        <>
          <CheckCircle2 className="h-4 w-4" /> Saved!
        </>
      ) : (
        <>
          <Save className="h-4 w-4" /> Save
        </>
      )}
    </Button>
  )
}

export default function SettingsClient({ initialSettings, supabaseConfigured }: Props) {
  const [shop, setShop] = useState({
    name: initialSettings.shop?.name ?? 'Kai3D',
    email: initialSettings.shop?.email ?? 'hello@kai3d.ph',
    phone: initialSettings.shop?.phone ?? '',
    address: initialSettings.shop?.address ?? 'Philippines',
  })
  const [cost, setCost] = useState({
    electricityRate: String(initialSettings.costDefaults?.electricityRate ?? 12),
    laborRate: String(initialSettings.costDefaults?.laborRate ?? 75),
    profitMargin: String(initialSettings.costDefaults?.profitMargin ?? 30),
    packagingCost: String(initialSettings.costDefaults?.packagingCost ?? 25),
  })
  const [notifs, setNotifs] = useState({
    emailNewOrder: initialSettings.notifications?.emailNewOrder ?? true,
    emailLowStock: initialSettings.notifications?.emailLowStock ?? true,
    emailPrintDone: initialSettings.notifications?.emailPrintDone ?? true,
    smsOrderShipped: initialSettings.notifications?.smsOrderShipped ?? false,
  })
  const [storage, setStorage] = useState({
    provider: initialSettings.storage?.provider ?? 'local',
    supabaseBucket: initialSettings.storage?.supabaseBucket ?? 'uploads',
  })

  const [loadingSection, setLoadingSection] = useState<string | null>(null)
  const [savedSection, setSavedSection] = useState<string | null>(null)

  const save = async (section: string, data: Record<string, unknown>) => {
    setLoadingSection(section)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [section]: data }),
      })
      setSavedSection(section)
      setTimeout(() => setSavedSection(null), 2000)
    } finally {
      setLoadingSection(null)
    }
  }

  const setShopField = (key: keyof typeof shop) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setShop((p) => ({ ...p, [key]: e.target.value }))

  const setCostField = (key: keyof typeof cost) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCost((p) => ({ ...p, [key]: e.target.value }))

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <Input label="Shop Name" value={shop.name} onChange={setShopField('name')} />
          <Input label="Email" type="email" value={shop.email} onChange={setShopField('email')} />
          <Input label="Phone" type="tel" value={shop.phone} onChange={setShopField('phone')} />
          <Input label="Address" value={shop.address} onChange={setShopField('address')} />
          <SaveBtn
            loading={loadingSection === 'shop'}
            saved={savedSection === 'shop'}
            onClick={() => save('shop', shop)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost Calculator Defaults</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <Input
            label="Electricity Rate (₱/kWh)"
            type="number"
            value={cost.electricityRate}
            onChange={setCostField('electricityRate')}
          />
          <Input
            label="Labor Rate (₱/hour)"
            type="number"
            value={cost.laborRate}
            onChange={setCostField('laborRate')}
          />
          <Input
            label="Default Profit Margin (%)"
            type="number"
            value={cost.profitMargin}
            onChange={setCostField('profitMargin')}
          />
          <Input
            label="Default Packaging Cost (₱)"
            type="number"
            value={cost.packagingCost}
            onChange={setCostField('packagingCost')}
          />
          <SaveBtn
            loading={loadingSection === 'costDefaults'}
            saved={savedSection === 'costDefaults'}
            onClick={() =>
              save('costDefaults', {
                electricityRate: Number(cost.electricityRate),
                laborRate: Number(cost.laborRate),
                profitMargin: Number(cost.profitMargin),
                packagingCost: Number(cost.packagingCost),
              })
            }
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {(
            [
              { key: 'emailNewOrder', label: 'Email on new order' },
              { key: 'emailLowStock', label: 'Email on low stock' },
              { key: 'emailPrintDone', label: 'Email on print completion' },
              { key: 'smsOrderShipped', label: 'SMS on order shipped' },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{label}</span>
              <input
                type="checkbox"
                checked={notifs[key]}
                onChange={(e) => setNotifs((p) => ({ ...p, [key]: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 accent-[#6EC30B]"
              />
            </label>
          ))}
          <div className="pt-2">
            <SaveBtn
              loading={loadingSection === 'notifications'}
              saved={savedSection === 'notifications'}
              onClick={() => save('notifications', notifs)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image Storage</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Choose where uploaded product and order photos are saved.
          </p>
          <div className="space-y-2">
            {(
              [
                {
                  value: 'local' as const,
                  label: 'Local (public/uploads)',
                  hint: 'Stored on this server’s disk. Simplest, but files don’t survive a redeploy on most hosts.',
                },
                {
                  value: 'supabase' as const,
                  label: 'Supabase Storage',
                  hint: 'Stored in your Supabase project’s storage bucket. Persists across deploys.',
                },
              ] as const
            ).map(({ value, label, hint }) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name="storageProvider"
                  checked={storage.provider === value}
                  onChange={() => setStorage((p) => ({ ...p, provider: value }))}
                  className="mt-0.5 h-4 w-4 accent-[#6EC30B]"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{label}</span>
                  <span className="block text-xs text-slate-500">{hint}</span>
                </span>
              </label>
            ))}
          </div>

          {storage.provider === 'supabase' && (
            <>
              {!supabaseConfigured && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                  Supabase isn&apos;t configured yet (missing NEXT_PUBLIC_SUPABASE_URL /
                  SUPABASE_SERVICE_ROLE_KEY). Uploads will fall back to local storage until it is.
                </p>
              )}
              <Input
                label="Storage Bucket"
                value={storage.supabaseBucket}
                onChange={(e) => setStorage((p) => ({ ...p, supabaseBucket: e.target.value }))}
                placeholder="uploads"
              />
            </>
          )}

          <SaveBtn
            loading={loadingSection === 'storage'}
            saved={savedSection === 'storage'}
            onClick={() => save('storage', storage)}
          />
        </div>
      </Card>
    </>
  )
}
