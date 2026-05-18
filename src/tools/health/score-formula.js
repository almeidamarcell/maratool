// Health calculators that use closed-form formulas (not categorical sums).
// Each function is pure and exported for testing.

function round0(n) { return Math.round(n) }
function round1(n) { return Math.round(n * 10) / 10 }
function round2(n) { return Math.round(n * 100) / 100 }

// ─── MELD / MELD-Na ──────────────────────────────────────────────────
// MELD = 3.78×ln(bili) + 11.2×ln(INR) + 9.57×ln(Cr) + 6.43
// Lab floor: any value < 1 → 1. Creatinine cap: 4. If dialyzed ≥ 2× in 7 days → Cr = 4.
// Score rounded to nearest integer; floor 6, ceiling 40.
// MELD-Na (UNOS 2016): if MELD > 11, MELD-Na = MELD + 1.32×(137 − Na) − [0.033×MELD×(137 − Na)]
// Na bounded 125–137. Floor 6, ceiling 40.
// Refs: Kamath PS et al. Hepatology. 2001;33(2):464-470. Kim WR et al. NEJM. 2008;359(10):1018-1026.
export function meldScore({ bilirubinMgDl, inr, creatinineMgDl, dialysis }) {
  if (bilirubinMgDl <= 0 || inr <= 0 || creatinineMgDl <= 0) return null
  let bili = Math.max(bilirubinMgDl, 1)
  let i = Math.max(inr, 1)
  let cr = dialysis ? 4 : Math.min(Math.max(creatinineMgDl, 1), 4)
  const raw = 3.78 * Math.log(bili) + 11.2 * Math.log(i) + 9.57 * Math.log(cr) + 6.43
  const score = Math.min(40, Math.max(6, round0(raw)))
  return score
}

export function meldNaScore({ bilirubinMgDl, inr, creatinineMgDl, dialysis, sodiumMmol }) {
  const meld = meldScore({ bilirubinMgDl, inr, creatinineMgDl, dialysis })
  if (meld === null || !Number.isFinite(sodiumMmol) || sodiumMmol <= 0) return null
  if (meld <= 11) return meld
  const na = Math.min(137, Math.max(125, sodiumMmol))
  const adj = meld + 1.32 * (137 - na) - 0.033 * meld * (137 - na)
  return Math.min(40, Math.max(6, round0(adj)))
}

export function meldMortality(meld) {
  if (meld === null) return null
  if (meld < 10) return '3-month mortality < 2%'
  if (meld <= 19) return '3-month mortality 6–20%'
  if (meld <= 29) return '3-month mortality 20–52%'
  if (meld <= 39) return '3-month mortality 52–71%'
  return '3-month mortality ~ 71% or more'
}

// ─── Pack-year ───────────────────────────────────────────────────────
// pack-years = (cigarettes/day) × years / 20
export function packYears({ cigarettesPerDay, years }) {
  if (cigarettesPerDay < 0 || years < 0) return null
  return round1((cigarettesPerDay * years) / 20)
}

export function packYearRisk(py) {
  if (py === null) return null
  if (py < 10) return 'Light smoking history'
  if (py < 20) return 'Moderate smoking history'
  if (py < 30) return 'Heavy smoking history'
  return 'Very heavy smoking history (≥ 30 py — qualifies for USPSTF lung cancer screening if age 50–80)'
}

// ─── FIB-4 Index ─────────────────────────────────────────────────────
// FIB-4 = (age × AST) / (platelets[×10⁹/L] × √ALT)
// Ref: Sterling RK et al. Hepatology. 2006;43(6):1317-1325.
export function fib4({ ageYears, astUL, plateletsE9L, altUL }) {
  if (ageYears <= 0 || astUL <= 0 || plateletsE9L <= 0 || altUL <= 0) return null
  return round2((ageYears * astUL) / (plateletsE9L * Math.sqrt(altUL)))
}
export function fib4Risk(v) {
  if (v === null) return null
  if (v < 1.45) return 'Low — advanced fibrosis (F3–F4) effectively excluded'
  if (v <= 3.25) return 'Indeterminate — further assessment (elastography/biopsy) advised'
  return 'High — advanced fibrosis (F3–F4) likely'
}

