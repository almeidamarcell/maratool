import { describe, test, expect } from 'vitest'
import { cockcroftGault, classifyGFR } from './cockcroft-gault.js'

// Reference: Cockcroft DW, Gault MH. Nephron. 1976;16(1):31-41.
// CrCl (mL/min) = ((140 − age) × weight_kg) / (72 × Cr_mg/dL)
// × 0.85 if female

describe('cockcroftGault — rounded to integer (Whitebook display)', () => {
  test('70-year-old male, 70 kg, Cr 1.0 → 68 mL/min (Whitebook)', () => {
    expect(cockcroftGault({ age: 70, weightKg: 70, creatinineMgDl: 1.0, sex: 'male' })).toBe(68)
  })

  test('60-year-old female, 60 kg, Cr 0.8 → 71 mL/min (Whitebook)', () => {
    expect(cockcroftGault({ age: 60, weightKg: 60, creatinineMgDl: 0.8, sex: 'female' })).toBe(71)
  })

  test('40-year-old male, 80 kg, Cr 1.2 → 93 mL/min (Whitebook)', () => {
    expect(cockcroftGault({ age: 40, weightKg: 80, creatinineMgDl: 1.2, sex: 'male' })).toBe(93)
  })

  test('55-year-old male, 65 kg, Cr 1.5 → 51 mL/min (Whitebook + Nephron 1976)', () => {
    expect(cockcroftGault({ age: 55, weightKg: 65, creatinineMgDl: 1.5, sex: 'male' })).toBe(51)
  })

  test('75-year-old female, 55 kg, Cr 1.5 → 28 mL/min (Whitebook)', () => {
    expect(cockcroftGault({ age: 75, weightKg: 55, creatinineMgDl: 1.5, sex: 'female' })).toBe(28)
  })

  test('returns null when creatinine is 0', () => {
    expect(cockcroftGault({ age: 50, weightKg: 70, creatinineMgDl: 0, sex: 'male' })).toBe(null)
  })

  test('returns null when age ≥ 140', () => {
    expect(cockcroftGault({ age: 140, weightKg: 70, creatinineMgDl: 1.0, sex: 'male' })).toBe(null)
  })

  test('returns null when weight is 0', () => {
    expect(cockcroftGault({ age: 50, weightKg: 0, creatinineMgDl: 1.0, sex: 'male' })).toBe(null)
  })
})

describe('classifyGFR — KDIGO CKD stages', () => {
  test('≥ 90 → G1 (Normal or high)', () => {
    expect(classifyGFR(95)).toBe('G1 (Normal or high)')
  })
  test('60–89 → G2 (Mildly decreased)', () => {
    expect(classifyGFR(75)).toBe('G2 (Mildly decreased)')
  })
  test('45–59 → G3a (Mildly to moderately decreased)', () => {
    expect(classifyGFR(50)).toBe('G3a (Mildly to moderately decreased)')
  })
  test('30–44 → G3b (Moderately to severely decreased)', () => {
    expect(classifyGFR(35)).toBe('G3b (Moderately to severely decreased)')
  })
  test('15–29 → G4 (Severely decreased)', () => {
    expect(classifyGFR(20)).toBe('G4 (Severely decreased)')
  })
  test('< 15 → G5 (Kidney failure)', () => {
    expect(classifyGFR(10)).toBe('G5 (Kidney failure)')
  })
  test('returns null for null', () => {
    expect(classifyGFR(null)).toBe(null)
  })
})
