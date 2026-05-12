import { describe, test, expect } from 'vitest'
import {
  apgarScore,
  classifyApgar,
  ettSizeUncuffed,
  ettSizeCuffed,
  ettInsertionDepth,
  pediatricInfusionMcgKgMin,
  pediatricInfusionMgKgHour,
  gestationalAgeFromCRL,
} from './pediatric.js'

describe('apgarScore — sum of 5 items (0–2 each)', () => {
  test('all 2 → 10', () => {
    expect(apgarScore({ appearance: 2, pulse: 2, grimace: 2, activity: 2, respiration: 2 })).toBe(10)
  })
  test('mixed: 1+1+1+2+1 → 6', () => {
    expect(apgarScore({ appearance: 1, pulse: 1, grimace: 1, activity: 2, respiration: 1 })).toBe(6)
  })
  test('returns null when any value > 2', () => {
    expect(apgarScore({ appearance: 3, pulse: 2, grimace: 2, activity: 2, respiration: 2 })).toBe(null)
  })
  test('returns null when any value < 0', () => {
    expect(apgarScore({ appearance: -1, pulse: 2, grimace: 2, activity: 2, respiration: 2 })).toBe(null)
  })
})
describe('classifyApgar', () => {
  test('≥ 7 → Reassuring', () => { expect(classifyApgar(7)).toBe('Reassuring') })
  test('4–6 → Moderately depressed', () => { expect(classifyApgar(5)).toBe('Moderately depressed') })
  test('≤ 3 → Severely depressed', () => { expect(classifyApgar(2)).toBe('Severely depressed') })
})

// Pediatric ETT — uncuffed = age/4 + 4; cuffed = age/4 + 3.5
describe('ettSizeUncuffed', () => {
  test('4 yo → 5.0 mm', () => { expect(ettSizeUncuffed(4)).toBe(5.0) })
  test('8 yo → 6.0 mm', () => { expect(ettSizeUncuffed(8)).toBe(6.0) })
  test('1 yo → 4.25 mm', () => { expect(ettSizeUncuffed(1)).toBe(4.25) })
  test('returns null when age < 1', () => { expect(ettSizeUncuffed(0.5)).toBe(null) })
})
describe('ettSizeCuffed', () => {
  test('4 yo → 4.5 mm', () => { expect(ettSizeCuffed(4)).toBe(4.5) })
  test('8 yo → 5.5 mm', () => { expect(ettSizeCuffed(8)).toBe(5.5) })
})
describe('ettInsertionDepth — 3 × ETT size (cm)', () => {
  test('ETT 4.0 → 12 cm', () => { expect(ettInsertionDepth(4.0)).toBe(12) })
  test('ETT 5.0 → 15 cm', () => { expect(ettInsertionDepth(5.0)).toBe(15) })
})

// Pediatric infusion calculators.
// mcg/kg/min → mL/h: (dose × weight × 60) / concentration_mcg_per_ml
describe('pediatricInfusionMcgKgMin', () => {
  test('5 mcg/kg/min in 20 kg pt, conc 400 mcg/mL → 15 mL/h', () => {
    expect(pediatricInfusionMcgKgMin({ doseMcgKgMin: 5, weightKg: 20, concentrationMcgPerMl: 400 })).toBe(15)
  })
  test('returns null when concentration is 0', () => {
    expect(pediatricInfusionMcgKgMin({ doseMcgKgMin: 5, weightKg: 20, concentrationMcgPerMl: 0 })).toBe(null)
  })
})

// mg/kg/hour → mL/h: (dose × weight) / concentration_mg_per_ml
describe('pediatricInfusionMgKgHour', () => {
  test('2 mg/kg/h in 25 kg pt, conc 10 mg/mL → 5 mL/h', () => {
    expect(pediatricInfusionMgKgHour({ doseMgKgHour: 2, weightKg: 25, concentrationMgPerMl: 10 })).toBe(5)
  })
  test('returns null when concentration is 0', () => {
    expect(pediatricInfusionMgKgHour({ doseMgKgHour: 2, weightKg: 25, concentrationMgPerMl: 0 })).toBe(null)
  })
})

// Gestational age by CRL — Robinson-Fleming formula.
// GA (days) = 8.052 × sqrt(CRL_mm × 1.037) + 23.73
describe('gestationalAgeFromCRL', () => {
  test('CRL 10 mm → ~50 days (~7w1d)', () => {
    const r = gestationalAgeFromCRL(10)
    expect(r.totalDays).toBeGreaterThan(45)
    expect(r.totalDays).toBeLessThan(55)
  })
  test('CRL 50 mm → ~84 days (~12w0d)', () => {
    const r = gestationalAgeFromCRL(50)
    expect(r.totalDays).toBeGreaterThan(80)
    expect(r.totalDays).toBeLessThan(90)
  })
  test('returns null when CRL is 0', () => {
    expect(gestationalAgeFromCRL(0)).toBe(null)
  })
})
