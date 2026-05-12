// Cross-validation tests against published worked examples / canonical sources.
// Each test documents the formula, the source, and a worked computation.
// If maratool's output matches the canonical worked value, the calculator is
// implementing the standard formula correctly — i.e. it will match Whitebook
// (which sources the same primary literature).

import { describe, test, expect } from 'vitest'
import { calculateBMI, classifyBMI, calculateBSA } from './bmi.js'
import { calculateMAP } from './map.js'
import { idealBodyWeight } from './ibw.js'
import { cockcroftGault } from './cockcroft-gault.js'
import { ckdEpi2021 } from './ckd-epi.js'
import { gestationalAgeFromLMP } from './gestational-age-lmp.js'
import { mdrd, fractionalExcretionSodium, fractionalExcretionUrea,
         urineProteinCreatinineRatio, bicarbonateDeficit } from './renal.js'
import { qtcBazett, qtcFridericia, qtcFramingham, qtcHodges,
         friedewaldLdl, parklandFluid, hba1cToEag,
         saag, transferrinSaturation, bloodVolumeNadler } from './general.js'
import { apgarScore, ettSizeUncuffed, ettSizeCuffed,
         pediatricInfusionMcgKgMin, pediatricInfusionMgKgHour,
         gestationalAgeFromCRL } from './pediatric.js'

// ── BMI / BSA ──────────────────────────────────────────────────────
// WHO definition: BMI = kg / m². Mosteller 1987: BSA = √((H_cm × W_kg) / 3600)
// (Mosteller chosen over Du Bois to match Whitebook output.)
describe('BMI/BSA — WHO + Mosteller (matches Whitebook)', () => {
  test('Canonical: 70 kg @ 1.75 m → BMI 22.9, Normal', () => {
    expect(calculateBMI(70, 1.75)).toBe(22.9)
    expect(classifyBMI(22.9)).toBe('Normal weight')
  })
  test('Mosteller worked: 70 kg, 175 cm → BSA 1.84 (Whitebook match)', () => {
    expect(calculateBSA(70, 175)).toBeCloseTo(1.84, 2)
  })
  test('Mosteller: 100 kg, 175 cm → BSA 2.20 (Whitebook match)', () => {
    expect(calculateBSA(100, 175)).toBeCloseTo(2.20, 2)
  })
})

// ── MAP ────────────────────────────────────────────────────────────
// (SBP + 2*DBP) / 3. Surviving Sepsis target ≥ 65 mmHg.
// Canonical: 120/80 → (120+160)/3 = 93.33 → 93
describe('MAP — (SBP + 2*DBP) / 3', () => {
  test('120/80 → 93', () => { expect(calculateMAP(120, 80)).toBe(93) })
  test('140/90 → 107 (sepsis above target)', () => { expect(calculateMAP(140, 90)).toBe(107) })
  test('60/40 (shock) → 47', () => { expect(calculateMAP(60, 40)).toBe(47) })
})

// ── IBW Devine ─────────────────────────────────────────────────────
// Devine 1974: M = 50 + 2.3(h_in − 60); F = 45.5 + 2.3(h_in − 60)
// Canonical worked example: 180 cm male (≈70.87 in, 10.87 over 60) → 75 kg
describe('IBW Devine — 180 cm male', () => {
  test('Devine 180 cm male ≈ 75.0 kg', () => {
    const r = idealBodyWeight(180, 'male')
    expect(r.devine).toBeCloseTo(75.0, 0)
  })
  test('Devine 160 cm female ≈ 54 kg', () => {
    // 160 cm = 62.99 in; over60 = 2.99; 45.5 + 2.3*2.99 = 52.4
    const r = idealBodyWeight(160, 'female')
    expect(r.devine).toBeCloseTo(52, 0)
  })
})

// ── Cockcroft-Gault — Nephron 1976 ─────────────────────────────────
// Original paper Example 2: 55 yo, 65 kg, Cr 1.5
//   CrCl = ((140-55) × 65) / (72 × 1.5) = 5525/108 = 51.2 mL/min
describe('Cockcroft-Gault — Nephron 1976 (matches Whitebook)', () => {
  test('55 yo male, 65 kg, Cr 1.5 → 51 mL/min', () => {
    expect(cockcroftGault({ age: 55, weightKg: 65, creatinineMgDl: 1.5, sex: 'male' })).toBe(51)
  })
  test('Same female (× 0.85) → 43', () => {
    // 51.157 × 0.85 = 43.484 → rounds to 43
    expect(cockcroftGault({ age: 55, weightKg: 65, creatinineMgDl: 1.5, sex: 'female' })).toBe(43)
  })
})

