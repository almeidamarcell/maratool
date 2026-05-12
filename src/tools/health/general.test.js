import { describe, test, expect } from 'vitest'
import {
  qtcBazett,
  qtcFridericia,
  qtcFramingham,
  qtcHodges,
  classifyQtc,
  friedewaldLdl,
  parklandFluid,
  hba1cToEag,
  saag,
  classifySaag,
  transferrinSaturation,
  bloodVolumeNadler,
} from './general.js'

// QTc: heart rate in bpm, QT in ms. RR = 60000/HR ms = 60/HR s.
describe('qtcBazett — QT / sqrt(RR in seconds)', () => {
  test('QT 400 ms, HR 60 → 400 ms (RR = 1s)', () => {
    expect(qtcBazett({ qtMs: 400, hr: 60 })).toBe(400)
  })
  test('QT 400 ms, HR 100 → ~516 ms (RR=0.6s)', () => {
    // 400 / sqrt(0.6) = 400 / 0.7746 = 516.4
    expect(qtcBazett({ qtMs: 400, hr: 100 })).toBeCloseTo(516, 0)
  })
  test('returns null when HR is 0', () => {
    expect(qtcBazett({ qtMs: 400, hr: 0 })).toBe(null)
  })
})
describe('qtcFridericia — QT / cbrt(RR in seconds)', () => {
  test('QT 400, HR 60 → 400', () => {
    expect(qtcFridericia({ qtMs: 400, hr: 60 })).toBe(400)
  })
  test('QT 400, HR 100 → ~474', () => {
    // 400 / 0.6^(1/3) = 400 / 0.8434 = 474.3
    expect(qtcFridericia({ qtMs: 400, hr: 100 })).toBeCloseTo(474, 0)
  })
})
describe('qtcFramingham — QT + 154 × (1 − RR)', () => {
  test('HR 60 → QTc = QT', () => {
    expect(qtcFramingham({ qtMs: 400, hr: 60 })).toBe(400)
  })
  test('QT 400, HR 100 → 400 + 154 × 0.4 = 461.6', () => {
    expect(qtcFramingham({ qtMs: 400, hr: 100 })).toBeCloseTo(462, 0)
  })
})
describe('qtcHodges — QT + 1.75 × (HR − 60)', () => {
  test('HR 60 → QTc = QT', () => {
    expect(qtcHodges({ qtMs: 400, hr: 60 })).toBe(400)
  })
  test('QT 400, HR 100 → 400 + 1.75 × 40 = 470', () => {
    expect(qtcHodges({ qtMs: 400, hr: 100 })).toBe(470)
  })
})
describe('classifyQtc', () => {
  test('< 360 → Short', () => { expect(classifyQtc(350, 'male')).toBe('Short') })
  test('male normal 360–449', () => { expect(classifyQtc(400, 'male')).toBe('Normal') })
  test('female normal 360–459', () => { expect(classifyQtc(450, 'female')).toBe('Normal') })
  test('borderline 450–469 male', () => { expect(classifyQtc(460, 'male')).toBe('Borderline prolonged') })
  test('prolonged ≥ 470 male', () => { expect(classifyQtc(475, 'male')).toBe('Prolonged') })
  test('prolonged ≥ 480 female', () => { expect(classifyQtc(485, 'female')).toBe('Prolonged') })
})

// Friedewald: LDL = TC − HDL − TG/5 (all in mg/dL). Invalid if TG > 400.
describe('friedewaldLdl', () => {
  test('TC 200, HDL 50, TG 150 → 120', () => {
    expect(friedewaldLdl({ totalChol: 200, hdl: 50, triglycerides: 150 })).toBe(120)
  })
  test('TC 250, HDL 40, TG 200 → 170', () => {
    expect(friedewaldLdl({ totalChol: 250, hdl: 40, triglycerides: 200 })).toBe(170)
  })
  test('returns null if TG > 400', () => {
    expect(friedewaldLdl({ totalChol: 250, hdl: 40, triglycerides: 450 })).toBe(null)
  })
  test('returns null on missing values', () => {
    expect(friedewaldLdl({ totalChol: 0, hdl: 40, triglycerides: 150 })).toBe(null)
  })
})

