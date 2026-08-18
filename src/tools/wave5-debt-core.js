/** Wave 5 finance calculators — simple interest, credit card payoff,
 * refinance, loan payoff, debt snowball/avalanche, rent vs buy. */

import { calcMonthlyPayment, buildAmortizationSchedule } from './finance-amortization-core.js'

export function formatMonths(m) {
  if (!isFinite(m) || m <= 0) return '—'
  const y = Math.floor(m / 12)
  const r = Math.round(m % 12)
  if (y === 0) return r + ' mo'
  return y + ' yr' + (r ? ' ' + r + ' mo' : '')
}

// A = P(1 + r·t). Time unit converts to years.
export function simpleInterest(principal, annualRatePct, time, unit = 'years') {
  const p = Number(principal)
  const r = Number(annualRatePct) / 100
  const t = Number(time)
  if (![p, r, t].every(isFinite) || p <= 0 || t <= 0 || r < 0) return null
  const years = unit === 'months' ? t / 12 : unit === 'days' ? t / 365 : t
  const interest = p * r * years
  return { interest, total: p + interest, years }
}

// Simulate month by month. mode: 'fixed' (constant payment) or 'minimum'
// (interest + minPct% of balance with a dollar floor — the issuer convention,
// and the trap this tool exists to show).
export function creditCardPayoff(balance, aprPct, opts) {
  let bal = Number(balance)
  const apr = Number(aprPct)
  if (!isFinite(bal) || bal <= 0 || !isFinite(apr) || apr < 0) return null
  const monthlyRate = apr / 100 / 12
  const mode = opts.mode
  const fixed = Number(opts.payment) || 0
  const minPct = (Number(opts.minPct) || 1) / 100
  const minFloor = Number(opts.minFloor) || 25

  if (mode === 'fixed' && fixed <= bal * monthlyRate) {
    return { neverPaysOff: true, monthlyInterest: bal * monthlyRate }
  }

  let months = 0
  let totalInterest = 0
  let firstPayment = 0
  const MAX_MONTHS = 1200
  while (bal > 0.005 && months < MAX_MONTHS) {
    months++
    const interest = bal * monthlyRate
    totalInterest += interest
    let payment = mode === 'fixed' ? fixed : Math.max(interest + bal * minPct, minFloor)
    bal += interest
    if (payment > bal) payment = bal
    if (months === 1) firstPayment = payment
    bal -= payment
  }
  if (months >= MAX_MONTHS && bal > 0.005) {
    return { neverPaysOff: true, monthlyInterest: Number(balance) * monthlyRate }
  }
  return {
    neverPaysOff: false,
    months,
    totalInterest,
    totalPaid: Number(balance) + totalInterest,
    firstPayment,
  }
}

// Old loan (balance, rate, remaining months) vs new loan (rate, term, closing costs).
export function refinance(balance, oldRatePct, remainingMonths, newRatePct, newTermMonths, closingCosts = 0) {
  const bal = Number(balance)
  const oldRate = Number(oldRatePct)
  const oldMonths = Math.round(Number(remainingMonths))
  const newRate = Number(newRatePct)
  const newMonths = Math.round(Number(newTermMonths))
  const closing = Number(closingCosts) || 0
  if (![bal, oldRate, newRate].every(isFinite) || bal <= 0 || oldMonths <= 0 || newMonths <= 0) return null

  const oldPayment = calcMonthlyPayment(bal, oldRate, oldMonths)
  const newPayment = calcMonthlyPayment(bal, newRate, newMonths)
  const oldTotalInterest = oldPayment * oldMonths - bal
  const newTotalInterest = newPayment * newMonths - bal
  const monthlySavings = oldPayment - newPayment
  const lifetimeSavings = oldTotalInterest - newTotalInterest - closing
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(closing / monthlySavings) : null
  return { oldPayment, newPayment, monthlySavings, oldTotalInterest, newTotalInterest, lifetimeSavings, breakEvenMonths }
}

// Payoff with a fixed payment (+optional extra). Returns null when the payment
// doesn't cover the first month's interest.
export function loanPayoff(balance, aprPct, monthlyPayment, extraMonthly = 0) {
  let bal = Number(balance)
  const apr = Number(aprPct)
  const payment = Number(monthlyPayment) + (Number(extraMonthly) || 0)
  if (!isFinite(bal) || bal <= 0 || !isFinite(apr) || apr < 0 || payment <= 0) return null
  const r = apr / 100 / 12
  if (payment <= bal * r) return { neverPaysOff: true, monthlyInterest: bal * r }
  let months = 0
  let totalInterest = 0
  const MAX_MONTHS = 1200
  while (bal > 0.005 && months < MAX_MONTHS) {
    months++
    const interest = bal * r
    totalInterest += interest
    bal = bal + interest - Math.min(payment, bal + interest)
  }
  return { neverPaysOff: false, months, totalInterest, totalPaid: Number(balance) + totalInterest }
}

