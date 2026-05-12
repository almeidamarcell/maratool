// Renal function calculators — pure functions.
// References:
// - MDRD: Levey AS et al. Ann Intern Med. 1999;130(6):461-470.
// - FENa: Espinel CH. JAMA. 1976;236(6):579-581.
// - FEUrea: Carvounis CP et al. Kidney Int. 2002;62(6):2223-2229.
// - UPCR: Ginsberg JM et al. N Engl J Med. 1983;309(25):1543-1546.
// - HCO3 deficit: Adrogue HJ, Madias NE. N Engl J Med. 1998;338(2):107-111.

function round0(n) { return Math.round(n) }
function round1(n) { return Math.round(n * 10) / 10 }
function round2(n) { return Math.round(n * 100) / 100 }

// 4-variable MDRD (original 1999, pre-IDMS coefficient 186 — matches Whitebook).
// eGFR = 186 × Cr^-1.154 × Age^-0.203 × (0.742 if female) × (1.212 if Black)
// Race coefficient is optional; defaults to non-Black to align with modern race-free practice
// when race is not specified. Pass `race: 'black'` for the original 1999 race-adjusted output.
export function mdrd({ age, sex, creatinineMgDl, race }) {
  if (creatinineMgDl <= 0 || age <= 0) return null
  if (sex !== 'male' && sex !== 'female') return null
  const sexFactor = sex === 'female' ? 0.742 : 1
  const raceFactor = race === 'black' ? 1.212 : 1
  const egfr =
    186 *
    Math.pow(creatinineMgDl, -1.154) *
    Math.pow(age, -0.203) *
    sexFactor *
    raceFactor
  return Math.round(egfr * 10) / 10
}

// FENa (%) = (UNa × PCr) / (PNa × UCr) × 100
// Prerenal: < 1%, intrinsic AKI: > 2%
export function fractionalExcretionSodium({ uNa, pCr, pNa, uCr }) {
  if (pNa <= 0 || uCr <= 0) return null
  return round2((uNa * pCr) / (pNa * uCr) * 100)
}

// FEUrea (%) — useful when patient is on diuretics.
// Prerenal: < 35%, intrinsic AKI: > 50%
export function fractionalExcretionUrea({ uUrea, pCr, pUrea, uCr }) {
  if (pUrea <= 0 || uCr <= 0) return null
  return round2((uUrea * pCr) / (pUrea * uCr) * 100)
}

// UPCR — if protein and Cr both in mg/dL, ratio (mg/mg) approximates
// 24-hour proteinuria in g/day.
export function urineProteinCreatinineRatio({ proteinMgDl, creatinineMgDl }) {
  if (creatinineMgDl <= 0) return null
  return round2(proteinMgDl / creatinineMgDl)
}

// HCO3 deficit (mEq) = 0.5 × weight × (target − measured).
// Returns 0 if not deficient.
export function bicarbonateDeficit({ weightKg, currentHCO3, targetHCO3 }) {
  if (weightKg <= 0) return null
  if (currentHCO3 >= targetHCO3) return 0
  return round1(0.5 * weightKg * (targetHCO3 - currentHCO3))
}
