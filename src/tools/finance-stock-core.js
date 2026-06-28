/** Stock average price and DCA calculations */

export function weightedAverage(lots) {
  let totalShares = 0
  let totalCost = 0
  for (const lot of lots) {
    const shares = Number(lot.shares) || 0
    const price = Number(lot.price) || 0
    if (shares <= 0 || price < 0) continue
    totalShares += shares
    totalCost += shares * price
  }
  if (totalShares <= 0) return null
  return { avgPrice: totalCost / totalShares, totalShares, totalCost }
}

export function dcaSchedule({ monthlyAmount, months, prices }) {
  let totalShares = 0
  let totalInvested = 0
  const schedule = []
  for (let m = 0; m < months; m++) {
    const price = prices && prices[m] != null ? Number(prices[m]) : Number(prices?.[0]) || 100
    const amount = Number(monthlyAmount) || 0
    const shares = price > 0 ? amount / price : 0
    totalShares += shares
    totalInvested += amount
    schedule.push({ month: m + 1, price, amount, shares, totalShares, avgCost: totalInvested / totalShares })
  }
  return {
    totalInvested,
    totalShares,
    avgCost: totalShares > 0 ? totalInvested / totalShares : 0,
    schedule,
  }
}

export function formatMoney(n) {
  if (!isFinite(n)) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
