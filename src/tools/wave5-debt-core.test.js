import { describe, test, expect } from 'vitest'
import { simpleInterest, creditCardPayoff, refinance, loanPayoff, debtPlan, rentVsBuy } from './wave5-debt-core.js'
import { EXCEL_FUNCTIONS } from './excel-functions-data.js'

describe('simpleInterest', () => {
  test('textbook case: $1000 at 5% for 3 years = $150', () => {
    const r = simpleInterest(1000, 5, 3, 'years')
    expect(r.interest).toBeCloseTo(150, 6)
    expect(r.total).toBeCloseTo(1150, 6)
  })
  test('months convert to years', () => {
    expect(simpleInterest(1000, 12, 6, 'months').interest).toBeCloseTo(60, 6)
  })
  test('days use a 365-day year', () => {
    expect(simpleInterest(1000, 3.65, 100, 'days').interest).toBeCloseTo(10, 6)
  })
  test('rejects zero principal and negative rate', () => {
    expect(simpleInterest(0, 5, 1)).toBeNull()
    expect(simpleInterest(1000, -1, 1)).toBeNull()
  })
})

describe('creditCardPayoff', () => {
  test('fixed payment: $5000 at 24% APR, $250/mo ≈ 25 months', () => {
    const r = creditCardPayoff(5000, 24, { mode: 'fixed', payment: 250 })
    expect(r.neverPaysOff).toBe(false)
    expect(r.months).toBeGreaterThanOrEqual(24)
    expect(r.months).toBeLessThanOrEqual(27)
    expect(r.totalInterest).toBeGreaterThan(1000)
  })
  test('payment below monthly interest never pays off', () => {
    const r = creditCardPayoff(10000, 30, { mode: 'fixed', payment: 200 })
    expect(r.neverPaysOff).toBe(true)
    expect(r.monthlyInterest).toBeCloseTo(250, 2)
  })
  test('minimum payment (interest + 1% of balance) takes far longer than fixed', () => {
    const min = creditCardPayoff(5000, 24, { mode: 'minimum', minPct: 1, minFloor: 25 })
    const fixed = creditCardPayoff(5000, 24, { mode: 'fixed', payment: 250 })
    expect(min.neverPaysOff).toBe(false)
    expect(min.months).toBeGreaterThan(fixed.months * 3)
    expect(min.totalInterest).toBeGreaterThan(fixed.totalInterest * 3)
  })
  test('zero APR pays off balance/payment months', () => {
    const r = creditCardPayoff(1200, 0, { mode: 'fixed', payment: 100 })
    expect(r.months).toBe(12)
    expect(r.totalInterest).toBeCloseTo(0, 6)
  })
})

describe('refinance', () => {
  test('4% drop on $300k/25y saves money after break-even', () => {
    const r = refinance(300000, 7, 300, 5.5, 300, 5000)
    expect(r.newPayment).toBeLessThan(r.oldPayment)
    expect(r.monthlySavings).toBeGreaterThan(250)
    expect(r.breakEvenMonths).toBeGreaterThan(0)
    expect(r.breakEvenMonths).toBeLessThan(24)
    expect(r.lifetimeSavings).toBeGreaterThan(50000)
  })
  test('higher new rate → negative savings, no break-even', () => {
    const r = refinance(200000, 4, 240, 7, 240, 3000)
    expect(r.monthlySavings).toBeLessThan(0)
    expect(r.breakEvenMonths).toBeNull()
  })
  test('longer new term can cut the payment while raising lifetime interest', () => {
    const r = refinance(200000, 6, 120, 6, 360, 0)
    expect(r.newPayment).toBeLessThan(r.oldPayment)
    expect(r.newTotalInterest).toBeGreaterThan(r.oldTotalInterest)
  })
})

describe('loanPayoff', () => {
  test('extra payment shortens payoff and saves interest', () => {
    const base = loanPayoff(20000, 8, 400, 0)
    const extra = loanPayoff(20000, 8, 400, 100)
    expect(base.neverPaysOff).toBe(false)
    expect(extra.months).toBeLessThan(base.months)
    expect(extra.totalInterest).toBeLessThan(base.totalInterest)
  })
  test('payment equal to interest never pays off', () => {
    // $20k at 12% → $200/mo interest
    expect(loanPayoff(20000, 12, 200, 0).neverPaysOff).toBe(true)
  })
})

