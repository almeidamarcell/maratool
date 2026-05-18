import { describe, it, expect } from 'vitest'
import {
  meldScore, meldNaScore, meldMortality, packYears, packYearRisk,
  fib4, fib4Risk, maddreyDF, maddreyRisk, nafldFibrosis, nafldRisk,
  das28esr, das28crp, das28Band, lilleModel, lilleRisk,
  injurySeverityScore, issRisk, pesiScore, pesiClass,
  dkaSeverity, dkaSeverityLabel, rIssStage, rIssLabel, cdai, cdaiRisk,
  camIcu, camIcuLabel,
  scorad, scoradRisk, pasi, pasiRisk,
  psiPort, psiPortRisk, framinghamRisk, framinghamCategory,
} from './score-formula.js'

describe('meldScore', () => {
  it('matches published example (bili 2, INR 1.5, Cr 1.2)', () => {
    // 3.78*ln(2) + 11.2*ln(1.5) + 9.57*ln(1.2) + 6.43
    // = 2.620 + 4.541 + 1.745 + 6.43 ≈ 15.34 → 15
    expect(meldScore({ bilirubinMgDl: 2, inr: 1.5, creatinineMgDl: 1.2 })).toBe(15)
  })
  it('floors all lab values < 1 to 1', () => {
    // ln(1) = 0 for all; result = 6.43 → 6 → floored at 6
    expect(meldScore({ bilirubinMgDl: 0.5, inr: 0.9, creatinineMgDl: 0.8 })).toBe(6)
  })
  it('caps creatinine at 4', () => {
    const s1 = meldScore({ bilirubinMgDl: 2, inr: 1.5, creatinineMgDl: 4 })
    const s2 = meldScore({ bilirubinMgDl: 2, inr: 1.5, creatinineMgDl: 10 })
    expect(s2).toBe(s1)
  })
  it('uses Cr=4 if dialysis is true', () => {
    const dial = meldScore({ bilirubinMgDl: 2, inr: 1.5, creatinineMgDl: 0.5, dialysis: true })
    const noDial = meldScore({ bilirubinMgDl: 2, inr: 1.5, creatinineMgDl: 4 })
    expect(dial).toBe(noDial)
  })
  it('caps at 40', () => {
    expect(meldScore({ bilirubinMgDl: 100, inr: 10, creatinineMgDl: 4 })).toBe(40)
  })
})

describe('meldNaScore', () => {
  it('returns base MELD when MELD ≤ 11', () => {
    // Small values → MELD floored at 6, no Na adjustment
    expect(meldNaScore({ bilirubinMgDl: 1, inr: 1, creatinineMgDl: 1, sodiumMmol: 130 })).toBe(6)
  })
  it('lower Na raises MELD-Na for MELD > 11', () => {
    const base = meldScore({ bilirubinMgDl: 3, inr: 2, creatinineMgDl: 2 })
    const na = meldNaScore({ bilirubinMgDl: 3, inr: 2, creatinineMgDl: 2, sodiumMmol: 125 })
    expect(na).toBeGreaterThan(base)
  })
})

describe('packYears', () => {
  it('1 pack/day × 20 years = 20 py', () => {
    expect(packYears({ cigarettesPerDay: 20, years: 20 })).toBe(20)
  })
  it('half pack/day × 30 years = 15 py', () => {
    expect(packYears({ cigarettesPerDay: 10, years: 30 })).toBe(15)
  })
  it('returns null for negative values', () => {
    expect(packYears({ cigarettesPerDay: -1, years: 10 })).toBeNull()
  })
})

describe('packYearRisk', () => {
  it('classifies thresholds', () => {
    expect(packYearRisk(5)).toMatch(/Light/)
    expect(packYearRisk(15)).toMatch(/Moderate/)
    expect(packYearRisk(25)).toMatch(/^Heavy/)
    expect(packYearRisk(30)).toMatch(/Very heavy/)
  })
})

