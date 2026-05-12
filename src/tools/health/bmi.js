// BMI & BSA calculator — pure functions.
// Reference: Whitebook (PEBMED) — IMC e Superfície Corporal.
// BMI categories: WHO (adults ≥ 18y).
// BSA: Mosteller formula — BSA = √((H × W) / 3600), with H in cm, W in kg.
//   Chosen over Du Bois 1916 to match Whitebook output.
//   Ref: Mosteller RD. N Engl J Med. 1987;317(17):1098.

function round1(n) {
  return Math.round(n * 10) / 10
}

function round2(n) {
  return Math.round(n * 100) / 100
}

// Normalize height: assume meters if < 3, centimeters otherwise.
// Catches both `1.75` and `175` for the same patient.
function heightMeters(h) {
  if (h <= 0) return null
  return h < 3 ? h : h / 100
}

export function calculateBMI(weightKg, height) {
  if (weightKg <= 0) return null
  const m = heightMeters(height)
  if (m === null) return null
  return round1(weightKg / (m * m))
}

export function classifyBMI(bmi) {
  if (bmi === null || bmi === undefined) return null
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal weight'
  if (bmi < 30) return 'Overweight'
  if (bmi < 35) return 'Obesity class I'
  if (bmi < 40) return 'Obesity class II'
  return 'Obesity class III'
}

// Mosteller: BSA = √((H_cm × W_kg) / 3600)
export function calculateBSA(weightKg, height) {
  if (weightKg <= 0) return null
  const m = heightMeters(height)
  if (m === null) return null
  const cm = m * 100
  const bsa = Math.sqrt((cm * weightKg) / 3600)
  return round2(bsa)
}