// ─── Maddrey Discriminant Function ───────────────────────────────────
// DF = 4.6 × (patient PT − control PT) + total bilirubin (mg/dL)
// Ref: Maddrey WC et al. Gastroenterology. 1978;75(2):193-199.
export function maddreyDF({ ptSeconds, controlPtSeconds, bilirubinMgDl }) {
  if (ptSeconds <= 0 || controlPtSeconds <= 0 || bilirubinMgDl < 0) return null
  return round1(4.6 * (ptSeconds - controlPtSeconds) + bilirubinMgDl)
}
export function maddreyRisk(df) {
  if (df === null) return null
  return df >= 32
    ? 'Severe alcoholic hepatitis — poor short-term prognosis; consider corticosteroids'
    : 'Non-severe alcoholic hepatitis — lower 30-day mortality'
}

// ─── NAFLD Fibrosis Score ────────────────────────────────────────────
// NFS = −1.675 + 0.037·age + 0.094·BMI + 1.13·IFG/DM + 0.99·(AST/ALT) − 0.013·platelets − 0.66·albumin
// Ref: Angulo P et al. Hepatology. 2007;45(4):846-854.
export function nafldFibrosis({ ageYears, bmi, diabetes, astUL, altUL, plateletsE9L, albuminGDl }) {
  if (ageYears <= 0 || bmi <= 0 || astUL <= 0 || altUL <= 0 || plateletsE9L <= 0 || albuminGDl <= 0) return null
  const v = -1.675 + 0.037 * ageYears + 0.094 * bmi + 1.13 * (diabetes ? 1 : 0)
    + 0.99 * (astUL / altUL) - 0.013 * plateletsE9L - 0.66 * albuminGDl
  return round2(v)
}
export function nafldRisk(v) {
  if (v === null) return null
  if (v < -1.455) return 'Low probability of advanced fibrosis (F3–F4 excluded)'
  if (v <= 0.675) return 'Indeterminate — further assessment advised'
  return 'High probability of advanced fibrosis (F3–F4)'
}

// ─── DAS28 (ESR and CRP) ─────────────────────────────────────────────
// DAS28-ESR = 0.56·√TJC28 + 0.28·√SJC28 + 0.70·ln(ESR) + 0.014·GH
// DAS28-CRP = 0.56·√TJC28 + 0.28·√SJC28 + 0.36·ln(CRP+1) + 0.014·GH + 0.96
// Refs: Prevoo ML et al. Arthritis Rheum. 1995;38(1):44-48; Wells G et al. Ann Rheum Dis. 2009;68(6):954-960.
function das28Band(v) {
  if (v === null) return null
  if (v < 2.6) return 'Remission (DAS28 < 2.6)'
  if (v <= 3.2) return 'Low disease activity'
  if (v <= 5.1) return 'Moderate disease activity'
  return 'High disease activity'
}
export function das28esr({ tjc28, sjc28, esrMmHr, ghVas }) {
  if (tjc28 < 0 || sjc28 < 0 || esrMmHr <= 0 || ghVas < 0) return null
  const v = 0.56 * Math.sqrt(tjc28) + 0.28 * Math.sqrt(sjc28) + 0.70 * Math.log(esrMmHr) + 0.014 * ghVas
  return round1(v * 10) / 10
}
export function das28crp({ tjc28, sjc28, crpMgL, ghVas }) {
  if (tjc28 < 0 || sjc28 < 0 || crpMgL < 0 || ghVas < 0) return null
  const v = 0.56 * Math.sqrt(tjc28) + 0.28 * Math.sqrt(sjc28) + 0.36 * Math.log(crpMgL + 1) + 0.014 * ghVas + 0.96
  return round1(v * 10) / 10
}
export { das28Band }