describe('meldMortality', () => {
  it('maps score bands to mortality strings', () => {
    expect(meldMortality(8)).toMatch(/< 2%/)
    expect(meldMortality(15)).toMatch(/6–20%/)
    expect(meldMortality(25)).toMatch(/20–52%/)
    expect(meldMortality(35)).toMatch(/52–71%/)
    expect(meldMortality(40)).toMatch(/71%/)
  })
})

describe('fib4', () => {
  it('matches worked example (age 60, AST 60, plt 150, ALT 40)', () => {
    // 3600 / (150·√40) = 3600 / 948.683 ≈ 3.79
    expect(fib4({ ageYears: 60, astUL: 60, plateletsE9L: 150, altUL: 40 })).toBeCloseTo(3.79, 2)
  })
  it('classifies risk bands', () => {
    expect(fib4Risk(1.0)).toMatch(/Low/)
    expect(fib4Risk(2.0)).toMatch(/Indeterminate/)
    expect(fib4Risk(4.0)).toMatch(/High/)
  })
  it('returns null on invalid input', () => {
    expect(fib4({ ageYears: 0, astUL: 60, plateletsE9L: 150, altUL: 40 })).toBeNull()
  })
})

describe('maddreyDF', () => {
  it('4.6·(PT−control)+bili (PT 20, control 12, bili 5) = 41.8', () => {
    expect(maddreyDF({ ptSeconds: 20, controlPtSeconds: 12, bilirubinMgDl: 5 })).toBe(41.8)
  })
  it('≥ 32 flags severe alcoholic hepatitis', () => {
    expect(maddreyRisk(41.8)).toMatch(/Severe/)
    expect(maddreyRisk(20)).toMatch(/Non-severe/)
  })
})

describe('nafldFibrosis', () => {
  it('matches worked example', () => {
    // age60 BMI30 DM AST50 ALT25 plt200 alb4.0 → raw 1.235, round2 → 1.23
    expect(nafldFibrosis({ ageYears: 60, bmi: 30, diabetes: true, astUL: 50, altUL: 25, plateletsE9L: 200, albuminGDl: 4.0 })).toBe(1.23)
  })
  it('classifies bands', () => {
    expect(nafldRisk(-2)).toMatch(/Low/)
    expect(nafldRisk(0)).toMatch(/Indeterminate/)
    expect(nafldRisk(1)).toMatch(/High/)
  })
})

describe('DAS28', () => {
  it('DAS28-ESR worked example (TJC5 SJC3 ESR30 GH50) ≈ 4.8', () => {
    expect(das28esr({ tjc28: 5, sjc28: 3, esrMmHr: 30, ghVas: 50 })).toBeCloseTo(4.8, 1)
  })
  it('DAS28-CRP worked example (TJC5 SJC3 CRP10 GH50) ≈ 4.3', () => {
    expect(das28crp({ tjc28: 5, sjc28: 3, crpMgL: 10, ghVas: 50 })).toBeCloseTo(4.3, 1)
  })
  it('bands map correctly', () => {
    expect(das28Band(2.0)).toMatch(/Remission/)
    expect(das28Band(3.0)).toMatch(/Low/)
    expect(das28Band(4.5)).toMatch(/Moderate/)
    expect(das28Band(6.0)).toMatch(/High/)
  })
})

describe('lilleModel', () => {
  it('returns a probability in [0,1]', () => {
    const s = lilleModel({ ageYears: 50, albuminDay0GL: 30, bilirubinDay0MgDl: 10, bilirubinDay7MgDl: 6, ptSeconds: 20, renalInsufficiency: false })
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(1)
    expect(s).toBeCloseTo(0.085, 2)
  })
  it('classifies responder vs non-responder at 0.45', () => {
    expect(lilleRisk(0.085)).toMatch(/responder to corticosteroids/)
    expect(lilleRisk(0.6)).toMatch(/non-responder/)
  })
})

