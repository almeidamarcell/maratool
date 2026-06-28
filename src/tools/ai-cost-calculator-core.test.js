import { describe, it, expect } from 'vitest'
import { calculateCost, formatUsd } from './ai-cost-calculator-core.js'

describe('calculateCost', () => {
  it('returns zero cost for zero tokens', () => {
    var result = calculateCost(0, 0, 'gpt-4o')
    expect(result.totalCost).toBe(0)
    expect(result.inputCost).toBe(0)
    expect(result.outputCost).toBe(0)
  })

  it('calculates input cost correctly for gpt-4o', () => {
    // 1M input tokens at $2.50/M = $2.50
    var result = calculateCost(1_000_000, 0, 'gpt-4o')
    expect(result.inputCost).toBeCloseTo(2.5, 4)
    expect(result.outputCost).toBe(0)
  })

  it('calculates output cost correctly for gpt-4o', () => {
    // 1M output tokens at $10/M = $10
    var result = calculateCost(0, 1_000_000, 'gpt-4o')
    expect(result.outputCost).toBeCloseTo(10, 4)
  })

  it('sums input and output costs', () => {
    var result = calculateCost(1000, 500, 'gpt-4o-mini')
    expect(result.totalCost).toBeCloseTo(result.inputCost + result.outputCost, 8)
  })

  it('uses default model for unknown id', () => {
    var result = calculateCost(1000, 1000, 'unknown-model')
    expect(result.model).toBe('GPT-4o')
  })
})

describe('formatUsd', () => {
  it('formats zero', () => {
    expect(formatUsd(0)).toBe('$0.00')
  })

  it('formats small amounts with extra precision', () => {
    expect(formatUsd(0.001)).toBe('$0.0010')
  })

  it('formats normal amounts', () => {
    expect(formatUsd(12.5)).toBe('$12.50')
  })
})