// ─── Lille Model (alcoholic hepatitis, day-7 steroid response) ───────
// score = exp(−R)/(1+exp(−R));  bilirubin entered in mg/dL, converted to µmol/L (×17.1)
// R = 3.19 − 0.101·age + 0.147·albuminDay0[g/L] + 0.0165·ΔbiliDay0−7[µmol/L]
//     − 0.206·renalInsuff − 0.0065·biliDay0[µmol/L] − 0.0096·PT[s]
// Ref: Louvet A et al. Hepatology. 2007;45(6):1348-1354.
export function lilleModel({ ageYears, albuminDay0GL, bilirubinDay0MgDl, bilirubinDay7MgDl, ptSeconds, renalInsufficiency }) {
  if (ageYears <= 0 || albuminDay0GL <= 0 || bilirubinDay0MgDl < 0 || bilirubinDay7MgDl < 0 || ptSeconds <= 0) return null
  const b0 = bilirubinDay0MgDl * 17.1
  const b7 = bilirubinDay7MgDl * 17.1
  const evolBili = b0 - b7
  const R = 3.19 - 0.101 * ageYears + 0.147 * albuminDay0GL + 0.0165 * evolBili
    - 0.206 * (renalInsufficiency ? 1 : 0) - 0.0065 * b0 - 0.0096 * ptSeconds
  const score = Math.exp(-R) / (1 + Math.exp(-R))
  return Math.round(score * 1000) / 1000
}
export function lilleRisk(s) {
  if (s === null) return null
  return s >= 0.45
    ? 'Lille ≥ 0.45 — non-responder to corticosteroids; ~25% 6-month survival'
    : 'Lille < 0.45 — responder to corticosteroids; ~85% 6-month survival'
}

// ─── Injury Severity Score (ISS) ─────────────────────────────────────
// Sum of squares of the three highest AIS values across 6 body regions.
// Any region AIS = 6 → ISS = 75.
// Ref: Baker SP et al. J Trauma. 1974;14(3):187-196.
export function injurySeverityScore(aisValues) {
  if (!Array.isArray(aisValues) || aisValues.length === 0) return null
  for (const a of aisValues) { if (a < 0 || a > 6 || !Number.isFinite(a)) return null }
  if (aisValues.some(a => a === 6)) return 75
  const top3 = [...aisValues].sort((a, b) => b - a).slice(0, 3)
  return top3.reduce((s, a) => s + a * a, 0)
}
export function issRisk(v) {
  if (v === null) return null
  if (v === 75) return 'ISS 75 — maximal (unsurvivable region injury)'
  if (v <= 8) return 'Minor trauma (ISS ≤ 8)'
  if (v <= 15) return 'Moderate trauma (ISS 9–15)'
  if (v <= 24) return 'Serious / major trauma (ISS 16–24)'
  if (v <= 49) return 'Severe trauma (ISS 25–49)'
  return 'Critical trauma (ISS 50–74)'
}

// ─── PESI (Pulmonary Embolism Severity Index) ────────────────────────
// Total = age + sum of weighted points. Ref: Aujesky D et al. AJRCCM. 2005;172(8):1041-1046.
export function pesiScore({ ageYears, male, cancer, chronicHF, chronicLung, hr110, sbpLt100, rr30, tempLt36, alteredMental, sao2Lt90 }) {
  if (ageYears <= 0) return null
  return Math.round(ageYears)
    + (male ? 10 : 0) + (cancer ? 30 : 0) + (chronicHF ? 10 : 0) + (chronicLung ? 10 : 0)
    + (hr110 ? 20 : 0) + (sbpLt100 ? 30 : 0) + (rr30 ? 20 : 0) + (tempLt36 ? 20 : 0)
    + (alteredMental ? 60 : 0) + (sao2Lt90 ? 20 : 0)
}
export function pesiClass(v) {
  if (v === null) return null
  if (v <= 65) return 'Class I — very low risk (30-day mortality 0–1.6%)'
  if (v <= 85) return 'Class II — low risk (1.7–3.5%)'
  if (v <= 105) return 'Class III — intermediate risk (3.2–7.1%)'
  if (v <= 125) return 'Class IV — high risk (4.0–11.4%)'
  return 'Class V — very high risk (10.0–24.5%)'
}

// ─── DKA Severity (ADA classification — worst category) ──────────────
// Ref: Kitabchi AE et al. Diabetes Care. 2009;32(7):1335-1343.
export function dkaSeverity({ phArterial, bicarbonateMeqL, mentalStatus }) {
  // mentalStatus: 'alert' | 'drowsy' | 'stupor'
  if (phArterial <= 0 || bicarbonateMeqL < 0) return null
  let level = 0 // 1 mild, 2 moderate, 3 severe
  if (phArterial < 7.00 || bicarbonateMeqL < 10 || mentalStatus === 'stupor') level = 3
  else if (phArterial < 7.24 || bicarbonateMeqL < 15 || mentalStatus === 'drowsy') level = 2
  else if (phArterial < 7.30 || bicarbonateMeqL < 18) level = 1
  else level = 0
  return level
}
export function dkaSeverityLabel(level) {
  if (level === null) return null
  return ['Criteria for DKA not met by pH/bicarbonate', 'Mild DKA', 'Moderate DKA', 'Severe DKA'][level]
}