describe('injurySeverityScore', () => {
  it('sums squares of three highest AIS', () => {
    expect(injurySeverityScore([5, 4, 3, 2, 0, 0])).toBe(50) // 25+16+9
  })
  it('any AIS = 6 → 75', () => {
    expect(injurySeverityScore([6, 2, 1, 0, 0, 0])).toBe(75)
  })
  it('classifies severity bands', () => {
    expect(issRisk(50)).toMatch(/Critical/)
    expect(issRisk(20)).toMatch(/Serious/)
    expect(issRisk(75)).toMatch(/maximal/)
  })
})

describe('pesiScore', () => {
  it('age + weighted points (age70 male) = 80 → Class II', () => {
    const s = pesiScore({ ageYears: 70, male: true })
    expect(s).toBe(80)
    expect(pesiClass(s)).toMatch(/Class II/)
  })
  it('high-risk combination → Class V', () => {
    const s = pesiScore({ ageYears: 70, male: false, cancer: true, sbpLt100: true })
    expect(s).toBe(130)
    expect(pesiClass(s)).toMatch(/Class V/)
  })
})

describe('dkaSeverity', () => {
  it('pH 7.1 / HCO3 12 / alert → moderate', () => {
    expect(dkaSeverityLabel(dkaSeverity({ phArterial: 7.1, bicarbonateMeqL: 12, mentalStatus: 'alert' }))).toBe('Moderate DKA')
  })
  it('pH 6.9 → severe', () => {
    expect(dkaSeverityLabel(dkaSeverity({ phArterial: 6.9, bicarbonateMeqL: 8, mentalStatus: 'stupor' }))).toBe('Severe DKA')
  })
  it('pH 7.28 → mild', () => {
    expect(dkaSeverityLabel(dkaSeverity({ phArterial: 7.28, bicarbonateMeqL: 16, mentalStatus: 'alert' }))).toBe('Mild DKA')
  })
})

describe('rIssStage', () => {
  it('ISS I + standard cyto + normal LDH → Stage I', () => {
    expect(rIssStage({ iss: 1, highRiskCytogenetics: false, highLDH: false })).toBe(1)
  })
  it('ISS III + high LDH → Stage III', () => {
    expect(rIssStage({ iss: 3, highRiskCytogenetics: false, highLDH: true })).toBe(3)
  })
  it('everything else → Stage II', () => {
    expect(rIssStage({ iss: 1, highRiskCytogenetics: false, highLDH: true })).toBe(2)
    expect(rIssStage({ iss: 2, highRiskCytogenetics: false, highLDH: false })).toBe(2)
    expect(rIssLabel(2)).toMatch(/Stage II/)
  })
})

describe('cdai', () => {
  it('remission worked example ≈ 96', () => {
    const v = cdai({ stools7d: 10, painSum7d: 3, wellbeingSum7d: 7, complications: 0, antidiarrheal: false, abdominalMass: 0, hctObserved: 45, male: true, weightKg: 70, standardWeightKg: 70 })
    expect(v).toBe(96)
    expect(cdaiRisk(v)).toMatch(/remission/)
  })
  it('classifies activity bands', () => {
    expect(cdaiRisk(100)).toMatch(/remission/)
    expect(cdaiRisk(200)).toMatch(/Mild/)
    expect(cdaiRisk(300)).toMatch(/Moderate/)
    expect(cdaiRisk(500)).toMatch(/Severe/)
  })
})

