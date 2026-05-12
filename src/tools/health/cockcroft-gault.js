// Cockcroft-Gault creatinine clearance.
// Reference: Cockcroft DW, Gault MH. Nephron. 1976;16(1):31-41.
// CrCl (mL/min) = ((140 − age) × weight_kg) / (72 × Cr_mg/dL) × (0.85 if female)
// Rounded to integer to match Whitebook's display convention.

function round0(n) { return Math.round(n) }

export function cockcroftGault({ age, weightKg, creatinineMgDl, sex }) {
  if (creatinineMgDl <= 0) return null
  if (weightKg <= 0) return null
  if (age >= 140 || age < 0) return null
  const base = ((140 - age) * weightKg) / (72 * creatinineMgDl)
  const adjusted = sex === 'female' ? base * 0.85 : base
  return round0(adjusted)
}

// KDIGO 2012 GFR stages (mL/min/1.73 m² — also applied to CrCl as approximation).
export function classifyGFR(gfr) {
  if (gfr === null || gfr === undefined) return null
  if (gfr >= 90) return 'G1 (Normal or high)'
  if (gfr >= 60) return 'G2 (Mildly decreased)'
  if (gfr >= 45) return 'G3a (Mildly to moderately decreased)'
  if (gfr >= 30) return 'G3b (Moderately to severely decreased)'
  if (gfr >= 15) return 'G4 (Severely decreased)'
  return 'G5 (Kidney failure)'
}