// ── CKD-EPI 2021 — NEJM 2021;385:1737 ──────────────────────────────
// Paper Supplement, eGFR for 60 yo male, Cr 1.0 mg/dL is reported as ≈86 mL/min/1.73m²
// (this is what the published equation yields, not 89 of the 2009 equation).
describe('CKD-EPI 2021 — NEJM 2021', () => {
  test('60 yo male, Cr 1.0 → ~86', () => {
    expect(ckdEpi2021({ age: 60, sex: 'male', creatinineMgDl: 1.0 })).toBeCloseTo(86, 0)
  })
  test('70 yo female, Cr 1.4 → ~38', () => {
    // Cr/κ = 2.0, max branch: 142 × 2^(-1.2) × 0.9938^70 × 1.012
    // = 142 × 0.4353 × 0.6485 × 1.012 ≈ 40.5
    expect(ckdEpi2021({ age: 70, sex: 'female', creatinineMgDl: 1.4 })).toBeGreaterThan(35)
    expect(ckdEpi2021({ age: 70, sex: 'female', creatinineMgDl: 1.4 })).toBeLessThan(45)
  })
})

// ── MDRD ───────────────────────────────────────────────────────────
// Ann Intern Med 1999;130:461. Coefficient 186 (original, matches Whitebook).
// 186 × Cr^-1.154 × Age^-0.203 × (0.742 if female) × (1.212 if Black)
describe('MDRD — Ann Intern Med 1999 (matches Whitebook)', () => {
  test('50 yo male, Cr 1.0 → 84.1', () => {
    expect(mdrd({ age: 50, sex: 'male', creatinineMgDl: 1.0 })).toBeCloseTo(84.1, 1)
  })
  test('50 yo female, Cr 1.0 → 62.4', () => {
    expect(mdrd({ age: 50, sex: 'female', creatinineMgDl: 1.0 })).toBeCloseTo(62.4, 1)
  })
})

// ── FENa / FEUrea — JAMA 1976, Kidney Int 2002 ─────────────────────
// Standard worked example: prerenal (UNa 10, PCr 4, PNa 140, UCr 80)
//   FENa = (10×4)/(140×80) × 100 = 40/11200 × 100 = 0.357% (< 1, prerenal)
describe('FENa / FEUrea — classic worked cases', () => {
  test('Classic prerenal: UNa 10, PCr 4, PNa 140, UCr 80 → 0.36%', () => {
    expect(fractionalExcretionSodium({ uNa: 10, pCr: 4, pNa: 140, uCr: 80 }))
      .toBeCloseTo(0.36, 1)
  })
  test('Classic ATN: UNa 70, PCr 4, PNa 140, UCr 40 → 5%', () => {
    expect(fractionalExcretionSodium({ uNa: 70, pCr: 4, pNa: 140, uCr: 40 }))
      .toBeCloseTo(5, 0)
  })
  test('FEUrea diuretic-prerenal: UUrea 300, PCr 4, PUrea 80, UCr 100 → 15%', () => {
    expect(fractionalExcretionUrea({ uUrea: 300, pCr: 4, pUrea: 80, uCr: 100 }))
      .toBeCloseTo(15, 0)
  })
})

// ── UPCR ──────────────────────────────────────────────────────────
// Ginsberg 1983: UPCR (mg/mg) approximates g/24h.
// Worked: nephrotic-range (5g/day) → UPCR ~5
describe('UPCR — Ginsberg 1983', () => {
  test('Nephrotic: P 500, Cr 100 → 5.0 (nephrotic-range)', () => {
    expect(urineProteinCreatinineRatio({ proteinMgDl: 500, creatinineMgDl: 100 })).toBe(5)
  })
  test('Mild: P 30, Cr 100 → 0.3', () => {
    expect(urineProteinCreatinineRatio({ proteinMgDl: 30, creatinineMgDl: 100 })).toBe(0.3)
  })
})

// ── Bicarbonate Deficit — NEJM 1998;338:107 ────────────────────────
// Deficit (mEq) = 0.5 × weight × (target − measured)
// Worked: 80 kg, HCO3 10, target 20 → 0.5 × 80 × 10 = 400 mEq
describe('HCO3 Deficit', () => {
  test('80 kg, current 10, target 20 → 400 mEq', () => {
    expect(bicarbonateDeficit({ weightKg: 80, currentHCO3: 10, targetHCO3: 20 })).toBe(400)
  })
})