describe('camIcu', () => {
  it('positive requires F1 AND F2 AND (F3 OR F4)', () => {
    expect(camIcu({ f1AcuteFluctuating: true, f2Inattention: true, f3AlteredLOC: true, f4DisorganizedThinking: false })).toBe(true)
    expect(camIcu({ f1AcuteFluctuating: true, f2Inattention: true, f3AlteredLOC: false, f4DisorganizedThinking: true })).toBe(true)
  })
  it('negative when F1 or F2 absent, or both F3 and F4 absent', () => {
    expect(camIcu({ f1AcuteFluctuating: false, f2Inattention: true, f3AlteredLOC: true, f4DisorganizedThinking: true })).toBe(false)
    expect(camIcu({ f1AcuteFluctuating: true, f2Inattention: false, f3AlteredLOC: true, f4DisorganizedThinking: true })).toBe(false)
    expect(camIcu({ f1AcuteFluctuating: true, f2Inattention: true, f3AlteredLOC: false, f4DisorganizedThinking: false })).toBe(false)
  })
  it('labels positivity', () => {
    expect(camIcuLabel(true)).toMatch(/POSITIVE/)
    expect(camIcuLabel(false)).toMatch(/negative/)
  })
})

describe('scorad', () => {
  it('A/5 + 7B/2 + C (extent50, B=12, C=10) = 62', () => {
    expect(scorad({ extentPct: 50, erythema: 2, edema: 2, oozing: 2, excoriation: 2, lichenification: 2, dryness: 2, pruritusVas: 5, sleepVas: 5 })).toBe(62)
  })
  it('classifies severity', () => {
    expect(scoradRisk(20)).toMatch(/Mild/)
    expect(scoradRisk(40)).toMatch(/Moderate/)
    expect(scoradRisk(62)).toMatch(/Severe/)
  })
  it('rejects out-of-range intensity', () => {
    expect(scorad({ extentPct: 10, erythema: 5, edema: 0, oozing: 0, excoriation: 0, lichenification: 0, dryness: 0, pruritusVas: 0, sleepVas: 0 })).toBeNull()
  })
})

describe('pasi', () => {
  it('all regions E=I=D=2, A=3 → 18.0', () => {
    const r = { e: 2, i: 2, d: 2, a: 3 }
    expect(pasi({ head: r, arms: r, trunk: r, legs: r })).toBe(18)
  })
  it('classifies severity', () => {
    expect(pasiRisk(3)).toMatch(/Mild/)
    expect(pasiRisk(8)).toMatch(/Moderate/)
    expect(pasiRisk(18)).toMatch(/Severe/)
  })
})

describe('psiPort', () => {
  it('young, no risk factors → Class I', () => {
    const r = psiPort({ ageYears: 40, female: false })
    expect(r.klass).toBe('I')
  })
  it('age 75 male with neoplasm → 105 points, Class IV', () => {
    const r = psiPort({ ageYears: 75, female: false, neoplasm: true })
    expect(r.points).toBe(105)
    expect(r.klass).toBe('IV')
  })
  it('age 60 female, no other risk → 50 points, Class II', () => {
    const r = psiPort({ ageYears: 60, female: true })
    expect(r.points).toBe(50)
    expect(r.klass).toBe('II')
  })
  it('maps class to mortality', () => {
    expect(psiPortRisk('V')).toMatch(/27–31%/)
  })
})

describe('framinghamRisk (ATP III)', () => {
  it('man 55, TC 250, HDL 39, nonsmoker, SBP 146 untreated → 15 pts, 20%', () => {
    const r = framinghamRisk({ male: true, ageYears: 55, totalChol: 250, hdl: 39, smoker: false, sbp: 146, treatedBp: false })
    expect(r.points).toBe(15)
    expect(r.riskPct).toBe('20%')
  })
  it('woman 60, TC 220, HDL 50, smoker, SBP 130 untreated → 16 pts, 4%', () => {
    const r = framinghamRisk({ male: false, ageYears: 60, totalChol: 220, hdl: 50, smoker: true, sbp: 130, treatedBp: false })
    expect(r.points).toBe(16)
    expect(r.riskPct).toBe('4%')
  })
  it('categorises 10-year risk', () => {
    expect(framinghamCategory('4%')).toMatch(/Low/)
    expect(framinghamCategory('15%')).toMatch(/Intermediate/)
    expect(framinghamCategory('≥ 30%')).toMatch(/High/)
  })
})