// ─── R-ISS (Revised International Staging System, multiple myeloma) ───
// Ref: Palumbo A et al. J Clin Oncol. 2015;33(26):2863-2869.
export function rIssStage({ iss, highRiskCytogenetics, highLDH }) {
  // iss: 1 | 2 | 3
  if (![1, 2, 3].includes(iss)) return null
  if (iss === 1 && !highRiskCytogenetics && !highLDH) return 1
  if (iss === 3 && (highRiskCytogenetics || highLDH)) return 3
  return 2
}
export function rIssLabel(stage) {
  if (stage === null) return null
  return {
    1: 'R-ISS Stage I — best prognosis (5-yr OS ≈ 82%)',
    2: 'R-ISS Stage II — intermediate (5-yr OS ≈ 62%)',
    3: 'R-ISS Stage III — poorest prognosis (5-yr OS ≈ 40%)',
  }[stage]
}

// ─── CDAI (Crohn's Disease Activity Index) ───────────────────────────
// Ref: Best WR et al. Gastroenterology. 1976;70(3):439-444.
export function cdai({ stools7d, painSum7d, wellbeingSum7d, complications, antidiarrheal, abdominalMass, hctObserved, male, weightKg, standardWeightKg }) {
  if ([stools7d, painSum7d, wellbeingSum7d, complications, hctObserved, weightKg, standardWeightKg].some(x => !Number.isFinite(x) || x < 0)) return null
  // abdominalMass: 0 none, 2 questionable, 5 definite
  const hctTerm = male ? (47 - hctObserved) : (42 - hctObserved)
  const weightTerm = 100 * (1 - weightKg / standardWeightKg)
  const v = 2 * stools7d
    + 5 * painSum7d
    + 7 * wellbeingSum7d
    + 20 * complications
    + 30 * (antidiarrheal ? 1 : 0)
    + 10 * abdominalMass
    + 6 * hctTerm
    + 1 * weightTerm
  return Math.round(v)
}
export function cdaiRisk(v) {
  if (v === null) return null
  if (v < 150) return 'Clinical remission (CDAI < 150)'
  if (v <= 220) return 'Mild disease (150–220)'
  if (v <= 450) return 'Moderate disease (221–450)'
  return 'Severe disease (CDAI > 450)'
}

// ─── CAM-ICU (Confusion Assessment Method for the ICU) ───────────────
// Positive = Feature 1 AND Feature 2 AND (Feature 3 OR Feature 4)
// F1 acute change/fluctuating course; F2 inattention; F3 altered LOC (RASS ≠ 0); F4 disorganized thinking.
// Ref: Ely EW et al. JAMA. 2001;286(21):2703-2710.
export function camIcu({ f1AcuteFluctuating, f2Inattention, f3AlteredLOC, f4DisorganizedThinking }) {
  if ([f1AcuteFluctuating, f2Inattention, f3AlteredLOC, f4DisorganizedThinking].some(v => typeof v !== 'boolean')) return null
  const positive = f1AcuteFluctuating && f2Inattention && (f3AlteredLOC || f4DisorganizedThinking)
  return positive
}
export function camIcuLabel(positive) {
  if (positive === null) return null
  return positive
    ? 'CAM-ICU POSITIVE — delirium present'
    : 'CAM-ICU negative — no delirium by CAM-ICU'
}

