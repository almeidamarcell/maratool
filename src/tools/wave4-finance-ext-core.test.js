import { describe, test, expect } from 'vitest'
import { dcf, positionSize, cryptoProfit } from './wave4-finance-ext-core.js'

describe('dcf', () => {
  test('discounts future cash flows', () => {
    const r = dcf([100, 100], 10)
    expect(r.npv).toBeCloseTo(173.5537, 2)
  })
})

describe('positionSize', () => {
  test('sizes position from risk and stop distance', () => {
    const r = positionSize(10000, 1, 50, 45)
    expect(r.shares).toBe(20)
    expect(r.riskAmount).toBe(100)
  })
})

describe('cryptoProfit', () => {
  test('includes fees in profit', () => {
    const r = cryptoProfit(100, 150, 2, 5, 5)
    expect(r.cost).toBe(205)
    expect(r.proceeds).toBe(295)
    expect(r.profit).toBe(90)
  })
})
