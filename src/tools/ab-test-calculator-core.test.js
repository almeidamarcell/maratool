import { describe, it, expect } from 'vitest'
import { validateAbTestInput, calculateAbTest, formatPercent } from './ab-test-calculator-core.js'

describe('validateAbTestInput', () => {
  it('rejects zero visitors', () => {
    expect(validateAbTestInput(0, 0, 100, 10).valid).toBe(false)
  })

  it('rejects conversions exceeding visitors', () => {
    expect(validateAbTestInput(100, 50, 100, 150).valid).toBe(false)
  })

  it('accepts valid input', () => {
    expect(validateAbTestInput(1000, 50, 1000, 70).valid).toBe(true)
  })
})

describe('calculateAbTest', () => {
  it('returns error for invalid input', () => {
    expect(calculateAbTest(0, 0, 100, 10).error).toBeTruthy()
  })

  it('detects significant uplift', () => {
    var result = calculateAbTest(10000, 200, 10000, 300)
    expect(result.significant).toBe(true)
    expect(result.variantRate).toBeGreaterThan(result.controlRate)
    expect(result.lift).toBeGreaterThan(0)
  })

  it('detects non-significant difference with similar rates', () => {
    var result = calculateAbTest(100, 5, 100, 6)
    expect(result.significant).toBe(false)
  })

  it('returns p-value between 0 and 1', () => {
    var result = calculateAbTest(1000, 50, 1000, 70)
    expect(result.pValue).toBeGreaterThanOrEqual(0)
    expect(result.pValue).toBeLessThanOrEqual(1)
  })
})

describe('formatPercent', () => {
  it('formats rate as percentage', () => {
    expect(formatPercent(0.0525)).toBe('5.25%')
  })
})
