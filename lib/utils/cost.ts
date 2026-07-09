export interface CostInputs {
  filamentGrams: number
  filamentCostPerG: number
  printHours: number
  electricityKwh: number
  electricityCost: number // PHP per kWh
  laborHours: number
  laborRatePerHour: number
  packagingCost: number
  shippingCost: number
  profitMargin: number // 0–1 (e.g. 0.3 = 30%)
}

export interface CostBreakdown {
  filamentCost: number
  electricityCost: number
  laborCost: number
  packagingCost: number
  shippingCost: number
  totalCost: number
  suggestedPrice: number
  margin: number
}

export function calculateCost(inputs: CostInputs): CostBreakdown {
  const filamentCost = inputs.filamentGrams * inputs.filamentCostPerG
  const electricityCost = inputs.electricityKwh * inputs.printHours * inputs.electricityCost
  const laborCost = inputs.laborHours * inputs.laborRatePerHour
  const { packagingCost, shippingCost } = inputs

  const totalCost = filamentCost + electricityCost + laborCost + packagingCost + shippingCost
  const margin = inputs.profitMargin
  const suggestedPrice = totalCost / (1 - margin)

  return {
    filamentCost: round(filamentCost),
    electricityCost: round(electricityCost),
    laborCost: round(laborCost),
    packagingCost: round(packagingCost),
    shippingCost: round(shippingCost),
    totalCost: round(totalCost),
    suggestedPrice: round(suggestedPrice),
    margin,
  }
}

function round(n: number) {
  return Math.round(n * 100) / 100
}
