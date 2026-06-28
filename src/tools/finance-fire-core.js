/** FIRE (Financial Independence Retire Early) calculations */

export function calcFire({ savings, annualExpenses, annualIncome, savingsRate, expectedReturn = 7, withdrawalRate = 4 }) {
  const expenses = annualExpenses > 0 ? annualExpenses : 0
  const fiNumber = expenses > 0 ? expenses / (withdrawalRate / 100) : 0
  const saveRate = savingsRate > 0 ? savingsRate / 100 : (annualIncome > 0 ? (annualIncome - expenses) / annualIncome : 0)
  const annualSavings = annualIncome > 0 ? annualIncome * saveRate : 0
  const r = expectedReturn / 100

  let balance = savings
  let years = 0
  if (fiNumber <= 0 || annualSavings <= 0 && balance < fiNumber) {
    return { fiNumber, years: null, annualSavings, saveRatePct: saveRate * 100 }
  }
  while (balance < fiNumber && years < 100) {
    balance = balance * (1 + r) + annualSavings
    years++
  }

  return {
    fiNumber,
    years: years >= 100 ? null : years,
    annualSavings,
    saveRatePct: saveRate * 100,
    finalBalance: balance,
  }
}

export function formatMoney(n) {
  if (!isFinite(n)) return '—'
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}
