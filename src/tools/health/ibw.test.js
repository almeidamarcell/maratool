import { describe, test, expect } from 'vitest'
import { idealBodyWeight } from './ibw.js'

// Reference: Devine, Robinson, Miller, Hamwi (1974–1983).
// Height is in cm. Returns object with all 4 formulas in kg.

describe('idealBodyWeight — male, 175 cm (≈68.9 inches → 8.9 over 60in)', () => {
  const r = idealBodyWeight(175, 'male')

  test('Devine: 50 + 2.3 × 8.898 ≈ 70.5 kg', () => {
    expect(r.devine).toBeCloseTo(70.5, 0)
  })
  test('Robinson: 52 + 1.9 × 8.898 ≈ 68.9 kg', () => {
    expect(r.robinson).toBeCloseTo(68.9, 0)
  })
  test('Miller: 56.2 + 1.41 × 8.898 ≈ 68.7 kg', () => {
    expect(r.miller).toBeCloseTo(68.7, 0)
  })
  test('Hamwi: 48 + 2.7 × 8.898 ≈ 72.0 kg', () => {
    expect(r.hamwi).toBeCloseTo(72.0, 0)
  })
})

describe('idealBodyWeight — female, 165 cm (≈64.96 in → 4.96 over 60in)', () => {
  const r = idealBodyWeight(165, 'female')

  test('Devine: 45.5 + 2.3 × 4.96 ≈ 56.9 kg', () => {
    expect(r.devine).toBeCloseTo(56.9, 0)
  })
  test('Robinson: 49 + 1.7 × 4.96 ≈ 57.4 kg', () => {
    expect(r.robinson).toBeCloseTo(57.4, 0)
  })
  test('Miller: 53.1 + 1.36 × 4.96 ≈ 59.8 kg', () => {
    expect(r.miller).toBeCloseTo(59.8, 0)
  })
  test('Hamwi: 45.5 + 2.2 × 4.96 ≈ 56.4 kg', () => {
    expect(r.hamwi).toBeCloseTo(56.4, 0)
  })
})

describe('idealBodyWeight — invalid inputs', () => {
  test('returns null for all when height ≤ 60 inches (≤152.4 cm)', () => {
    const r = idealBodyWeight(150, 'male')
    expect(r.devine).toBe(null)
    expect(r.robinson).toBe(null)
    expect(r.miller).toBe(null)
    expect(r.hamwi).toBe(null)
  })
  test('returns null for invalid sex', () => {
    const r = idealBodyWeight(175, 'other')
    expect(r.devine).toBe(null)
  })
  test('returns null when height is 0', () => {
    const r = idealBodyWeight(0, 'male')
    expect(r.devine).toBe(null)
  })
})
