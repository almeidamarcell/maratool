import { describe, test, expect } from 'vitest'
import {
  serumOsmolality,
  correctedCalcium,
  correctedSodium,
  ironDeficitGanzoni,
} from './electrolytes.js'

// ── Serum Osmolality ─────────────────────────────────────────────────
// Osm (mOsm/kg) = 2 × Na + Glucose/18 + BUN/2.8
describe('serumOsmolality', () => {
  test('Na 140, Glc 90, BUN 14 → 290', () => {
    // 2*140 + 90/18 + 14/2.8 = 280 + 5 + 5 = 290
    expect(serumOsmolality({ sodium: 140, glucose: 90, bun: 14 })).toBe(290)
  })
  test('Na 145, Glc 180, BUN 28 → 310', () => {
    // 2*145 + 180/18 + 28/2.8 = 290 + 10 + 10 = 310
    expect(serumOsmolality({ sodium: 145, glucose: 180, bun: 28 })).toBe(310)
  })
  test('returns null when Na is 0', () => {
    expect(serumOsmolality({ sodium: 0, glucose: 90, bun: 14 })).toBe(null)
  })
})

// ── Corrected Calcium ────────────────────────────────────────────────
// Corrected Ca = Ca + 0.8 × (4 − Alb).  Reference albumin = 4 g/dL.
describe('correctedCalcium', () => {
  test('Ca 8.0, Alb 2.0 → 9.6', () => {
    // 8.0 + 0.8 * (4-2) = 8.0 + 1.6 = 9.6
    expect(correctedCalcium({ totalCalcium: 8.0, albumin: 2.0 })).toBeCloseTo(9.6, 1)
  })
  test('Ca 9.5, Alb 4.0 → 9.5 (no correction needed)', () => {
    expect(correctedCalcium({ totalCalcium: 9.5, albumin: 4.0 })).toBeCloseTo(9.5, 1)
  })
  test('Ca 10.0, Alb 5.0 → 9.2 (downward correction)', () => {
    // 10.0 + 0.8 * (4-5) = 10.0 - 0.8 = 9.2
    expect(correctedCalcium({ totalCalcium: 10.0, albumin: 5.0 })).toBeCloseTo(9.2, 1)
  })
  test('returns null when Ca is 0', () => {
    expect(correctedCalcium({ totalCalcium: 0, albumin: 3.0 })).toBe(null)
  })
})

// ── Sodium Correction for Hyperglycemia ──────────────────────────────
// Katz 1973: Corrected Na = Measured Na + 1.6 × ((Glc − 100) / 100)
describe('correctedSodium (Katz)', () => {
  test('Na 130, Glc 400 → 134.8', () => {
    // 130 + 1.6 * (400-100)/100 = 130 + 4.8 = 134.8
    expect(correctedSodium({ sodium: 130, glucose: 400 })).toBeCloseTo(134.8, 1)
  })
  test('Na 140, Glc 100 → 140 (no correction)', () => {
    expect(correctedSodium({ sodium: 140, glucose: 100 })).toBeCloseTo(140, 1)
  })
  test('returns null when Na is 0', () => {
    expect(correctedSodium({ sodium: 0, glucose: 400 })).toBe(null)
  })
})

// ── Iron Deficit (Ganzoni) ───────────────────────────────────────────
// Total iron deficit (mg) = weight × (target Hb − current Hb) × 2.4 + iron stores
// iron stores = 500 mg if weight ≥ 35 kg, else 15 × weight (mg).
// Target Hb defaults to 15 g/dL for adults.
describe('ironDeficitGanzoni', () => {
  test('70 kg, Hb 10, target 15 → 1340 mg', () => {
    // 70 * (15-10) * 2.4 + 500 = 70*5*2.4 + 500 = 840 + 500 = 1340
    expect(ironDeficitGanzoni({ weightKg: 70, currentHb: 10, targetHb: 15 })).toBe(1340)
  })
  test('60 kg, Hb 8, target 14 → 1364 mg', () => {
    // 60 * (14-8) * 2.4 + 500 = 864 + 500 = 1364
    expect(ironDeficitGanzoni({ weightKg: 60, currentHb: 8, targetHb: 14 })).toBe(1364)
  })
  test('20 kg child, Hb 10, target 14 → 492 mg (15 × 20 stores)', () => {
    // 20 * 4 * 2.4 + 15*20 = 192 + 300 = 492
    expect(ironDeficitGanzoni({ weightKg: 20, currentHb: 10, targetHb: 14 })).toBe(492)
  })
  test('uses 15 g/dL as default targetHb', () => {
    const r1 = ironDeficitGanzoni({ weightKg: 70, currentHb: 10 })
    const r2 = ironDeficitGanzoni({ weightKg: 70, currentHb: 10, targetHb: 15 })
    expect(r1).toBe(r2)
  })
  test('returns 0 when current ≥ target', () => {
    expect(ironDeficitGanzoni({ weightKg: 70, currentHb: 16, targetHb: 15 })).toBe(0)
  })
  test('returns null when weight is 0', () => {
    expect(ironDeficitGanzoni({ weightKg: 0, currentHb: 10, targetHb: 15 })).toBe(null)
  })
})