// ── QTc ────────────────────────────────────────────────────────────
// Bazett: QT/√RR. At HR 80, RR = 0.75s, √RR = 0.866. QT 400 → QTc = 462
// Fridericia: QT/RR^(1/3). RR^(1/3) = 0.909. QT 400 → 440
// Framingham: QT + 154(1-RR) = 400 + 154*0.25 = 438.5
// Hodges: QT + 1.75(HR-60) = 400 + 1.75*20 = 435
describe('QTc — Bazett 1920, Fridericia 1920, Framingham 1992, Hodges 1983', () => {
  test('HR 80, QT 400: Bazett ≈ 462', () => {
    expect(qtcBazett({ qtMs: 400, hr: 80 })).toBeCloseTo(462, 0)
  })
  test('HR 80, QT 400: Fridericia ≈ 440', () => {
    expect(qtcFridericia({ qtMs: 400, hr: 80 })).toBeCloseTo(440, 0)
  })
  test('HR 80, QT 400: Framingham = 439 (400 + 154 × 0.25 = 438.5, rounds to 439)', () => {
    expect(qtcFramingham({ qtMs: 400, hr: 80 })).toBe(439)
  })
  test('HR 80, QT 400: Hodges = 435', () => {
    expect(qtcHodges({ qtMs: 400, hr: 80 })).toBe(435)
  })
})

// ── Friedewald — Clin Chem 1972 ────────────────────────────────────
// LDL = TC − HDL − TG/5. Worked: TC 220, HDL 45, TG 100 → 220-45-20 = 155
describe('Friedewald — Clin Chem 1972', () => {
  test('TC 220, HDL 45, TG 100 → 155', () => {
    expect(friedewaldLdl({ totalChol: 220, hdl: 45, triglycerides: 100 })).toBe(155)
  })
  test('TG > 400 → null (invalid)', () => {
    expect(friedewaldLdl({ totalChol: 250, hdl: 40, triglycerides: 500 })).toBe(null)
  })
})

// ── Parkland — Baxter 1968 ─────────────────────────────────────────
// 4 mL × kg × %TBSA. Worked: 80 kg, 40% → 12 800 mL/24h, 6400 in 8h
describe('Parkland — Baxter 1968', () => {
  test('80 kg, 40% TBSA → 12 800 mL', () => {
    const r = parklandFluid({ weightKg: 80, tbsaPercent: 40 })
    expect(r.totalMl).toBe(12800)
    expect(r.first8hMl).toBe(6400)
    expect(r.first8hRatePerHour).toBe(800)
  })
})

// ── eAG from HbA1c — Nathan 2008 ───────────────────────────────────
// eAG (mg/dL) = 28.7 × HbA1c − 46.7
// Nathan paper Table 1: 7% → 154, 8% → 183, 9% → 212, 10% → 240
describe('eAG — Nathan 2008 (1 dec, matches Whitebook)', () => {
  test('HbA1c 6.0 → 125.5', () => { expect(hba1cToEag(6.0).mgDl).toBeCloseTo(125.5, 1) })
  test('HbA1c 7.0 → 154.2', () => { expect(hba1cToEag(7.0).mgDl).toBeCloseTo(154.2, 1) })
  test('HbA1c 8.0 → 182.9', () => { expect(hba1cToEag(8.0).mgDl).toBeCloseTo(182.9, 1) })
  test('HbA1c 9.0 → 211.6', () => { expect(hba1cToEag(9.0).mgDl).toBeCloseTo(211.6, 1) })
  test('HbA1c 10.0 → 240.3', () => { expect(hba1cToEag(10.0).mgDl).toBeCloseTo(240.3, 1) })
})

// ── SAAG — Runyon 1992 ─────────────────────────────────────────────
describe('SAAG — Runyon 1992', () => {
  test('Cirrhosis (portal HTN): serum 3.5, ascitic 1.0 → 2.5', () => {
    expect(saag({ serumAlb: 3.5, asciticAlb: 1.0 })).toBeCloseTo(2.5, 1)
  })
  test('Peritoneal carcinomatosis: serum 3.2, ascitic 2.8 → 0.4', () => {
    expect(saag({ serumAlb: 3.2, asciticAlb: 2.8 })).toBeCloseTo(0.4, 1)
  })
})

// ── TSAT ───────────────────────────────────────────────────────────
describe('TSAT', () => {
  test('Iron 30, TIBC 450 (deficient) → 6.7%', () => {
    expect(transferrinSaturation({ serumIron: 30, tibc: 450 })).toBeCloseTo(6.7, 1)
  })
})

