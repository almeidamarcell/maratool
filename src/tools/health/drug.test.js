import { describe, test, expect } from 'vitest'
import {
  opioidConversion,
  benzodiazepineConversion,
  corticosteroidConversion,
  rsiDoses,
  phenytoinCorrected,
} from './drug.js'

// ── Opioid Conversion (MME) ─────────────────────────────────────────
// All conversions go through morphine PO 30 mg = 1 reference (CDC table).
describe('opioidConversion', () => {
  test('30 mg morphine PO → 30 mg morphine PO (identity)', () => {
    expect(opioidConversion({ from: 'morphine-po', to: 'morphine-po', dose: 30 })).toBe(30)
  })
  test('30 mg morphine PO → 10 mg morphine IV (3:1 ratio)', () => {
    expect(opioidConversion({ from: 'morphine-po', to: 'morphine-iv', dose: 30 })).toBeCloseTo(10, 1)
  })
  test('30 mg morphine PO → 7.5 mg hydromorphone PO (4:1)', () => {
    expect(opioidConversion({ from: 'morphine-po', to: 'hydromorphone-po', dose: 30 })).toBeCloseTo(7.5, 1)
  })
  test('30 mg morphine PO → 20 mg oxycodone PO (1.5:1)', () => {
    expect(opioidConversion({ from: 'morphine-po', to: 'oxycodone-po', dose: 30 })).toBeCloseTo(20, 0)
  })
  test('30 mg morphine PO → 200 mg tramadol PO (1:6.67)', () => {
    expect(opioidConversion({ from: 'morphine-po', to: 'tramadol-po', dose: 30 })).toBeCloseTo(200, 0)
  })
  test('returns null on unknown drug', () => {
    expect(opioidConversion({ from: 'unknown', to: 'morphine-po', dose: 30 })).toBe(null)
  })
})

// ── Benzodiazepine equivalence (Ashton manual) ──────────────────────
// Reference: 10 mg diazepam = baseline.
describe('benzodiazepineConversion', () => {
  test('10 mg diazepam → 1 mg clonazepam', () => {
    // Equivalence ratio Diaz:Clona = 10:1 (Ashton)
    expect(benzodiazepineConversion({ from: 'diazepam', to: 'clonazepam', dose: 10 })).toBeCloseTo(1, 1)
  })
  test('10 mg diazepam → 1 mg alprazolam', () => {
    // Diazepam 10 mg = Alprazolam 1 mg (clinically used)
    // Ashton actually says 0.5 mg alprazolam = 10 mg diazepam; we use 1 mg per common reference.
    expect(benzodiazepineConversion({ from: 'diazepam', to: 'alprazolam', dose: 10 })).toBeCloseTo(1, 1)
  })
  test('10 mg diazepam → 2 mg lorazepam', () => {
    expect(benzodiazepineConversion({ from: 'diazepam', to: 'lorazepam', dose: 10 })).toBeCloseTo(2, 1)
  })
  test('20 mg diazepam → 2 mg clonazepam (linear)', () => {
    expect(benzodiazepineConversion({ from: 'diazepam', to: 'clonazepam', dose: 20 })).toBeCloseTo(2, 1)
  })
  test('returns null on unknown drug', () => {
    expect(benzodiazepineConversion({ from: 'unknown', to: 'diazepam', dose: 10 })).toBe(null)
  })
})

// ── Corticosteroid Equivalence ──────────────────────────────────────
// Reference: hydrocortisone 20 mg = baseline.
// Prednisone 5 = Methylpred 4 = Dexa 0.75 = Hydrocort 20 (mg).
describe('corticosteroidConversion', () => {
  test('Prednisone 5 → Hydrocortisone 20', () => {
    expect(corticosteroidConversion({ from: 'prednisone', to: 'hydrocortisone', dose: 5 })).toBe(20)
  })
  test('Prednisone 60 → Methylprednisolone 48', () => {
    expect(corticosteroidConversion({ from: 'prednisone', to: 'methylprednisolone', dose: 60 })).toBeCloseTo(48, 0)
  })
  test('Prednisone 5 → Dexamethasone 0.75', () => {
    expect(corticosteroidConversion({ from: 'prednisone', to: 'dexamethasone', dose: 5 })).toBeCloseTo(0.75, 2)
  })
  test('Dexamethasone 4 → Prednisone 26.7', () => {
    expect(corticosteroidConversion({ from: 'dexamethasone', to: 'prednisone', dose: 4 })).toBeCloseTo(26.7, 1)
  })
})

// ── RSI Doses ───────────────────────────────────────────────────────
// Standard induction + paralytic doses by weight.
// Etomidate 0.3 mg/kg, Ketamine 1.5 mg/kg, Propofol 1.5 mg/kg, Midazolam 0.2 mg/kg.
// Succinylcholine 1.5 mg/kg, Rocuronium 1.2 mg/kg.
describe('rsiDoses', () => {
  test('70 kg patient → etomidate 21 mg, ketamine 105 mg', () => {
    const r = rsiDoses(70)
    expect(r.etomidate).toBeCloseTo(21, 0)
    expect(r.ketamine).toBeCloseTo(105, 0)
  })
  test('70 kg → succinylcholine 105, rocuronium 84', () => {
    const r = rsiDoses(70)
    expect(r.succinylcholine).toBeCloseTo(105, 0)
    expect(r.rocuronium).toBeCloseTo(84, 0)
  })
  test('returns null when weight is 0', () => {
    expect(rsiDoses(0)).toBe(null)
  })
})

// ── Phenytoin level correction (Sheiner-Tozer) ──────────────────────
// Corrected level = measured / (0.2 × albumin + 0.1)
// In ESRD: corrected = measured / (0.1 × albumin + 0.1)
describe('phenytoinCorrected', () => {
  test('Level 10, Alb 4, normal renal → 11.1', () => {
    // 10 / (0.2*4 + 0.1) = 10 / 0.9 = 11.11
    expect(phenytoinCorrected({ level: 10, albumin: 4, esrd: false })).toBeCloseTo(11.1, 1)
  })
  test('Level 10, Alb 2, normal renal → 20', () => {
    // 10 / (0.2*2 + 0.1) = 10 / 0.5 = 20
    expect(phenytoinCorrected({ level: 10, albumin: 2, esrd: false })).toBe(20)
  })
  test('Level 5, Alb 2, ESRD → 16.67', () => {
    // 5 / (0.1*2 + 0.1) = 5 / 0.3 = 16.67
    expect(phenytoinCorrected({ level: 5, albumin: 2, esrd: true })).toBeCloseTo(16.7, 1)
  })
})
