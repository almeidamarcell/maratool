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

export function commission(amount, rate) {
  const commissionAmt = amount * (rate / 100)
  return { commission: commissionAmt, net: amount - commissionAmt }
}

export function contractorRate(desiredSalary, billableHours = 1200, expensePct = 15, taxPct = 25) {
  const expenses = desiredSalary * (expensePct / 100)
  const tax = desiredSalary * (taxPct / 100)
  const total = desiredSalary + expenses + tax
  const hourly = billableHours > 0 ? total / billableHours : 0
  return { hourly, daily: hourly * 8, annualEquivalent: desiredSalary, expenses, tax, totalNeeded: total }
}

export function pricingFromCost(cost, markupPct) {
  const price = cost * (1 + markupPct / 100)
  const profit = price - cost
  const margin = price > 0 ? (profit / price) * 100 : 0
  return { price, profit, margin }
}

export function pricingFromMargin(cost, marginPct) {
  const price = marginPct >= 100 ? 0 : cost / (1 - marginPct / 100)
  const profit = price - cost
  return { price, profit, margin: marginPct }
}

export function invoiceDueDate(issueDate, termsDays) {
  const d = new Date(issueDate)
  if (isNaN(d.getTime())) return null
  d.setDate(d.getDate() + termsDays)
  return d
}

export function formatMoney(n) {
  if (!isFinite(n)) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatPct(n) {
  if (!isFinite(n)) return '—'
  return n.toFixed(2) + '%'
}
