import { describe, it, expect } from 'vitest'
import { validateCacLtvInput, calculateCacLtv } from './cac-ltv-calculator-core.js'

describe('validateCacLtvInput', () => {
  it('rejects zero customers', () => {
    expect(validateCacLtvInput(1000, 0, 50, 12, 80).valid).toBe(false)
  })

  it('accepts valid input', () => {
    expect(validateCacLtvInput(10000, 100, 50, 24, 80).valid).toBe(true)
  })
})

describe('calculateCacLtv', () => {
  it('calculates CAC, LTV, and ratio', () => {
    var result = calculateCacLtv(10000, 100, 50, 24, 80)
    expect(result.cac).toBe(100)
    expect(result.ltv).toBe(960) // 50 * 0.8 * 24
    expect(result.ratio).toBeCloseTo(9.6, 1)
  })

  it('calculates payback months', () => {
    var result = calculateCacLtv(10000, 100, 50, 24, 80)
    expect(result.paybackMonths).toBeCloseTo(2.5, 1) // 100 / 40
  })

  it('returns error for invalid input', () => {
    expect(calculateCacLtv(1000, 0, 50, 12, 80).error).toBeTruthy()
  })
})
