// Electrolyte & serum corrections.
// References per function.

function round0(n) { return Math.round(n) }
function round1(n) { return Math.round(n * 10) / 10 }

// Serum osmolality: 2 × Na + Glc/18 + BUN/2.8
export function serumOsmolality({ sodium, glucose, bun }) {
  if (sodium <= 0) return null
  return round0(2 * sodium + glucose / 18 + bun / 2.8)
}

// Corrected calcium for albumin (Payne 1973).
// Corrected Ca = Total Ca + 0.8 × (4 − Alb).
export function correctedCalcium({ totalCalcium, albumin }) {
  if (totalCalcium <= 0 || albumin <= 0) return null
  return round1(totalCalcium + 0.8 * (4 - albumin))
}

// Sodium correction for hyperglycemia (Katz 1973).
// Corrected Na = Measured Na + 1.6 × ((Glc − 100) / 100).
// Note: Hillier 2004 proposes 2.4 factor; Katz 1.6 remains the conventional reference.
export function correctedSodium({ sodium, glucose }) {
  if (sodium <= 0) return null
  if (glucose <= 100) return round1(sodium)
  return round1(sodium + 1.6 * ((glucose - 100) / 100))
}

// Total iron deficit — Ganzoni formula.
// Total deficit (mg) = weight (kg) × (target Hb − current Hb) × 2.4 + iron stores
// Stores: 500 mg if weight ≥ 35 kg, else 15 × weight (mg).
export function ironDeficitGanzoni({ weightKg, currentHb, targetHb = 15 }) {
  if (weightKg <= 0) return null
  if (currentHb >= targetHb) return 0
  const stores = weightKg >= 35 ? 500 : 15 * weightKg
  return round0(weightKg * (targetHb - currentHb) * 2.4 + stores)
}