// ─── SCORAD (atopic dermatitis) ──────────────────────────────────────
// SCORAD = A/5 + 7B/2 + C   (A extent %, B intensity 0–18, C subjective 0–20)
// Ref: European Task Force on Atopic Dermatitis. Dermatology. 1993;186(1):23-31.
export function scorad({ extentPct, erythema, edema, oozing, excoriation, lichenification, dryness, pruritusVas, sleepVas }) {
  const ints = [erythema, edema, oozing, excoriation, lichenification, dryness]
  if (extentPct < 0 || extentPct > 100) return null
  if (ints.some(v => !Number.isFinite(v) || v < 0 || v > 3)) return null
  if ([pruritusVas, sleepVas].some(v => !Number.isFinite(v) || v < 0 || v > 10)) return null
  const A = extentPct
  const B = ints.reduce((s, v) => s + v, 0)
  const C = pruritusVas + sleepVas
  return round1(A / 5 + (7 * B) / 2 + C)
}
export function scoradRisk(v) {
  if (v === null) return null
  if (v < 25) return 'Mild atopic dermatitis (SCORAD < 25)'
  if (v <= 50) return 'Moderate atopic dermatitis (SCORAD 25–50)'
  return 'Severe atopic dermatitis (SCORAD > 50)'
}

// ─── PASI (psoriasis) ────────────────────────────────────────────────
// PASI = 0.1·(E+I+D)h·Ah + 0.2·(...)u + 0.3·(...)t + 0.4·(...)l
// E/I/D 0–4; area score 0–6. Ref: Fredriksson T, Pettersson U. Dermatologica. 1978;157(4):238-244.
export function pasi(regions) {
  // regions: { head:{e,i,d,a}, arms:{...}, trunk:{...}, legs:{...} }
  const w = { head: 0.1, arms: 0.2, trunk: 0.3, legs: 0.4 }
  let total = 0
  for (const key of ['head', 'arms', 'trunk', 'legs']) {
    const r = regions[key]
    if (!r) return null
    const { e, i, d, a } = r
    if ([e, i, d].some(x => !Number.isFinite(x) || x < 0 || x > 4)) return null
    if (!Number.isFinite(a) || a < 0 || a > 6) return null
    total += w[key] * (e + i + d) * a
  }
  return round1(total)
}
export function pasiRisk(v) {
  if (v === null) return null
  if (v < 5) return 'Mild psoriasis (PASI < 5)'
  if (v <= 10) return 'Moderate psoriasis (PASI 5–10)'
  return 'Severe psoriasis (PASI > 10) — candidate for systemic therapy'
}

// ─── PSI / PORT (Pneumonia Severity Index) ───────────────────────────
// Ref: Fine MJ et al. N Engl J Med. 1997;336(4):243-250.
export function psiPort(p) {
  const {
    ageYears, female, nursingHome,
    neoplasm, liver, chf, cerebrovascular, renal,
    alteredMental, rr30, sbp90, tempAbnormal, pulse125,
    phLt735, bun30, naLt130, glucose250, hctLt30, pao2Lt60, pleuralEffusion,
  } = p
  if (!Number.isFinite(ageYears) || ageYears <= 0) return null
  // Step 1 — Class I (history + examination only)
  const isClassI = ageYears <= 50 && !neoplasm && !liver && !chf && !cerebrovascular && !renal
    && !alteredMental && !rr30 && !sbp90 && !tempAbnormal && !pulse125
  if (isClassI) return { points: null, klass: 'I' }
  let pts = female ? ageYears - 10 : ageYears
  if (nursingHome) pts += 10
  if (neoplasm) pts += 30
  if (liver) pts += 20
  if (chf) pts += 10
  if (cerebrovascular) pts += 10
  if (renal) pts += 10
  if (alteredMental) pts += 20
  if (rr30) pts += 20
  if (sbp90) pts += 20
  if (tempAbnormal) pts += 15
  if (pulse125) pts += 10
  if (phLt735) pts += 30
  if (bun30) pts += 20
  if (naLt130) pts += 20
  if (glucose250) pts += 10
  if (hctLt30) pts += 10
  if (pao2Lt60) pts += 10
  if (pleuralEffusion) pts += 10
  pts = Math.round(pts)
  let klass = 'II'
  if (pts > 130) klass = 'V'
  else if (pts > 90) klass = 'IV'
  else if (pts > 70) klass = 'III'
  return { points: pts, klass }
}
export function psiPortRisk(klass) {
  if (!klass) return null
  return {
    I: 'Class I — 30-day mortality ≈ 0.1%; outpatient',
    II: 'Class II — mortality ≈ 0.6%; outpatient',
    III: 'Class III — mortality ≈ 0.9–2.8%; brief observation/admission',
    IV: 'Class IV — mortality ≈ 8.2–9.3%; inpatient',
    V: 'Class V — mortality ≈ 27–31%; inpatient, consider ICU',
  }[klass]
}

