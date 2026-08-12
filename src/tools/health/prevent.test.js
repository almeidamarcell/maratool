import { describe, it, expect } from 'vitest'
import { preventRisk, preventCategory } from './prevent.js'

describe('preventRisk (AHA PREVENT base model)', () => {
  // Golden vector from the preventr R package README (Mayer M, preventr
  // v0.12.0), whose outputs are validated against the official AHA PREVENT
  // online calculator: 50-year-old woman, SBP 160 on treatment, TC 200,
  // HDL 45, no statin, diabetic, non-smoker, eGFR 90, BMI 35 →
  // 10-yr: total CVD 14.7%, ASCVD 9.2%, HF 8.1%
  // 30-yr: total CVD 53.0%, ASCVD 35.4%, HF 39.0%
  const woman = { male: false, ageYears: 50, totalChol: 200, hdl: 45, sbp: 160, bpMeds: true, statin: false, diabetic: true, smoker: false, egfr: 90, bmi: 35 }
  it('matches official calculator, 10-year outputs', () => {
    const r = preventRisk(woman)
    expect(r.cvd10).toBeCloseTo(14.7, 1)
    expect(r.ascvd10).toBeCloseTo(9.2, 1)
    expect(r.hf10).toBeCloseTo(8.1, 1)
  })
  it('matches official calculator, 30-year outputs', () => {
    const r = preventRisk(woman)
    expect(r.cvd30).toBeCloseTo(53.0, 1)
    expect(r.ascvd30).toBeCloseTo(35.4, 1)
    expect(r.hf30).toBeCloseTo(39.0, 1)
  })
  it('computes male risks with sensible ordering', () => {
    const base = { male: true, ageYears: 55, totalChol: 213, hdl: 50, sbp: 120, bpMeds: false, statin: false, diabetic: false, smoker: false, egfr: 90, bmi: 26 }
    const r = preventRisk(base)
    expect(r.cvd10).toBeGreaterThan(0)
    expect(r.cvd10).toBeGreaterThanOrEqual(r.ascvd10)
    expect(r.cvd30).toBeGreaterThan(r.cvd10)
    const worse = preventRisk({ ...base, sbp: 160, bpMeds: true, diabetic: true, smoker: true, egfr: 45 })
    expect(worse.cvd10).toBeGreaterThan(r.cvd10)
    expect(worse.hf10).toBeGreaterThan(r.hf10)
  })
  it('suppresses 30-year outputs for ages 60-79', () => {
    const r = preventRisk({ male: false, ageYears: 65, totalChol: 200, hdl: 50, sbp: 130, bpMeds: false, statin: false, diabetic: false, smoker: false, egfr: 80, bmi: 27 })
    expect(r.cvd10).toBeGreaterThan(0)
    expect(r.cvd30).toBeNull()
    expect(r.ascvd30).toBeNull()
    expect(r.hf30).toBeNull()
  })
  it('activates the SBP spline knot below 110 mmHg', () => {
    // The model has separate terms for min(SBP,110) and max(SBP,110); an SBP
    // below the knot must flow through the min-branch coefficient and yield a
    // valid, different estimate than SBP at the knot.
    const base = { male: true, ageYears: 55, totalChol: 213, hdl: 50, bpMeds: false, statin: false, diabetic: false, smoker: false, egfr: 90, bmi: 26 }
    const low = preventRisk({ ...base, sbp: 95 })
    const knot = preventRisk({ ...base, sbp: 110 })
    expect(low.cvd10).toBeGreaterThan(0)
    expect(low.cvd10).toBeLessThan(100)
    expect(low.cvd10).not.toBe(knot.cvd10)
  })
  it('rejects out-of-range inputs', () => {
    const ok = { male: false, ageYears: 50, totalChol: 200, hdl: 45, sbp: 130, bpMeds: false, statin: false, diabetic: false, smoker: false, egfr: 90, bmi: 27 }
    expect(preventRisk(ok)).not.toBeNull()
    expect(preventRisk({ ...ok, ageYears: 29 })).toBeNull()
    expect(preventRisk({ ...ok, ageYears: 80 })).toBeNull()
    expect(preventRisk({ ...ok, totalChol: 129 })).toBeNull()
    expect(preventRisk({ ...ok, hdl: 101 })).toBeNull()
    expect(preventRisk({ ...ok, sbp: 89 })).toBeNull()
    expect(preventRisk({ ...ok, egfr: 14 })).toBeNull()
    expect(preventRisk({ ...ok, bmi: 18 })).toBeNull()
    expect(preventRisk({ ...ok, bmi: 40 })).toBeNull()
    expect(preventRisk({ ...ok, egfr: NaN })).toBeNull()
  })
  it('categorises per ACC/AHA bands', () => {
    expect(preventCategory(3)).toMatch(/Low/)
    expect(preventCategory(6)).toMatch(/Borderline/)
    expect(preventCategory(10)).toMatch(/Intermediate/)
    expect(preventCategory(25)).toMatch(/High/)
  })
})

