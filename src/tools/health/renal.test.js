import { describe, test, expect } from 'vitest'
import {
  mdrd,
  fractionalExcretionSodium,
  fractionalExcretionUrea,
  urineProteinCreatinineRatio,
  bicarbonateDeficit,
} from './renal.js'

// ─── MDRD (4-variable, 1999 original coefficient 186) ──────────────
// eGFR = 186 × Cr^-1.154 × Age^-0.203 × (0.742 if female) × (1.212 if Black)
// Validated against Whitebook outputs.
describe('mdrd', () => {
  test('50 yo male, Cr 1.0 → 84.1 (matches Whitebook)', () => {
    expect(mdrd({ age: 50, sex: 'male', creatinineMgDl: 1.0 })).toBeCloseTo(84.1, 1)
  })
  test('50 yo female, Cr 1.0 → 62.4 (matches Whitebook)', () => {
    expect(mdrd({ age: 50, sex: 'female', creatinineMgDl: 1.0 })).toBeCloseTo(62.4, 1)
  })
  test('60 yo male, Cr 1.5 → 50.7 (matches Whitebook)', () => {
    expect(mdrd({ age: 60, sex: 'male', creatinineMgDl: 1.5 })).toBeCloseTo(50.7, 1)
  })
  test('70 yo female, Cr 2.0 → 26.2 (matches Whitebook)', () => {
    expect(mdrd({ age: 70, sex: 'female', creatinineMgDl: 2.0 })).toBeCloseTo(26.2, 1)
  })
  test('race=black applies 1.212 multiplier', () => {
    const nb = mdrd({ age: 50, sex: 'male', creatinineMgDl: 1.0 })
    const bl = mdrd({ age: 50, sex: 'male', creatinineMgDl: 1.0, race: 'black' })
    expect(bl / nb).toBeCloseTo(1.212, 2)
  })
  test('returns null when Cr is 0', () => {
    expect(mdrd({ age: 50, sex: 'male', creatinineMgDl: 0 })).toBe(null)
  })
  test('returns null for invalid sex', () => {
    expect(mdrd({ age: 50, sex: 'other', creatinineMgDl: 1.0 })).toBe(null)
  })
})

// ─── FENa ─────────────────────────────────────────────────────────────
// FENa = (UNa × PCr) / (PNa × UCr) × 100
describe('fractionalExcretionSodium', () => {
  test('classic prerenal (UNa 10, PCr 2, PNa 140, UCr 100) → 0.14%', () => {
    expect(fractionalExcretionSodium({ uNa: 10, pCr: 2, pNa: 140, uCr: 100 })).toBeCloseTo(0.14, 2)
  })
  test('intrinsic (UNa 60, PCr 4, PNa 140, UCr 50) → 3.43%', () => {
    expect(fractionalExcretionSodium({ uNa: 60, pCr: 4, pNa: 140, uCr: 50 })).toBeCloseTo(3.43, 1)
  })
  test('returns null when uCr is 0', () => {
    expect(fractionalExcretionSodium({ uNa: 50, pCr: 2, pNa: 140, uCr: 0 })).toBe(null)
  })
  test('returns null when pNa is 0', () => {
    expect(fractionalExcretionSodium({ uNa: 50, pCr: 2, pNa: 0, uCr: 100 })).toBe(null)
  })
})

// ─── FEUrea ───────────────────────────────────────────────────────────
// FEUrea = (UUrea × PCr) / (PUrea × UCr) × 100
describe('fractionalExcretionUrea', () => {
  test('prerenal (UUrea 300, PCr 2, PUrea 80, UCr 100) → 7.5%', () => {
    expect(fractionalExcretionUrea({ uUrea: 300, pCr: 2, pUrea: 80, uCr: 100 })).toBeCloseTo(7.5, 1)
  })
  test('returns null when uCr is 0', () => {
    expect(fractionalExcretionUrea({ uUrea: 300, pCr: 2, pUrea: 80, uCr: 0 })).toBe(null)
  })
})

// ─── UPCR ─────────────────────────────────────────────────────────────
// UPCR (g/g) = urine protein / urine creatinine.
// If protein in mg/dL and Cr in mg/dL: ratio in g/g equals ratio of mg/dL.
describe('urineProteinCreatinineRatio', () => {
  test('protein 100 mg/dL, Cr 50 mg/dL → 2.0 g/g (estimates ~2 g/day)', () => {
    expect(urineProteinCreatinineRatio({ proteinMgDl: 100, creatinineMgDl: 50 })).toBe(2)
  })
  test('protein 30 mg/dL, Cr 100 mg/dL → 0.3 g/g', () => {
    expect(urineProteinCreatinineRatio({ proteinMgDl: 30, creatinineMgDl: 100 })).toBe(0.3)
  })
  test('returns null when creatinine is 0', () => {
    expect(urineProteinCreatinineRatio({ proteinMgDl: 50, creatinineMgDl: 0 })).toBe(null)
  })
})

// ─── Bicarbonate Deficit ──────────────────────────────────────────────
// Deficit (mEq) = 0.5 × weight × (target HCO3 − measured HCO3)
describe('bicarbonateDeficit', () => {
  test('70 kg, current 14, target 22 → 280 mEq', () => {
    expect(bicarbonateDeficit({ weightKg: 70, currentHCO3: 14, targetHCO3: 22 })).toBe(280)
  })
  test('60 kg, current 18, target 24 → 180 mEq', () => {
    expect(bicarbonateDeficit({ weightKg: 60, currentHCO3: 18, targetHCO3: 24 })).toBe(180)
  })
  test('returns 0 when current ≥ target', () => {
    expect(bicarbonateDeficit({ weightKg: 70, currentHCO3: 24, targetHCO3: 22 })).toBe(0)
  })
  test('returns null when weight is 0', () => {
    expect(bicarbonateDeficit({ weightKg: 0, currentHCO3: 14, targetHCO3: 22 })).toBe(null)
  })
})