// Parkland: 4 mL × weight × %TBSA over 24h (half in first 8h, half in next 16h).
describe('parklandFluid', () => {
  test('70 kg, 30% TBSA → 8400 mL total, 4200 mL first 8h, 525 mL/h', () => {
    const r = parklandFluid({ weightKg: 70, tbsaPercent: 30 })
    expect(r.totalMl).toBe(8400)
    expect(r.first8hMl).toBe(4200)
    expect(r.first8hRatePerHour).toBe(525)
  })
  test('60 kg, 20% TBSA → 4800 mL total', () => {
    expect(parklandFluid({ weightKg: 60, tbsaPercent: 20 }).totalMl).toBe(4800)
  })
  test('returns null when TBSA is 0', () => {
    expect(parklandFluid({ weightKg: 70, tbsaPercent: 0 })).toBe(null)
  })
})

// eAG (mg/dL) = 28.7 × HbA1c − 46.7 — 1 decimal display, matches Whitebook.
describe('hba1cToEag', () => {
  test('HbA1c 6.0 → 125.5 mg/dL (Whitebook)', () => {
    expect(hba1cToEag(6.0).mgDl).toBeCloseTo(125.5, 1)
  })
  test('HbA1c 7.0 → 154.2 (Whitebook)', () => {
    expect(hba1cToEag(7.0).mgDl).toBeCloseTo(154.2, 1)
  })
  test('HbA1c 8.0 → 182.9 (Whitebook)', () => {
    expect(hba1cToEag(8.0).mgDl).toBeCloseTo(182.9, 1)
  })
  test('HbA1c 9.0 → 211.6 (Whitebook)', () => {
    expect(hba1cToEag(9.0).mgDl).toBeCloseTo(211.6, 1)
  })
  test('HbA1c 10.0 → 240.3 (Whitebook)', () => {
    expect(hba1cToEag(10.0).mgDl).toBeCloseTo(240.3, 1)
  })
  test('also returns mmol/L', () => {
    const r = hba1cToEag(7.0)
    expect(r.mmolL).toBeCloseTo(8.6, 1)
  })
  test('returns null when HbA1c is 0', () => {
    expect(hba1cToEag(0)).toBe(null)
  })
})

// SAAG = serum albumin − ascitic albumin
describe('saag', () => {
  test('serum 3.5, ascitic 1.3 → 2.2 g/dL', () => {
    expect(saag({ serumAlb: 3.5, asciticAlb: 1.3 })).toBeCloseTo(2.2, 1)
  })
  test('returns null when serum is 0', () => {
    expect(saag({ serumAlb: 0, asciticAlb: 1.3 })).toBe(null)
  })
})
describe('classifySaag', () => {
  test('≥ 1.1 → Portal hypertension', () => {
    expect(classifySaag(1.2)).toBe('Portal hypertension (transudate)')
  })
  test('< 1.1 → Non-portal hypertensive', () => {
    expect(classifySaag(0.8)).toBe('Non-portal hypertensive (exudate)')
  })
  test('null for null', () => { expect(classifySaag(null)).toBe(null) })
})

// TSAT (%) = (serum iron / TIBC) × 100
describe('transferrinSaturation', () => {
  test('iron 80, TIBC 400 → 20%', () => {
    expect(transferrinSaturation({ serumIron: 80, tibc: 400 })).toBe(20)
  })
  test('returns null when TIBC is 0', () => {
    expect(transferrinSaturation({ serumIron: 80, tibc: 0 })).toBe(null)
  })
})

// Nadler blood volume (mL):
// male:   0.3669 × h(m)^3 + 0.03219 × w(kg) + 0.6041     (then × 1000)
// female: 0.3561 × h(m)^3 + 0.03308 × w(kg) + 0.1833     (then × 1000)
describe('bloodVolumeNadler', () => {
  test('male 70 kg, 175 cm → ~4900 mL', () => {
    const r = bloodVolumeNadler({ weightKg: 70, heightCm: 175, sex: 'male' })
    expect(r).toBeGreaterThan(4500)
    expect(r).toBeLessThan(5500)
  })
  test('female 60 kg, 165 cm → ~3900 mL', () => {
    const r = bloodVolumeNadler({ weightKg: 60, heightCm: 165, sex: 'female' })
    expect(r).toBeGreaterThan(3500)
    expect(r).toBeLessThan(4400)
  })
  test('returns null for invalid sex', () => {
    expect(bloodVolumeNadler({ weightKg: 70, heightCm: 175, sex: 'other' })).toBe(null)
  })
})
