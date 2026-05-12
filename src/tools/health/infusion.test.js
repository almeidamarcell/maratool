import { describe, test, expect } from 'vitest'
import {
  dropsPerMinToMlPerHour,
  mlPerHourToDropsPerMin,
  mcgKgMinToMlPerHour,
  mlPerHourToMcgKgMin,
} from './infusion.js'

// ── Drops to mL/h ───────────────────────────────────────────────────
// Standard macrodrop (gtt): 20 gtt/mL. mL/h = drops/min × 60 / drops_per_ml
describe('dropsPerMinToMlPerHour', () => {
  test('20 gtt/min, factor 20 (macro) → 60 mL/h', () => {
    expect(dropsPerMinToMlPerHour({ dropsPerMin: 20, dropsPerMl: 20 })).toBe(60)
  })
  test('30 gtt/min, factor 20 → 90 mL/h', () => {
    expect(dropsPerMinToMlPerHour({ dropsPerMin: 30, dropsPerMl: 20 })).toBe(90)
  })
  test('60 gtt/min, factor 60 (microdrop) → 60 mL/h', () => {
    expect(dropsPerMinToMlPerHour({ dropsPerMin: 60, dropsPerMl: 60 })).toBe(60)
  })
  test('returns null when dropsPerMl is 0', () => {
    expect(dropsPerMinToMlPerHour({ dropsPerMin: 20, dropsPerMl: 0 })).toBe(null)
  })
})
describe('mlPerHourToDropsPerMin', () => {
  test('60 mL/h, factor 20 → 20 gtt/min', () => {
    expect(mlPerHourToDropsPerMin({ mlPerHour: 60, dropsPerMl: 20 })).toBe(20)
  })
  test('120 mL/h, factor 20 → 40 gtt/min', () => {
    expect(mlPerHourToDropsPerMin({ mlPerHour: 120, dropsPerMl: 20 })).toBe(40)
  })
  test('120 mL/h, factor 60 → 120 gtt/min', () => {
    expect(mlPerHourToDropsPerMin({ mlPerHour: 120, dropsPerMl: 60 })).toBe(120)
  })
})

// ── mcg/kg/min ↔ mL/h ───────────────────────────────────────────────
describe('mcgKgMinToMlPerHour', () => {
  test('5 mcg/kg/min, 70 kg, conc 400 mcg/mL → 52.5 mL/h', () => {
    // (5 × 70 × 60) / 400 = 21000/400 = 52.5
    expect(mcgKgMinToMlPerHour({ doseMcgKgMin: 5, weightKg: 70, concentrationMcgPerMl: 400 })).toBeCloseTo(52.5, 1)
  })
  test('10 mcg/kg/min, 80 kg, 1000 mcg/mL → 48', () => {
    expect(mcgKgMinToMlPerHour({ doseMcgKgMin: 10, weightKg: 80, concentrationMcgPerMl: 1000 })).toBe(48)
  })
})
describe('mlPerHourToMcgKgMin', () => {
  test('52.5 mL/h, 70 kg, 400 mcg/mL → 5 mcg/kg/min', () => {
    expect(mlPerHourToMcgKgMin({ mlPerHour: 52.5, weightKg: 70, concentrationMcgPerMl: 400 })).toBeCloseTo(5, 1)
  })
  test('returns null when weight is 0', () => {
    expect(mlPerHourToMcgKgMin({ mlPerHour: 50, weightKg: 0, concentrationMcgPerMl: 400 })).toBe(null)
  })
})
