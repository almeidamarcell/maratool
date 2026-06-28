/** Shared amortization math for mortgage and loan calculators */

export function calcMonthlyPayment(principal, annualRate, termMonths) {
  if (principal <= 0 || termMonths <= 0) return 0
  if (annualRate <= 0) return principal / termMonths
  const r = annualRate / 100 / 12
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
}

export function buildAmortizationSchedule(principal, annualRate, termMonths, extraMonthly = 0) {
  const payment = calcMonthlyPayment(principal, annualRate, termMonths) + extraMonthly
  const r = annualRate / 100 / 12
  let balance = principal
  const schedule = []
  let totalInterest = 0
  let month = 0

  while (balance > 0.005 && month < termMonths * 2) {
    month++
    const interest = r > 0 ? balance * r : 0
    let principalPaid = payment - interest
    if (principalPaid > balance) principalPaid = balance
    balance -= principalPaid
    totalInterest += interest
    schedule.push({
      month,
      payment: principalPaid + interest,
      principal: principalPaid,
      interest,
      balance: Math.max(0, balance),
    })
    if (balance <= 0) break
  }

  return {
    monthlyPayment: calcMonthlyPayment(principal, annualRate, termMonths),
    totalPayment: schedule.reduce((s, row) => s + row.payment, 0),
    totalInterest,
    schedule,
    months: schedule.length,
  }
}

export function formatMoney(n, currency = '$') {
  if (!isFinite(n)) return '—'
  return currency + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