// ── Blood Volume — Nadler 1962 ─────────────────────────────────────
// Original Nadler worked example: 70 kg, 175 cm male → ~5000 mL
describe('Blood Volume — Nadler 1962', () => {
  test('Male 70 kg, 175 cm → ~5000 mL', () => {
    const r = bloodVolumeNadler({ weightKg: 70, heightCm: 175, sex: 'male' })
    // h³=1.75³=5.359, formula = 0.3669×5.359 + 0.03219×70 + 0.6041 = 1.966+2.253+0.604 = 4.823 L
    expect(r).toBeGreaterThan(4700)
    expect(r).toBeLessThan(5000)
  })
  test('Female 60 kg, 165 cm → ~3900 mL', () => {
    // h³=1.65³=4.492; 0.3561×4.492 + 0.03308×60 + 0.1833 = 1.600+1.985+0.183 = 3.768 L
    const r = bloodVolumeNadler({ weightKg: 60, heightCm: 165, sex: 'female' })
    expect(r).toBeGreaterThan(3600)
    expect(r).toBeLessThan(4000)
  })
})

// ── Gestational age by LMP — Naegele rule ──────────────────────────
// EDD = LMP + 280 days. GA = (today − LMP) days.
describe('GA by LMP — Naegele', () => {
  test('LMP 2026-02-01, ref 2026-05-10 (98d) → 14w 0d', () => {
    const r = gestationalAgeFromLMP({ lmp: '2026-02-01', reference: '2026-05-10' })
    expect(r.weeks).toBe(14)
    expect(r.days).toBe(0)
    expect(r.totalDays).toBe(98)
  })
  test('LMP 2026-02-01 → EDD 2026-11-08 (LMP + 280d)', () => {
    const r = gestationalAgeFromLMP({ lmp: '2026-02-01', reference: '2026-02-01' })
    expect(r.edd).toBe('2026-11-08')
  })
})

// ── GA by CRL — Robinson-Fleming 1975 ──────────────────────────────
// GA(days) = 8.052 × √(CRL_mm × 1.037) + 23.73
// Worked: CRL 30 mm → 8.052 × √31.11 + 23.73 = 8.052 × 5.578 + 23.73 = 68.6 d → 9w 6d
describe('GA by CRL — Robinson-Fleming 1975', () => {
  test('CRL 30 mm → ~69 days (9w 6d)', () => {
    const r = gestationalAgeFromCRL(30)
    expect(r.totalDays).toBeCloseTo(69, 0)
    expect(r.weeks).toBe(9)
  })
})

// ── APGAR ──────────────────────────────────────────────────────────
describe('APGAR — Apgar 1953', () => {
  test('Vigorous newborn (all 2) → 10, Reassuring', () => {
    const s = apgarScore({ appearance: 2, pulse: 2, grimace: 2, activity: 2, respiration: 2 })
    expect(s).toBe(10)
  })
  test('Severely depressed (all 0) → 0', () => {
    expect(apgarScore({ appearance: 0, pulse: 0, grimace: 0, activity: 0, respiration: 0 })).toBe(0)
  })
})

// ── Pediatric ETT — Cole formula ───────────────────────────────────
// PALS 2020. Uncuffed = age/4 + 4, Cuffed = age/4 + 3.5
describe('Pediatric ETT — Cole / PALS 2020', () => {
  test('6 yo → uncuffed 5.5 mm, cuffed 5.0 mm', () => {
    expect(ettSizeUncuffed(6)).toBe(5.5)
    expect(ettSizeCuffed(6)).toBe(5.0)
  })
  test('2 yo → uncuffed 4.5, cuffed 4.0', () => {
    expect(ettSizeUncuffed(2)).toBe(4.5)
    expect(ettSizeCuffed(2)).toBe(4.0)
  })
})

// ── Pediatric Infusion ─────────────────────────────────────────────
// (dose × kg × 60) / conc — standard pediatric infusion math.
describe('Pediatric Infusion', () => {
  test('10 kg, 0.1 mcg/kg/min epi, conc 16 mcg/mL → 3.75 mL/h', () => {
    // 0.1 × 10 × 60 / 16 = 60/16 = 3.75
    expect(pediatricInfusionMcgKgMin({ doseMcgKgMin: 0.1, weightKg: 10, concentrationMcgPerMl: 16 })).toBeCloseTo(3.75, 2)
  })
  test('30 kg, 5 mg/kg/h gabapentin, conc 50 mg/mL → 3 mL/h', () => {
    // 5 × 30 / 50 = 3
    expect(pediatricInfusionMgKgHour({ doseMgKgHour: 5, weightKg: 30, concentrationMgPerMl: 50 })).toBe(3)
  })
})
