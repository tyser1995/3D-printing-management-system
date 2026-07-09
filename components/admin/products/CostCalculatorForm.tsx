'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { calculateCost, type CostInputs } from '@/lib/utils/cost'
import { formatCurrency } from '@/lib/utils/format'

interface CostCalculatorFormProps {
  productId: string
  productName: string
  initialData?: Partial<CostInputs>
  onSaved?: () => void
}

const defaultInputs: CostInputs = {
  filamentGrams: 0,
  filamentCostPerG: 1.2,
  printHours: 0,
  electricityKwh: 0.1,
  electricityCost: 12,
  laborHours: 0.5,
  laborRatePerHour: 80,
  packagingCost: 15,
  shippingCost: 0,
  profitMargin: 0.3,
}

interface FieldProps {
  label: string
  k: keyof CostInputs
  step?: string
  unit?: string
  inputs: CostInputs
  onChange: (k: keyof CostInputs) => (e: React.ChangeEvent<HTMLInputElement>) => void
}

function Field({ label, k, step = '0.01', unit, inputs, onChange }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-1">
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
        <input
          type="number"
          min="0"
          step={step}
          value={inputs[k]}
          onChange={onChange(k)}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#6EC30B] focus:outline-none"
        />
      </div>
    </div>
  )
}

export default function CostCalculatorForm({
  productId,
  productName,
  initialData,
  onSaved,
}: CostCalculatorFormProps) {
  const [inputs, setInputs] = useState<CostInputs>({ ...defaultInputs, ...initialData })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const breakdown = calculateCost(inputs)

  const set = (key: keyof CostInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs((prev) => ({ ...prev, [key]: Number(e.target.value) }))
    setSaved(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await fetch(`/api/products/${productId}/cost`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      })
      setSaved(true)
      onSaved?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <Card>
        <h3 className="mb-4 font-semibold text-slate-900">{productName} — Cost Inputs</h3>

        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Filament</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Filament (g)" k="filamentGrams" step="1" inputs={inputs} onChange={set} />
            <Field
              label="Cost per gram (₱)"
              k="filamentCostPerG"
              unit="₱"
              inputs={inputs}
              onChange={set}
            />
          </div>

          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Print</p>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Print time (h)"
              k="printHours"
              step="0.5"
              inputs={inputs}
              onChange={set}
            />
            <Field label="Power draw (kWh/h)" k="electricityKwh" inputs={inputs} onChange={set} />
            <Field
              label="Electricity cost (₱/kWh)"
              k="electricityCost"
              unit="₱"
              inputs={inputs}
              onChange={set}
            />
          </div>

          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Labor & Packaging
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Labor hours" k="laborHours" step="0.25" inputs={inputs} onChange={set} />
            <Field
              label="Labor rate (₱/h)"
              k="laborRatePerHour"
              unit="₱"
              inputs={inputs}
              onChange={set}
            />
            <Field
              label="Packaging cost (₱)"
              k="packagingCost"
              unit="₱"
              inputs={inputs}
              onChange={set}
            />
            <Field
              label="Shipping cost (₱)"
              k="shippingCost"
              unit="₱"
              inputs={inputs}
              onChange={set}
            />
          </div>

          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Margin</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Profit Margin (%)
            </label>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={inputs.profitMargin}
              onChange={set('profitMargin')}
              className="w-full accent-[#6EC30B]"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0%</span>
              <span className="font-medium text-[#6EC30B]">
                {Math.round(inputs.profitMargin * 100)}%
              </span>
              <span>80%</span>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} loading={loading} fullWidth className="mt-6">
          {saved ? '✓ Saved' : 'Save Cost Config'}
        </Button>
      </Card>

      {/* Live Preview */}
      <Card>
        <h3 className="mb-4 font-semibold text-slate-900">Cost Breakdown</h3>

        <div className="space-y-3">
          {[
            { label: 'Filament', value: breakdown.filamentCost },
            { label: 'Electricity', value: breakdown.electricityCost },
            { label: 'Labor', value: breakdown.laborCost },
            { label: 'Packaging', value: breakdown.packagingCost },
            { label: 'Shipping', value: breakdown.shippingCost },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{label}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-[#6EC30B]"
                    style={{
                      width: `${breakdown.totalCost > 0 ? (value / breakdown.totalCost) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-20 text-right font-medium text-slate-900">
                  {formatCurrency(value)}
                </span>
              </div>
            </div>
          ))}

          <div className="border-t border-slate-100 pt-3">
            <div className="flex justify-between text-sm font-semibold text-slate-900">
              <span>Total Cost</span>
              <span>{formatCurrency(breakdown.totalCost)}</span>
            </div>
          </div>

          <div className="mt-2 rounded-xl bg-[#6EC30B]/10 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-[#5AAA09]">Suggested Price</span>
              <span className="text-2xl font-bold text-[#6EC30B]">
                {formatCurrency(breakdown.suggestedPrice)}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#5AAA09]">
              At {Math.round(breakdown.margin * 100)}% margin —{' '}
              {formatCurrency(breakdown.suggestedPrice - breakdown.totalCost)} profit
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