describe('debtPlan', () => {
  const debts = [
    { name: 'Card A', balance: 3000, aprPct: 24, minPayment: 90 },
    { name: 'Card B', balance: 8000, aprPct: 18, minPayment: 200 },
    { name: 'Car', balance: 12000, aprPct: 7, minPayment: 300 },
  ]
  test('snowball pays smallest balance first', () => {
    const r = debtPlan(debts, 200, 'snowball')
    expect(r.neverPaysOff).toBe(false)
    expect(r.payoffOrder[0]).toBe('Card A')
  })
  test('avalanche saves at least as much interest as snowball', () => {
    const snow = debtPlan(debts, 200, 'snowball')
    const aval = debtPlan(debts, 200, 'avalanche')
    expect(aval.totalInterest).toBeLessThanOrEqual(snow.totalInterest + 0.01)
  })
  test('extra money shortens the plan', () => {
    const none = debtPlan(debts, 0, 'avalanche')
    const some = debtPlan(debts, 300, 'avalanche')
    expect(some.months).toBeLessThan(none.months)
  })
  test('min payment below interest with no extra flags neverPaysOff', () => {
    const r = debtPlan([{ name: 'X', balance: 10000, aprPct: 30, minPayment: 100 }], 0, 'snowball')
    expect(r.neverPaysOff).toBe(true)
    expect(r.stuckOn).toBe('X')
  })
})

describe('rentVsBuy', () => {
  const base = {
    homePrice: 400000, downPct: 20, mortgageRatePct: 6.5, termYears: 30,
    propertyTaxPct: 1.1, maintenancePct: 1, appreciationPct: 3, closingPct: 3,
    monthlyRent: 2000, rentIncreasePct: 3, investmentReturnPct: 7, yearsToStay: 8,
  }
  test('produces both net costs and a verdict', () => {
    const r = rentVsBuy(base)
    expect(r).not.toBeNull()
    expect(['buy', 'rent']).toContain(r.verdict)
    expect(r.netAdvantage).toBeCloseTo(r.netCostRent - r.netCostBuy, 6)
  })
  test('very cheap rent favors renting; very expensive rent favors buying', () => {
    expect(rentVsBuy({ ...base, monthlyRent: 800 }).verdict).toBe('rent')
    expect(rentVsBuy({ ...base, monthlyRent: 4500 }).verdict).toBe('buy')
  })
  test('higher appreciation favors buying, higher investment return favors renting', () => {
    expect(rentVsBuy({ ...base, appreciationPct: 6 }).netAdvantage)
      .toBeGreaterThan(rentVsBuy({ ...base, appreciationPct: 0 }).netAdvantage)
    expect(rentVsBuy({ ...base, investmentReturnPct: 3 }).netAdvantage)
      .toBeGreaterThan(rentVsBuy({ ...base, investmentReturnPct: 10 }).netAdvantage)
  })
  test('with equal growth rates, a longer stay amortizes transaction costs and favors buying', () => {
    const eq = { ...base, appreciationPct: 5, investmentReturnPct: 5 }
    const short = rentVsBuy({ ...eq, yearsToStay: 2 })
    const long = rentVsBuy({ ...eq, yearsToStay: 25 })
    expect(short.verdict).toBe('rent')
    expect(long.netAdvantage).toBeGreaterThan(short.netAdvantage)
    expect(long.verdict).toBe('buy')
  })
})

describe('EXCEL_FUNCTIONS dataset', () => {
  test('has 375 unique English names', () => {
    expect(EXCEL_FUNCTIONS.length).toBe(375)
    expect(new Set(EXCEL_FUNCTIONS.map(f => f.en)).size).toBe(375)
  })
  test('known translations are present', () => {
    const byEn = Object.fromEntries(EXCEL_FUNCTIONS.map(f => [f.en, f]))
    expect(byEn.VLOOKUP.pt).toBe('PROCV')
    expect(byEn.VLOOKUP.es).toBe('BUSCARV')
    expect(byEn.SUM.pt).toBe('SOMA')
    expect(byEn.IF.es).toBe('SI')
  })
  test('every row has all three languages non-empty', () => {
    for (const f of EXCEL_FUNCTIONS) {
      expect(f.en.length).toBeGreaterThan(0)
      expect(f.pt.length).toBeGreaterThan(0)
      expect(f.es.length).toBeGreaterThan(0)
    }
  })
})