// debts: [{ name, balance, aprPct, minPayment }] — extra dollars roll to the
// focus debt: lowest balance (snowball) or highest APR (avalanche).
export function debtPlan(debts, extraMonthly, strategy) {
  const list = (debts || [])
    .map((d, i) => ({
      name: d.name || 'Debt ' + (i + 1),
      balance: Number(d.balance),
      apr: Number(d.aprPct),
      min: Number(d.minPayment),
    }))
    .filter(d => isFinite(d.balance) && d.balance > 0 && isFinite(d.apr) && d.apr >= 0 && isFinite(d.min) && d.min > 0)
  if (!list.length) return null
  const extra = Number(extraMonthly) || 0

  // Guard: every debt's min payment must beat its own monthly interest,
  // otherwise the simulation never converges.
  for (const d of list) {
    if (d.min <= (d.balance * d.apr) / 100 / 12 && extra <= 0) {
      return { neverPaysOff: true, stuckOn: d.name }
    }
  }

  const debtsSim = list.map(d => ({ ...d }))
  let months = 0
  let totalInterest = 0
  const payoffOrder = []
  const MAX_MONTHS = 1200
  while (debtsSim.some(d => d.balance > 0.005) && months < MAX_MONTHS) {
    months++
    for (const d of debtsSim) {
      if (d.balance <= 0.005) continue
      const interest = (d.balance * d.apr) / 100 / 12
      d.balance += interest
      totalInterest += interest
    }
    const open = debtsSim.filter(d => d.balance > 0.005)
    const focus = strategy === 'avalanche'
      ? open.reduce((a, b) => (b.apr > a.apr ? b : a))
      : open.reduce((a, b) => (b.balance < a.balance ? b : a))
    let freed = extra
    for (const d of debtsSim) {
      if (d.balance <= 0.005) { freed += d.min; continue }
      const pay = Math.min(d.min, d.balance)
      d.balance -= pay
      if (pay < d.min) freed += d.min - pay
    }
    if (focus.balance > 0.005 && freed > 0) {
      focus.balance -= Math.min(freed, focus.balance)
    }
    for (const d of debtsSim) {
      if (d.balance <= 0.005 && !payoffOrder.includes(d.name)) payoffOrder.push(d.name)
    }
  }
  if (months >= MAX_MONTHS) return { neverPaysOff: true, stuckOn: null }
  const totalBalance = list.reduce((s, d) => s + d.balance, 0)
  return { neverPaysOff: false, months, totalInterest, totalPaid: totalBalance + totalInterest, payoffOrder }
}

// Net cost over the horizon for each path. Positive netAdvantage = buying wins.
export function rentVsBuy(params) {
  const price = Number(params.homePrice)
  const downPct = Number(params.downPct) / 100
  const rate = Number(params.mortgageRatePct)
  const termYears = Number(params.termYears) || 30
  const taxPct = (Number(params.propertyTaxPct) || 0) / 100
  const maintPct = (Number(params.maintenancePct) || 0) / 100
  const appreciationPct = (Number(params.appreciationPct) || 0) / 100
  const closingPct = (Number(params.closingPct) || 0) / 100
  const rent0 = Number(params.monthlyRent)
  const rentGrowthPct = (Number(params.rentIncreasePct) || 0) / 100
  const investPct = (Number(params.investmentReturnPct) || 0) / 100
  const years = Math.round(Number(params.yearsToStay))
  if (![price, rate, rent0].every(isFinite) || price <= 0 || rent0 <= 0 || years <= 0 || !isFinite(downPct) || downPct < 0 || downPct > 1) return null

  const down = price * downPct
  const closing = price * closingPct
  const loan = price - down
  const termMonths = termYears * 12
  const { schedule, monthlyPayment } = buildAmortizationSchedule(loan, rate, termMonths)

  let buyOutflows = down + closing
  let rentOutflows = 0
  // Symmetric opportunity cost: the renter invests the buyer's upfront cash
  // plus the monthly difference while owning costs more; once rent overtakes
  // the cost of owning, the buyer invests the difference instead.
  let renterPortfolio = down + closing
  let renterContrib = down + closing
  let buyerPortfolio = 0
  let buyerContrib = 0
  const monthlyInvestRate = Math.pow(1 + investPct, 1 / 12) - 1

  let homeValue = price
  let rent = rent0
  const horizonMonths = Math.min(years * 12, termMonths)
  for (let m = 1; m <= years * 12; m++) {
    homeValue *= Math.pow(1 + appreciationPct, 1 / 12)
    const ownCost = (m <= termMonths ? monthlyPayment : 0) + (homeValue * (taxPct + maintPct)) / 12
    buyOutflows += ownCost
    rentOutflows += rent
    renterPortfolio *= 1 + monthlyInvestRate
    buyerPortfolio *= 1 + monthlyInvestRate
    if (ownCost > rent) {
      renterPortfolio += ownCost - rent
      renterContrib += ownCost - rent
    } else {
      buyerPortfolio += rent - ownCost
      buyerContrib += rent - ownCost
    }
    if (m % 12 === 0) rent *= 1 + rentGrowthPct
  }
  const balanceLeft = horizonMonths >= termMonths ? 0 : schedule[horizonMonths - 1].balance
  const sellingCosts = homeValue * 0.06
  const equity = homeValue - balanceLeft - sellingCosts
  const investmentGains = renterPortfolio - renterContrib
  const buyerGains = buyerPortfolio - buyerContrib

  const netCostBuy = buyOutflows - equity - buyerGains
  const netCostRent = rentOutflows - investmentGains
  return {
    monthlyPayment,
    buyOutflows,
    rentOutflows,
    equity,
    homeValue,
    investmentGains,
    netCostBuy,
    netCostRent,
    netAdvantage: netCostRent - netCostBuy,
    verdict: netCostBuy < netCostRent ? 'buy' : 'rent',
  }
}
