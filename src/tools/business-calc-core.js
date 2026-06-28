/** Business calculator shared math */

export function profitMargin(revenue, cogs, expenses = 0) {
  if (revenue <= 0) return null
  const grossProfit = revenue - cogs
  const netProfit = grossProfit - expenses
  return {
    grossProfit,
    netProfit,
    grossMargin: (grossProfit / revenue) * 100,
    netMargin: (netProfit / revenue) * 100,
  }
}

export function breakEven(fixedCosts, pricePerUnit, variableCostPerUnit) {
  const contribution = pricePerUnit - variableCostPerUnit
  if (contribution <= 0) return null
  const units = fixedCosts / contribution
  return {
    units,
    revenue: units * pricePerUnit,
    contributionMargin: (contribution / pricePerUnit) * 100,
  }
}

export function addVat(amount, rate) {
  const tax = amount * (rate / 100)
  return { net: amount, tax, gross: amount + tax }
}

export function removeVat(gross, rate) {
  const net = gross / (1 + rate / 100)
  return { net, tax: gross - net, gross }
}

export function calcRoi(initial, finalValue) {
  if (initial <= 0) return null
  const profit = finalValue - initial
  return {
    profit,
    roi: (profit / initial) * 100,
  }
}

export function salaryConvert(annual, hoursPerWeek = 40, weeksPerYear = 52) {
  const hourly = annual / (hoursPerWeek * weeksPerYear)
  return {
    annual,
    monthly: annual / 12,
    biweekly: annual / 26,
    weekly: annual / weeksPerYear,
    daily: annual / (weeksPerYear * 5),
    hourly,
  }
}

export function formatMoney(n) {
  if (!isFinite(n)) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatPct(n) {
  if (!isFinite(n)) return '—'
  return n.toFixed(2) + '%'
}
