// Drug dosing / conversion calculators.
// References:
// - Opioid: CDC Guideline for Prescribing Opioids 2022; AAFP 2008.
// - Benzodiazepine: Ashton Manual (1990, rev. 2002).
// - Corticosteroid: standard equivalence tables (Roberts 1999; UpToDate).
// - RSI: standard ICU/ED practice (Walls et al., Manual of Emergency Airway Management).
// - Phenytoin: Sheiner LB, Tozer TN. Clin Pharmacol Ther 1973.

function round1(n) { return Math.round(n * 10) / 10 }
function round0(n) { return Math.round(n) }

// ── Opioid (MME — morphine milligram equivalents) ───────────────────
// Each opioid mapped to mg equivalent to 30 mg oral morphine.
const OPIOID_MORPHINE_PO_EQUIV = {
  'morphine-po':       30,
  'morphine-iv':       10,    // PO:IV = 3:1
  'oxycodone-po':      20,    // 30 mg morphine PO ≈ 20 mg oxycodone PO
  'hydromorphone-po':  7.5,   // 4:1 to morphine PO
  'hydromorphone-iv':  1.5,   // 4:1 to morphine IV (10/4 ≈ 2.5; CDC uses 1.5 for safer conversion)
  'fentanyl-iv-mcg':   100,   // 30 mg morphine PO ≈ 100 mcg fentanyl IV
  'codeine-po':        200,   // 30 mg morphine PO ≈ 200 mg codeine PO
  'tramadol-po':       200,   // 30 mg morphine PO ≈ 200 mg tramadol PO (1:6.67)
  'methadone-po':      4,     // Variable; this is conservative for chronic conversion
}
export function opioidConversion({ from, to, dose }) {
  const f = OPIOID_MORPHINE_PO_EQUIV[from]
  const t = OPIOID_MORPHINE_PO_EQUIV[to]
  if (f === undefined || t === undefined || dose < 0) return null
  // Convert `dose` of `from` to morphine PO, then to target.
  const mmePerUnit = 30 / f         // mg morphine PO per unit of `from`
  const mme = dose * mmePerUnit
  return round1(mme * t / 30)
}

// ── Benzodiazepine equivalence (10 mg diazepam = baseline) ──────────
// Equivalent of 10 mg diazepam:
const BENZO_DIAZEPAM_EQUIV = {
  'diazepam':     10,
  'alprazolam':   1,        // Common clinical reference
  'lorazepam':    2,
  'clonazepam':   1,        // Ashton: 0.5; common clinical: 1.0
  'oxazepam':     30,
  'temazepam':    20,
  'midazolam':    7.5,
}
export function benzodiazepineConversion({ from, to, dose }) {
  const f = BENZO_DIAZEPAM_EQUIV[from]
  const t = BENZO_DIAZEPAM_EQUIV[to]
  if (f === undefined || t === undefined || dose < 0) return null
  const diazepamEquiv = (dose / f) * 10
  return round1((diazepamEquiv / 10) * t)
}

// ── Corticosteroid equivalence (5 mg prednisone = baseline) ─────────
// Equivalent of 5 mg prednisone (anti-inflammatory potency):
const CORTICO_PREDNISONE_EQUIV = {
  'cortisone':            25,
  'hydrocortisone':       20,
  'prednisone':           5,
  'prednisolone':         5,
  'methylprednisolone':   4,
  'triamcinolone':        4,
  'dexamethasone':        0.75,
  'betamethasone':        0.6,
}
export function corticosteroidConversion({ from, to, dose }) {
  const f = CORTICO_PREDNISONE_EQUIV[from]
  const t = CORTICO_PREDNISONE_EQUIV[to]
  if (f === undefined || t === undefined || dose < 0) return null
  const prednisoneEquiv = (dose / f) * 5
  // 2 decimals — dexamethasone/betamethasone often need <1 mg precision.
  return Math.round((prednisoneEquiv / 5) * t * 100) / 100
}

// ── RSI Doses (weight-based) ────────────────────────────────────────
// Induction agents (mg) and paralytics (mg) at typical RSI doses.
export function rsiDoses(weightKg) {
  if (weightKg <= 0) return null
  return {
    // Induction
    etomidate:        round0(weightKg * 0.3),
    ketamine:         round0(weightKg * 1.5),
    propofol:         round0(weightKg * 1.5),
    midazolam:        round1(weightKg * 0.2),
    // Paralytic
    succinylcholine:  round0(weightKg * 1.5),
    rocuronium:       round1(weightKg * 1.2),
    // Pre-treatment
    fentanyl:         round0(weightKg * 3),     // mcg
    lidocaine:        round1(weightKg * 1.5),   // mg
  }
}

// ── Phenytoin corrected level (Sheiner-Tozer) ───────────────────────
// Normal renal: corrected = measured / (0.2 × albumin + 0.1)
// ESRD (CrCl < 20): corrected = measured / (0.1 × albumin + 0.1)
export function phenytoinCorrected({ level, albumin, esrd = false }) {
  if (level <= 0 || albumin <= 0) return null
  const factor = esrd ? 0.1 * albumin + 0.1 : 0.2 * albumin + 0.1
  if (factor <= 0) return null
  return round1(level / factor)
}
