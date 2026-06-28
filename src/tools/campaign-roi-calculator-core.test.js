import { describe, it, expect } from 'vitest'
import { validateRoiInput, calculateRoi } from './campaign-roi-calculator-core.js'

describe('validateRoiInput', () => {
  it('rejects zero cost', () => {
    expect(validateRoiInput(1000, 0).valid).toBe(false)
  })

  it('accepts valid input', () => {
    expect(validateRoiInput(5000, 1000).valid).toBe(true)
  })
})

describe('calculateRoi', () => {
  it('calculates ROI and ROAS', () => {
    var result = calculateRoi(5000, 1000)
    expect(result.profit).toBe(4000)
    expect(result.roi).toBe(400)
    expect(result.roas).toBe(5)
  })

  it('handles break-even', () => {
    var result = calculateRoi(1000, 1000)
    expect(result.profit).toBe(0)
    expect(result.roi).toBe(0)
    expect(result.roas).toBe(1)
  })

  it('handles negative ROI', () => {
    var result = calculateRoi(800, 1000)
    expect(result.profit).toBe(-200)
    expect(result.roi).toBe(-20)
  })

  it('returns error for invalid cost', () => {
    expect(calculateRoi(1000, 0).error).toBeTruthy()
  })
})
