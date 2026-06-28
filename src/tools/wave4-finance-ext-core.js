/** Wave 4 finance calculators */

export function dcf(cashFlows, discountRatePct) {
  const flows = (cashFlows || []).map(Number)
  const r = Number(discountRatePct) / 100
  if (!flows.length || !isFinite(r)) return null
  let npv = 0
  const discounted = flows.map((cf, i) => {
    const pv = cf / Math.pow(1 + r, i + 1)
    npv += pv
    return { period: i + 1, cashFlow: cf, presentValue: pv }
  })
  return { npv, discounted, discountRatePct: Number(discountRatePct) }
}

export function positionSize(accountSize, riskPct, entryPrice, stopLoss) {
  const account = Number(accountSize)
  const risk = Number(riskPct) / 100
  const entry = Number(entryPrice)
  const stop = Number(stopLoss)
  if (![account, risk, entry, stop].every(isFinite) || entry <= 0 || entry === stop) return null
  const riskAmount = account * risk
  const riskPerShare = Math.abs(entry - stop)
  const shares = riskPerShare > 0 ? riskAmount / riskPerShare : 0
  return {
    riskAmount,
    riskPerShare,
    shares,
    positionValue: shares * entry,
  }
}

export function cryptoProfit(buyPrice, sellPrice, quantity, buyFee = 0, sellFee = 0) {
  const buy = Number(buyPrice)
  const sell = Number(sellPrice)
  const qty = Number(quantity)
  const bf = Number(buyFee) || 0
  const sf = Number(sellFee) || 0
  if (![buy, sell, qty].every(isFinite) || qty <= 0) return null
  const cost = buy * qty + bf
  const proceeds = sell * qty - sf
  const profit = proceeds - cost
  return {
    cost,
    proceeds,
    profit,
    roiPct: cost > 0 ? (profit / cost) * 100 : 0,
  }
}
