// Pediatric & obstetric (CRL) calculators — pure functions.

function round1(n) { return Math.round(n * 10) / 10 }
function round2(n) { return Math.round(n * 100) / 100 }
function round0(n) { return Math.round(n) }

// ─── APGAR ───────────────────────────────────────────────────────────
// Ref: Apgar V. Curr Res Anesth Analg. 1953;32(4):260-267.
const APGAR_KEYS = ['appearance', 'pulse', 'grimace', 'activity', 'respiration']
export function apgarScore(items) {
  let total = 0
  for (const k of APGAR_KEYS) {
    const v = items[k]
    if (v === undefined || v === null) return null
    if (v < 0 || v > 2 || !Number.isInteger(v)) return null
    total += v
  }
  return total
}
export function classifyApgar(score) {
  if (score === null || score === undefined) return null
  if (score >= 7) return 'Reassuring'
  if (score >= 4) return 'Moderately depressed'
  return 'Severely depressed'
}

// ─── Pediatric ETT ───────────────────────────────────────────────────
// Cole formula. Age in years (≥ 1).
// Uncuffed: (age / 4) + 4
// Cuffed:   (age / 4) + 3.5
// Insertion depth (cm) = 3 × ETT size.
export function ettSizeUncuffed(ageYears) {
  if (ageYears < 1) return null
  return round2(ageYears / 4 + 4)
}
export function ettSizeCuffed(ageYears) {
  if (ageYears < 1) return null
  return round2(ageYears / 4 + 3.5)
}
export function ettInsertionDepth(ettSizeMm) {
  if (ettSizeMm <= 0) return null
  return round1(3 * ettSizeMm)
}

// ─── Pediatric infusion calculators ──────────────────────────────────
// mcg/kg/min → mL/h
export function pediatricInfusionMcgKgMin({ doseMcgKgMin, weightKg, concentrationMcgPerMl }) {
  if (doseMcgKgMin < 0 || weightKg <= 0 || concentrationMcgPerMl <= 0) return null
  return round2((doseMcgKgMin * weightKg * 60) / concentrationMcgPerMl)
}
// mg/kg/hour → mL/h
export function pediatricInfusionMgKgHour({ doseMgKgHour, weightKg, concentrationMgPerMl }) {
  if (doseMgKgHour < 0 || weightKg <= 0 || concentrationMgPerMl <= 0) return null
  return round2((doseMgKgHour * weightKg) / concentrationMgPerMl)
}

// ─── Gestational age from CRL — Robinson-Fleming formula ─────────────
// GA (days) = 8.052 × sqrt(CRL_mm × 1.037) + 23.73
// Ref: Robinson HP, Fleming JE. Br J Obstet Gynaecol. 1975;82(9):702-710.
export function gestationalAgeFromCRL(crlMm) {
  if (crlMm <= 0) return null
  const totalDays = Math.round(8.052 * Math.sqrt(crlMm * 1.037) + 23.73)
  return {
    totalDays,
    weeks: Math.floor(totalDays / 7),
    days: totalDays % 7,
  }
}
