/** Compound interest and CAGR calculations */

export function compoundInterest(principal, annualRate, years, monthlyContribution = 0, compoundFrequency = 12) {
  const r = annualRate / 100
  const n = compoundFrequency
  let balance = principal
  const yearly = []

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < n; m++) {
      balance = balance * (1 + r / n) + monthlyContribution
    }
    const contributed = principal + monthlyContribution * 12 * y
    yearly.push({
      year: y,
      balance,
      contributed,
      interest: balance - contributed,
    })
  }

  const totalContributed = principal + monthlyContribution * 12 * years
  return {
    finalBalance: balance,
    totalContributed,
    totalInterest: balance - totalContributed,
    yearly,
  }
}

export function calcCagr(beginValue, endValue, years) {
  if (beginValue <= 0 || endValue <= 0 || years <= 0) return null
  return (Math.pow(endValue / beginValue, 1 / years) - 1) * 100
}

export function formatMoney(n) {
  if (!isFinite(n)) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
