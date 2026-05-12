import { describe, test, expect } from 'vitest'
import { ckdEpi2021 } from './ckd-epi.js'

// Reference: Inker LA, Eneanya ND, et al. New Creatinine- and Cystatin C-Based
// Equations to Estimate GFR without Race. N Engl J Med. 2021;385(19):1737-1749.
//
// 2021 race-free CKD-EPI (creatinine):
// eGFR = 142 × min(Cr/κ, 1)^α × max(Cr/κ, 1)^-1.200 × 0.9938^Age × (1.012 if female)
// where κ = 0.7 if female, 0.9 if male
//       α = -0.241 if female, -0.302 if male
// Result in mL/min/1.73 m²

describe('ckdEpi2021 — known reference values', () => {
  // Verified against NIDDK calculator output.
  test('60 yo male, Cr 1.0 → 86 mL/min/1.73m²', () => {
    expect(ckdEpi2021({ age: 60, sex: 'male', creatinineMgDl: 1.0 })).toBeCloseTo(86, 0)
  })

  test('60 yo female, Cr 1.0 → 60–65 (max branch, female factor)', () => {
    const r = ckdEpi2021({ age: 60, sex: 'female', creatinineMgDl: 1.0 })
    expect(r).toBeGreaterThanOrEqual(60)
    expect(r).toBeLessThanOrEqual(65)
  })

  test('40 yo male, Cr 0.8 → ~110-125 (min branch)', () => {
    const r = ckdEpi2021({ age: 40, sex: 'male', creatinineMgDl: 0.8 })
    expect(r).toBeGreaterThan(108)
    expect(r).toBeLessThan(125)
  })

  test('80 yo male, Cr 1.5 → ~45 mL/min/1.73m²', () => {
    const r = ckdEpi2021({ age: 80, sex: 'male', creatinineMgDl: 1.5 })
    expect(r).toBeGreaterThan(40)
    expect(r).toBeLessThan(50)
  })
})

describe('ckdEpi2021 — invalid inputs', () => {
  test('returns null when creatinine is 0', () => {
    expect(ckdEpi2021({ age: 50, sex: 'male', creatinineMgDl: 0 })).toBe(null)
  })
  test('returns null when age < 18 (calibrated for adults)', () => {
    expect(ckdEpi2021({ age: 10, sex: 'male', creatinineMgDl: 1.0 })).toBe(null)
  })
  test('returns null for invalid sex', () => {
    expect(ckdEpi2021({ age: 50, sex: 'other', creatinineMgDl: 1.0 })).toBe(null)
  })
})