// ─── Framingham 10-year hard CHD risk (NCEP ATP III, 2002) ───────────
// Ref: NCEP ATP III. JAMA. 2001;285(19):2486-2497; circulation point tables.
function fhAgeIdx(a) {
  if (a < 35) return 0; if (a < 40) return 1; if (a < 45) return 2; if (a < 50) return 3
  if (a < 55) return 4; if (a < 60) return 5; if (a < 65) return 6; if (a < 70) return 7
  if (a < 75) return 8; return 9
}
function fhAgeGroup(a) { // 0:20-39 1:40-49 2:50-59 3:60-69 4:70-79
  if (a < 40) return 0; if (a < 50) return 1; if (a < 60) return 2; if (a < 70) return 3; return 4
}
function fhCholBand(tc) { if (tc < 160) return 0; if (tc < 200) return 1; if (tc < 240) return 2; if (tc < 280) return 3; return 4 }
function fhSbpBand(s) { if (s < 120) return 0; if (s < 130) return 1; if (s < 140) return 2; if (s < 160) return 3; return 4 }
function fhHdl(h) { if (h >= 60) return -1; if (h >= 50) return 0; if (h >= 40) return 1; return 2 }
export function framinghamRisk({ male, ageYears, totalChol, hdl, smoker, sbp, treatedBp }) {
  if ([ageYears, totalChol, hdl, sbp].some(v => !Number.isFinite(v) || v <= 0)) return null
  if (ageYears < 20 || ageYears > 79) return null
  const ag = fhAgeGroup(ageYears)
  const cb = fhCholBand(totalChol)
  const sb = fhSbpBand(sbp)
  let pts
  if (male) {
    pts = [-9, -4, 0, 3, 6, 8, 10, 11, 12, 13][fhAgeIdx(ageYears)]
    pts += [[0, 4, 7, 9, 11], [0, 3, 5, 6, 8], [0, 2, 3, 4, 5], [0, 1, 1, 2, 3], [0, 0, 0, 1, 1]][ag][cb]
    pts += smoker ? [8, 5, 3, 1, 1][ag] : 0
    pts += fhHdl(hdl)
    pts += (treatedBp ? [0, 1, 2, 2, 3] : [0, 0, 1, 1, 2])[sb]
  } else {
    pts = [-7, -3, 0, 3, 6, 8, 10, 12, 14, 16][fhAgeIdx(ageYears)]
    pts += [[0, 4, 8, 11, 13], [0, 3, 6, 8, 10], [0, 2, 4, 5, 7], [0, 1, 2, 3, 4], [0, 1, 1, 2, 2]][ag][cb]
    pts += smoker ? [9, 7, 4, 2, 1][ag] : 0
    pts += fhHdl(hdl)
    pts += (treatedBp ? [0, 3, 4, 5, 6] : [0, 1, 2, 3, 4])[sb]
  }
  let pct
  if (male) {
    if (pts < 0) pct = '< 1%'
    else if (pts <= 4) pct = '1%'
    else if (pts <= 6) pct = '2%'
    else pct = ({ 7: '3%', 8: '4%', 9: '5%', 10: '6%', 11: '8%', 12: '10%', 13: '12%', 14: '16%', 15: '20%', 16: '25%' })[pts] || '≥ 30%'
  } else {
    if (pts < 9) pct = '< 1%'
    else if (pts <= 12) pct = '1%'
    else pct = ({ 13: '2%', 14: '2%', 15: '3%', 16: '4%', 17: '5%', 18: '6%', 19: '8%', 20: '11%', 21: '14%', 22: '17%', 23: '22%', 24: '27%' })[pts] || '≥ 30%'
  }
  return { points: pts, riskPct: pct }
}
export function framinghamCategory(riskPct) {
  if (!riskPct) return null
  const n = riskPct === '< 1%' ? 0.5 : (riskPct.startsWith('≥') ? 30 : parseFloat(riskPct))
  if (n < 10) return 'Low 10-year CHD risk (< 10%)'
  if (n <= 20) return 'Intermediate 10-year CHD risk (10–20%)'
  return 'High 10-year CHD risk (> 20%)'
}