describe('preventRisk cross-implementation oracle vectors', () => {
  // Expected values computed by running the independent Canvas Medical
  // implementation (Medical-Software-Foundation/canvas, prevent-calculator/
  // services/equations.py) on 2026-08-12 — an independently transcribed port
  // of the Khan 2024 supplement whose outputs match the official AHA
  // calculator. Guards against transcription errors in coefficient rows that
  // the female golden vector does not exercise (male rows, statin terms).
  it('male 55, no statin → 4.1/2.8/1.6 (10y), 22.6/14.8/11.0 (30y)', () => {
    const r = preventRisk({ male: true, ageYears: 55, totalChol: 213, hdl: 50, sbp: 120, diabetic: false, smoker: false, bmi: 26, egfr: 90, bpMeds: false, statin: false })
    expect([r.cvd10, r.ascvd10, r.hf10]).toEqual([4.1, 2.8, 1.6])
    expect([r.cvd30, r.ascvd30, r.hf30]).toEqual([22.6, 14.8, 11])
  })
  it('same man on a statin → statin terms shift CVD/ASCVD, HF unchanged', () => {
    const r = preventRisk({ male: true, ageYears: 55, totalChol: 213, hdl: 50, sbp: 120, diabetic: false, smoker: false, bmi: 26, egfr: 90, bpMeds: false, statin: true })
    expect([r.cvd10, r.ascvd10, r.hf10]).toEqual([4, 2.8, 1.6])
    expect([r.cvd30, r.ascvd30, r.hf30]).toEqual([23.8, 16, 11])
  })
  it('golden-vector woman on a statin → 13.6/9.1/8.1 and 52.5/36.6/39.0', () => {
    const r = preventRisk({ male: false, ageYears: 50, totalChol: 200, hdl: 45, sbp: 160, diabetic: true, smoker: false, bmi: 35, egfr: 90, bpMeds: true, statin: true })
    expect([r.cvd10, r.ascvd10, r.hf10]).toEqual([13.6, 9.1, 8.1])
    expect([r.cvd30, r.ascvd30, r.hf30]).toEqual([52.5, 36.6, 39])
  })
  it('male 45 smoker + diabetic + reduced eGFR → 19.8/13.7/8.4 (10y)', () => {
    const r = preventRisk({ male: true, ageYears: 45, totalChol: 250, hdl: 38, sbp: 140, diabetic: true, smoker: true, bmi: 31, egfr: 70, bpMeds: true, statin: false })
    expect([r.cvd10, r.ascvd10, r.hf10]).toEqual([19.8, 13.7, 8.4])
    expect([r.cvd30, r.ascvd30, r.hf30]).toEqual([58.4, 43.8, 38.5])
  })
})

describe('preventRisk boundaries', () => {
  const ok = { male: false, ageYears: 50, totalChol: 200, hdl: 45, sbp: 130, bpMeds: false, statin: false, diabetic: false, smoker: false, egfr: 90, bmi: 27 }
  it('rejects above the upper input bounds', () => {
    expect(preventRisk({ ...ok, totalChol: 321 })).toBeNull()
    expect(preventRisk({ ...ok, sbp: 201 })).toBeNull()
    expect(preventRisk({ ...ok, egfr: 141 })).toBeNull()
  })
  it('accepts inclusive boundary values (bmi upper bound is exclusive)', () => {
    expect(preventRisk({ ...ok, ageYears: 30 })).not.toBeNull()
    expect(preventRisk({ ...ok, ageYears: 79 })).not.toBeNull()
    expect(preventRisk({ ...ok, bmi: 18.5 })).not.toBeNull()
    expect(preventRisk({ ...ok, bmi: 39.9 })).not.toBeNull()
    expect(preventRisk({ ...ok, egfr: 140 })).not.toBeNull()
    expect(preventRisk({ ...ok, sbp: 200 })).not.toBeNull()
  })
  it('category thresholds sit exactly at 5, 7.5 and 20', () => {
    expect(preventCategory(4.9)).toMatch(/Low/)
    expect(preventCategory(5)).toMatch(/Borderline/)
    expect(preventCategory(7.5)).toMatch(/Intermediate/)
    expect(preventCategory(20)).toMatch(/High/)
    expect(preventCategory(NaN)).toBeNull()
    expect(preventCategory(null)).toBeNull()
  })
})
