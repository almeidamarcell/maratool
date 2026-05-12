// Ventilation & blood gas calculators.

function round0(n) { return Math.round(n) }
function round1(n) { return Math.round(n * 10) / 10 }

// FiO2 may be entered as a fraction (0.40) or percentage (40). Normalize.
function normalizeFiO2(fio2) {
  if (fio2 <= 0) return null
  return fio2 > 1 ? fio2 / 100 : fio2
}

// Ideal PaO2 by age — Sorbini 1968: PaO2 = 109 − 0.43 × age.
export function idealPaO2ByAge(ageYears) {
  if (ageYears < 0) return null
  return round1(109 - 0.43 * ageYears)
}

// P/F ratio.
export function pao2FiO2Ratio({ pao2, fio2 }) {
  const f = normalizeFiO2(fio2)
  if (f === null || pao2 <= 0) return null
  return round0(pao2 / f)
}

// Berlin 2012 ARDS classification.
export function classifyArds(pfRatio) {
  if (pfRatio === null || pfRatio === undefined) return null
  if (pfRatio > 300) return 'No ARDS'
  if (pfRatio > 200) return 'Mild ARDS'
  if (pfRatio > 100) return 'Moderate ARDS'
  return 'Severe ARDS'
}

// SpO2/FiO2 ratio — non-invasive proxy for P/F (Rice 2007).
export function spo2FiO2Ratio({ spo2, fio2 }) {
  const f = normalizeFiO2(fio2)
  if (f === null || spo2 <= 0) return null
  return round1(spo2 / f)
}
