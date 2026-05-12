import { describe, test, expect } from 'vitest'
import {
  idealPaO2ByAge,
  pao2FiO2Ratio,
  classifyArds,
  spo2FiO2Ratio,
} from './ventilation.js'

// ── Ideal PaO2 by Age (Sorbini 1968) ────────────────────────────────
// PaO2 = 109 − 0.43 × age (years)
describe('idealPaO2ByAge', () => {
  test('20 yo → 100.4 mmHg', () => {
    expect(idealPaO2ByAge(20)).toBeCloseTo(100.4, 1)
  })
  test('60 yo → 83.2 mmHg', () => {
    expect(idealPaO2ByAge(60)).toBeCloseTo(83.2, 1)
  })
  test('80 yo → 74.6 mmHg', () => {
    expect(idealPaO2ByAge(80)).toBeCloseTo(74.6, 1)
  })
  test('returns null for age < 0', () => {
    expect(idealPaO2ByAge(-5)).toBe(null)
  })
})

// ── PaO2/FiO2 Ratio (Berlin 2012) ───────────────────────────────────
describe('pao2FiO2Ratio', () => {
  test('PaO2 80, FiO2 0.4 → 200', () => {
    expect(pao2FiO2Ratio({ pao2: 80, fio2: 0.4 })).toBe(200)
  })
  test('PaO2 60, FiO2 0.5 → 120', () => {
    expect(pao2FiO2Ratio({ pao2: 60, fio2: 0.5 })).toBe(120)
  })
  test('FiO2 entered as percent (40) → still works (treat as 0.4)', () => {
    expect(pao2FiO2Ratio({ pao2: 80, fio2: 40 })).toBe(200)
  })
  test('returns null when FiO2 is 0', () => {
    expect(pao2FiO2Ratio({ pao2: 80, fio2: 0 })).toBe(null)
  })
})
describe('classifyArds (Berlin)', () => {
  test('> 300 → No ARDS', () => { expect(classifyArds(350)).toBe('No ARDS') })
  test('200–300 → Mild', () => { expect(classifyArds(250)).toBe('Mild ARDS') })
  test('100–200 → Moderate', () => { expect(classifyArds(150)).toBe('Moderate ARDS') })
  test('≤ 100 → Severe', () => { expect(classifyArds(80)).toBe('Severe ARDS') })
  test('null in → null out', () => { expect(classifyArds(null)).toBe(null) })
})

// ── SpO2/FiO2 Ratio ─────────────────────────────────────────────────
// S/F (non-invasive ARDS proxy). Rice 2007: 235 ≈ P/F 200; 315 ≈ P/F 300.
describe('spo2FiO2Ratio', () => {
  test('SpO2 95, FiO2 0.4 → 237.5', () => {
    expect(spo2FiO2Ratio({ spo2: 95, fio2: 0.4 })).toBeCloseTo(237.5, 1)
  })
  test('SpO2 90, FiO2 0.5 → 180', () => {
    expect(spo2FiO2Ratio({ spo2: 90, fio2: 0.5 })).toBe(180)
  })
  test('FiO2 as percent (40) → same result', () => {
    expect(spo2FiO2Ratio({ spo2: 95, fio2: 40 })).toBeCloseTo(237.5, 1)
  })
  test('returns null when FiO2 is 0', () => {
    expect(spo2FiO2Ratio({ spo2: 95, fio2: 0 })).toBe(null)
  })
})
